import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";

export const metadata = { title: "Your profile · The Pintail Experience" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Idempotent: ensures a trip_attendees row exists for the live trip.
  const { data: tripId, error: enrollError } = await supabase.rpc(
    "ensure_trip_enrollment",
  );
  if (enrollError) {
    console.error("onboarding: ensure_trip_enrollment failed", enrollError.message);
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("full_name, phone, bio, intro_note")
    .eq("id", user.id)
    .single();
  if (profileError) {
    console.error("onboarding: profile read failed", profileError.message);
  }

  let attendee = null;
  if (tripId) {
    const { data, error: attendeeError } = await supabase
      .from("trip_attendees")
      .select(
        "shirt_size, jacket_size, hat_size, glove_size, boot_size, dietary_notes, room_preference, prayer_request, roster_visible",
      )
      .eq("trip_id", tripId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (attendeeError) {
      console.error("onboarding: trip_attendees read failed", attendeeError.message);
    }
    attendee = data;
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-10">
      <header className="mb-8 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Welcome to Pintail
        </p>
        <h1 className="mt-2 font-display text-5xl leading-tight text-pintail-champagne">
          Your profile
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A few details so we can take care of you on the trip — and so the
          other men know who they&apos;re sharing the blind with.
        </p>
      </header>
      <OnboardingForm profile={profile} attendee={attendee} />
    </main>
  );
}
