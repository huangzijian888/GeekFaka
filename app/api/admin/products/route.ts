import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { logger } from "@/lib/logger";

const log = logger.child({ module: 'AdminProduct' });

// List Products
export async function GET(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const categoryId = searchParams.get("categoryId");

  const skip = (page - 1) * limit;

  const where = categoryId && categoryId !== "all" ? { categoryId } : {};

  try {
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          _count: {
            select: { licenses: { where: { status: "AVAILABLE" } } }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    log.error({ err: error }, "Failed to fetch products");
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// Create Product
export async function POST(req: Request) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, description, price, categoryId, deliveryFormat } = await req.json();

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        deliveryFormat: deliveryFormat || "SINGLE"
      }
    });
    
    log.info({ productId: product.id, name }, "Product created");
    return NextResponse.json(product);
  } catch (error) {
    log.error({ err: error }, "Failed to create product");
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
