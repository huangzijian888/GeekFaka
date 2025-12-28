import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ShoppingBag, Package, FileText, Settings, LogOut, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await isAuthenticated();
  
  // Exclude login page from protection check to avoid infinite loop
  // But wait, layout wraps pages. We can't easily exclude specific routes inside layout.
  // Actually, for cleaner structure, we usually group protected routes in (authenticated) group.
  // But for now, let's just assume if you are hitting /admin/login, this layout is NOT used 
  // if we place login outside or handle it carefully.
  // BETTER APPROACH: Use Next.js Route Groups.
  // Move layout to app/admin/(dashboard)/layout.tsx and page to app/admin/(dashboard)/page.tsx
  // Then login stays at app/admin/login/page.tsx without this layout.
  
  // Let's do the check here, but we need to handle the login route case.
  // The easiest way for now: Check if we are rendering login page? No, layout runs for all.
  
  // STRATEGY CHANGE: 
  // I will assume this layout applies to everything under /admin.
  // If the user is NOT authenticated, we redirect to login, UNLESS we are already there.
  // BUT server components don't know the current URL path easily without middleware.
  
  // SO: simpler strategy -> I will rely on the fact that if I put this layout in `app/admin/layout.tsx`,
  // it wraps `app/admin/login` too, which is bad because login page shouldn't have the sidebar.
  
  // FIX: I will move the protected dashboard into a Route Group `(dashboard)`.
  // app/admin/(dashboard)/layout.tsx -> The Sidebar Layout (Protected)
  // app/admin/(dashboard)/page.tsx -> Dashboard
  // app/admin/login/page.tsx -> Login Page (No Sidebar, Public)
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background dark text-foreground">
      {/* Mobile Sidebar could be added here */}
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center border-b px-6 font-bold text-lg">
          GeekFaka Admin
        </div>
        <nav className="flex-1 space-y-1 p-4">
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
        <div className="border-t p-4">
          <form action="/api/admin/login" method="DELETE"> 
            {/* DELETE method not supported by form directly, need client component or just link to api */}
            {/* Let's just put a client button later. For now a simple link */}
            <Link href="/api/admin/logout"> 
               <Button variant="outline" className="w-full">
                 <LogOut className="mr-2 h-4 w-4" /> 退出登录
               </Button>
            </Link>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
