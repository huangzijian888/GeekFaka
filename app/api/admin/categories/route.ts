import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
      orderBy: { priority: "desc" },
      skip,
      take: limit
    }),
    prisma.category.count()
  ]);

  return NextResponse.json({
    items: categories,
    total
  });
}

export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, slug, priority = 0 } = await req.json();
    const category = await prisma.category.create({
      data: { 
        name, 
        slug, 
        priority: Number(priority) 
      }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
