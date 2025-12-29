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

    // Check if coupon is bound to a specific product
    if (coupon.productId && coupon.productId !== productId) {
      return NextResponse.json({ error: "该优惠码不适用于此商品" }, { status: 400 });
    }

    // Check if coupon is bound to a specific category
    if (coupon.categoryId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true }
      });
      if (product?.categoryId !== coupon.categoryId) {
        return NextResponse.json({ error: "该优惠码不适用于此分类下的商品" }, { status: 400 });
      }
    }
    
    return NextResponse.json({ 
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    });

  } catch (error) {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}
