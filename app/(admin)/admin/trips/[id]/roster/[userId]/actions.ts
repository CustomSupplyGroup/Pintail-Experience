"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type Role = Database["public"]["Enums"]["user_role"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export type AttendeeState = { ok: boolean; message: string };

export async function updateAttendee(
  _prev: AttendeeState,
  formData: FormData,
): Promise<AttendeeState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();
  const userId = String(formData.get("user_id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!userId) return { ok: false, message: "Missing attendee id." };

  const fullName = String(formData.get("full_name") ?? "").trim() || null;
  const role = String(formData.get("role") ?? "attendee") as Role;

  const { error: userError } = await supabase
    .from("users")
    .update({ full_name: fullName, role })
    .eq("id", userId);

  if (userError) {
    console.error("admin user update failed:", userError.message);
    return { ok: false, message: `Couldn't update profile: ${userError.message}` };
  }

  if (tripId) {
    const waiverSigned = formData.get("waiver_signed") === "on";
    // Upsert, not update: an attendee may not yet have an enrollment row. A bare
    // UPDATE would no-op silently and still report success, losing the edit.
    const { error: attendeeError } = await supabase
      .from("trip_attendees")
      .upsert(
        {
          trip_id: tripId,
          user_id: userId,
          payment_status: String(
            formData.get("payment_status") ?? "unpaid",
          ) as PaymentStatus,
          room_assignment:
            String(formData.get("room_assignment") ?? "").trim() || null,
          waiver_signed_at: waiverSigned ? new Date().toISOString() : null,
        },
        { onConflict: "trip_id,user_id" },
      );

    if (attendeeError) {
      console.error("admin attendee update failed:", attendeeError.message);
      return { ok: false, message: `Couldn't update trip details: ${attendeeError.message}` };
    }
  }

  if (tripId) {
    revalidatePath(`/admin/trips/${tripId}/roster/${userId}`);
    revalidatePath(`/admin/trips/${tripId}/roster`);
  }
  return { ok: true, message: "Attendee updated." };
}
