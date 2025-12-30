import { NextResponse } from "next/server";
import { queryTrafficUsage } from "@/lib/traffic";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUsername = searchParams.get("username");

  if (!rawUsername) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  // Sanitize: Strip region suffixes to find the actual sub-user in upstream/DB
  const username = rawUsername.replace("-region-US", "").trim();

  try {
    const data = await queryTrafficUsage(username);
    
    if (!data) {
      return NextResponse.json({ error: "未找到该账号或该账号已失效" }, { status: 404 });
    }

    // Check local database for expiration status
    const localAccount = await prisma.trafficAccount.findUnique({
      where: { username }
    });

    const isExpired = localAccount?.expiresAt ? new Date(localAccount.expiresAt) < new Date() : false;

    return NextResponse.json({
      ...data,
      expiresAt: localAccount?.expiresAt,
      isExpired
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query traffic" }, { status: 500 });
  }
}
