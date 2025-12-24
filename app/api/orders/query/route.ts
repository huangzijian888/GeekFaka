import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ error: "请输入查询关键词" }, { status: 400 });
  }

  const keyword = q.trim();

  try {
    // 1. Try to find by Order No (Exact match)
    const orderByNo = await prisma.order.findUnique({
      where: { orderNo: keyword },
      select: {
        orderNo: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        product: { select: { name: true } }
      }
    });

    if (orderByNo) {
      return NextResponse.json([orderByNo]);
    }

    // 2. Try to find by Email/Contact (Exact match)
    const ordersByEmail = await prisma.order.findMany({
      where: { email: keyword },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to recent 20 orders
      select: {
        orderNo: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        product: { select: { name: true } }
      }
    });

    return NextResponse.json(ordersByEmail);
  } catch (error) {
    console.error("Order query error:", error);
    return NextResponse.json({ error: "系统错误" }, { status: 500 });
  }
}
