"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Ticket, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Coupon {
  id: string
  code: string
  discount: string
  isUsed: boolean
  createdAt: string
  usedAt: string | null
  order?: { orderNo: string }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState({
    code: "",
    discount: ""
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/coupons")
      const data = await res.json()
      setCoupons(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsOpen(false)
        setFormData({ code: "", discount: "" })
        fetchCoupons()
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
      fetchCoupons()
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">优惠码管理</h1>
          <p className="text-muted-foreground">创建一次性折扣券</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 新建优惠码
        </Button>
      </div>

      <div className="rounded-md border bg-card text-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>优惠码</TableHead>
              <TableHead>折扣金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>使用订单</TableHead>
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
                  <TableCell className="font-bold">¥{Number(coupon.discount).toFixed(2)}</TableCell>
                  <TableCell>
                    {coupon.isUsed ? (
                      <Badge variant="secondary" className="bg-zinc-800 text-zinc-500 border-zinc-700">
                        <XCircle className="mr-1 h-3 w-3" /> 已使用
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> 可使用
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(coupon.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {coupon.order?.orderNo || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建优惠码</DialogTitle>
            <DialogDescription>
              创建一个一次性的固定金额折扣券。
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
                <Button variant="outline" onClick={generateRandomCode} type="button">随机生成</Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>折扣金额 (元)</Label>
              <Input 
                type="number"
                step="0.01"
                value={formData.discount} 
                onChange={e => setFormData({ ...formData, discount: e.target.value })} 
                placeholder="例如：5.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              立即创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
