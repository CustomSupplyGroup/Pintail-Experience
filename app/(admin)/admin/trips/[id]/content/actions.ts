"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

export async function assignContent(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const tripId = String(formData.get("trip_id") ?? "");
  const seriesId = String(formData.get("series_id") ?? "");
  if (!tripId || !seriesId) return;
  const { error } = await supabase
    .from("trip_content")
    .upsert(
      { trip_id: tripId, series_id: seriesId },
      { onConflict: "trip_id,series_id" },
    );
  if (error) console.error("assignContent failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/content`);
}

export async function unassignContent(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const tripId = String(formData.get("trip_id") ?? "");
  const seriesId = String(formData.get("series_id") ?? "");
  if (!tripId || !seriesId) return;
  const { error } = await supabase
    .from("trip_content")
    .delete()
    .eq("trip_id", tripId)
    .eq("series_id", seriesId);
  if (error) console.error("unassignContent failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/content`);
}
