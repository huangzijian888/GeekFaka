import { Navbar } from "@/components/navbar";
import { StoreFront } from "@/components/store-front";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const categoriesData = await prisma.category.findMany({
    orderBy: { priority: "desc" },
    include: {
      products: {
        where: { isActive: true },
        include: {
          _count: {
            select: { licenses: { where: { status: "AVAILABLE" } } }
          }
        }
      }
    }
  });

  const categories = categoriesData.map(cat => ({
    id: cat.id,
    name: cat.name,
    products: cat.products.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock: p._count.licenses
    }))
  }));

  return (
    <main className="min-h-screen bg-background dark text-foreground selection:bg-primary selection:text-primary-foreground flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
        
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-2xl space-y-6">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
              <span className="block text-foreground">数字商品</span>
              <span className="block bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                自动发货平台
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
              GeekFaka 提供安全、极速的虚拟商品交易体验。<br/>
              7x24小时无人值守，支付即刻发货。
            </p>
          </div>
        </div>
      </section>

      {/* Product Section */}
      <section className="container mx-auto max-w-6xl px-4 pb-20 flex-1">
        <StoreFront categories={categories} />
      </section>
      
      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} GeekFaka. All rights reserved.
      </footer>
    </main>
  );
}
