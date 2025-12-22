import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Fetch settings from DB
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["epay_enabled"] } // Add other providers here later
    }
  });
  
  const config = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const channels = [];

  // EPay Check
  if (config.epay_enabled === "true") {
    // Usually EPay supports both Alipay and WeChat
    // In a more advanced version, we could have 'epay_channels' config to toggle them individually
    channels.push({ id: "alipay", name: "支付宝", icon: "wallet", provider: "epay" });
    channels.push({ id: "wechat", name: "微信支付", icon: "credit-card", provider: "epay" });
  }

  return NextResponse.json(channels);
}
