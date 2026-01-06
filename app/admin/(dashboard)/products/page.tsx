"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Loader2, Key, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { StockManager } from "@/components/admin/stock-manager"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: string
  categoryId: string
  category: Category
  isActive: boolean
  deliveryFormat: string
  _count: {
    licenses: number
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  // Filter & Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Stock State
  const [stockProduct, setStockProduct] = useState<Product | null>(null)
  const [isStockOpen, setIsStockOpen] = useState(false)
  
  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    deliveryFormat: "SINGLE"
  })

  useEffect(() => {
    fetchData()
  }, [page, selectedCategory])

  const fetchData = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        categoryId: selectedCategory
      })

      const [prodRes, catRes] = await Promise.all([
        fetch(`/api/admin/products?${queryParams}`),
        fetch("/api/admin/categories")
      ])
      
      const prodData = await prodRes.json()
      const catData = await catRes.json()
      
      if (prodRes.ok) {
        setProducts(prodData.products || [])
        setTotalPages(prodData.pagination?.pages || 1)
      }
      if (catRes.ok) {
        setCategories(catData.items || [])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        categoryId: product.categoryId,
        deliveryFormat: product.deliveryFormat || "SINGLE"
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: categories[0]?.id || "",
        deliveryFormat: "SINGLE"
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : "/api/admin/products"
    const method = editingProduct ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      })
      if (res.ok) {
        setIsDialogOpen(false)
        fetchData()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !current }),
        headers: { "Content-Type": "application/json" }
      })
      setProducts(products.map(p => p.id === id ? { ...p, isActive: !current } : p))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此商品吗？如果有关联的卡密可能会失败。")) return
    
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id))
      } else {
        const data = await res.json()
        alert(data.error)
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">商品管理</h1>
          <p className="text-muted-foreground">创建、编辑商品并管理库存</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-[180px]">
             <Select value={selectedCategory} onValueChange={(val) => { setPage(1); setSelectedCategory(val); }}>
               <SelectTrigger>
                 <div className="flex items-center gap-2">
                   <Filter className="h-4 w-4 text-muted-foreground" />
                   <SelectValue placeholder="全部分类" />
                 </div>
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">全部分类</SelectItem>
                 {categories.map(cat => (
                   <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <Button onClick={() => handleOpenDialog()}>
             <Plus className="mr-2 h-4 w-4" /> 新增商品
           </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card text-white flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-[300px]">名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    暂无商品数据
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/40 transition-colors h-24 group">
                    <TableCell className="py-4 relative">
                      {/* 侧边装饰条 */}
                      <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex flex-col gap-1.5 pl-2">
                        <span className="text-xl font-black text-slate-50 tracking-tight drop-shadow-sm leading-tight">
                          {product.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono select-all">
                            ID: {product.id}
                          </code>
                          <span className="text-xs text-muted-foreground/60 line-clamp-1 italic font-medium">
                            {product.description || "暂无描述"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-secondary/50 border-border/50 text-xs font-normal">
                        {product.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-primary tracking-tight">
                        ¥{Number(product.price).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        product._count.licenses === 0 
                          ? "bg-destructive/10 text-destructive border-destructive/20" 
                          : "bg-green-500/10 text-green-500 border-green-500/20"
                      )}>
                        {`库存: ${product._count.licenses}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={product.isActive} 
                        onCheckedChange={() => handleToggleActive(product.id, product.isActive)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         <Button 
                           variant="secondary" 
                           size="sm" 
                           className="h-8 px-2 lg:px-3 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                           onClick={() => {
                             setStockProduct(product)
                             setIsStockOpen(true)
                           }}
                         >
                           <Key className="h-3.5 w-3.5 mr-1" />
                           库存
                         </Button>
                         <Button 
                           variant="secondary" 
                           size="sm" 
                           className="h-8 px-2 lg:px-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                           onClick={() => handleOpenDialog(product)}
                         >
                           <Edit2 className="h-3.5 w-3.5 mr-1" />
                           编辑
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-8 px-2 lg:px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                           onClick={() => handleDelete(product.id)}
                         >
                           <Trash2 className="h-3.5 w-3.5 mr-1" />
                           删除
                         </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-end space-x-2 p-4 border-t bg-card shrink-0">
          <div className="flex-1 text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stock Management Dialog */}
      {stockProduct && (
        <StockManager 
          productId={stockProduct.id}
          productName={stockProduct.name}
          open={isStockOpen}
          onOpenChange={setIsStockOpen}
          onStockUpdated={fetchData}
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "编辑商品" : "新增商品"}</DialogTitle>
            <DialogDescription>
              配置商品详情与描述信息
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Left Column: Basic Info */}
              <div className="md:col-span-1 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">商品名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="例如：Netflix 4K"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="categoryId">所属分类</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">价格 (元)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">¥</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      className="pl-7"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>发货格式</Label>
                  <Select 
                    value={formData.deliveryFormat} 
                    onValueChange={(val) => setFormData({ ...formData, deliveryFormat: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">普通 (单激活码/IP)</SelectItem>
                      <SelectItem value="ACCOUNT_PASS">账号----密码</SelectItem>
                      <SelectItem value="ACCOUNT_FULL">账号----密码----辅助邮箱----2FA</SelectItem>
                      <SelectItem value="VIRTUAL_CARD">虚拟卡 (卡号|月/年|CVV)</SelectItem>
                      <SelectItem value="PROXY_IP">代理IP (主机:端口:用户:密码)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">影响用户查收卡密时的展示方式</p>
                </div>

                <div className="pt-4">
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     提示：<br/>
                     1. 商品创建后默认为上架状态。<br/>
                     2. 请在“库存管理”中添加卡密。<br/>
                     3. 描述支持图片和超链接。<br/>
                     4. 请务必按所选格式添加卡密。
                   </p>
                </div>
              </div>

              {/* Right Column: Rich Text Editor */}
              <div className="md:col-span-2 flex flex-col gap-2 h-full min-h-[400px]">
                <Label>详细描述</Label>
                <div className="flex-1 border rounded-md overflow-hidden bg-background">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="输入商品的详细说明，支持图片链接、标题排版..."
                  />
                </div>
              </div>
            </div>
          </form>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button type="submit" onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存商品
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
