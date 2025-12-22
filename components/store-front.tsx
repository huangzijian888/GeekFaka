"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ShoppingCart, Loader2, Zap, Package, CreditCard, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description: string | null
  price: string
  stock: number
}

interface Category {
  id: string
  name: string
  products: Product[]
}

interface PaymentChannel {
  id: string
  name: string
  icon: string 
  provider: string
  fee?: number
}

export function StoreFront({ categories }: { categories: Category[] }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isBuyOpen, setIsBuyOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Payment Channels
  const [channels, setChannels] = useState<PaymentChannel[]>([])
  const [paymentMethod, setPaymentMethod] = useState("") 
  
  // Form State
  const [email, setEmail] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [emailError, setEmailError] = useState("")

  // Derived State
  const selectedChannel = channels.find(c => c.id === paymentMethod)
  const productTotal = selectedProduct ? Number(selectedProduct.price) * quantity : 0
  const feePercent = selectedChannel?.fee || 0
  const feeAmount = productTotal * (feePercent / 100)
  const finalTotal = productTotal + feeAmount

  useEffect(() => {
    fetch("/api/config/payments")
      .then(res => res.json())
      .then(data => {
        setChannels(data)
        if (data.length > 0) setPaymentMethod(data[0].id)
      })
      .catch(console.error)
  }, [])

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isBuyOpen) {
      setEmailError("")
    }
  }, [isBuyOpen])

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setIsBuyOpen(true)
  }

  const handlePurchase = async () => {
    if (!selectedProduct) return
    
    if (!validateEmail(email)) {
      setEmailError("请输入有效的邮箱地址，用于接收卡密")
      return
    }
    
    if (!paymentMethod) {
      alert("请选择支付方式")
      return
    }

    setEmailError("")
    setLoading(true)

    try {
      // Find the provider for the selected channel
      const selectedChannel = channels.find(c => c.id === paymentMethod)
      const providerName = selectedChannel?.provider || "dummy"

      const payload = {
        productId: selectedProduct.id,
        quantity,
        email,
        paymentMethod: providerName, 
        options: {
          channel: paymentMethod === "wechat" ? "wxpay" : paymentMethod 
        }
      }

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        alert(data.error || "下单失败")
        return
      }

      if (data.payUrl) {
        window.location.href = data.payUrl
      }

    } catch (error) {
      console.error(error)
      alert("系统错误")
    } finally {
      setLoading(false)
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Package className="h-16 w-16 mb-4 opacity-20" />
        <p>暂无商品上架</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <Tabs defaultValue={categories[0].id} className="w-full">
        <div className="flex justify-center mb-10">
          <TabsList className="h-12 bg-secondary/50 backdrop-blur p-1 rounded-full border border-border/50">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="rounded-full px-6 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="group relative overflow-hidden border-border/50 bg-card/40 backdrop-blur hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg font-bold leading-tight line-clamp-2 min-h-[3rem]">
                          {product.name}
                        </CardTitle>
                        <Badge variant={product.stock > 0 ? "outline" : "destructive"} className="whitespace-nowrap">
                          {product.stock > 0 ? (
                            <span className="flex items-center gap-1">
                              <Zap className="h-3 w-3 fill-current" /> {product.stock}
                            </span>
                          ) : "缺货"}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 min-h-[2.5rem] mt-2">
                        {product.description || "暂无描述"}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                       <div className="flex items-baseline gap-1 text-primary">
                         <span className="text-sm font-medium">¥</span>
                         <span className="text-3xl font-bold tracking-tight">{Number(product.price).toFixed(2)}</span>
                       </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className="w-full font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" 
                        disabled={product.stock <= 0}
                        onClick={() => handleBuyClick(product)}
                        size="lg"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" /> 
                        立即购买
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
             </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isBuyOpen} onOpenChange={setIsBuyOpen}>
        <DialogContent className="sm:max-w-[500px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">确认订单</DialogTitle>
            <DialogDescription>
              请核对商品信息并选择支付方式
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* 商品信息卡片 */}
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium leading-none">{selectedProduct?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  单价: ¥{Number(selectedProduct?.price).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className={cn(emailError && "text-destructive")}>
                  接收邮箱 {emailError && <span className="text-xs font-normal ml-2">{emailError}</span>}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={cn("bg-background/50", emailError && "border-destructive focus-visible:ring-destructive")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                  <Label htmlFor="quantity">购买数量</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={selectedProduct?.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="bg-background/50"
                  />
                 </div>
                 <div className="grid gap-2">
                    <Label>预计支付金额</Label>
                    <div className="flex flex-col items-end">
                      <div className="h-10 flex items-center px-3 rounded-md border border-primary/20 bg-primary/5 text-primary font-bold text-lg w-full justify-end">
                        ¥ {finalTotal.toFixed(2)}
                      </div>
                      {feeAmount > 0 ? (
                        <span className="text-xs text-muted-foreground mt-1">
                          (商品 ¥{productTotal.toFixed(2)} + 支付渠道手续费 ¥{feeAmount.toFixed(2)})
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground mt-1">
                          免手续费
                        </span>
                      )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>支付方式</Label>
              {channels.length > 0 ? (
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                  {channels.map((channel) => (
                    <div key={channel.id}>
                      <RadioGroupItem value={channel.id} id={channel.id} className="peer sr-only" />
                      <Label
                        htmlFor={channel.id}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all relative overflow-hidden"
                      >
                        {channel.fee && channel.fee > 0 && (
                          <div className="absolute top-0 right-0 bg-destructive text-white text-[10px] px-1.5 py-0.5 rounded-bl">
                            +{channel.fee}%
                          </div>
                        )}
                        {channel.icon === "wallet" ? (
                          <Wallet className="mb-2 h-6 w-6 text-blue-500" />
                        ) : (
                          <CreditCard className="mb-2 h-6 w-6 text-green-500" />
                        )}
                        {channel.name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="p-4 border border-destructive/50 rounded bg-destructive/10 text-destructive text-sm text-center">
                  暂无可用支付方式，请联系管理员。
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button size="lg" className="w-full font-bold text-lg h-12" onClick={handlePurchase} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "正在创建订单..." : "立即支付"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
