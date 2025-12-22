"use client"

import dynamic from "next/dynamic"
import { cn } from "@/lib/utils"
import "@uiw/react-md-editor/markdown-editor.css"
import "@uiw/react-markdown-preview/markdown.css"

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: false }
)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  return (
    <div className={cn("min-h-[300px] h-full", className)} data-color-mode="dark">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height="100%"
        className="h-full border border-input rounded-md overflow-hidden bg-background"
        preview="live"
      />
    </div>
  )
}