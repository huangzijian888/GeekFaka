import { NextResponse } from "next/server";
import { queryDailyRecords, queryHourlyRecords } from "@/lib/traffic";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUsername = searchParams.get("username");
  const type = searchParams.get("type") || "hourly"; // "hourly" or "daily"

  if (!rawUsername) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const username = rawUsername.replace("-region-US", "").trim();

  try {
    const end = new Date().toISOString().split("T")[0];
    let start = new Date();
    
    if (type === "daily") {
      start.setDate(start.getDate() - 30); // Last 30 days
    } else {
      start.setDate(start.getDate() - 2); // Last 48 hours for detail
    }
    
    const startStr = start.toISOString().split("T")[0];

    const data = type === "daily" 
      ? await queryDailyRecords(username, startStr, end)
      : await queryHourlyRecords(username, startStr, end);

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "获取统计数据失败" }, { status: 500 });
  }
}
