import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { VideoBackground } from "@/components/video-background";
import { stock } from "@/lib/stock";
import { getActiveExperience } from "@/lib/trip";
import { daysUntilDate } from "@/lib/utils";

function fmtDate(d: string | null): string {
  if (!d) return "";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return `${h12}:${m}${ampm}`;
}

const ROLE_LABEL: Record<string, string> = {
  lodge: "Lodge",
  dog_handler: "Dog Handler",
  photographer: "Photographer",
  leather_goods: "Pintail Goods",
  speaker: "Teaching",
  other: "Partner",
};

const ROLE_FALLBACK: Record<string, Parameters<typeof stock>[0]> = {
  lodge: "decoySpread",
  dog_handler: "boatHunter",
  photographer: "featherDetail",
  leather_goods: "leatherMark",
  speaker: "lodgeFire",
  other: "capPortrait",
};

export default async function TripOnePager() {
  const supabase = await createClient();

  const { trip, error: tripError } = await getActiveExperience(supabase);
  if (tripError) {
    console.error("trip page: active trip lookup failed", tripError);
  }

  const [
    { data: pages, error: pagesError },
    { data: vendors, error: vendorsError },
    { data: schedule, error: scheduleError },
  ] = await Promise.all([
      supabase
        .from("trip_pages")
        .select("slug, title, content")
        .eq("visible", true)
        .in("slug", ["vision", "whats-included"]),
      supabase
        .from("vendors")
        .select("name, slug, role, featured_photo_url")
        .order("name", { ascending: true }),
      supabase
        .from("schedule_items")
        .select("id, day_number, start_time, title, category")
        .eq("visible_to_attendees", true)
        .order("day_number", { ascending: true })
        .order("start_time", { ascending: true, nullsFirst: true }),
    ]);

  if (pagesError) console.error("trip page: pages read failed", pagesError.message);
  if (vendorsError) console.error("trip page: vendors read failed", vendorsError.message);
  if (scheduleError) console.error("trip page: schedule read failed", scheduleError.message);

  const vision = pages?.find((p) => p.slug === "vision");
  const included = pages?.find((p) => p.slug === "whats-included");
  const countdown = trip?.start_date ? daysUntilDate(trip.start_date) : null;

  const byDay = new Map<number, NonNullable<typeof schedule>>();
  for (const it of schedule ?? []) {
    if (!byDay.has(it.day_number)) byDay.set(it.day_number, []);
    byDay.get(it.day_number)!.push(it);
  }

  return (
    <div className="space-y-10">
      <Link
        href="/home"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Home
      </Link>

      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden">
        <div className="relative h-72">
          <VideoBackground src="/video/hero-1.mp4" poster="/img/hero-1-poster.jpg" />
          <div className="absolute inset-0 bg-gradient-to-t from-pintail-night via-pintail-night/60 to-pintail-night/20" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="font-display text-4xl text-pintail-cream">
              {trip?.name ?? "The Pintail Experience"}
            </p>
            {countdown !== null && (
              <p className="mt-1 font-serif text-2xl text-primary">
                {countdown === 0
                  ? "It's here."
                  : `${countdown} ${countdown === 1 ? "day" : "days"} to go`}
              </p>
            )}
            {(trip?.start_date || trip?.location) && (
              <p className="mt-1 text-sm text-pintail-cream/80">
                {trip?.start_date && (
                  <>
                    {fmtDate(trip.start_date)}
                    {trip.end_date && ` – ${fmtDate(trip.end_date)}`}
                  </>
                )}
                {trip?.location && (
                  <span className="block">{trip.location}</span>
                )}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* The Vision */}
      {vision?.content && (
        <section>
          <h2 className="mb-2 font-serif text-2xl text-primary">The Vision</h2>
          <Markdown>{vision.content}</Markdown>
        </section>
      )}

      {/* The Details */}
      {included?.content && (
        <section>
          <h2 className="mb-2 font-serif text-2xl text-primary">The Details</h2>
          <Markdown>{included.content}</Markdown>
        </section>
      )}

      {/* The Hosting Team */}
      {vendors && vendors.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-2xl text-primary">
            The Hosting Team
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {vendors.map((v) => (
              <li key={v.slug}>
                <Link href={`/vendors/${v.slug}`}>
                  <Card className="overflow-hidden transition-colors hover:border-primary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        v.featured_photo_url ??
                        stock(ROLE_FALLBACK[v.role] ?? "decoySpread")
                      }
                      alt={v.name}
                      className="h-24 w-full object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-[0.65rem] uppercase tracking-wide text-primary">
                        {ROLE_LABEL[v.role] ?? "Partner"}
                      </p>
                      <p className="mt-0.5 font-serif text-base leading-tight">
                        {v.name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* The Schedule — appears once it's posted */}
      <section>
        <h2 className="mb-3 font-serif text-2xl text-primary">The Schedule</h2>
        {byDay.size === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                The day-by-day run of the trip drops here as we lock it in.
                Trust us — it&apos;s worth the wait.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {[...byDay.entries()].map(([day, items]) => (
              <div key={day}>
                <h3 className="mb-2 font-serif text-lg">Day {day}</h3>
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-baseline gap-3">
                      <span className="w-16 shrink-0 text-sm tabular-nums text-muted-foreground">
                        {fmtTime(it.start_time)}
                      </span>
                      <span className="text-sm text-foreground/90">
                        {it.title}
                      </span>
                      <Badge variant="secondary" className="ml-auto text-primary">
                        {it.category}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <Link
              href="/schedule"
              className="inline-block text-sm text-primary hover:underline"
            >
              See the full schedule →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
