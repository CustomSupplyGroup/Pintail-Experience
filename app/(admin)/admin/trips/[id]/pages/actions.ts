"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";

export type PageState = { ok: boolean; message: string };

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateReaders(tripId: string | null): void {
  if (tripId) revalidatePath(`/admin/trips/${tripId}/pages`);
  revalidatePath("/admin/trips");
  // Member + public reader surfaces for trip info.
  revalidatePath("/logistics");
  revalidatePath("/trip");
}

export async function savePage(
  _prev: PageState,
  formData: FormData,
): Promise<PageState> {
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
    slug: str(formData, "slug") ?? slugify(title),
    content: str(formData, "content"),
    sort_order: Number(str(formData, "sort_order") ?? "0"),
    visible: formData.get("visible") === "on",
  };

  if (id) {
    const { error } = await supabase.from("trip_pages").update(payload).eq("id", id);
    if (error) {
      console.error("page update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
    revalidateReaders(tripId);
    if (tripId) revalidatePath(`/admin/trips/${tripId}/pages/${id}`);
    return { ok: true, message: "Page saved." };
  }

  if (!tripId) return { ok: false, message: "No active trip." };
  const { data, error } = await supabase
    .from("trip_pages")
    .insert({ ...payload, trip_id: tripId })
    .select("id")
    .single();
  if (error) {
    console.error("page insert failed:", error.message);
    return { ok: false, message: `Couldn't create: ${error.message}` };
  }
  revalidateReaders(tripId);
  redirect(`/admin/trips/${tripId}/pages/${data.id}`);
}

export async function deletePage(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("trip_pages").delete().eq("id", id);
  if (error) console.error("page delete failed:", error.message);
  revalidateReaders(tripId || null);
  redirect(`/admin/trips/${tripId}/pages`);
}
