import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ShoppingBag, Package, Users } from "lucide-react";

export default async function DashboardPage() {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  // Fetch stats
  const productCount = await prisma.product.count();
  const orderCount = await prisma.order.count({ where: { status: "PAID" } });
  
  // Calculate total revenue (SQLite usually returns Decimal as string or number, handled by Prisma)
  const orders = await prisma.order.findMany({ 
    where: { status: "PAID" },
    select: { totalAmount: true }
  });
  
  const totalRevenue = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
  
  // Calculate stock status
  const totalLicenses = await prisma.license.count();
  const soldLicenses = await prisma.license.count({ where: { status: "SOLD" } });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">仪表盘</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              累计收入
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成交订单</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
            <p className="text-xs text-muted-foreground">
              已支付订单
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">商品数量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
            <p className="text-xs text-muted-foreground">
              上架商品总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存消耗</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {totalLicenses > 0 ? ((soldLicenses / totalLicenses) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              已售 {soldLicenses} / 总计 {totalLicenses}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
