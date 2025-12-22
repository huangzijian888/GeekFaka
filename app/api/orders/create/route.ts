import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentAdapter } from "@/lib/payments/registry";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, quantity = 1, email, paymentMethod = "epay", options } = body;

    if (!productId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Check Product & Stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: {
          select: { licenses: { where: { status: "AVAILABLE" } } }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product._count.licenses < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // 2. Calculate Amount
    const price = Number(product.price);
    const totalAmount = price * quantity;

    // 3. Create Order
    // Generate a simple order number
    const orderNo = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.order.create({
      data: {
        orderNo,
        email,
        productId,
        quantity,
        totalAmount,
        paymentMethod,
        status: "PENDING",
      }
    });

    // 4. Initiate Payment
    try {
      const adapter = getPaymentAdapter(paymentMethod);
      const paymentIntent = await adapter.createPayment(
        orderNo, 
        totalAmount, 
        `${product.name} x${quantity}`,
        options
      );

      return NextResponse.json({ 
        success: true, 
        orderNo, 
        payUrl: paymentIntent.payUrl,
        qrCode: paymentIntent.qrCode 
      });

    } catch (payError: any) {
      console.error("Payment init failed:", payError);
      return NextResponse.json({ error: "Payment initialization failed: " + payError.message }, { status: 500 });
    }

  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
