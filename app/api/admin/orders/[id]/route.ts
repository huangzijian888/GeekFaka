import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendOrderEmail } from "@/lib/mail";
import { createTrafficSubUser } from "@/lib/traffic";

// Manual Actions (e.g., Mark as Paid)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { action } = await req.json(); // "MARK_PAID"
    const { id } = params;

    const order = await prisma.order.findUnique({ 
      where: { id },
      include: { product: true }
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === "MARK_PAID") {
       if (order.status === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 400 });

       // Transactional manual fulfillment
       await prisma.$transaction(async (tx) => {
         
         if (order.product.isTrafficItem) {
            // Traffic Item Logic
            const account = await createTrafficSubUser(order.orderNo, order.product.trafficDuration);
            let expiresAt: Date | null = null;
            if (order.product.trafficDuration > 0) {
              expiresAt = new Date(Date.now() + order.product.trafficDuration * 3600000);
            }

            await tx.trafficAccount.create({
              data: {
                username: account.username,
                password: account.password,
                orderId: order.id,
                expiresAt
              }
            });

            // FETCH dynamic host/port from settings
            const proxyHostSetting = await tx.systemSetting.findUnique({ where: { key: "proxy_host" } });
            const proxyPortSetting = await tx.systemSetting.findUnique({ where: { key: "proxy_port" } });
            const host = proxyHostSetting?.value || "us.arxlabs.io";
            const port = proxyPortSetting?.value || "3010";

            const formattedUsername = `${account.username}-region-US`;

            await tx.license.create({
              data: {
                code: `${host}:${port}:${formattedUsername}:${account.password}`,
                productId: order.productId,
                orderId: order.id,
                status: "SOLD"
              }
            });

         } else {
            // Standard Stock Logic
            const licenses = await tx.license.findMany({
              where: { productId: order.productId, status: "AVAILABLE" },
              orderBy: { createdAt: 'asc' }, // FIFO: Use oldest licenses first
              take: order.quantity
            });

            if (licenses.length < order.quantity) {
              throw new Error("Insufficient stock to fulfill manually");
            }

            const licenseIds = licenses.map(l => l.id);
            await tx.license.updateMany({
              where: { id: { in: licenseIds } },
              data: { status: "SOLD", orderId: order.id }
            });
         }

         // Update Order
         await tx.order.update({
           where: { id },
           data: { 
             status: "PAID", 
             paidAt: new Date(),
             paymentMethod: "manual"
           }
         });
       });

       // Trigger email notification in background
       sendOrderEmail(order.orderNo).catch(console.error);

       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Operation failed" }, { status: 500 });
  }
}
