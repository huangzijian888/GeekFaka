"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Activity, Zap, Loader2, AlertCircle, BarChart3, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactECharts from "echarts-for-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TrafficQueryPage() {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState("")
  const [view, setView] = useState("current") // "current" or "history"
  const [statsType, setStatsType] = useState("hourly") // "hourly" or "daily"

  const handleQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError("")
    setResult(null)
    setStats([])

    try {
      const res = await fetch(`/api/traffic/query?username=${encodeURIComponent(username.trim())}`)
      const data = await res.json()
      
      if (res.ok) {
        setResult(data)
        // If success, auto-fetch initial stats
        fetchStats(username.trim(), "hourly")
      } else {
        setError(data.error || "查询失败，请检查账号是否正确")
      }
    } catch (e) {
      setError("系统错误，请稍后再试")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (uname: string, type: string) => {
    setStatsLoading(true)
    try {
      const res = await fetch(`/api/traffic/stats?username=${encodeURIComponent(uname)}&type=${type}`)
      const data = await res.json()
      if (res.ok) {
        setStats(data)
      }
    } catch (e) {
      console.error("Stats error:", e)
    } finally {
      setStatsLoading(false)
    }
  }

  const getOption = () => {
    // Process data for ECharts
    const sortedStats = [...stats].sort((a, b) => {
      const timeA = a.hour || a.today;
      const timeB = b.hour || b.today;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}<br/>消耗: <b>${item.value} MB</b>`;
        }
      },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true, top: "10%" },
      xAxis: {
        type: "category",
        data: sortedStats.map(s => (s.hour || s.today).split(' ')[1] || s.today.slice(5)),
        axisLine: { lineStyle: { color: "#333" } },
        axisLabel: { color: "#888", fontSize: 10 }
      },
      yAxis: {
        type: "value",
        name: "MB",
        splitLine: { lineStyle: { color: "#222" } },
        axisLabel: { color: "#888" }
      },
      series: [
        {
          data: sortedStats.map(s => parseFloat(s.traffic)),
          type: "line",
          smooth: true,
          showSymbol: false,
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.3)" },
                { offset: 1, color: "rgba(59, 130, 246, 0)" }
              ]
            }
          },
          lineStyle: { color: "#3b82f6", width: 3 },
          itemStyle: { color: "#3b82f6" }
        }
      ]
    };
  }

  return (
    <main className="min-h-screen bg-background dark text-foreground flex flex-col pb-10">
      <Navbar />
      
      <div className="container mx-auto max-w-2xl px-4 py-16 flex-1">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2">
            <Activity className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">流量使用查询</h1>
          <p className="text-muted-foreground">实时监控您的代理服务流量消耗情况</p>
        </div>

        <Card className="border-primary/20 bg-card/50 backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">账号查询</CardTitle>
            <CardDescription>请输入下单时系统分配给您的账号</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleQuery} className="flex gap-2">
              <Input 
                placeholder="例如: HTStoreXXXX"
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
                <Tabs value={view} onValueChange={setView} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                    <TabsTrigger value="current" className="text-xs">当前用量</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs">消耗趋势</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="current" className="mt-6 space-y-6">
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

                    <div className="relative pt-2 px-1">
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
                  </TabsContent>

                  <TabsContent value="history" className="mt-6 space-y-4">
                    <div className="flex justify-center gap-2 mb-2">
                      <Button 
                        variant={statsType === 'hourly' ? 'default' : 'outline'} 
                        size="sm" 
                        className="h-7 text-[10px] px-3"
                        onClick={() => { setStatsType('hourly'); fetchStats(username, 'hourly'); }}
                      >
                        近 48 小时
                      </Button>
                      <Button 
                        variant={statsType === 'daily' ? 'default' : 'outline'} 
                        size="sm" 
                        className="h-7 text-[10px] px-3"
                        onClick={() => { setStatsType('daily'); fetchStats(username, 'daily'); }}
                      >
                        近 30 天
                      </Button>
                    </div>

                    <div className="h-64 w-full bg-background/30 rounded-xl border border-border/50 flex items-center justify-center relative">
                      {statsLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                      ) : stats.length > 0 ? (
                        <ReactECharts 
                          option={getOption()} 
                          style={{ height: '100%', width: '100%' }}
                          notMerge={true}
                        />
                      ) : (
                        <div className="text-center space-y-2">
                          <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground/20" />
                          <p className="text-xs text-muted-foreground">暂无该时段的消耗记录</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>

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
