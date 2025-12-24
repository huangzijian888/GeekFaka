import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/prisma";
import { CustomerService } from "@/components/customer-service";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeekFaka - 自动发货平台",
  description: "24小时自动发货，安全快捷",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const crispId = await prisma.systemSetting.findUnique({
    where: { key: "crisp_id" },
  });

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <CustomerService crispId={crispId?.value} />
      </body>
    </html>
  );
}
