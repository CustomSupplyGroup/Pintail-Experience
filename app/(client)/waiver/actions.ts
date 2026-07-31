"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WAIVER_VERSION } from "@/lib/waiver-copy";

export async function recordWaiver(
  signaturePath: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "You're signed out." };

  const { data: tripId, error: enrollErr } = await supabase.rpc(
    "ensure_trip_enrollment",
  );
  if (enrollErr || !tripId) {
    return { ok: false, message: "No active trip to sign for." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    null;

  const { error: waiverErr } = await supabase.from("waivers").insert({
    trip_id: tripId,
    user_id: user.id,
    signature_image_path: signaturePath,
    ip_address: ip,
    document_version: WAIVER_VERSION,
  });
  if (waiverErr) {
    console.error("waiver insert failed:", waiverErr.message);
    return { ok: false, message: `Couldn't save your waiver: ${waiverErr.message}` };
  }

  const { error: attendeeErr } = await supabase
    .from("trip_attendees")
    .update({ waiver_signed_at: new Date().toISOString() })
    .eq("trip_id", tripId)
    .eq("user_id", user.id);
  if (attendeeErr) {
    console.error("waiver flag update failed:", attendeeErr.message);
  }

  revalidatePath("/waiver");
  revalidatePath("/home");
  return { ok: true, message: "Waiver signed. Thank you." };
}
