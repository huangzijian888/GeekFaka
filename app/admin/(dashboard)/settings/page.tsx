"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, ShieldCheck, CreditCard, Settings, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

// Define available sub-channels for EPay
const EPAY_SUB_CHANNELS = [
  { id: "alipay", label: "支付宝" },
  { id: "wxpay", label: "微信支付" },
  { id: "qqpay", label: "QQ钱包" },
  { id: "usdt", label: "USDT" },
]

// Define available providers metadata
const PROVIDERS = [
  {
    id: "epay",
    name: "易支付 (EPay)",
    description: "支持支付宝、微信、QQ钱包的聚合支付接口",
    icon: CreditCard,
    statusKey: "epay_api_url", // Keep for completeness
    enabledKey: "epay_enabled" // New key for explicit toggle
  },
  // Future providers...
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [draftConfig, setDraftConfig] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  useEffect(() => {
    // When dialog opens, reset draft to current config
    if (selectedProvider) {
      setDraftConfig({ ...config })
    }
  }, [selectedProvider, config])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      const data = await res.json()
      setConfig(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setDraftConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Prepare payload: remove empty password
      const payload = { ...draftConfig }
      if (!payload.admin_password) {
        delete payload.admin_password
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      })
      
      if (res.ok) {
        alert("设置已保存")
        // Clear password field from draft after save for security
        const newDraft = { ...draftConfig }
        delete newDraft.admin_password
        setDraftConfig(newDraft)
        
        setConfig(newDraft) 
        setSelectedProvider(null) 
      } else {
        alert("保存失败")
      }
    } catch (error) {
      console.error(error)
      alert("保存出错")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">系统设置</h1>
        <p className="text-muted-foreground">管理支付渠道与站点参数</p>
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="payment">支付渠道</TabsTrigger>
          <TabsTrigger value="site">站点设置</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS.map((provider) => {
              const isEnabled = config[provider.enabledKey] === "true"
              const isConfigured = !!config[provider.statusKey]
              const Icon = provider.icon

              return (
                <Card key={provider.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => setSelectedProvider(provider.id)}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{provider.name}</CardTitle>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground h-10 line-clamp-2">
                      {provider.description}
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      {isEnabled ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> 已启用
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          已停用
                        </Badge>
                      )}
                      {!isConfigured && (
                         <span className="text-xs text-destructive ml-auto">未配置参数</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>


        <TabsContent value="site" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>站点基础信息</CardTitle>
              <CardDescription>配置网站的全局参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>网站标题</Label>
                <Input 
                  value={draftConfig.site_title || ""}
                  onChange={e => handleChange("site_title", e.target.value)}
                  placeholder="GeekFaka - 自动发货平台"
                />
              </div>
              <div className="grid gap-2">
                <Label>网站 URL (用于支付回调)</Label>
                <Input 
                  value={draftConfig.site_url || ""}
                  onChange={e => handleChange("site_url", e.target.value)}
                  placeholder="https://your-domain.com"
                />
                <p className="text-xs text-muted-foreground">
                  必须配置正确的域名（包含 https://），否则支付后无法自动发货。
                </p>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                   <Settings className="h-4 w-4" /> 客服与联系
                </h3>
                <div className="grid gap-2">
                   <Label>Crisp Website ID (在线客服)</Label>
                   <Input 
                     value={draftConfig.crisp_id || ""}
                     onChange={e => handleChange("crisp_id", e.target.value)}
                     placeholder="e.g. 8d40a5a2-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                     className="font-mono"
                   />
                   <p className="text-xs text-muted-foreground">
                     在 <a href="https://crisp.chat/" target="_blank" className="underline hover:text-primary">Crisp</a> 注册并获取 Website ID，即可开启右下角在线客服。留空则关闭。
                   </p>
                </div>
                <div className="grid gap-2">
                   <Label>底部联系方式</Label>
                   <Textarea 
                     value={draftConfig.site_contact_info || ""}
                     onChange={e => handleChange("site_contact_info", e.target.value)}
                     placeholder="支持 Markdown，例如：联系邮箱：`support@example.com`"
                     className="min-h-[100px] font-mono text-sm"
                   />
                   <p className="text-xs text-muted-foreground">
                     将显示在网站底部的版权信息下方。
                   </p>
                </div>
              </div>
              
              <div className="grid gap-2 pt-4 border-t">
                <Label>修改管理员密码</Label>
                <Input 
                  type="password"
                  value={draftConfig.admin_password || ""}
                  onChange={e => handleChange("admin_password", e.target.value)}
                  placeholder="留空则不修改"
                  autoComplete="new-password"
                />
                <p className="text-xs text-muted-foreground">
                  设置新密码后，下次登录生效。若留空则保持当前密码不变。
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存配置
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EPay Configuration Dialog */}
      <Dialog open={selectedProvider === "epay"} onOpenChange={(open) => !open && setSelectedProvider(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>配置易支付 (EPay)</DialogTitle>
            <DialogDescription>
              请输入易支付网关的对接参数。支持彩虹易支付等兼容系统。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">启用此支付渠道</Label>
                  <p className="text-xs text-muted-foreground">关闭后前台将不可见</p>
                </div>
                <Switch 
                  checked={draftConfig.epay_enabled === "true"}
                  onCheckedChange={(checked) => handleChange("epay_enabled", String(checked))}
                />
              </div>

              {/* Sub-channel Selection */}
              <div className="grid gap-3 border rounded-lg p-4">
                <Label>支持的支付方式</Label>
                <div className="grid grid-cols-2 gap-4">
                  {EPAY_SUB_CHANNELS.map((sub) => {
                    const currentChannels = (draftConfig.epay_channels || "").split(",").filter(Boolean);
                    const isChecked = currentChannels.includes(sub.id);
                    
                    return (
                      <div key={sub.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`chan-${sub.id}`} 
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            let newChannels;
                            if (checked) {
                              newChannels = [...currentChannels, sub.id];
                            } else {
                              newChannels = currentChannels.filter(c => c !== sub.id);
                            }
                            handleChange("epay_channels", newChannels.join(","));
                          }}
                        />
                        <Label htmlFor={`chan-${sub.id}`} className="font-normal cursor-pointer">
                          {sub.label}
                        </Label>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">勾选您的易支付网关实际支持的支付方式。</p>
              </div>

              <div className="grid gap-2">
                <Label>交易手续费率 (%)</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0"
                    className="pr-8"
                    value={draftConfig.epay_fee || ""}
                    onChange={e => handleChange("epay_fee", e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground">用户支付时需额外承担的费率，0 为不收取。例如填 3 代表 3%。</p>
              </div>

              <div className="grid gap-2">
                <Label>API 接口地址</Label>
                <Input 
                  placeholder="https://pay.example.com/" 
                  value={draftConfig.epay_api_url || ""}
                  onChange={e => handleChange("epay_api_url", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>商户 ID (PID)</Label>
                  <Input 
                    value={draftConfig.epay_pid || ""}
                    onChange={e => handleChange("epay_pid", e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>签名方式</Label>
                  <Select 
                    value={draftConfig.epay_sign_type || "MD5"} 
                    onValueChange={val => handleChange("epay_sign_type", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MD5">MD5 (默认)</SelectItem>
                      <SelectItem value="RSA">RSA (推荐)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {draftConfig.epay_sign_type === "RSA" ? (
                <>
                  <div className="grid gap-2">
                    <Label>商户私钥 (Private Key)</Label>
                    <Textarea 
                      placeholder="-----BEGIN RSA PRIVATE KEY-----" 
                      className="font-mono text-xs h-32"
                      value={draftConfig.epay_private_key || ""}
                      onChange={e => handleChange("epay_private_key", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">请填入你的 RSA 私钥 (PKCS#1 或 PKCS#8)</p>
                  </div>
                  <div className="grid gap-2">
                    <Label>平台公钥 (Public Key)</Label>
                    <Textarea 
                      placeholder="-----BEGIN PUBLIC KEY-----" 
                      className="font-mono text-xs h-32"
                      value={draftConfig.epay_public_key || ""}
                      onChange={e => handleChange("epay_public_key", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">请填入易支付平台的公钥用于验签</p>
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label>商户密钥 (Key)</Label>
                  <Input 
                    type="password"
                    value={draftConfig.epay_key || ""}
                    onChange={e => handleChange("epay_key", e.target.value)}
                  />
                </div>
              )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProvider(null)}>取消</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存配置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
