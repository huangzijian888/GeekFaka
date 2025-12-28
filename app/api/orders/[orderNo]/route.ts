import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { orderNo: string } }
) {
  const { orderNo } = params;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: {
        product: {
          select: { name: true, description: true, deliveryFormat: true }
        },
        licenses: {
          select: { id: true, code: true }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security: Only expose license codes if order is PAID
    if (order.status !== "PAID") {
      // Create a sanitized order object without licenses
      const { licenses, ...safeOrder } = order;
      return NextResponse.json({ ...safeOrder, licenses: [] });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Fetch order error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
