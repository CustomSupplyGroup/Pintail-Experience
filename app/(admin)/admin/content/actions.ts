"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";
import type { Json } from "@/lib/database.types";

type ContentKind = Database["public"]["Enums"]["content_kind"];

export type ContentState = { ok: boolean; message: string };

const KINDS: ContentKind[] = ["devotional", "curriculum"];

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

function intOrNull(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// ── Series ──────────────────────────────────────────────────────────────────

export async function saveSeries(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();
  const id = str(formData, "id");

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Title is required." };

  const kindRaw = String(formData.get("kind") ?? "");
  const kind = (KINDS.includes(kindRaw as ContentKind)
    ? kindRaw
    : "devotional") as ContentKind;

  const payload = {
    title,
    kind,
    description: str(formData, "description"),
  };

  if (id) {
    const { error } = await supabase
      .from("content_series")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("series update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${id}`);
    return { ok: true, message: "Series saved." };
  }

  const { data, error } = await supabase
    .from("content_series")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    console.error("series insert failed:", error.message);
    return { ok: false, message: `Couldn't create: ${error.message}` };
  }
  revalidatePath("/admin/content");
  redirect(`/admin/content/${data.id}`);
}

export async function deleteSeries(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("content_series").delete().eq("id", id);
  if (error) console.error("series delete failed:", error.message);
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

// ── Entries ─────────────────────────────────────────────────────────────────

export async function saveEntry(
  _prev: ContentState,
  formData: FormData,
): Promise<ContentState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();
  const id = str(formData, "id");
  const seriesId = str(formData, "series_id");
  if (!seriesId) return { ok: false, message: "Missing series." };

  const title = str(formData, "title");
  if (!title) return { ok: false, message: "Title is required." };

  const questions: Json = String(formData.get("discussion_questions") ?? "")
    .split(/\r?\n/)
    .map((q) => q.trim())
    .filter(Boolean);

  const payload = {
    series_id: seriesId,
    title,
    day_offset: intOrNull(formData, "day_offset"),
    sort: intOrNull(formData, "sort") ?? 0,
    body_md: str(formData, "body_md"),
    scripture_reference: str(formData, "scripture_reference"),
    audio_mux_id: str(formData, "audio_mux_id"),
    video_mux_id: str(formData, "video_mux_id"),
    discussion_questions: questions,
    published: formData.get("published") === "on",
  };

  if (id) {
    const { error } = await supabase
      .from("content_entries")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("entry update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
  } else {
    const { error } = await supabase.from("content_entries").insert(payload);
    if (error) {
      console.error("entry insert failed:", error.message);
      return { ok: false, message: `Couldn't add: ${error.message}` };
    }
  }

  revalidatePath(`/admin/content/${seriesId}`);
  return { ok: true, message: "Entry saved." };
}

export async function deleteEntry(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const seriesId = String(formData.get("series_id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("content_entries").delete().eq("id", id);
  if (error) console.error("entry delete failed:", error.message);
  if (seriesId) revalidatePath(`/admin/content/${seriesId}`);
}

// ── Trip assignment (trip_content) ──────────────────────────────────────────

export async function saveTripContentAssignment(
  formData: FormData,
): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const seriesId = String(formData.get("series_id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!seriesId || !tripId) return;
  const { error } = await supabase
    .from("trip_content")
    .upsert({ series_id: seriesId, trip_id: tripId });
  if (error) console.error("trip_content assign failed:", error.message);
  revalidatePath(`/admin/content/${seriesId}`);
}

export async function removeTripContentAssignment(
  formData: FormData,
): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const seriesId = String(formData.get("series_id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!seriesId || !tripId) return;
  const { error } = await supabase
    .from("trip_content")
    .delete()
    .eq("series_id", seriesId)
    .eq("trip_id", tripId);
  if (error) console.error("trip_content remove failed:", error.message);
  revalidatePath(`/admin/content/${seriesId}`);
}
