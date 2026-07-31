import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { getTripDevotionals } from "@/lib/content";
import { PageHeader, EmptyState } from "@/components/page-header";
import { DevotionalsJourney, type DevotionalCard } from "./devotionals-journey";

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

  // Released entries drive the visible list; the full series gives each entry
  // its "Day N of total" place and the progress denominator.
  const [
    { devotionals: released, error },
    { devotionals: all, error: allError },
  ] = await Promise.all([
    getTripDevotionals(supabase, trip.id, trip.start_date, {
      releasedOnly: true,
    }),
    getTripDevotionals(supabase, trip.id, trip.start_date),
  ]);

  const total = all.length;
  const positionById = new Map(all.map((d, i) => [d.id, i + 1]));

  // Newest first for reading.
  const cards: DevotionalCard[] = [...released].reverse().map((d) => ({
    id: d.id,
    title: d.title,
    scripture: d.scripture_reference ?? "",
    hasAudio: Boolean(d.audio_mux_id),
    position: positionById.get(d.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Devotionals"
        subtitle="A short word for the road to the trip."
      />
      {error || allError ? (
        <EmptyState>Couldn&apos;t load devotionals right now.</EmptyState>
      ) : cards.length === 0 ? (
        <EmptyState>
          The first devotional will arrive soon. Watch for it.
        </EmptyState>
      ) : (
        <DevotionalsJourney
          cards={cards}
          total={total}
          releasedCount={released.length}
          tripName={trip.name}
        />
      )}
    </div>
  );
}
