import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type DB = SupabaseClient<Database>;
export type ContentEntry = Database["public"]["Tables"]["content_entries"]["Row"];
export type ContentSeries = Database["public"]["Tables"]["content_series"]["Row"];
export type ContentKind = Database["public"]["Enums"]["content_kind"];

export type ResolvedDevotional = ContentEntry & {
  resolvedAt: Date | null;
  released: boolean;
};

/**
 * Turn an entry's `day_offset` into an absolute datetime, relative to the trip
 * start. Offset 0 = the trip's start day; negative = the lead-up. Released at
 * dawn (6am local-ish) — the brand's hour. Returns null when unscheduled.
 */
export function resolveEntryDate(
  startDate: string | null,
  dayOffset: number | null,
): Date | null {
  if (!startDate || dayOffset === null) return null;
  const d = new Date(`${startDate}T06:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + dayOffset);
  return d;
}

/** The content_series ids of a given kind assigned to a trip. */
async function seriesIdsForTrip(
  supabase: DB,
  tripId: string,
  kind: ContentKind,
): Promise<{ ids: string[]; error: string | null }> {
  const { data, error } = await supabase
    .from("trip_content")
    .select("series_id, content_series!inner(kind)")
    .eq("trip_id", tripId)
    .eq("content_series.kind", kind);

  if (error) {
    console.error("seriesIdsForTrip failed:", error.message);
    return { ids: [], error: error.message };
  }
  return { ids: (data ?? []).map((r) => r.series_id), error: null };
}

/** All entries (RLS filters unpublished for members) of a kind for a trip. */
export async function getTripContentEntries(
  supabase: DB,
  tripId: string,
  kind: ContentKind,
): Promise<{ entries: ContentEntry[]; error: string | null }> {
  const { ids, error } = await seriesIdsForTrip(supabase, tripId, kind);
  if (error) return { entries: [], error };
  if (ids.length === 0) return { entries: [], error: null };

  const { data, error: entriesError } = await supabase
    .from("content_entries")
    .select("*")
    .in("series_id", ids)
    .order("sort", { ascending: true });

  if (entriesError) {
    console.error("getTripContentEntries failed:", entriesError.message);
    return { entries: [], error: entriesError.message };
  }
  return { entries: data ?? [], error: null };
}

/**
 * Devotionals for a trip, each resolved to a real datetime and marked released
 * once that datetime has passed. Sorted chronologically. `releasedOnly` limits
 * to what a member should see now.
 */
export async function getTripDevotionals(
  supabase: DB,
  tripId: string,
  startDate: string | null,
  opts?: { releasedOnly?: boolean },
): Promise<{ devotionals: ResolvedDevotional[]; error: string | null }> {
  const { entries, error } = await getTripContentEntries(
    supabase,
    tripId,
    "devotional",
  );
  if (error) return { devotionals: [], error };

  const now = Date.now();
  const resolved: ResolvedDevotional[] = entries
    .filter((e) => e.published)
    .map((e) => {
      const resolvedAt = resolveEntryDate(startDate, e.day_offset);
      return {
        ...e,
        resolvedAt,
        released: resolvedAt ? resolvedAt.getTime() <= now : false,
      };
    })
    .sort(
      (a, b) => (a.resolvedAt?.getTime() ?? 0) - (b.resolvedAt?.getTime() ?? 0),
    );

  const list = opts?.releasedOnly
    ? resolved.filter((d) => d.released)
    : resolved;
  return { devotionals: list, error: null };
}

/** The most recent released devotional for a trip (or null). */
export async function getLatestDevotional(
  supabase: DB,
  tripId: string,
  startDate: string | null,
): Promise<{ devotional: ResolvedDevotional | null; error: string | null }> {
  const { devotionals, error } = await getTripDevotionals(
    supabase,
    tripId,
    startDate,
    { releasedOnly: true },
  );
  if (error) return { devotional: null, error };
  return {
    devotional: devotionals.length ? devotionals[devotionals.length - 1] : null,
    error: null,
  };
}

/** Curriculum sessions for a trip (published only), in sort order. */
export async function getTripCurriculum(
  supabase: DB,
  tripId: string,
): Promise<{ sessions: ContentEntry[]; error: string | null }> {
  const { entries, error } = await getTripContentEntries(
    supabase,
    tripId,
    "curriculum",
  );
  if (error) return { sessions: [], error };
  return { sessions: entries.filter((e) => e.published), error: null };
}
