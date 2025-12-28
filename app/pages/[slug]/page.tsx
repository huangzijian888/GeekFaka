import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import ReactMarkdown from "react-markdown";
import { Metadata } from "next";

interface ArticlePageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug }
  });

  if (!article) return { title: "Not Found" };

  return {
    title: `${article.title} - GeekFaka`,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug }
  });

  if (!article || !article.isVisible) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background dark text-foreground flex flex-col">
      <Navbar />
      
      <div className="container mx-auto max-w-3xl px-4 py-12 flex-1">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <h1>{article.title}</h1>
          <div className="text-sm text-muted-foreground mb-8">
            更新于 {new Date(article.updatedAt).toLocaleDateString()}
          </div>
          <ReactMarkdown>{article.content || ""}</ReactMarkdown>
        </article>
      </div>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} GeekFaka. All rights reserved.
      </footer>
    </main>
  );
}
