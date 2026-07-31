import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const KINDS: { kind: "devotional" | "curriculum"; label: string }[] = [
  { kind: "devotional", label: "Devotionals" },
  { kind: "curriculum", label: "Curriculum" },
];

export default async function ContentLibraryPage() {
  const supabase = await createClient();

  const { data: series, error } = await supabase
    .from("content_series")
    .select("id, title, description, kind")
    .order("title", { ascending: true });

  if (error) {
    return (
      <div>
        <PageHeader title="Content library" />
        <EmptyState>Couldn&apos;t load content: {error.message}</EmptyState>
      </div>
    );
  }

  // Entry counts per series.
  const { data: entryRows, error: entryError } = await supabase
    .from("content_entries")
    .select("series_id");
  if (entryError) {
    console.error("content library: entry counts failed", entryError.message);
  }
  const entryCounts = new Map<string, number>();
  for (const row of entryRows ?? []) {
    entryCounts.set(row.series_id, (entryCounts.get(row.series_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <PageHeader
          title="Content library"
          subtitle="Reusable devotional & curriculum series. Author once, assign to any hunt."
        />
        <Link
          href="/admin/content/new"
          className={buttonVariants({ className: "mb-6" })}
        >
          New series
        </Link>
      </div>

      {!series || series.length === 0 ? (
        <EmptyState>No series yet. Create the first one.</EmptyState>
      ) : (
        <div className="space-y-8">
          {KINDS.map(({ kind, label }) => {
            const group = series.filter((s) => s.kind === kind);
            return (
              <section key={kind}>
                <h2 className="mb-3 font-heading text-xl italic tracking-tight">
                  {label}
                </h2>
                {group.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No {label.toLowerCase()} series yet.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {group.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/admin/content/${s.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                        >
                          <div>
                            <p className="font-serif text-lg">{s.title}</p>
                            {s.description && (
                              <p className="text-sm text-muted-foreground">
                                {s.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {entryCounts.get(s.id) ?? 0} entries
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
