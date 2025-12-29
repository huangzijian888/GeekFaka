"use client"

import { useState, useEffect } from "react"
import { Megaphone, X, ChevronRight, Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"

interface AnnouncementProps {
  content: string
}

export function Announcement({ content }: AnnouncementProps) {
  const [open, setOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!content) return

    // Simple hash to detect content changes
    const contentHash = btoa(encodeURIComponent(content)).substring(0, 32)
    const seenHash = localStorage.getItem("announcement_seen_hash")

    if (seenHash !== contentHash) {
      setOpen(true)
      localStorage.setItem("announcement_seen_hash", contentHash)
    }
    
    setIsVisible(true)
  }, [content])

  if (!content || !isVisible) return null

  return (
    <>
      {/* Minimal Announcement Bar */}
      <div className="bg-primary/5 border-b border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer group" onClick={() => setOpen(true)}>
        <div className="container mx-auto max-w-6xl px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse">
              <Megaphone className="h-3.5 w-3.5" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate group-hover:text-primary transition-colors">
              重要公告：点击查看详情和使用指南...
            </p>
          </div>
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
            立即查收 <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Full Content Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-primary/20 bg-background/95 backdrop-blur-2xl">
          <DialogHeader className="p-6 pb-4 border-b bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-xl font-black tracking-tight">网站服务公告</DialogTitle>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-headings:font-black prose-p:text-muted-foreground prose-strong:text-primary prose-a:text-primary hover:prose-a:underline leading-relaxed">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>

          <div className="p-4 border-t bg-muted/30 flex justify-center">
            <Button className="w-full sm:w-32 font-bold shadow-lg shadow-primary/20" onClick={() => setOpen(false)}>
              我已阅读
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
