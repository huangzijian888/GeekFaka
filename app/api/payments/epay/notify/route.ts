import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentAdapter } from "@/lib/payments/registry";

export async function GET(req: Request) {
  // EPay notifications are usually GET requests, but verify based on your gateway
  const { searchParams } = new URL(req.url);
  const data = Object.fromEntries(searchParams.entries());

  return processNotification(data);
}

export async function POST(req: Request) {
  // Handle POST notifications if configured
  const formData = await req.formData();
  const data = Object.fromEntries(formData.entries());
  
  return processNotification(data);
}

async function processNotification(data: any) {
  try {
    const adapter = getPaymentAdapter("epay");
    const callbackData = await adapter.verifyCallback(data);

    if (callbackData.status === "PAID") {
       await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNo: callbackData.orderNo },
        });

        if (!order) throw new Error("Order not found");
        if (order.status === "PAID") return; // Idempotency

        // Check for expiration (30 mins)
        const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
        if (order.createdAt < thirtyMinutesAgo) {
          console.warn(`Order ${order.orderNo} payment received but expired.`);
          await tx.order.update({
            where: { id: order.id },
            data: { status: "EXPIRED" } // Or "PAID_EXPIRED" for manual refund
          });
          return;
        }

        // Allocate licenses
        const licenses = await tx.license.findMany({
          where: { 
            productId: order.productId,
            status: "AVAILABLE"
          },
          take: order.quantity
        });

        if (licenses.length < order.quantity) {
          // Log error: Stock insufficient despite payment
          console.error(`Order ${order.orderNo} paid but insufficient stock!`);
          // Could update status to "PAID_NO_STOCK" or handle refund manually
          return; 
        }

        const licenseIds = licenses.map(l => l.id);
        await tx.license.updateMany({
          where: { id: { in: licenseIds } },
          data: { status: "SOLD", orderId: order.id }
        });

        await tx.order.update({
          where: { id: order.id },
          data: { 
            status: "PAID",
            paymentMethod: "epay",
            paidAt: new Date()
          }
        });
      });
    }

    return new NextResponse("success");
  } catch (error) {
    console.error("EPay Notify Error:", error);
    return new NextResponse("fail", { status: 400 });
  }
}
