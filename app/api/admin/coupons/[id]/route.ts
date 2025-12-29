import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { code, discountValue, discountType, productId, categoryId, isUsed } = await req.json();
    const { id } = params;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: code?.trim().toUpperCase(),
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        discountType,
        productId: productId === undefined ? undefined : productId,
        categoryId: categoryId === undefined ? undefined : categoryId,
        isUsed
      }
    });

    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    await prisma.coupon.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
