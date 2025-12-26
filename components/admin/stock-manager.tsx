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
      <DialogContent className="sm:max-w-5xl h-[85vh] flex flex-col overflow-hidden p-0 gap-0 border-zinc-800 bg-zinc-950 text-zinc-100">
        <div className="grid grid-cols-1 md:grid-cols-6 h-full">
          {/* Left: Import Section */}
          <div className="md:col-span-3 bg-zinc-900/50 border-r border-zinc-800 p-10 flex flex-col gap-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Key className="h-7 w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black text-white tracking-tight">库存导入</DialogTitle>
                <DialogDescription className="text-sm font-medium text-zinc-400 mt-1">
                  正在为 <span className="text-primary font-bold">{productName}</span> 批量补充激活码
                </DialogDescription>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              <Label htmlFor="import" className="text-base font-bold flex justify-between text-zinc-300">
                <span>粘贴卡密内容</span>
                <span className="text-xs font-normal text-zinc-500 italic">每行视为独立条目</span>
              </Label>
              <Textarea
                id="import"
                placeholder="在此粘贴卡密内容...
KEY-AAA-BBB-CCC
KEY-DDD-EEE-FFF"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="flex-1 font-mono text-base bg-zinc-950 resize-none border-2 border-dashed border-zinc-800 focus-visible:border-primary p-6 leading-relaxed text-zinc-300 placeholder:text-zinc-600 rounded-xl"
              />
            </div>
            
            <Button 
              size="lg"
              className="w-full font-black h-16 text-xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all text-white rounded-xl" 
              onClick={handleImport} 
              disabled={isImporting || !importText.trim()}
            >
              {isImporting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Plus className="mr-2 h-6 w-6" />}
              执行批量导入
            </Button>
          </div>

          {/* Right: List Section */}
          <div className="md:col-span-3 p-8 flex flex-col h-full overflow-hidden bg-zinc-950">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h3 className="font-bold text-2xl tracking-tight text-white">可用库存</h3>
                <p className="text-sm text-zinc-400">当前商品未售出的激活码</p>
              </div>
              <Badge variant="secondary" className="px-4 py-1.5 font-mono text-base bg-zinc-900 border border-zinc-800 text-primary">
                {licenses.length} 个
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto border-2 border-zinc-800 rounded-xl bg-zinc-900/20">
              <Table>
                <TableHeader className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow className="border-b-2 border-zinc-800 hover:bg-transparent">
                    <TableHead className="w-[80px] font-bold text-zinc-400">序号</TableHead>
                    <TableHead className="font-bold text-zinc-200">卡密内容</TableHead>
                    <TableHead className="w-[80px] text-right font-bold text-zinc-400">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={3} className="h-64 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : licenses.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={3} className="h-64 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                            <span className="text-5xl opacity-50">📦</span>
                          </div>
                          <div className="text-lg font-medium text-zinc-500">暂无库存数据，请从左侧导入</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    licenses.map((license, index) => (
                      <TableRow key={license.id} className="group hover:bg-zinc-900 transition-colors border-b border-zinc-800/50 last:border-0 h-14">
                        <TableCell className="text-xs text-zinc-500 font-mono pl-6">
                          {String(index + 1).padStart(2, '0')}
                        </TableCell>
                        <TableCell className="font-mono text-sm break-all font-bold text-zinc-300 group-hover:text-white transition-colors">
                          {license.code}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all rounded-full"
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
            <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500 justify-end italic">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              最多仅显示最早 100 条可用库存
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
