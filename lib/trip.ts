import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type Trip = Database["public"]["Tables"]["trips"]["Row"];
type DB = SupabaseClient<Database>;

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
