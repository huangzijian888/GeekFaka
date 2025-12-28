import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await prisma.article.findMany({
    where: { isVisible: true },
    select: { title: true, slug: true },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(articles);
}
