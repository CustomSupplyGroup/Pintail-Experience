import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { getLatestDevotional } from "@/lib/content";
import { daysUntilDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { VideoBackground } from "@/components/video-background";

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError) {
    console.error("home: selected trip lookup failed", tripError);
  }

  // Signed-in attendees get enrolled + a profile-completeness check.
  // Guests (preview) skip all of this.
  let attendee: { shirt_size: string | null } | null = null;
  if (user) {
    const { data: tripId, error: enrollError } = await supabase.rpc(
      "ensure_trip_enrollment",
    );
    if (enrollError) {
      console.error("home: ensure_trip_enrollment failed", enrollError.message);
    } else if (tripId) {
      const { data, error: attendeeError } = await supabase
        .from("trip_attendees")
        .select("shirt_size")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (attendeeError) {
        console.error("home: attendee read failed", attendeeError.message);
      }
      attendee = data;
    }
  }

  const latest = trip
    ? await getLatestDevotional(supabase, trip.id, trip.start_date)
    : { devotional: null, error: null };
  const latestDevotional = latest.devotional;

  const profileIncomplete =
    Boolean(user) && (!user?.full_name || !attendee?.shirt_size);
  const countdown = trip?.start_date ? daysUntilDate(trip.start_date) : null;
  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-5xl leading-tight text-foreground">
          {firstName ?? "Friend"}
        </h1>
      </header>

      {profileIncomplete && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="font-serif text-lg">
              Finish setting up your profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add your sizes, dietary needs, and a short bio so we can take care
              of you — and introduce you to the other men.
            </p>
            <Link href="/onboarding" className={buttonVariants({})}>
              Complete profile
            </Link>
          </CardContent>
        </Card>
      )}

      <Link
        href="/trip"
        className="group relative block overflow-hidden rounded-xl border border-primary/15 transition-colors hover:border-primary/40"
      >
        <VideoBackground src="/video/hero-1.mp4" poster="/img/hero-1-poster.jpg" />
        <div className="absolute inset-0 bg-gradient-to-t from-pintail-night via-pintail-night/70 to-pintail-night/30" />
        <div className="relative p-5 pt-16">
          <p className="font-serif text-lg text-pintail-cream">
            {trip?.name ?? "The Pintail Experience"}
          </p>
          {countdown !== null ? (
            <p className="font-serif text-5xl text-primary">
              {countdown}
              <span className="ml-2 text-base text-pintail-cream/80">
                {countdown === 1 ? "day to go" : "days to go"}
              </span>
            </p>
          ) : (
            <p className="text-pintail-cream/80">
              Your trip details are coming soon.
            </p>
          )}
          {trip?.location && (
            <p className="text-sm text-pintail-cream/70">{trip.location}</p>
          )}
          <p className="mt-3 text-xs uppercase tracking-wide text-primary/80 transition-colors group-hover:text-primary">
            Tap for trip info →
          </p>
        </div>
      </Link>

      {latestDevotional ? (
        <Link href={`/devotionals/${latestDevotional.id}`}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-primary">
                Today&apos;s devotional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-serif text-xl">{latestDevotional.title}</p>
              {latestDevotional.scripture_reference && (
                <p className="mt-1 text-sm italic text-muted-foreground">
                  {latestDevotional.scripture_reference}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                The most recent devotional released for {trip?.name ?? "your trip"}.
              </p>
            </CardContent>
          </Card>
        </Link>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">What&apos;s next</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Devotionals, your schedule, and the curriculum will appear here as
              the trip draws closer.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
