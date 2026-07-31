"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";

export type CurriculumState = { ok: boolean; message: string };

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

export async function saveCurriculum(
  _prev: CurriculumState,
  formData: FormData,
): Promise<CurriculumState> {
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

  const questions = String(formData.get("discussion_questions") ?? "")
    .split(/\r?\n/)
    .map((q) => q.trim())
    .filter(Boolean);

  const published = formData.get("published") === "on";

  const payload = {
    title,
    session_number: Number(str(formData, "session_number") ?? "1"),
    scripture_reference: str(formData, "scripture_reference"),
    written_content: str(formData, "written_content"),
    audio_mux_id: str(formData, "audio_mux_id"),
    video_mux_id: str(formData, "video_mux_id"),
    discussion_questions: questions,
    published_at: published ? new Date().toISOString() : null,
  };

  if (id) {
    const { error } = await supabase
      .from("curriculum_sessions")
      .update(payload)
      .eq("id", id);
    if (error) {
      console.error("curriculum update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
    revalidatePath("/admin/curriculum");
    revalidatePath(`/admin/curriculum/${id}`);
    return { ok: true, message: "Session saved." };
  }

  if (!tripId) return { ok: false, message: "No active trip." };
  const { data, error } = await supabase
    .from("curriculum_sessions")
    .insert({ ...payload, trip_id: tripId })
    .select("id")
    .single();
  if (error) {
    console.error("curriculum insert failed:", error.message);
    return { ok: false, message: `Couldn't create: ${error.message}` };
  }
  revalidatePath("/admin/curriculum");
  redirect(`/admin/curriculum/${data.id}`);
}

export async function deleteCurriculum(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase
    .from("curriculum_sessions")
    .delete()
    .eq("id", id);
  if (error) console.error("curriculum delete failed:", error.message);
  revalidatePath("/admin/curriculum");
  redirect("/admin/curriculum");
}
