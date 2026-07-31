import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { getTripDevotionals } from "@/lib/content";
import { EmptyState } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { AudioPlayer } from "@/components/audio-player";

export default async function DevotionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError || !trip) {
    return (
      <article className="space-y-5">
        <Link
          href="/devotionals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Devotionals
        </Link>
        <EmptyState>Couldn&apos;t load this devotional right now.</EmptyState>
      </article>
    );
  }

  const { devotionals, error } = await getTripDevotionals(
    supabase,
    trip.id,
    trip.start_date,
    { releasedOnly: true },
  );
  if (error) {
    return (
      <article className="space-y-5">
        <Link
          href="/devotionals"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Devotionals
        </Link>
        <EmptyState>Couldn&apos;t load this devotional right now.</EmptyState>
      </article>
    );
  }

  const devotional = devotionals.find((d) => d.id === id);
  if (!devotional) notFound();

  return (
    <article className="space-y-5">
      <Link
        href="/devotionals"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Devotionals
      </Link>

      <header>
        <h1 className="font-serif text-3xl leading-tight">{devotional.title}</h1>
        {devotional.scripture_reference && (
          <p className="mt-2 italic text-primary">
            {devotional.scripture_reference}
          </p>
        )}
      </header>

      {devotional.audio_mux_id && (
        <AudioPlayer
          playbackId={devotional.audio_mux_id}
          title={devotional.title}
        />
      )}

      {devotional.body_md && <Markdown>{devotional.body_md}</Markdown>}
    </article>
  );
}
