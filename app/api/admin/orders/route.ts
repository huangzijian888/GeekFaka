import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const productId = searchParams.get("productId");

  const where: any = {};
  
  if (search) {
    where.OR = [
      { orderNo: { contains: search } },
      { email: { contains: search } }
    ];
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (productId && productId !== "ALL") {
    where.productId = productId;
  }

  // Auto-expire old pending orders (Lazy cleanup)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.order.updateMany({
    where: {
      status: "PENDING",
      createdAt: { lt: thirtyMinutesAgo }
    },
    data: { status: "EXPIRED" }
  });

  const orders = await prisma.order.findMany({
    where,
    include: {
      product: true
    },
    orderBy: { createdAt: "desc" },
    take: 50 // Simple pagination limit for now
  });

  return NextResponse.json(orders);
}
