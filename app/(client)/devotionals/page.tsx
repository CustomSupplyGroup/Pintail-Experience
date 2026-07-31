import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { getTripDevotionals } from "@/lib/content";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function DevotionalsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError) {
    return (
      <div>
        <PageHeader title="Devotionals" />
        <EmptyState>Couldn&apos;t load your trip right now.</EmptyState>
      </div>
    );
  }
  if (!trip) {
    return (
      <div>
        <PageHeader title="Devotionals" />
        <EmptyState>No trip selected yet.</EmptyState>
      </div>
    );
  }

  const { devotionals, error } = await getTripDevotionals(
    supabase,
    trip.id,
    trip.start_date,
    { releasedOnly: true },
  );

  // Newest first for reading.
  const list = [...devotionals].reverse();

  return (
    <div>
      <PageHeader
        title="Devotionals"
        subtitle="A short word for the road to the trip."
      />
      {error ? (
        <EmptyState>Couldn&apos;t load devotionals right now.</EmptyState>
      ) : list.length === 0 ? (
        <EmptyState>
          The first devotional will arrive soon. Watch for it.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((d) => (
            <li key={d.id}>
              <Link href={`/devotionals/${d.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <p className="font-serif text-xl">{d.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {d.scripture_reference ?? ""}
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
