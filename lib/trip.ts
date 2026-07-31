import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { AppUser } from "@/lib/auth";

export type Trip = Database["public"]["Tables"]["trips"]["Row"];
type DB = SupabaseClient<Database>;

export const TRIP_COOKIE = "pintail_trip";

/**
 * The single source of truth for "the current Experience (hunt/trip)".
 *
 * Prefers a `status = 'live'` trip (the one members are on now), falling back to
 * the earliest non-draft trip when nothing is live yet. Returns `{ trip, error }`
 * so every call site handles the error explicitly — no swallowed failures.
 *
 * Underpins both the single-trip admin reads and the member trip switcher.
 */
export async function getActiveExperience(
  supabase: DB,
): Promise<{ trip: Trip | null; error: string | null }> {
  const { data: live, error: liveError } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "live")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (liveError) {
    console.error("getActiveExperience: live lookup failed", liveError.message);
    return { trip: null, error: liveError.message };
  }
  if (live) return { trip: live, error: null };

  // No live trip yet — fall back to the earliest non-draft (upcoming/past).
  const { data: fallback, error: fallbackError } = await supabase
    .from("trips")
    .select("*")
    .neq("status", "draft")
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError) {
    console.error(
      "getActiveExperience: fallback lookup failed",
      fallbackError.message,
    );
    return { trip: null, error: fallbackError.message };
  }
  return { trip: fallback ?? null, error: null };
}

/** Seats filled per trip, via the anon-safe aggregate RPC (no PII). */
export async function getSeatCounts(
  supabase: DB,
): Promise<{ counts: Map<string, number>; error: string | null }> {
  const { data, error } = await supabase.rpc("trip_seat_counts");
  if (error) {
    console.error("getSeatCounts failed", error.message);
    return { counts: new Map(), error: error.message };
  }
  const counts = new Map<string, number>();
  for (const row of data ?? []) counts.set(row.trip_id, Number(row.seats_taken));
  return { counts, error: null };
}

/** How a trip's seats read publicly: "Full" or "N seats open" (or null). */
export function seatsLabel(
  capacity: number | null,
  taken: number,
): string | null {
  if (capacity == null) return null;
  const left = capacity - taken;
  if (left <= 0) return "Full";
  return `${left} ${left === 1 ? "seat" : "seats"} open`;
}

/** Every trip a member is on (via trip_attendees), sorted by start date. */
export async function getMemberTrips(
  supabase: DB,
  userId: string,
): Promise<{ trips: Trip[]; error: string | null }> {
  const { data, error } = await supabase
    .from("trip_attendees")
    .select("trips(*)")
    .eq("user_id", userId);

  if (error) {
    console.error("getMemberTrips failed", error.message);
    return { trips: [], error: error.message };
  }

  const trips = (data ?? [])
    .map((r) => r.trips as Trip | null)
    .filter((t): t is Trip => Boolean(t))
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));

  return { trips, error: null };
}

/** Nearest relevant trip: prefer live, then soonest upcoming, else most recent. */
function pickDefaultTrip(trips: Trip[]): Trip | null {
  if (trips.length === 0) return null;
  const live = trips.find((t) => t.status === "live");
  if (live) return live;

  const now = Date.now();
  const upcoming = trips
    .filter(
      (t) => t.start_date && new Date(`${t.start_date}T00:00:00`).getTime() >= now,
    )
    .sort((a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""));
  if (upcoming.length) return upcoming[0];

  return trips[trips.length - 1];
}

/**
 * The trip the member app should show right now: the cookie-selected trip if
 * it's one the member is on, otherwise the nearest relevant one. Guests (no
 * user) fall back to the single active experience. Also returns the full list
 * for the trip switcher.
 */
export async function getSelectedTrip(
  supabase: DB,
  user: AppUser | null,
): Promise<{ trip: Trip | null; memberTrips: Trip[]; error: string | null }> {
  if (!user) {
    const { trip, error } = await getActiveExperience(supabase);
    return { trip, memberTrips: trip ? [trip] : [], error };
  }

  const { trips, error } = await getMemberTrips(supabase, user.id);
  if (error) return { trip: null, memberTrips: [], error };

  if (trips.length === 0) {
    // Signed in but not on any roster yet — show the active experience.
    const { trip, error: activeError } = await getActiveExperience(supabase);
    return { trip, memberTrips: trip ? [trip] : [], error: activeError };
  }

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(TRIP_COOKIE)?.value;
  const selected =
    trips.find((t) => t.id === selectedId) ?? pickDefaultTrip(trips);

  return { trip: selected, memberTrips: trips, error: null };
}
