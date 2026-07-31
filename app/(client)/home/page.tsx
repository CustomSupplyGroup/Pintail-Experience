import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { getSelectedTrip } from "@/lib/trip";
import { getLatestDevotional } from "@/lib/content";
import { daysUntil, currentTripDay, isTripOver } from "@/lib/dates";
import { formatCents } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { VideoBackground } from "@/components/video-background";
import {
  ReadinessChecklist,
  type ReadinessRow,
} from "@/components/readiness-checklist";

function fmtTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return `${h12}:${m}${ampm}`;
}

type NextItem = { start_time: string | null; title: string; location: string | null };

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { trip, error: tripError } = await getSelectedTrip(supabase, user);
  if (tripError) {
    console.error("home: selected trip lookup failed", tripError);
  }

  // Signed-in attendees get enrolled + a readiness check. Guests skip this.
  let attendee: {
    shirt_size: string | null;
    amount_paid_cents: number;
    waiver_signed_at: string | null;
  } | null = null;
  if (user) {
    const { data: tripId, error: enrollError } = await supabase.rpc(
      "ensure_trip_enrollment",
    );
    if (enrollError) {
      console.error("home: ensure_trip_enrollment failed", enrollError.message);
    } else if (tripId) {
      const { data, error: attendeeError } = await supabase
        .from("trip_attendees")
        .select("shirt_size, amount_paid_cents, waiver_signed_at")
        .eq("trip_id", tripId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (attendeeError) {
        console.error("home: attendee read failed", attendeeError.message);
      }
      attendee = data;
    }
  }

  // Payment standing (only when a price is set).
  const priceCents = trip?.price_cents ?? null;
  const paidCents = attendee?.amount_paid_cents ?? 0;
  const balanceCents =
    priceCents != null ? Math.max(priceCents - paidCents, 0) : null;
  const showPayment = Boolean(user) && priceCents != null;

  const latest = trip
    ? await getLatestDevotional(supabase, trip.id, trip.start_date)
    : { devotional: null, error: null };
  const latestDevotional = latest.devotional;

  // Trip-day mode: is today one of the hunt days?
  const tripDay = trip ? currentTripDay(trip.start_date, trip.end_date) : null;
  const tripOver = trip ? isTripOver(trip.end_date) : false;
  const countdown = trip?.start_date ? daysUntil(trip.start_date) : null;

  // On a live day, find the next thing on the agenda.
  let nextItem: NextItem | null = null;
  if (trip && tripDay != null) {
    const now = new Date();
    const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    const { data: items, error: itemsError } = await supabase
      .from("schedule_items")
      .select("start_time, title, location, day_number")
      .eq("trip_id", trip.id)
      .eq("visible_to_attendees", true)
      .gte("day_number", tripDay)
      .order("day_number", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true });
    if (itemsError) {
      console.error("home: schedule lookup failed", itemsError.message);
    }
    const list = items ?? [];
    nextItem =
      list.find(
        (it) =>
          it.day_number > tripDay ||
          (it.start_time != null && it.start_time >= nowStr),
      ) ??
      list[0] ??
      null;
  }

  // Readiness rows (signed-in members only).
  const readinessRows: ReadinessRow[] = user
    ? [
        {
          label: "Complete your profile",
          done: Boolean(user.full_name) && Boolean(attendee?.shirt_size),
          href: "/onboarding",
        },
        {
          label: "Sign the waiver",
          done: Boolean(attendee?.waiver_signed_at),
          href: "/waiver",
        },
        {
          label: "Pay your balance",
          done: priceCents == null || paidCents >= priceCents,
          href: "/more",
        },
      ]
    : [];
  const showReadiness = readinessRows.some((r) => !r.done);

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h1 className="font-display text-5xl leading-tight text-foreground">
          {firstName ?? "Friend"}
        </h1>
      </header>

      {showReadiness && <ReadinessChecklist rows={readinessRows} />}

      <Link
        href="/trip"
        className="group relative block overflow-hidden rounded-xl border border-primary/15 transition-colors hover:border-primary/40"
      >
        <VideoBackground src="/video/hero-1.mp4" poster="/img/hero-1-poster.jpg" />
        <div className="absolute inset-0 bg-gradient-to-t from-pintail-night via-pintail-night/70 to-pintail-night/30" />
        <div className="relative p-5 pt-16">
          {tripDay != null ? (
            // Trip is happening now — show "where to be, when."
            <>
              <p className="font-serif text-lg text-pintail-cream">
                {trip?.name} · Day {tripDay}
              </p>
              {nextItem ? (
                <p className="mt-1">
                  <span className="font-serif text-3xl text-primary">
                    {fmtTime(nextItem.start_time) || "Next"}
                  </span>
                  <span className="ml-2 text-pintail-cream">{nextItem.title}</span>
                  {nextItem.location && (
                    <span className="mt-0.5 block text-sm text-pintail-cream/70">
                      {nextItem.location}
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-1 text-pintail-cream/80">
                  Rest up — the next call comes soon.
                </p>
              )}
            </>
          ) : tripOver ? (
            <>
              <p className="font-serif text-lg text-pintail-cream">{trip?.name}</p>
              <p className="mt-1 font-display text-3xl text-primary">
                The hunt is over. The experience isn&apos;t.
              </p>
            </>
          ) : (
            <>
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
            </>
          )}
          <p className="mt-3 text-xs uppercase tracking-wide text-primary/80 transition-colors group-hover:text-primary">
            {tripOver ? "See the photos →" : "Tap for trip info →"}
          </p>
        </div>
      </Link>

      {showPayment && (
        <Card className={balanceCents === 0 ? undefined : "border-primary/40"}>
          <CardHeader>
            <CardTitle className="text-sm font-normal text-primary">
              Your payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {balanceCents === 0 ? (
              <p className="font-serif text-xl">Paid in full — thank you.</p>
            ) : (
              <>
                <p className="font-serif text-2xl">
                  {formatCents(balanceCents)}{" "}
                  <span className="text-base text-muted-foreground">due</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCents(paidCents)} paid of {formatCents(priceCents)}.
                </p>
                {trip?.payment_url && (
                  <a
                    href={trip.payment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({})}
                  >
                    Make a payment
                  </a>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

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
