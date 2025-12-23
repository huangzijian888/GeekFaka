import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'AdminProduct' });

// List Products
export async function GET() {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const products = await prisma.product.findMany({
    include: {
      category: true,
      _count: {
        select: { licenses: { where: { status: "AVAILABLE" } } }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(products);
}

// Create Product
export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, description, price, categoryId } = await req.json();

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
      }
    });
    
    log.info({ productId: product.id, name }, "Product created");
    return NextResponse.json(product);
  } catch (error) {
    log.error({ err: error }, "Failed to create product");
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
