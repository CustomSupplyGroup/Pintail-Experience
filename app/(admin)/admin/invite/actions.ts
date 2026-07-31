"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import { getActiveExperience } from "@/lib/trip";

export type InviteState = { ok: boolean; message: string };

type Parsed = { email: string; name: string | null };

// Accepts lines like "john@example.com" or "John Doe <john@example.com>".
function parseLines(raw: string): Parsed[] {
  const out: Parsed[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    const angle = t.match(/^(.*?)<([^>]+)>$/);
    if (angle) {
      out.push({ name: angle[1].trim() || null, email: angle[2].trim().toLowerCase() });
    } else {
      out.push({ name: null, email: t.toLowerCase() });
    }
  }
  return out;
}

export async function inviteAttendees(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  if (!serviceRoleConfigured()) {
    return {
      ok: false,
      message:
        "Add SUPABASE_SERVICE_ROLE_KEY to your environment to send invites (Supabase → Project Settings → API).",
    };
  }

  const people = parseLines(String(formData.get("emails") ?? ""));
  if (people.length === 0) {
    return { ok: false, message: "Add at least one email address." };
  }

  // Find the active experience to enroll invitees into.
  const supabase = await createClient();
  const { trip, error: tripError } = await getActiveExperience(supabase);
  if (tripError) {
    return { ok: false, message: "Couldn't look up the trip. Try again." };
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectTo = `${appUrl}/auth/callback?redirect=/onboarding`;

  let invited = 0;
  const failures: string[] = [];

  for (const { email, name } of people) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: name ? { full_name: name } : undefined,
    });

    if (error) {
      // Already-registered users can't be re-invited; treat as non-fatal.
      failures.push(`${email} (${error.message})`);
      continue;
    }
    invited += 1;

    // Enroll the new user into the live trip (service role bypasses RLS).
    if (trip && data.user) {
      const { error: enrollErr } = await admin
        .from("trip_attendees")
        .insert({ trip_id: trip.id, user_id: data.user.id });
      if (enrollErr && !enrollErr.message.includes("duplicate")) {
        console.error("enroll on invite failed:", enrollErr.message);
      }
    }
  }

  revalidatePath("/admin/roster");

  if (invited === 0) {
    return { ok: false, message: `No invites sent. ${failures.join("; ")}` };
  }
  return {
    ok: true,
    message:
      `Invited ${invited} ${invited === 1 ? "person" : "people"}.` +
      (failures.length ? ` Skipped: ${failures.join("; ")}` : ""),
  };
}
