import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNo: true } } }
  });

  return NextResponse.json(coupons);
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { code, discount } = await req.json();

    if (!code || !discount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        discount: parseFloat(discount),
        isUsed: false
      }
    });

    return NextResponse.json(coupon);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
