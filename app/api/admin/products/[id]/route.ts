import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// Update Product
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { name, description, price, categoryId, isActive } = await req.json();
    const { id } = params;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        categoryId,
        isActive,
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// Delete Product
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = params;
    
    // Check if there are orders or licenses?
    // In a real app, you might want to prevent deletion if there are paid orders.
    // For now, we delete (licenses will be deleted if configured or cause error).
    
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product. Make sure to delete licenses first." }, { status: 500 });
  }
}
