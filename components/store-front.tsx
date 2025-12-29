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
import { ShoppingCart, Loader2, Zap, Package, CreditCard, Wallet, Ticket, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"

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

  // Coupon State
  const [couponCode, setCouponCode] = useState("")
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string, 
    discountType: "FIXED" | "PERCENTAGE", 
    discountValue: number 
  } | null>(null)
  const [couponError, setCouponError] = useState("")

  // Derived State
  const selectedChannel = channels.find(c => c.id === paymentMethod)
  const subtotal = selectedProduct ? Number(selectedProduct.price) * quantity : 0
  
  // Calculate discount
  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discountType === "PERCENTAGE") {
      discount = subtotal * (appliedCoupon.discountValue / 100)
    } else {
      discount = appliedCoupon.discountValue
    }
  }

  const productTotal = Math.max(0, subtotal - discount)
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
      setCouponCode("")
      setAppliedCoupon(null)
      setCouponError("")
    }
  }, [isBuyOpen])

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(val)
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setIsValidatingCoupon(true)
    setCouponError("")
    
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, productId: selectedProduct?.id })
      })
      const data = await res.json()
      
      if (res.ok) {
        setAppliedCoupon({ 
          code: data.code, 
          discountType: data.discountType, 
          discountValue: Number(data.discountValue) 
        })
      } else {
        setCouponError(data.error || "无效的优惠码")
        setAppliedCoupon(null)
      }
    } catch (e) {
      setCouponError("验证失败")
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const handleBuyClick = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setIsBuyOpen(true)
  }

  const handlePurchase = async () => {
    if (!selectedProduct) return
    
    if (!validateEmail(email)) {
      setEmailError("请输入有效的邮箱地址，用于接收订单通知")
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
        email: email, 
        paymentMethod: providerName,
        couponCode: appliedCoupon?.code,
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cat.products.map((product) => (
                  <Card 
                    key={product.id} 
                    className={cn(
                      "group relative overflow-hidden border border-primary/20 bg-card/80 shadow-md backdrop-blur transition-all duration-300",
                      product.stock > 0 
                        ? "hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1" 
                        : "opacity-60 grayscale-[0.8] cursor-not-allowed pointer-events-none"
                    )}
                  >
                    {/* Hover Overlay for Details */}
                    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-center items-center p-6 text-center">
                       <h4 className="font-bold text-lg mb-2 text-primary">{product.name}</h4>
                       <div className="text-sm text-muted-foreground line-clamp-6">
                         <ReactMarkdown>{product.description || "暂无详细描述"}</ReactMarkdown>
                       </div>
                       <Button 
                         variant="outline" 
                         className="mt-4 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                         onClick={(e) => {
                           handleBuyClick(product)
                         }}
                       >
                         查看详情 & 购买
                       </Button>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    <CardHeader>
                      <CardTitle className="text-xl font-bold leading-tight line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </CardTitle>
                      {/* Hide description in default view to keep it clean */}
                      <div className="h-[2.5rem]" /> 
                    </CardHeader>
                    
                    <CardContent>
                       <div className="flex items-center justify-between">
                         <div className="flex items-baseline gap-1 text-primary">
                           <span className="text-sm font-medium">¥</span>
                           <span className="text-3xl font-bold tracking-tight">{Number(product.price).toFixed(2)}</span>
                         </div>
                         <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className="px-3 py-1">
                           {product.stock > 0 ? (
                             <span className="flex items-center gap-1.5 font-medium">
                               <Package className="h-3.5 w-3.5" /> 库存 {product.stock}
                             </span>
                           ) : "缺货"}
                         </Badge>
                       </div>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className="w-full font-semibold shadow-lg shadow-primary/20 transition-all" 
                        disabled={product.stock <= 0}
                        onClick={() => handleBuyClick(product)}
                        size="lg"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" /> 
                        {product.stock > 0 ? "立即购买" : "已售罄"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
             </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isBuyOpen} onOpenChange={setIsBuyOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto md:overflow-hidden p-0 gap-0">
          <div className="grid grid-cols-1 md:grid-cols-5 md:h-full">
            {/* Left Column: Product Details */}
            <div className="order-2 md:order-1 md:col-span-3 p-6 flex flex-col md:h-full md:overflow-y-auto bg-background">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold">{selectedProduct?.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-primary bg-primary/10 border-primary/20">
                    单价 ¥{Number(selectedProduct?.price).toFixed(2)}
                  </Badge>
                  <Badge variant="outline">
                    库存 {selectedProduct?.stock}
                  </Badge>
                </div>
              </DialogHeader>
              
              <div className="flex-1 prose prose-sm dark:prose-invert max-w-none pr-2">
                 <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">商品详情</div>
                 <ReactMarkdown>{selectedProduct?.description || "暂无详细描述"}</ReactMarkdown>
              </div>
            </div>

            {/* Right Column: Checkout Form */}
            <div className="order-1 md:order-2 md:col-span-2 bg-muted/30 border-b md:border-b-0 md:border-l p-6 flex flex-col gap-6 md:h-full md:overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" /> 订单配置
                </h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="email" className={cn(emailError && "text-destructive")}>
                    接收邮箱 {emailError && <span className="text-xs font-normal ml-2 text-destructive">{emailError}</span>}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={cn("bg-background", emailError && "border-destructive focus-visible:ring-destructive")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quantity">购买数量</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={selectedProduct?.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="bg-background"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="coupon">优惠码 (可选)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="输入优惠码"
                        className={cn("bg-background pr-8 uppercase font-mono", appliedCoupon && "border-green-500 focus-visible:ring-green-500")}
                        disabled={!!appliedCoupon}
                      />
                      {appliedCoupon && <Check className="absolute right-2.5 top-2.5 h-4 w-4 text-green-500" />}
                    </div>
                    {appliedCoupon ? (
                      <Button variant="outline" size="icon" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode.trim()} className="shrink-0">
                        {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "使用"}
                      </Button>
                    )}
                  </div>
                  {couponError && <p className="text-[10px] text-destructive ml-1">{couponError}</p>}
                  {appliedCoupon && <p className="text-[10px] text-green-600 ml-1 font-medium flex items-center gap-1"><Ticket className="h-3 w-3" /> 已减免 ¥{discount.toFixed(2)}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> 支付方式
                </h3>
                {channels.length > 0 ? (
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3">
                    {channels.map((channel) => (
                      <div key={channel.id}>
                        <RadioGroupItem value={channel.id} id={channel.id} className="peer sr-only" />
                        <Label
                          htmlFor={channel.id}
                          className="flex items-center justify-between rounded-md border border-muted bg-background p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-1 peer-data-[state=checked]:ring-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            {channel.icon === "wallet" ? (
                              <Wallet className="h-5 w-5 text-blue-500" />
                            ) : (
                              <CreditCard className="h-5 w-5 text-green-500" />
                            )}
                            {channel.name}
                          </div>
                          {channel.fee && channel.fee > 0 && (
                            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                              +{channel.fee}%
                            </Badge>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <div className="p-3 border border-destructive/50 rounded bg-destructive/10 text-destructive text-xs text-center">
                    暂无可用支付方式
                  </div>
                )}
              </div>

              <div className="mt-auto pt-6 border-t space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">预计支付</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ¥{finalTotal.toFixed(2)}
                    </div>
                    {feeAmount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        含手续费 ¥{feeAmount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20" onClick={handlePurchase} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "正在处理..." : "立即支付"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
