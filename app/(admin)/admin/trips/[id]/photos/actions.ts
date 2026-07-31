"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

export async function setPhotoPublic(
  id: string,
  value: boolean,
  tripId: string,
): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .update({ public_visible: value })
    .eq("id", id);
  if (error) console.error("setPhotoPublic failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/photos`);
  revalidatePath("/gallery");
}

export async function setPhotoFeatured(
  id: string,
  value: boolean,
  tripId: string,
): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("photos")
    .update({ featured: value })
    .eq("id", id);
  if (error) console.error("setPhotoFeatured failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/photos`);
}

export async function deletePhoto(
  id: string,
  storagePath: string,
  tripId: string,
): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const { error: storageError } = await supabase.storage
    .from("photos")
    .remove([storagePath]);
  if (storageError) console.error("photo storage delete failed:", storageError.message);

  const { error } = await supabase.from("photos").delete().eq("id", id);
  if (error) console.error("photo row delete failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/photos`);
  revalidatePath("/photos");
  revalidatePath("/gallery");
}
