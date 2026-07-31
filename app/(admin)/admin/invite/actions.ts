"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, serviceRoleConfigured } from "@/lib/supabase/admin";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import { getActiveExperience } from "@/lib/trip";
import { sendEmail, welcomeEmailHtml } from "@/lib/email";

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

  // Enroll invitees into a specific trip when one is passed (from the roster's
  // "Invite attendees" button); otherwise fall back to the active experience.
  const supabase = await createClient();
  const tripParam = String(formData.get("trip") ?? "").trim();
  let tripId: string | null = null;
  if (tripParam) {
    const { data: tripRow, error: tripLookupError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", tripParam)
      .maybeSingle();
    if (tripLookupError) {
      return { ok: false, message: "Couldn't look up the trip. Try again." };
    }
    if (!tripRow) {
      return { ok: false, message: "That trip no longer exists." };
    }
    tripId = tripRow.id;
  } else {
    const { trip, error: tripError } = await getActiveExperience(supabase);
    if (tripError) {
      return { ok: false, message: "Couldn't look up the trip. Try again." };
    }
    tripId = trip?.id ?? null;
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

    // Enroll the new user into the target trip (service role bypasses RLS).
    if (tripId && data.user) {
      const { error: enrollErr } = await admin
        .from("trip_attendees")
        .insert({ trip_id: tripId, user_id: data.user.id });
      if (enrollErr && !enrollErr.message.includes("duplicate")) {
        console.error("enroll on invite failed:", enrollErr.message);
      }
    }

    // A branded welcome alongside Supabase's magic-link invite. Non-fatal.
    const welcome = await sendEmail({
      to: email,
      subject: "Welcome to The Pintail Experience",
      html: welcomeEmailHtml({ name, signInUrl: `${appUrl}/login` }),
    });
    if (!welcome.ok && !welcome.skipped) {
      console.error("welcome email failed:", welcome.error);
    }
  }

  revalidatePath("/admin/trips");
  if (tripId) revalidatePath(`/admin/trips/${tripId}/roster`);

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
