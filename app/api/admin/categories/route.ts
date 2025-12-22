import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { priority: "desc" }
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, slug, priority = 0 } = await req.json();
    const category = await prisma.category.create({
      data: { name, slug, priority }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
