import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { sendOrderEmail } from "@/lib/mail";

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
