"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Clock, Copy, XCircle, Loader2, Check, CreditCard, User, ShieldCheck, Mail, Key, Globe, Hash } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import React from "react"

interface Order {
  id: string
  orderNo: string
  email: string | null
  totalAmount: any
  status: string
  quantity: number
  paidAt: any
  product: {
    name: string
    deliveryFormat: string
  }
  licenses: {
    id: string
    code: string
  }[]
  createdAt: any
}

function CopyableField({ label, value, icon: Icon }: { label: string, value: string, icon?: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
          {Icon && <Icon className="h-3 w-3" />}
          {label}
        </span>
      </div>
      <div className="flex gap-2">
        <Input 
          readOnly 
          value={value} 
          className="bg-background/50 font-mono text-sm h-9 border-primary/10 focus-visible:ring-0 focus-visible:border-primary/30" 
        />
        <Button variant="secondary" size="icon" className="h-9 w-9 shrink-0 hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function LicenseItem({ code, index, format }: { code: string, index: number, format: string }) {
  const [fullCopied, setFullCopied] = useState(false);

  const handleCopyFull = () => {
    navigator.clipboard.writeText(code);
    setFullCopied(true);
    setTimeout(() => setFullCopied(false), 2000);
  };

  // Normal / SINGLE format
  if (format === "SINGLE" || !format) {
    return (
      <div className="group bg-muted/30 p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">卡密 #{index + 1}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={handleCopyFull}>
            {fullCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
        <code className="block bg-background/80 p-4 rounded-lg border font-mono text-lg break-all select-all text-primary font-bold">
          {code}
        </code>
      </div>
    );
  }

  // Account formats (using ----)
  if (format.startsWith("ACCOUNT_")) {
    const parts = code.split("----");
    const labels = format === "ACCOUNT_FULL" 
      ? ["账号", "密码", "辅助邮箱", "2FA 密钥"] 
      : ["账号", "密码"];
    const icons = [User, ShieldCheck, Mail, Key];

    return (
      <div className="group bg-muted/30 p-5 rounded-xl border border-border/50 hover:border-primary/30 transition-all space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">账号信息 #{index + 1}</span>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:border-primary/50" onClick={handleCopyFull}>
            {fullCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            复制完整格式
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {labels.map((label, i) => parts[i] && (
            <CopyableField key={label} label={label} value={parts[i]} icon={icons[i]} />
          ))}
        </div>
      </div>
    );
  }

  // Virtual Card format (using |)
  if (format === "VIRTUAL_CARD") {
    const parts = code.split("|");
    const labels = ["卡号", "有效期 (月/年)", "CVV 安全码"];
    const icons = [CreditCard, Clock, ShieldCheck];

    return (
      <div className="group bg-muted/30 p-5 rounded-xl border border-border/50 hover:border-primary/30 transition-all space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">虚拟卡信息 #{index + 1}</span>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:border-primary/50" onClick={handleCopyFull}>
            {fullCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            复制完整格式
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {labels.map((label, i) => parts[i] && (
            <CopyableField key={label} label={label} value={parts[i]} icon={icons[i]} />
          ))}
        </div>
      </div>
    );
  }

  // Proxy IP format (using :)
  if (format === "PROXY_IP") {
    const parts = code.split(":");
    const labels = ["主机 (Host)", "端口 (Port)", "用户 (User)", "密码 (Pass)"];
    const icons = [Globe, Hash, User, ShieldCheck];

    return (
      <div className="group bg-muted/30 p-5 rounded-xl border border-border/50 hover:border-primary/30 transition-all space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">代理信息 #{index + 1}</span>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:border-primary/50" onClick={handleCopyFull}>
            {fullCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
            复制完整格式
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {labels.map((label, i) => parts[i] && (
            <CopyableField key={label} label={label} value={parts[i]} icon={icons[i]} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function OrderPage({ params }: { params: { orderNo: string } }) {
  const { orderNo } = params
  const searchParams = useSearchParams()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [checking, setChecking] = useState(false)

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNo}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Effect to sync payment status if URL has payment params
  useEffect(() => {
    const tradeStatus = searchParams.get("trade_status")
    
    const syncPayment = async () => {
      if (tradeStatus === "TRADE_SUCCESS") {
        setSyncing(true)
        try {
          const query = searchParams.toString()
          await fetch(`/api/payments/epay/notify?${query}`)
        } catch (e) {
          console.error("Sync failed", e)
        } finally {
          setSyncing(false)
          fetchOrder()
        }
      } else {
        fetchOrder()
      }
    }

    syncPayment()
  }, [orderNo, searchParams])

  const handleCheckPayment = async () => {
    setChecking(true)
    try {
      const res = await fetch(`/api/orders/${orderNo}/check`, { method: "POST" })
      const data = await res.json()
      if (data.status === "PAID") {
        fetchOrder() // Refresh to show keys
      } else {
        alert("未查询到支付成功记录，请稍后再试或联系客服。")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark text-foreground">
        <Navbar />
        <div className="container mx-auto max-w-3xl py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background dark text-foreground">
        <Navbar />
        <div className="container mx-auto max-w-3xl py-20 text-center">
          <h1 className="text-2xl font-bold">订单不存在</h1>
        </div>
      </div>
    )
  }

  const isExpired = order.status === "EXPIRED" || (order.status === "PENDING" && new Date(order.createdAt).getTime() + 30 * 60 * 1000 < Date.now());

  return (
    <div className="min-h-screen bg-background dark text-foreground pb-20">
      <Navbar />
      <div className="container mx-auto max-w-3xl py-10 px-4">
        {syncing && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center gap-2 text-primary animate-pulse text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在同步支付状态，请稍候...
          </div>
        )}

        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {order.status === "PAID" ? (
                <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              ) : isExpired ? (
                <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-destructive" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-yellow-500 animate-pulse" />
                </div>
              )}
            </div>
            <CardTitle className="text-3xl font-black tracking-tight">
              {order.status === "PAID" ? "支付成功" : isExpired ? "订单已过期" : "等待支付"}
            </CardTitle>
            <p className="text-muted-foreground mt-2 font-mono">#{order.orderNo}</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
             <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-widest">商品名称</span>
                  <span className="font-bold text-base">{order.product.name}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-widest">支付金额</span>
                  <span className="font-bold text-xl text-primary font-mono">¥{Number(order.totalAmount).toFixed(2)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-widest">购买数量</span>
                  <span className="font-medium">{order.quantity} 个</span>
                </div>
                <div className="space-y-1">
                   <span className="text-muted-foreground block uppercase text-[10px] font-bold tracking-widest">联系方式</span>
                   <span className="font-medium">{order.email || "-"}</span>
                </div>
             </div>

             <Separator className="bg-border/50" />

             {order.status === "PAID" && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex items-center gap-2 mb-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <h3 className="font-bold text-lg">您的卡密信息</h3>
                 </div>
                 <div className="space-y-4">
                   {order.licenses.map((license, index) => (
                     <LicenseItem 
                       key={license.id} 
                       code={license.code} 
                       index={index} 
                       format={order.product.deliveryFormat} 
                     />
                   ))}
                 </div>
               </div>
             )}

             {order.status === "PENDING" && !isExpired && (
                <div className="text-center p-6 bg-yellow-500/5 text-yellow-600 rounded-xl border border-yellow-500/20 space-y-4">
                   <div className="space-y-2">
                     <p className="font-bold text-sm">付款完成后，请勿关闭此页面</p>
                     <p className="text-xs opacity-80">系统检测到支付成功后将自动展示卡密。</p>
                   </div>
                   <Button 
                     variant="outline" 
                     className="w-full border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10 hover:text-yellow-700"
                     onClick={handleCheckPayment}
                     disabled={checking}
                   >
                     {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                     我已支付，点击刷新
                   </Button>
                </div>
             )}

             {isExpired && (
                <div className="text-center p-6 bg-destructive/5 text-destructive rounded-xl border border-destructive/20">
                   订单超时未支付，已自动关闭。请返回首页重新下单。
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}