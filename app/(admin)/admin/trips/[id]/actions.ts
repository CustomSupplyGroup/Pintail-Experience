"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type TripStatus = Database["public"]["Enums"]["trip_status"];
type PlanningStatus = Database["public"]["Enums"]["planning_status"];

export type TripState = { ok: boolean; message: string };

const PLANNING: PlanningStatus[] = [
  "scoping",
  "booked",
  "prepping",
  "ready",
  "live",
  "wrapped",
];
const STATUS: TripStatus[] = ["draft", "live", "past"];

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

export async function updateTrip(
  _prev: TripState,
  formData: FormData,
): Promise<TripState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const id = str(formData, "id");
  if (!id) return { ok: false, message: "Missing trip id." };

  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Name is required." };

  const planningRaw = String(formData.get("planning_status") ?? "");
  const planning_status = (
    PLANNING.includes(planningRaw as PlanningStatus) ? planningRaw : "scoping"
  ) as PlanningStatus;

  const statusRaw = String(formData.get("status") ?? "");
  const status = (
    STATUS.includes(statusRaw as TripStatus) ? statusRaw : "draft"
  ) as TripStatus;

  const capacityRaw = str(formData, "capacity");
  const capacity = capacityRaw ? Number(capacityRaw) : null;
  if (capacity !== null && Number.isNaN(capacity)) {
    return { ok: false, message: "Capacity must be a number." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("trips")
    .update({
      name,
      location: str(formData, "location"),
      start_date: str(formData, "start_date"),
      end_date: str(formData, "end_date"),
      status,
      planning_status,
      capacity,
      tagline: str(formData, "tagline"),
      subtitle: str(formData, "subtitle"),
    })
    .eq("id", id);

  if (error) {
    console.error("trip update failed:", error.message);
    return { ok: false, message: `Couldn't save: ${error.message}` };
  }

  revalidatePath("/admin/trips");
  revalidatePath(`/admin/trips/${id}`);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/home");
  return { ok: true, message: "Trip saved." };
}
