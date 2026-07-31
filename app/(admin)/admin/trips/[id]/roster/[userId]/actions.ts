"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import { dollarsToCents, formatCents } from "@/lib/utils";
import { sendEmail, paymentReminderHtml } from "@/lib/email";
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
          amount_paid_cents: dollarsToCents(
            String(formData.get("amount_paid") ?? ""),
          ) ?? 0,
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

/** Email one attendee their current balance + pay link. Non-fatal on email. */
export async function sendPaymentReminder(
  _prev: AttendeeState,
  formData: FormData,
): Promise<AttendeeState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const userId = String(formData.get("user_id") ?? "");
  const tripId = String(formData.get("trip_id") ?? "");
  if (!userId || !tripId) return { ok: false, message: "Missing attendee." };

  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("name, price_cents, payment_url")
    .eq("id", tripId)
    .maybeSingle();
  if (tripError || !trip) {
    return { ok: false, message: "Couldn't load the trip." };
  }
  if (trip.price_cents == null) {
    return { ok: false, message: "Set a price on the trip first." };
  }

  const { data: person, error: personError } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle();
  if (personError || !person?.email) {
    return { ok: false, message: "Couldn't find this attendee's email." };
  }

  const { data: attendee, error: attendeeError } = await supabase
    .from("trip_attendees")
    .select("amount_paid_cents")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .maybeSingle();
  if (attendeeError) {
    return { ok: false, message: "Couldn't load payment details." };
  }

  const paid = attendee?.amount_paid_cents ?? 0;
  const balance = Math.max(trip.price_cents - paid, 0);
  if (balance <= 0) {
    return { ok: false, message: "This attendee is already paid in full." };
  }

  const result = await sendEmail({
    to: person.email,
    subject: `Your balance for ${trip.name}`,
    html: paymentReminderHtml({
      name: person.full_name,
      tripName: trip.name,
      totalLabel: formatCents(trip.price_cents),
      paidLabel: formatCents(paid),
      balanceLabel: formatCents(balance),
      payUrl: trip.payment_url,
    }),
  });

  if (result.skipped) {
    return { ok: false, message: "Email isn't configured (set RESEND_API_KEY)." };
  }
  if (!result.ok) {
    return { ok: false, message: "Couldn't send the reminder — try again." };
  }
  return { ok: true, message: `Reminder sent to ${person.email}.` };
}
