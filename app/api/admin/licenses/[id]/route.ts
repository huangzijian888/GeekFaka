import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

// Delete single license
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!await isAuthenticated()) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = params;
    await prisma.license.delete({
      where: { id, status: "AVAILABLE" } // Only allow deleting un-sold ones
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete license" }, { status: 500 });
  }
}
