import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function DevotionalsPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data: devotionals, error } = await supabase
    .from("devotionals")
    .select("id, title, scripture, scheduled_for, audio_mux_id")
    .not("scheduled_for", "is", null)
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Devotionals"
        subtitle="A short word for the road to the trip."
      />
      {error ? (
        <EmptyState>Couldn&apos;t load devotionals right now.</EmptyState>
      ) : !devotionals || devotionals.length === 0 ? (
        <EmptyState>
          The first devotional will arrive soon. Watch for it.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {devotionals.map((d) => (
            <li key={d.id}>
              <Link href={`/devotionals/${d.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <p className="font-serif text-xl">{d.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {d.scripture ?? ""}
                      {d.audio_mux_id ? " · audio" : ""}
                    </p>
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
