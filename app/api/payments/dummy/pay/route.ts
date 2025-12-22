import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNo = searchParams.get("orderNo");

  if (!orderNo) {
    return NextResponse.json({ error: "Missing orderNo" }, { status: 400 });
  }

  // Transaction wrapper to ensure atomicity
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Get Order
      const order = await tx.order.findUnique({
        where: { orderNo },
        include: { product: true } // Need price? No, just quantity
      });

      if (!order) throw new Error("Order not found");
      if (order.status === "PAID") return; // Already paid

      // 2. Lock/Allocate Licenses
      const licenses = await tx.license.findMany({
        where: { 
          productId: order.productId,
          status: "AVAILABLE"
        },
        take: order.quantity
      });

      if (licenses.length < order.quantity) {
        throw new Error("Insufficient stock during payment processing");
      }

      // 3. Update Licenses
      const licenseIds = licenses.map(l => l.id);
      await tx.license.updateMany({
        where: { id: { in: licenseIds } },
        data: { 
          status: "SOLD",
          orderId: order.id 
        }
      });

      // 4. Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paidAt: new Date()
        }
      });
    });

    // Redirect to order status page
    return NextResponse.redirect(new URL(`/orders/${orderNo}`, req.url));

  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
