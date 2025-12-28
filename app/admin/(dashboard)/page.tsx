import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, ShoppingBag, Package, Activity, TrendingUp, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RevenueChart } from "@/components/admin/revenue-chart";

// Helper to calculate percentage change
const calculateChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export default async function DashboardPage() {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    redirect("/admin/login");
  }

  // Timezone Adjustment for China (UTC+8)
  const now = new Date();
  const utcOffset = 8;
  const chinaTime = new Date(now.getTime() + utcOffset * 3600000);
  
  const todayStartChina = new Date(chinaTime.getFullYear(), chinaTime.getMonth(), chinaTime.getDate());
  const todayStart = new Date(todayStartChina.getTime() - utcOffset * 3600000);
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  // 1. Fetch Orders for Today and Yesterday
  const todayOrders = await prisma.order.findMany({
    where: { status: "PAID", paidAt: { gte: todayStart } },
    select: { totalAmount: true }
  });

  const yesterdayOrders = await prisma.order.findMany({
    where: { status: "PAID", paidAt: { gte: yesterdayStart, lt: todayStart } },
    select: { totalAmount: true }
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  
  const todayOrderCount = todayOrders.length;
  const yesterdayOrderCount = yesterdayOrders.length;

  const revenueChange = calculateChange(todayRevenue, yesterdayRevenue);
  const orderChange = calculateChange(todayOrderCount, yesterdayOrderCount);

  // 2. Fetch Last 7 Days Trend
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  
  const recentOrders = await prisma.order.findMany({
    where: { status: "PAID", paidAt: { gte: sevenDaysAgo } },
    select: { paidAt: true, totalAmount: true }
  });

  // Group by date
  const trendMap = new Map<string, number>();
  // Initialize last 7 days with 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    // Format label using China locale
    const key = d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' });
    trendMap.set(key, 0);
  }

  recentOrders.forEach(order => {
    if (order.paidAt) {
      const key = order.paidAt.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' });
      if (trendMap.has(key)) {
        trendMap.set(key, (trendMap.get(key) || 0) + Number(order.totalAmount));
      }
    }
  });

  const trendData = Array.from(trendMap.entries()).map(([date, amount]) => ({ date, amount }));

  // 3. Overall Stats
  const productCount = await prisma.product.count();
  const totalRevenueAllTimeRaw = await prisma.order.aggregate({
    where: { status: "PAID" },
    _sum: { totalAmount: true }
  });
  const totalRevenueAllTime = Number(totalRevenueAllTimeRaw._sum.totalAmount || 0);

  // 4. Low Stock Products (< 10)
  const productsWithStock = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      price: true,
      _count: {
        select: { licenses: { where: { status: "AVAILABLE" } } }
      }
    }
  });

  const lowStockProducts = productsWithStock
    .map(p => ({ ...p, stock: p._count.licenses }))
    .filter(p => p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-white">仪表盘</h1>
      
      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日收入</CardTitle>
            <CreditCard className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">¥{todayRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              较昨日 <span className={revenueChange >= 0 ? "text-green-500" : "text-red-500"}>
                {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日订单</CardTitle>
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{todayOrderCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              较昨日 <span className={orderChange >= 0 ? "text-green-500" : "text-red-500"}>
                {orderChange >= 0 ? "+" : ""}{orderChange.toFixed(1)}%
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计收入</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalRevenueAllTime.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">历史总流水</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在售商品</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount}</div>
            <p className="text-xs text-muted-foreground mt-1">当前活跃商品</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Revenue Trend Chart */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> 
              近7日收入趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={trendData} />
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              缺货预警
            </CardTitle>
            <CardDescription>库存少于 10 件的商品</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  库存充足，暂无预警
                </div>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-border/50 last:border-0 pb-3 last:pb-0">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">单价: ¥{Number(p.price).toFixed(2)}</p>
                    </div>
                    <div className={p.stock === 0 ? "text-red-500 font-bold" : "text-yellow-500 font-bold"}>
                      {p.stock === 0 ? "已售罄" : `剩 ${p.stock} 件`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
