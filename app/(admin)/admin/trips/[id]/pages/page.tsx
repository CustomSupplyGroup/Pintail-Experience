import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export default async function PagesAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (tripError) {
    console.error("trip info: trip read failed", tripError.message);
    return (
      <div>
        <PageHeader title="Trip Info" />
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: pages, error } = await supabase
    .from("trip_pages")
    .select("id, title, slug, sort_order, visible")
    .eq("trip_id", trip.id)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <Link
        href={`/admin/trips/${id}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to trip
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <PageHeader
          title="Trip Info"
          subtitle="Packing list, travel, what to expect — any info page."
        />
        <Link
          href={`/admin/trips/${id}/pages/new`}
          className={buttonVariants({ className: "mb-6" })}
        >
          New page
        </Link>
      </div>

      {error ? (
        <EmptyState>Couldn&apos;t load pages: {error.message}</EmptyState>
      ) : !pages || pages.length === 0 ? (
        <EmptyState>No info pages yet.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {pages.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/trips/${id}/pages/${p.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
              >
                <div>
                  <p className="font-serif text-lg">{p.title}</p>
                  <p className="text-sm text-muted-foreground">/{p.slug}</p>
                </div>
                {!p.visible && <Badge variant="secondary">hidden</Badge>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
