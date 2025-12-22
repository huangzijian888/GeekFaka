import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Copy, XCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";

export default async function OrderPage({ params }: { params: { orderNo: string } }) {
  const { orderNo } = params;

  const order = await prisma.order.findUnique({
    where: { orderNo },
    include: {
      product: true,
      licenses: true
    }
  });

  if (!order) {
    notFound();
  }

  const isExpired = order.status === "EXPIRED" || (order.status === "PENDING" && new Date(order.createdAt).getTime() + 30 * 60 * 1000 < Date.now());

  return (
    <div className="min-h-screen bg-muted/40 pb-20">
      <Navbar />
      <div className="container mx-auto max-w-3xl py-10 px-4">
        <Card className="mb-8">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {order.status === "PAID" ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : isExpired ? (
                <XCircle className="h-16 w-16 text-destructive" />
              ) : (
                <Clock className="h-16 w-16 text-yellow-500" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {order.status === "PAID" ? "支付成功" : isExpired ? "订单已过期" : "等待支付"}
            </CardTitle>
            <p className="text-muted-foreground mt-2">订单号: {order.orderNo}</p>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block">商品名称</span>
                  <span className="font-medium">{order.product.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">支付金额</span>
                  <span className="font-medium text-lg">¥{Number(order.totalAmount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">购买数量</span>
                  <span className="font-medium">{order.quantity} 个</span>
                </div>
                <div>
                   <span className="text-muted-foreground block">联系邮箱</span>
                   <span className="font-medium">{order.email || "-"}</span>
                </div>
             </div>

             <Separator />

             {order.status === "PAID" && (
               <div>
                 <h3 className="font-semibold mb-4 text-lg">您的卡密信息</h3>
                 <div className="space-y-3">
                   {order.licenses.map((license, index) => (
                     <div key={license.id} className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border flex flex-col gap-2">
                       <div className="flex justify-between items-center">
                         <span className="text-xs text-muted-foreground">卡密 #{index + 1}</span>
                       </div>
                       <code className="block bg-background p-3 rounded border font-mono text-lg break-all select-all">
                         {license.code}
                       </code>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {order.status === "PENDING" && !isExpired && (
                <div className="text-center p-4 bg-yellow-500/10 text-yellow-600 rounded-md border border-yellow-500/20">
                   请在 30 分钟内完成支付，否则订单将自动取消。
                </div>
             )}

             {isExpired && (
                <div className="text-center p-4 bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                   订单超时未支付，已自动关闭。请重新下单。
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
