"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type Category = Database["public"]["Enums"]["schedule_category"];

export type ScheduleState = { ok: boolean; message: string };

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

export async function saveScheduleItem(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();
  const id = str(formData, "id");
  const tripId = str(formData, "trip_id");

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Title is required." };

  const payload = {
    title,
    day_number: Number(str(formData, "day_number") ?? "1"),
    start_time: str(formData, "start_time"),
    end_time: str(formData, "end_time"),
    description: str(formData, "description"),
    location: str(formData, "location"),
    category: String(formData.get("category") ?? "special") as Category,
    visible_to_attendees: formData.get("visible_to_attendees") === "on",
  };

  if (id) {
    const { error } = await supabase
      .from("schedule_items")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("schedule update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
    if (tripId) revalidatePath(`/admin/trips/${tripId}/schedule`);
    revalidatePath("/schedule");
    return { ok: true, message: "Schedule item saved." };
  }

  if (!tripId) return { ok: false, message: "No active trip." };
  const { error } = await supabase
    .from("schedule_items")
    .insert({ ...payload, trip_id: tripId })
    .select("id")
    .single();
  if (error) {
    console.error("schedule insert failed:", error.message);
    return { ok: false, message: `Couldn't create: ${error.message}` };
  }
  revalidatePath(`/admin/trips/${tripId}/schedule`);
  revalidatePath("/schedule");
  redirect(`/admin/trips/${tripId}/schedule`);
}

export async function deleteScheduleItem(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("schedule_items").delete().eq("id", id);
  if (error) console.error("schedule delete failed:", error.message);
  if (tripId) revalidatePath(`/admin/trips/${tripId}/schedule`);
  revalidatePath("/schedule");
  redirect(`/admin/trips/${tripId}/schedule`);
}
