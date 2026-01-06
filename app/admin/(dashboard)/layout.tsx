import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Package, FileText, Settings, LogOut, BookOpen, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await isAuthenticated();
  
  return (
    <div className="flex h-screen flex-col md:flex-row bg-background dark text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex shrink-0">
        <div className="flex h-14 items-center border-b px-6 font-bold text-lg">
          GeekFaka Admin
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <Link href="/admin">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              仪表盘
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingBag className="mr-2 h-4 w-4" />
              商品管理
            </Button>
          </Link>
          <Link href="/admin/categories">
            <Button variant="ghost" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              分类管理
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              订单列表
            </Button>
          </Link>
          <Link href="/admin/coupons">
            <Button variant="ghost" className="w-full justify-start">
              <Ticket className="mr-2 h-4 w-4" />
              优惠码管理
            </Button>
          </Link>
          <Link href="/admin/articles">
            <Button variant="ghost" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              文章管理
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              系统设置
            </Button>
          </Link>
        </nav>
        <div className="border-t p-4 shrink-0">
          <a href="/api/admin/logout"> 
             <Button variant="outline" className="w-full">
               <LogOut className="mr-2 h-4 w-4" /> 退出登录
             </Button>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
