"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Activity, Zap, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TrafficQueryPage() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch(`/api/traffic/query?username=${encodeURIComponent(username.trim())}`)
      const data = await res.json()
      
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || "查询失败，请检查账号是否正确")
      }
    } catch (e) {
      setError("系统错误，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background dark text-foreground flex flex-col">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-4 py-16 flex-1">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">流量使用查询</h1>
          <p className="text-muted-foreground">实时监控您的代理服务流量消耗情况</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-lg">账号查询</CardTitle>
            <CardDescription>请输入下单时系统分配给您的账号</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleQuery} className="flex gap-2">
              <Input 
                placeholder="例如: HT123456"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-background/50 font-mono"
              />
              <Button type="submit" disabled={loading} className="shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">查询</span>
              </Button>
            </form>

            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">剩余流量</p>
                    <p className="text-2xl font-black text-primary">{Number(result.traffic).toFixed(3)} <span className="text-sm font-medium text-muted-foreground">GB</span></p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">总分配流量</p>
                    <p className="text-2xl font-black">{Number(result.alltraffic).toFixed(3)} <span className="text-sm font-medium text-muted-foreground">GB</span></p>
                  </div>
                </div>

                <div className="relative pt-2">
                   <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground font-medium">已使用进度</span>
                      <span className="font-bold text-primary">{((1 - (Number(result.traffic) / Number(result.alltraffic))) * 100).toFixed(1)}%</span>
                   </div>
                   <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${(1 - (Number(result.traffic) / Number(result.alltraffic))) * 100}%` }}
                      />
                   </div>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-[11px] text-yellow-600/80 leading-relaxed text-center">
                  提示：流量数据实时更新。如果剩余流量归零，账号将自动进入失效状态。
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} GeekFaka. All rights reserved.
      </footer>
    </main>
  )
}
