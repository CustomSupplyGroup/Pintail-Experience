import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SeriesForm } from "../series-form";
import { EntryForm, type Entry } from "../entry-form";
import { TripAssignmentList, type AssignableTrip } from "../trip-assignment";
import { deleteSeries, deleteEntry } from "../actions";

function toQuestions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [];
}

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ seriesId: string }>;
}) {
  const { seriesId } = await params;
  const supabase = await createClient();

  const { data: series, error } = await supabase
    .from("content_series")
    .select("id, title, description, kind")
    .eq("id", seriesId)
    .maybeSingle();

  if (error) {
    console.error("series detail: read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/content"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to content
        </Link>
        <div className="mt-2">
          <PageHeader title="Series" />
        </div>
        <EmptyState>Couldn&apos;t load this series: {error.message}</EmptyState>
      </div>
    );
  }
  if (!series) notFound();

  const { data: entryRows, error: entriesError } = await supabase
    .from("content_entries")
    .select(
      "id, title, day_offset, sort, body_md, scripture_reference, audio_mux_id, video_mux_id, discussion_questions, published",
    )
    .eq("series_id", seriesId)
    .order("sort", { ascending: true });
  if (entriesError) {
    console.error("series detail: entries load failed", entriesError.message);
  }
  const entries: Entry[] = (entryRows ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    day_offset: e.day_offset,
    sort: e.sort,
    body_md: e.body_md,
    scripture_reference: e.scripture_reference,
    audio_mux_id: e.audio_mux_id,
    video_mux_id: e.video_mux_id,
    discussion_questions: toQuestions(e.discussion_questions),
    published: e.published,
  }));

  // Trip assignment state.
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id, name, start_date")
    .order("start_date", { ascending: true });
  if (tripsError) {
    console.error("series detail: trips load failed", tripsError.message);
  }
  const { data: assignedRows, error: assignedError } = await supabase
    .from("trip_content")
    .select("trip_id")
    .eq("series_id", seriesId);
  if (assignedError) {
    console.error(
      "series detail: assignments load failed",
      assignedError.message,
    );
  }
  const assignedIds = new Set((assignedRows ?? []).map((r) => r.trip_id));
  const assignableTrips: AssignableTrip[] = (trips ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    start_date: t.start_date,
    assigned: assignedIds.has(t.id),
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/content"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to content
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageHeader title={series.title} subtitle={series.kind} />
        <form action={deleteSeries}>
          <input type="hidden" name="id" value={series.id} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="mt-1 text-destructive"
            confirmText={`Delete "${series.title}" and all its entries? This can't be undone.`}
          >
            Delete series
          </ConfirmSubmitButton>
        </form>
      </div>

      <SeriesForm series={series} />

      {/* Assign to trips */}
      <section className="mt-10">
        <h2 className="mb-3 font-heading text-xl italic tracking-tight">
          Assigned to hunts
        </h2>
        {tripsError ? (
          <EmptyState>Couldn&apos;t load trips: {tripsError.message}</EmptyState>
        ) : (
          <TripAssignmentList seriesId={series.id} trips={assignableTrips} />
        )}
      </section>

      {/* Entries */}
      <section className="mt-10">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-heading text-xl italic tracking-tight">Entries</h2>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>

        {entriesError ? (
          <EmptyState>
            Couldn&apos;t load entries: {entriesError.message}
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {entries.map((e) => (
              <div key={e.id} className="space-y-2">
                <EntryForm seriesId={series.id} entry={e} />
                <form action={deleteEntry} className="text-right">
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="series_id" value={series.id} />
                  <ConfirmSubmitButton
                    variant="ghost"
                    size="xs"
                    className="text-destructive"
                    confirmText={`Delete entry "${e.title}"?`}
                  >
                    Delete entry
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}

            <div>
              <p className="mb-2 text-sm font-medium">Add an entry</p>
              <EntryForm seriesId={series.id} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
