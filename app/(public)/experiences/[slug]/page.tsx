import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSeatCounts, seatsLabel } from "@/lib/trip";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { stock } from "@/lib/stock";
import { fmtRange } from "@/lib/dates";

const ROLE_FALLBACK: Record<string, Parameters<typeof stock>[0]> = {
  lodge: "decoySpread",
  dog_handler: "boatHunter",
  photographer: "featherDetail",
  leather_goods: "leatherMark",
  speaker: "lodgeFire",
  other: "capPortrait",
};

async function loadTrip(slug: string) {
  const supabase = await createClient();
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, slug, name, tagline, subtitle, location, start_date, end_date, capacity, status, description",
    )
    .eq("slug", slug)
    .neq("status", "draft")
    .maybeSingle();
  if (error) console.error("experience: trip read failed", error.message);
  return { supabase, trip };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { trip } = await loadTrip(slug);
  if (!trip) return { title: "The Pintail Experience" };
  const desc =
    trip.tagline ?? trip.description ?? "An intentional, faith-centered hunt.";
  return {
    title: `${trip.name} — The Pintail Experience`,
    description: desc,
    openGraph: { title: trip.name, description: desc },
  };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { supabase, trip } = await loadTrip(slug);
  if (!trip) notFound();

  const [
    { data: pages, error: pagesError },
    { data: vendorRows, error: vendorsError },
    { counts },
  ] = await Promise.all([
    supabase
      .from("trip_pages")
      .select("slug, title, content, sort_order")
      .eq("trip_id", trip.id)
      .eq("visible", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("trip_vendors")
      .select("role_on_trip, vendors(name, slug, role, featured_photo_url)")
      .eq("trip_id", trip.id),
    getSeatCounts(supabase),
  ]);
  if (pagesError) console.error("experience: pages read failed", pagesError.message);
  if (vendorsError) console.error("experience: vendors read failed", vendorsError.message);

  const seats = seatsLabel(trip.capacity, counts.get(trip.id) ?? 0);

  const vendors = (vendorRows ?? [])
    .map((r) => {
      const v = r.vendors as {
        name: string;
        slug: string;
        role: string;
        featured_photo_url: string | null;
      } | null;
      return v ? { ...v, role_on_trip: r.role_on_trip } : null;
    })
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${stock("marshDawn")})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pintail-night/85 via-pintail-night/70 to-pintail-night" />
        <div className="relative z-10 max-w-2xl">
          <Link
            href="/"
            className="mb-6 inline-block text-xs uppercase tracking-[0.3em] text-primary hover:text-pintail-cream"
          >
            ← The Pintail Experience
          </Link>
          <h1 className="font-display text-6xl text-pintail-cream sm:text-7xl">
            {trip.name}
          </h1>
          {trip.tagline && (
            <p className="mt-3 text-lg text-pintail-cream/85">{trip.tagline}</p>
          )}
          <p className="mt-4 text-sm uppercase tracking-wide text-muted-foreground">
            {fmtRange(trip.start_date, trip.end_date)}
            {trip.location && ` · ${trip.location}`}
          </p>
          {seats && (
            <p
              className={
                seats === "Full"
                  ? "mt-2 text-sm text-muted-foreground"
                  : "mt-2 text-sm text-primary"
              }
            >
              {seats}
            </p>
          )}
          <div className="mt-8">
            <Link href="/#inquire" className={buttonVariants({ size: "lg" })}>
              Request an invitation
            </Link>
          </div>
        </div>
      </section>

      {/* Overview / logistics pages */}
      {(pages ?? []).some((p) => p.content) && (
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-2xl space-y-10">
            {(pages ?? []).map((p) =>
              p.content ? (
                <div key={p.slug}>
                  <h2 className="mb-2 font-heading text-2xl italic tracking-tight text-primary">
                    {p.title}
                  </h2>
                  <Markdown>{p.content}</Markdown>
                </div>
              ) : null,
            )}
          </div>
        </section>
      )}

      {/* Hosting team */}
      {vendors.length > 0 && (
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 text-center font-heading text-2xl italic tracking-tight">
              The Hosting Team
            </h2>
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {vendors.map((v) => (
                <li key={v.slug}>
                  <Card className="overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        v.featured_photo_url ??
                        stock(ROLE_FALLBACK[v.role] ?? "decoySpread")
                      }
                      alt={v.name}
                      className="h-28 w-full object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-[0.65rem] uppercase tracking-wide text-primary">
                        {v.role_on_trip ?? "Partner"}
                      </p>
                      <p className="mt-0.5 font-serif text-base leading-tight">
                        {v.name}
                      </p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-border bg-card px-6 py-16 text-center">
        <h2 className="font-heading text-2xl italic tracking-tight">
          Interested in {trip.name}?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Seats are limited and by invitation. Tell us about yourself.
        </p>
        <Link
          href="/#inquire"
          className={buttonVariants({ size: "lg", className: "mt-6" })}
        >
          Request an invitation
        </Link>
      </section>
    </main>
  );
}
