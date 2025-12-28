import { Navbar } from "@/components/navbar";
import { StoreFront } from "@/components/store-front";
import { prisma } from "@/lib/prisma";
import ReactMarkdown from "react-markdown";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  let categoriesData: any[] = [];
  let contactInfo: any = null;
  let announcement: any = null;

  try {
    categoriesData = await prisma.category.findMany({
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

    contactInfo = await prisma.systemSetting.findUnique({
      where: { key: "site_contact_info" },
    });

    announcement = await prisma.systemSetting.findUnique({
      where: { key: "site_announcement" },
    });
  } catch (error) {
    console.warn("Failed to fetch homepage data (likely during build):", error);
  }

  const categories = categoriesData.map(cat => ({
    id: cat.id,
    name: cat.name,
    products: cat.products.map((p: any) => ({
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
      
      {/* Hero Section - Background Only */}
      <section className="relative overflow-hidden pt-10 pb-6">
        <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
      </section>

      {/* Announcement Section */}
      {announcement?.value && (
        <section className="container mx-auto max-w-6xl px-4 mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-xl transition-all hover:border-primary/30 shadow-2xl shadow-primary/5 group animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="hidden sm:flex bg-primary/20 p-2.5 rounded-xl shrink-0 items-center justify-center">
                <Megaphone className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="h-5 w-5 text-primary sm:hidden" />
                  <h3 className="text-lg font-bold text-foreground tracking-tight">
                    网站公告
                  </h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed selection:bg-primary/30">
                  <ReactMarkdown>{announcement.value}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Product Section */}
      <section className="container mx-auto max-w-6xl px-4 pb-12 flex-1">
        <StoreFront categories={categories} />
      </section>
      
      {/* Info Section */}
      <section className="py-12 text-center bg-muted/20">
        <div className="container px-4">
           <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
            GeekFaka 提供安全、极速的虚拟商品交易体验。<br/>
            7x24小时无人值守，支付即刻发货。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="space-y-4">
          <p>&copy; {new Date().getFullYear()} GeekFaka. All rights reserved.</p>
          {contactInfo?.value && (
            <div className="prose prose-sm dark:prose-invert mx-auto">
               <ReactMarkdown>{contactInfo.value}</ReactMarkdown>
            </div>
          )}
        </div>
      </footer>
    </main>
  );
}
