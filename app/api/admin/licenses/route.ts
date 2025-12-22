import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// List Licenses for a Product
export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const licenses = await prisma.license.findMany({
    where: { 
      productId,
      status: "AVAILABLE" 
    },
    orderBy: { createdAt: "desc" },
    take: 100 // Limit for performance, usually enough for view
  });

  return NextResponse.json(licenses);
}

// Bulk Create Licenses
export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { productId, codes } = await req.json(); // codes is an array of strings

    if (!productId || !Array.isArray(codes)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const data = codes
      .filter(code => code.trim() !== "")
      .map(code => ({
        code: code.trim(),
        productId,
        status: "AVAILABLE"
      }));

    if (data.length === 0) {
      return NextResponse.json({ error: "No valid codes provided" }, { status: 400 });
    }

    const result = await prisma.license.createMany({
      data
    });

    return NextResponse.json({ count: result.count });
  } catch (error) {
    return NextResponse.json({ error: "Failed to import licenses" }, { status: 500 });
  }
}
