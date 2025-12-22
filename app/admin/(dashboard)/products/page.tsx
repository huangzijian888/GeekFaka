"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Loader2, PackageOpen, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { StockManager } from "@/components/admin/stock-manager"

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
  _count: {
    licenses: number
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  
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
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories")
      ])
      const prodData = await prodRes.json()
      const catData = await catRes.json()
      setProducts(prodData)
      setCategories(catData)
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
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: categories[0]?.id || "",
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">商品管理</h1>
          <p className="text-muted-foreground">创建、编辑商品并管理库存</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> 新增商品
        </Button>
      </div>

      <div className="rounded-md border bg-card text-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
                      库存: {product._count.licenses}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "编辑商品" : "新增商品"}</DialogTitle>
            <DialogDescription>
              填写商品的基本信息
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">商品名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryId">分类</Label>
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
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="输入商品的详细说明或使用说明..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitLoading}>
                {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
