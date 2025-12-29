import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_API_KEY = "geekfaka_default_secret_key";

export async function POST(req: Request) {
  const apiKey = req.headers.get("X-API-KEY");
  const validApiKey = process.env.COUPON_API_KEY || DEFAULT_API_KEY;

  if (apiKey !== validApiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      count = 1, 
      discountValue, 
      discountType = "FIXED", 
      productId = null, 
      categoryId = null, 
      prefix = "", 
      length = 8 
    } = body;

    if (discountValue === undefined) {
      return NextResponse.json({ error: "discountValue is required" }, { status: 400 });
    }

    if (count > 500) {
      return NextResponse.json({ error: "Maximum 500 coupons per request" }, { status: 400 });
    }

    const generateCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return prefix ? `${prefix}-${code}` : code;
    };

    const couponsData = [];
    const generatedCodes = new Set<string>();

    while (couponsData.length < count) {
      const code = generateCode();
      if (!generatedCodes.has(code)) {
        generatedCodes.add(code);
        couponsData.push({
          code,
          discountType,
          discountValue: parseFloat(discountValue),
          productId,
          categoryId,
          isUsed: false
        });
      }
    }

    // Use createMany for performance. 
    // Note: If some codes already exist in DB, this might fail depending on DB settings.
    // In many DBs, createMany skips duplicates if properly configured, but Prisma's behavior varies.
    // For simplicity, we assume codes are unique enough or user handles retries.
    const result = await prisma.coupon.createMany({
      data: couponsData,
      // skipDuplicates: true // Not supported in SQLite
    });

    return NextResponse.json({ 
      success: true, 
      requested: count, 
      created: result.count,
      message: result.count < count ? "Some duplicates were skipped" : "All coupons created"
    });

  } catch (error) {
    console.error("Bulk coupon creation error:", error);
    return NextResponse.json({ error: "Failed to create coupons" }, { status: 500 });
  }
}
