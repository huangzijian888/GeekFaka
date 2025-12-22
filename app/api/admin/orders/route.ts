import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search"); // OrderNo or Email

  const where: any = {};
  if (search) {
    where.OR = [
      { orderNo: { contains: search } },
      { email: { contains: search } }
    ];
  }

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
