"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import { sendEmail, broadcastEmailHtml, emailConfigured } from "@/lib/email";
import type { Database } from "@/lib/database.types";

type Channel = Database["public"]["Enums"]["announcement_channel"];

export type BroadcastState = { ok: boolean; message: string };

export async function sendBroadcast(
  _prev: BroadcastState,
  formData: FormData,
): Promise<BroadcastState> {
  let staff;
  try {
    staff = await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  const alsoEmail = formData.get("send_email") === "on";
  const channel: Channel = alsoEmail ? "all" : "in_app";

  if (!title) return { ok: false, message: "Give the announcement a title." };
  if (!tripId) return { ok: false, message: "No trip to announce to." };

  const { error: insertError } = await supabase.from("announcements").insert({
    trip_id: tripId,
    created_by: staff.id,
    title,
    body: body || null,
    channel,
    sent_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error("announcement insert failed:", insertError.message);
    return { ok: false, message: `Couldn't post announcement: ${insertError.message}` };
  }

  let emailNote = "";
  if (alsoEmail) {
    if (!emailConfigured()) {
      emailNote =
        " Posted in-app, but email was skipped — add RESEND_API_KEY to send email.";
    } else {
      // Read recipients with the service role when available so we never depend
      // on the founder's RLS to see other attendees' emails; fall back to the
      // staff-scoped client otherwise. We're already inside a requireStaff gate.
      const reader = serviceRoleConfigured() ? createAdminClient() : supabase;
      const { data: rows, error: rowsError } = await reader
        .from("trip_attendees")
        .select("users(email)")
        .eq("trip_id", tripId);

      if (rowsError) {
        console.error("broadcast recipient read failed:", rowsError.message);
        revalidatePath("/admin");
        revalidatePath(`/admin/trips/${tripId}/broadcast`);
        return {
          ok: true,
          message: "Announcement posted, but couldn't load emails to send.",
        };
      }

      const emails = (rows ?? [])
        .map((r) => (r.users as { email: string } | null)?.email)
        .filter((e): e is string => Boolean(e));

      if (emails.length) {
        const result = await sendEmail({
          to: emails,
          subject: title,
          html: broadcastEmailHtml({ title, body }),
        });
        emailNote = result.ok
          ? ` Emailed ${emails.length} attendee${emails.length === 1 ? "" : "s"}.`
          : " Posted in-app, but the email failed to send.";
      }
    }
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/trips/${tripId}/broadcast`);
  return { ok: true, message: `Announcement posted.${emailNote}` };
}
