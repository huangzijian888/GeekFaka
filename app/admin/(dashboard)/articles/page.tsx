"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Loader2, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Article {
  id: string
  slug: string
  title: string
  content: string
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 10

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    isVisible: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchArticles(page)
  }, [page])

  useEffect(() => {
    if (editingArticle) {
      setFormData({
        title: editingArticle.title,
        slug: editingArticle.slug,
        content: editingArticle.content || "",
        isVisible: editingArticle.isVisible
      })
    } else {
      setFormData({ title: "", slug: "", content: "", isVisible: true })
    }
  }, [editingArticle])

  const fetchArticles = async (currentPage: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/articles?page=${currentPage}&limit=${PAGE_SIZE}`)
      const data = await res.json()
      setArticles(data.items || [])
      setTotalPages(Math.ceil((data.total || 0) / PAGE_SIZE))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingArticle 
        ? `/api/admin/articles/${editingArticle.id}` 
        : "/api/admin/articles"
      
      const method = editingArticle ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsOpen(false)
        fetchArticles(page)
      } else {
        alert("保存失败")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return
    try {
      await fetch(`/api/admin/articles/${id}`, { method: "DELETE" })
      fetchArticles(page)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">文章管理</h1>
          <p className="text-muted-foreground">发布教程、公告或协议页面</p>
        </div>
        <Button onClick={() => { setEditingArticle(null); setIsOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> 新建文章
        </Button>
      </div>

      <div className="rounded-md border bg-card text-white flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead>标题</TableHead>
                <TableHead>路径 (Slug)</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后更新</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    暂无文章
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((article) => (
                  <TableRow key={article.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">/pages/{article.slug}</TableCell>
                    <TableCell>
                      {article.isVisible ? (
                        <span className="flex items-center text-green-500 text-xs">
                          <Eye className="mr-1 h-3 w-3" /> 公开
                        </span>
                      ) : (
                        <span className="flex items-center text-muted-foreground text-xs">
                          <EyeOff className="mr-1 h-3 w-3" /> 隐藏
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(article.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/pages/${article.slug}`, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingArticle(article); setIsOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(article.id)}>
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
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingArticle ? "编辑文章" : "新建文章"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>标题</Label>
                <Input 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  placeholder="例如：购买教程"
                />
              </div>
              <div className="grid gap-2">
                <Label>URL 路径 (Slug)</Label>
                <Input 
                  value={formData.slug} 
                  onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                  placeholder="例如：how-to-buy"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.isVisible} 
                onCheckedChange={c => setFormData({ ...formData, isVisible: c })} 
              />
              <Label>公开显示</Label>
            </div>

            <div className="grid gap-2">
              <Label>内容 (Markdown)</Label>
              <div data-color-mode="dark">
                <RichTextEditor
                  value={formData.content}
                  onChange={(val) => setFormData({ ...formData, content: val || "" })}
                  className="min-h-[400px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
