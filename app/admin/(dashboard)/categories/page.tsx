"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, Loader2, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  priority: number
  _count?: {
    products: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  
  // Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    priority: "0",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/categories")
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        priority: category.priority.toString(),
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: "",
        slug: "",
        priority: "0",
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitLoading(true)
    
    const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories"
    const method = editingCategory ? "PATCH" : "POST"

    try {
      const res = await fetch(url, {
        method,
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      })
      if (res.ok) {
        setIsDialogOpen(false)
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || "操作失败")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此分类吗？必须先删除该分类下的所有商品。")) return
    
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id))
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
          <h1 className="text-3xl font-bold tracking-tight text-white">分类管理</h1>
          <p className="text-muted-foreground">管理商品分类及其排序</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> 新增分类
        </Button>
      </div>

      <div className="rounded-md border bg-card text-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>名称</TableHead>
              <TableHead>标识 (Slug)</TableHead>
              <TableHead>优先级</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  暂无分类数据
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="hover:bg-muted/30">
                  <TableCell className="font-bold text-lg">{category.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-primary">
                      <ArrowUp className="h-3 w-3" />
                      {category.priority}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                         variant="secondary" 
                         size="sm" 
                         className="h-8 px-2 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                         onClick={() => handleOpenDialog(category)}
                       >
                         <Edit2 className="h-3.5 w-3.5 mr-1" />
                         编辑
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                         onClick={() => handleDelete(category.id)}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "编辑分类" : "新增分类"}</DialogTitle>
            <DialogDescription>
              数字越大，前台显示越靠前
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：视频会员"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">唯一标识 (Slug)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="例如：streaming"
                required
              />
              <p className="text-xs text-muted-foreground">URL 路径的一部分，不可重复</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">排序优先级</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
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
