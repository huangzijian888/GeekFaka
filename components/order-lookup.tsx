"use client"

import { useState } from "react"
import { Search, Loader2, Calendar, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function OrderLookup() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setHasSearched(false)
    setResults([])

    try {
      const res = await fetch(`/api/orders/query?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      
      if (Array.isArray(data)) {
        setResults(data)
      } else {
        setResults([])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PAID": return <Badge className="bg-green-500 hover:bg-green-600 px-1.5 py-0 text-[10px] h-5">已支付</Badge>
      case "PENDING": return <Badge variant="secondary" className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-1.5 py-0 text-[10px] h-5">待支付</Badge>
      case "EXPIRED": return <Badge variant="destructive" className="px-1.5 py-0 text-[10px] h-5">已过期</Badge>
      default: return <Badge variant="outline" className="px-1.5 py-0 text-[10px] h-5">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm">
          <Search className="h-4 w-4 text-primary" />
          <span className="font-bold">查询订单</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>订单查询</DialogTitle>
          <DialogDescription>
            输入下单时填写的联系方式（邮箱/QQ/手机号）或订单号查询。
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input 
            placeholder="联系方式 / 订单号" 
            value={query} 
            onChange={e => setQuery(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "查询"}
          </Button>
        </form>

        <div className="mt-4">
          {hasSearched && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              <p>未找到相关订单</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {results.map((order) => (
                <Link 
                  key={order.orderNo} 
                  href={`/orders/${order.orderNo}`}
                  onClick={() => setOpen(false)}
                  className="block group"
                >
                  <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors flex items-center justify-between">
                      <div className="space-y-2 flex-1 mr-4">
                        <div className="font-bold text-sm leading-tight text-foreground/90">
                          {order.product.name}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {getStatusBadge(order.status)}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {formatDate(order.createdAt)}
                          </span>
                          <span className="font-mono font-medium text-foreground">
                            ¥{Number(order.totalAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
