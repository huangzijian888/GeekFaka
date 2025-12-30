"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Ticket, Loader2, CheckCircle2, XCircle, Percent, Coins, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Coupon {
  id: string
  code: string
  discountType: "FIXED" | "PERCENTAGE"
  discountValue: string
  isUsed: boolean
  productId: string | null
  product?: { name: string }
  categoryId: string | null
  category?: { name: string }
  createdAt: string
  usedAt: string | null
  order?: { orderNo: string }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 10

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discountValue: "",
    discountType: "FIXED" as "FIXED" | "PERCENTAGE",
    scopeType: "ALL" as "ALL" | "PRODUCT" | "CATEGORY",
    productId: "",
    categoryId: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCoupons(page)
    fetchProducts()
    fetchCategories()
  }, [page])

  useEffect(() => {
    if (editingCoupon) {
      let scopeType: "ALL" | "PRODUCT" | "CATEGORY" = "ALL";
      if (editingCoupon.productId) scopeType = "PRODUCT";
      else if (editingCoupon.categoryId) scopeType = "CATEGORY";

      setFormData({
        code: editingCoupon.code,
        discountValue: editingCoupon.discountValue || "0",
        discountType: editingCoupon.discountType,
        scopeType,
        productId: editingCoupon.productId || "",
        categoryId: editingCoupon.categoryId || ""
      })
    } else {
      setFormData({ code: "", discountValue: "", discountType: "FIXED", scopeType: "ALL", productId: "", categoryId: "" })
    }
  }, [editingCoupon])

  const fetchCoupons = async (currentPage: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/coupons?page=${currentPage}&limit=${PAGE_SIZE}`)
      const data = await res.json()
      setCoupons(data.items || [])
      setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products?limit=100")
      const data = await res.json()
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products)
      } else if (Array.isArray(data)) {
        setProducts(data)
      } else {
        setProducts([])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      setCategories(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons";
      const method = editingCoupon ? "PATCH" : "POST";

      const payload = {
        code: formData.code,
        discountType: formData.discountType,
        discountValue: formData.discountValue,
        productId: formData.scopeType === "PRODUCT" ? formData.productId : null,
        categoryId: formData.scopeType === "CATEGORY" ? formData.categoryId : null,
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setIsOpen(false)
        fetchCoupons(page)
      } else {
        const data = await res.json()
        alert(data.error || "保存失败")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个优惠码吗？")) return
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" })
      fetchCoupons(page)
    } catch (e) {
      console.error(e)
    }
  }

  const generateRandomCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code: result });
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">优惠码管理</h1>
          <p className="text-muted-foreground">创建通用、分类或指定商品的一次性折扣券</p>
        </div>
        <Button onClick={() => { setEditingCoupon(null); setIsOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> 新建优惠码
        </Button>
      </div>

      <div className="rounded-md border bg-card text-white flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead>优惠码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>面值</TableHead>
                <TableHead>适用范围</TableHead>
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
              ) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    暂无优惠码
                  </TableCell>
                </TableRow>
              ) : (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-primary">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discountType === "PERCENTAGE" ? (
                        <span className="flex items-center gap-1 text-xs"><Percent className="h-3 w-3" /> 百分比</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs"><Coins className="h-3 w-3" /> 固定金额</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold">
                      {coupon.discountType === "PERCENTAGE" 
                        ? `${Number(coupon.discountValue).toFixed(0)}%` 
                        : `¥${Number(coupon.discountValue).toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      {coupon.product ? (
                        <Badge variant="outline" className="font-normal border-blue-500/30 text-blue-400">商品: {coupon.product.name}</Badge>
                      ) : coupon.category ? (
                        <Badge variant="outline" className="font-normal border-purple-500/30 text-purple-400">分类: {coupon.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">全站通用</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {coupon.isUsed ? (
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 border-zinc-700">
                          已使用 ({coupon.order?.orderNo})
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600">
                          可使用
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCoupon(coupon); setIsOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(coupon.id)}>
                          <Trash2 className="h-4 w-4" />
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
            第 {page} 页 / 共 {totalPages} 页
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "编辑优惠码" : "新建优惠码"}</DialogTitle>
            <DialogDescription>
              创建一个一次性的折扣券。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>优惠码内容</Label>
              <div className="flex gap-2">
                <Input 
                  value={formData.code} 
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} 
                  placeholder="例如：DISCOUNT10"
                  className="font-mono"
                />
                {!editingCoupon && <Button variant="outline" onClick={generateRandomCode} type="button">随机</Button>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>优惠类型</Label>
                <Select 
                  value={formData.discountType} 
                  onValueChange={(val: any) => setFormData({ ...formData, discountType: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">固定金额</SelectItem>
                    <SelectItem value="PERCENTAGE">百分比折扣</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{formData.discountType === "FIXED" ? "金额 (元)" : "比例 (%)"}</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.discountValue} 
                  onChange={e => setFormData({ ...formData, discountValue: e.target.value })} 
                  placeholder={formData.discountType === "FIXED" ? "5.00" : "10"}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>适用范围</Label>
              <Select 
                value={formData.scopeType} 
                onValueChange={(val: any) => setFormData({ ...formData, scopeType: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择商品" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全站通用</SelectItem>
                  <SelectItem value="PRODUCT">指定商品</SelectItem>
                  <SelectItem value="CATEGORY">指定分类</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scopeType === "PRODUCT" && (
              <div className="grid gap-2">
                <Label>选择商品</Label>
                <Select 
                  value={formData.productId} 
                  onValueChange={(val) => setFormData({ ...formData, productId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.scopeType === "CATEGORY" && (
              <div className="grid gap-2">
                <Label>选择分类</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCoupon ? "保存修改" : "立即创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
