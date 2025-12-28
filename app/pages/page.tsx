import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { FileText, ChevronRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HelpCenterPage() {
  const articles = await prisma.article.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <main className="min-h-screen bg-background dark text-foreground flex flex-col">
      <Navbar />
      
      <div className="container mx-auto max-w-4xl px-4 py-16 flex-1">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">帮助中心</h1>
          <p className="text-muted-foreground text-lg">这里有您需要的教程、常见问题以及服务条款</p>
        </div>

        <div className="grid gap-4">
          {articles.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-2xl text-muted-foreground">
              暂无内容
            </div>
          ) : (
            articles.map((article) => (
              <Link key={article.slug} href={`/pages/${article.slug}`}>
                <Card className="hover:border-primary/50 transition-all group overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                      <CardDescription>
                        更新于 {new Date(article.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} GeekFaka. All rights reserved.
      </footer>
    </main>
  );
}
