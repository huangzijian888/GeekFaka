import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Fetch settings from DB
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["epay_enabled", "epay_channels", "epay_fee"] } 
    }
  });
  
  const config = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);

  const channels = [];

  // EPay Check
  if (config.epay_enabled === "true") {
    const fee = parseFloat(config.epay_fee || "0");
    const enabledSubChannels = (config.epay_channels || "alipay,wxpay").split(",");

    if (enabledSubChannels.includes("alipay")) {
      channels.push({ id: "alipay", name: "支付宝", icon: "wallet", provider: "epay", fee });
    }
    if (enabledSubChannels.includes("wxpay")) {
      channels.push({ id: "wxpay", name: "微信支付", icon: "credit-card", provider: "epay", fee });
    }
    if (enabledSubChannels.includes("qqpay")) {
      channels.push({ id: "qqpay", name: "QQ钱包", icon: "wallet", provider: "epay", fee });
    }
    if (enabledSubChannels.includes("usdt")) {
      channels.push({ id: "usdt", name: "USDT", icon: "credit-card", provider: "epay", fee });
    }
  }

  return NextResponse.json(channels);
}
