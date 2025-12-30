"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, CheckCircle2, XCircle, Clock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Order {
  id: string
  orderNo: string
  email: string
  totalAmount: string
  status: string
  quantity: number
  paymentMethod: string | null
  createdAt: string
  paidAt: string | null
  product: {
    name: string
  }
}

interface Product {
  id: string
  name: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [productFilter, setProductFilter] = useState("ALL")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchOrders(1)
    fetchProducts()
  }, [])

  // Refetch when filters change, resetting to page 1
  useEffect(() => {
    fetchOrders(1)
  }, [statusFilter, productFilter])

  // Refetch when page changes (but via manual control, so strict effect might double fetch if not careful)
  // Better to call fetchOrders directly on page change handler

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products?limit=100")
      const data = await res.json()
      if (res.ok && data.products) {
        setProducts(data.products)
      } else if (Array.isArray(data)) {
        // Fallback for older API version if any
        setProducts(data)
      } else {
        setProducts([])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchOrders = async (page = currentPage, query?: string) => {
    setLoading(true)
    try {
      // Use current search state if query not provided
      const searchQuery = query !== undefined ? query : search
      
      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("pageSize", pageSize.toString())
      if (searchQuery) params.set("search", searchQuery)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      if (productFilter !== "ALL") params.set("productId", productFilter)

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const data = await res.json()
      
      if (res.ok) {
        setOrders(data.orders || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.total || 0)
        setCurrentPage(data.page || 1)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders(1, search)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    fetchOrders(newPage)
  }

  const handleManualFulfill = async (orderId: string) => {
    if (!confirm("确定要手动将此订单标记为已支付并补发卡密吗？")) return
    
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "MARK_PAID" }),
        headers: { "Content-Type": "application/json" }
      })
      
      const data = await res.json()
      if (res.ok) {
        fetchOrders(currentPage)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error(error)
      alert("操作失败")
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-green-500 hover:bg-green-600">已支付</Badge>
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">待支付</Badge>
      case "FAILED":
      case "EXPIRED":
        return <Badge variant="destructive">失败/过期</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">订单管理</h1>
            <p className="text-muted-foreground">查看流水与补单操作</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 w-full max-w-sm">
            <Input 
              placeholder="搜索订单号或邮箱..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background/50"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background/50">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="PAID">已支付</SelectItem>
                <SelectItem value="PENDING">待支付</SelectItem>
                <SelectItem value="FAILED">失败/过期</SelectItem>
              </SelectContent>
            </Select>

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[180px] bg-background/50">
                <SelectValue placeholder="全部商品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部商品</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card text-white flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead>订单号</TableHead>
                <TableHead>商品</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>支付方式</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    暂无订单数据
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/30 h-16">
                    <TableCell className="font-mono text-xs">
                      <div className="flex flex-col gap-1">
                         <span className="font-bold">{order.orderNo}</span>
                         <span className="text-muted-foreground scale-90 origin-left">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium line-clamp-1 max-w-[200px]" title={order.product.name}>
                        {order.product.name}
                      </div>
                      <div className="text-xs text-muted-foreground">x{order.quantity}</div>
                    </TableCell>
                    <TableCell className="font-bold text-primary">
                      ¥{Number(order.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground uppercase">
                      {order.paymentMethod || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                         {/* Link to public order page */}
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                           onClick={() => window.open(`/orders/${order.orderNo}`, "_blank")}
                           title="查看前台详情"
                         >
                           <ExternalLink className="h-4 w-4" />
                         </Button>

                         {order.status === "PENDING" && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="h-8 text-xs border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                             onClick={() => handleManualFulfill(order.id)}
                             disabled={actionLoading === order.id}
                           >
                             {actionLoading === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "补单"}
                           </Button>
                         )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between p-4 border-t bg-card shrink-0">
          <div className="text-sm text-muted-foreground">
            共 {totalCount} 条记录，页码 {currentPage} / {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              下一页 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
