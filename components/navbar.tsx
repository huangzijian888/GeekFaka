"use client"

import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { OrderLookup } from "@/components/order-lookup"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center max-w-6xl mx-auto px-4">
        <div className="mr-4 flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6" />
            <span className="font-bold sm:inline-block">
              GeekFaka
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
              首页
            </Link>
            <Link href="/pages" className="transition-colors hover:text-foreground/80 text-muted-foreground">
              帮助中心
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or other items */}
          </div>
          <nav className="flex items-center">
            <OrderLookup />
          </nav>
        </div>
      </div>
    </header>
  )
}
