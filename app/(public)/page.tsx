import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSeatCounts, seatsLabel } from "@/lib/trip";
import { InquiryForm } from "./inquiry-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VideoBackground } from "@/components/video-background";
import { stock } from "@/lib/stock";

export const metadata: Metadata = {
  title: "The Pintail Experience — For the inspired sportsman",
  description:
    "An intentional, faith-centered hunting retreat. Reverence, craftsmanship, and brotherhood in the field.",
  openGraph: {
    title: "The Pintail Experience",
    description:
      "An intentional, faith-centered hunting retreat. Reverence, craftsmanship, and brotherhood in the field.",
    images: ["/brand/wordmark.png"],
  },
};

function fmtRange(start: string | null, end: string | null): string {
  if (!start) return "Dates to come";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(`${start}T00:00:00`).toLocaleDateString("en-US", opts);
  const e = end
    ? new Date(`${end}T00:00:00`).toLocaleDateString("en-US", {
        ...opts,
        year: "numeric",
      })
    : new Date(`${start}T00:00:00`).toLocaleDateString("en-US", {
        year: "numeric",
      });
  return `${s} – ${e}`;
}

export default async function LandingPage() {
  const supabase = await createClient();

  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select(
      "id, slug, name, tagline, subtitle, location, start_date, end_date, capacity, status",
    )
    .neq("status", "past")
    .order("start_date", { ascending: true });
  if (tripsError) console.error("landing: trips read failed", tripsError.message);

  const { counts } = await getSeatCounts(supabase);
  const hunts = trips ?? [];

  return (
    <main className="flex flex-col">
      {/* Top bar: member sign-in, top-right */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-5">
        <Link
          href="/login"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "pointer-events-auto backdrop-blur",
          })}
        >
          Member sign in
        </Link>
      </div>

      {/* Hero — the ethos, not one trip. Brand film with a still-image fallback. */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="pointer-events-none absolute inset-0">
          <VideoBackground
            src="/video/hero-1.mp4"
            poster={stock("marshDawn")}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pintail-night/85 via-pintail-night/70 to-pintail-night" />
        <div className="relative z-10 max-w-2xl animate-rise">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-primary">
            For the inspired sportsman
          </p>
          <h1>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/wordmark.png"
              alt="The Pintail Experience"
              className="mx-auto h-24 w-auto sm:h-32"
            />
            <span className="mt-3 block text-sm uppercase tracking-[0.4em] text-pintail-champagne/80">
              The Experience
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Hunts built with intention — reverence for the field, craftsmanship
            in every detail, and brotherhood around the fire. More than a
            trophy. A few days that stay with you.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="#inquire" className={buttonVariants({ size: "lg" })}>
              Request an invitation
            </Link>
            <Link
              href="#hunts"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See upcoming hunts
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Hunts */}
      <section id="hunts" className="border-t border-border px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-heading text-3xl italic tracking-tight">
            Upcoming Hunts
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
            Each hunt is named, small, and by invitation.
          </p>

          {hunts.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              The next hunt is being planned. Request an invitation to hear
              first.
            </p>
          ) : (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {hunts.map((t) => {
                const seats = seatsLabel(t.capacity, counts.get(t.id) ?? 0);
                return (
                  <li key={t.id}>
                    <Link href={`/experiences/${t.slug}`}>
                      <Card className="h-full transition-colors hover:border-primary">
                        <CardContent className="space-y-2 pt-6">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-display text-3xl text-pintail-cream">
                              {t.name}
                            </p>
                            {seats && (
                              <span
                                className={
                                  seats === "Full"
                                    ? "shrink-0 text-xs uppercase tracking-wide text-muted-foreground"
                                    : "shrink-0 text-xs uppercase tracking-wide text-primary"
                                }
                              >
                                {seats}
                              </span>
                            )}
                          </div>
                          {t.tagline && (
                            <p className="text-sm text-foreground/85">
                              {t.tagline}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {fmtRange(t.start_date, t.end_date)}
                            {t.location && <span className="block">{t.location}</span>}
                          </p>
                          <p className="pt-1 text-xs uppercase tracking-wide text-primary">
                            Learn more →
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Vision */}
      <section className="relative border-t border-border px-6 py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${stock("lodgeFire")})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-pintail-night/85" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl italic tracking-tight">
            The hunt lasts a few days. The experience lasts far longer.
          </h2>
          <p className="mt-6 text-muted-foreground">
            The real experience is the people, the meals, the conversations, and
            the bonds built as a result of the hunt. From the day you&apos;re
            confirmed, it lives in your pocket — a daily devotional in the
            lead-up, the run-of-show in your hand on the water, and an archive of
            every teaching, every photo, and the closing blessing long after
            you&apos;ve flown home.
          </p>
        </div>
      </section>

      {/* Inquiry */}
      <section id="inquire" className="border-t border-border bg-card px-6 py-20">
        <div className="mx-auto max-w-xl">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-3xl italic tracking-tight">
              Request an invitation
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Seats are limited and by invitation. Tell us about yourself and
              we&apos;ll reach out.
            </p>
          </div>
          <InquiryForm />
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10 text-center text-xs text-muted-foreground">
        <Link href="/gallery" className="text-primary underline underline-offset-2">
          View the gallery
        </Link>
        <p className="mt-3">© {new Date().getFullYear()} The Pintail Experience.</p>
      </footer>
    </main>
  );
}
