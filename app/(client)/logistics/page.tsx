import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function LogisticsPage() {
  const supabase = await createClient();
  const { data: pages, error } = await supabase
    .from("trip_pages")
    .select("id, title, slug")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Logistics & info"
        subtitle="Everything you need to know before you go."
      />
      {error ? (
        <EmptyState>Couldn&apos;t load logistics right now.</EmptyState>
      ) : !pages || pages.length === 0 ? (
        <EmptyState>Travel details and the packing list are coming soon.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {pages.map((p) => (
            <li key={p.id}>
              <Link href={`/logistics/${p.slug}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <p className="font-serif text-xl">{p.title}</p>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
