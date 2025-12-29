import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { code, productId } = await req.json();

    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (!coupon) {
      return NextResponse.json({ error: "无效的优惠码" }, { status: 404 });
    }

    if (coupon.isUsed) {
      return NextResponse.json({ error: "该优惠码已被使用" }, { status: 400 });
    }

    // Optional: add logic here if coupon is tied to specific products
    
    return NextResponse.json({ 
      id: coupon.id,
      code: coupon.code,
      discount: coupon.discount
    });

  } catch (error) {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
