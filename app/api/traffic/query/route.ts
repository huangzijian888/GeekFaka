import { NextResponse } from "next/server";
import { queryTrafficUsage } from "@/lib/traffic";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  try {
    const data = await queryTrafficUsage(username);
    if (!data) {
      return NextResponse.json({ error: "未找到该账号或该账号已失效" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query traffic" }, { status: 500 });
  }
}
