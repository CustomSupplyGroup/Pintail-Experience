import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/page-header";
import { Markdown } from "@/components/markdown";

export default async function LogisticsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from("trip_pages")
    .select("title, content, visible")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("logistics detail: page read failed", error.message);
    return (
      <article className="space-y-5">
        <Link
          href="/logistics"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Logistics
        </Link>
        <EmptyState>Couldn&apos;t load this page right now.</EmptyState>
      </article>
    );
  }

  if (!page || !page.visible) notFound();

  return (
    <article className="space-y-5">
      <Link
        href="/logistics"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Logistics
      </Link>
      <h1 className="font-serif text-3xl leading-tight">{page.title}</h1>
      {page.content && <Markdown>{page.content}</Markdown>}
    </article>
  );
}
