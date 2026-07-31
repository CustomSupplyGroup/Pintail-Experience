"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";

export type DevotionalState = { ok: boolean; message: string };

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

export async function saveDevotional(
  _prev: DevotionalState,
  formData: FormData,
): Promise<DevotionalState> {
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

  const dayOffsetRaw = str(formData, "day_offset");
  const scheduledRaw = str(formData, "scheduled_for");

  const payload = {
    title,
    scripture: str(formData, "scripture"),
    written_content: str(formData, "written_content"),
    audio_mux_id: str(formData, "audio_mux_id"),
    day_offset: dayOffsetRaw ? Number(dayOffsetRaw) : 0,
    scheduled_for: scheduledRaw ? new Date(scheduledRaw).toISOString() : null,
  };

  if (id) {
    const { error } = await supabase
      .from("devotionals")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("devotional update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
    revalidatePath("/admin/devotionals");
    revalidatePath(`/admin/devotionals/${id}`);
    return { ok: true, message: "Devotional saved." };
  }

  if (!tripId) return { ok: false, message: "No active trip." };
  const { data, error } = await supabase
    .from("devotionals")
    .insert({ ...payload, trip_id: tripId })
    .select("id")
    .single();
  if (error) {
    console.error("devotional insert failed:", error.message);
    return { ok: false, message: `Couldn't create: ${error.message}` };
  }
  revalidatePath("/admin/devotionals");
  redirect(`/admin/devotionals/${data.id}`);
}

export async function deleteDevotional(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("devotionals").delete().eq("id", id);
  if (error) console.error("devotional delete failed:", error.message);
  revalidatePath("/admin/devotionals");
  redirect("/admin/devotionals");
}
