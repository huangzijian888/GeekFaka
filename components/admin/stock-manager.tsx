"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Key } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface License {
  id: string
  code: string
  status: string
  createdAt: string
}

interface StockManagerProps {
  productId: string
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onStockUpdated: () => void
}

export function StockManager({ productId, productName, open, onOpenChange, onStockUpdated }: StockManagerProps) {
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(false)
  const [importText, setImportText] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (open) {
      fetchLicenses()
    }
  }, [open, productId])

  const fetchLicenses = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/licenses?productId=${productId}`)
      const data = await res.json()
      setLicenses(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importText.trim()) return
    setIsImporting(true)

    const codes = importText.split("\n").map(c => c.trim()).filter(c => c !== "")
    
    try {
      const res = await fetch("/api/admin/licenses", {
        method: "POST",
        body: JSON.stringify({ productId, codes }),
        headers: { "Content-Type": "application/json" }
      })
      
      if (res.ok) {
        setImportText("")
        fetchLicenses()
        onStockUpdated()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        setLicenses(licenses.filter(l => l.id !== id))
        onStockUpdated()
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <DialogTitle>库存管理: {productName}</DialogTitle>
          </div>
          <DialogDescription>
            批量导入卡密或管理现有未售出的卡密。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
          {/* Import Section */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <Label htmlFor="import" className="text-sm font-semibold">批量导入 (每行一个)</Label>
            <Textarea
              id="import"
              placeholder="粘贴你的卡密信息...
例如:
KEY-123456
KEY-789012"
              rows={5}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="font-mono text-sm bg-background/50"
            />
            <Button 
              className="w-full" 
              onClick={handleImport} 
              disabled={isImporting || !importText.trim()}
            >
              {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              开始导入
            </Button>
          </div>

          {/* List Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex justify-between">
              <span>现有库存 (展示最新100条)</span>
              <Badge variant="outline">{licenses.length} 条</Badge>
            </Label>
            <div className="rounded-md border bg-background/50">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>内容</TableHead>
                    <TableHead className="w-[100px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-20 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : licenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-20 text-center text-muted-foreground text-sm">
                        暂无可用库存，请先导入
                      </TableCell>
                    </TableRow>
                  ) : (
                    licenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-mono text-xs break-all py-3">
                          {license.code}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(license.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
