"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type TripStatus = Database["public"]["Enums"]["trip_status"];

export type TripState = { ok: boolean; message: string };

export async function updateTrip(
  _prev: TripState,
  formData: FormData,
): Promise<TripState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing trip id." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, message: "Trip name is required." };

  const { error } = await supabase
    .from("trips")
    .update({
      name,
      location: String(formData.get("location") ?? "").trim() || null,
      start_date: String(formData.get("start_date") ?? "").trim() || null,
      end_date: String(formData.get("end_date") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      status: String(formData.get("status") ?? "draft") as TripStatus,
    })
    .eq("id", id);

  if (error) {
    console.error("trip update failed:", error.message);
    return { ok: false, message: `Couldn't save: ${error.message}` };
  }

  revalidatePath("/admin/trips");
  revalidatePath(`/admin/trips/${id}`);
  revalidatePath("/");
  revalidatePath("/home");
  return { ok: true, message: "Trip saved." };
}
