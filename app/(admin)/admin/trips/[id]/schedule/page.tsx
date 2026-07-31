import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

function fmt(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return `${h12}:${m}${ampm}`;
}

export default async function ScheduleAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (tripError) {
    console.error("schedule: trip read failed", tripError.message);
    return (
      <div>
        <PageHeader title="Schedule" />
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: items, error } = await supabase
    .from("schedule_items")
    .select("id, day_number, start_time, end_time, title, location, category, visible_to_attendees")
    .eq("trip_id", trip.id)
    .order("day_number", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });

  const byDay = new Map<number, typeof items>();
  for (const it of items ?? []) {
    if (!byDay.has(it.day_number)) byDay.set(it.day_number, []);
    byDay.get(it.day_number)!.push(it);
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <PageHeader title="Schedule" subtitle="The run-of-show, by day." />
        <Link
          href={`/admin/trips/${id}/schedule/new`}
          className={buttonVariants({ className: "mb-6" })}
        >
          Add item
        </Link>
      </div>

      {error ? (
        <EmptyState>Couldn&apos;t load the schedule: {error.message}</EmptyState>
      ) : !items || items.length === 0 ? (
        <EmptyState>No schedule items yet.</EmptyState>
      ) : (
        <div className="space-y-6">
          {[...byDay.entries()].map(([day, dayItems]) => (
            <section key={day}>
              <h2 className="mb-2 font-serif text-xl">Day {day}</h2>
              <ul className="space-y-2">
                {dayItems!.map((it) => (
                  <li key={it.id}>
                    <Link
                      href={`/admin/trips/${id}/schedule/${it.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-sm tabular-nums text-muted-foreground">
                          {fmt(it.start_time)}
                        </span>
                        <div>
                          <p className="font-medium">{it.title}</p>
                          {it.location && (
                            <p className="text-sm text-muted-foreground">{it.location}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!it.visible_to_attendees && (
                          <Badge variant="secondary">hidden</Badge>
                        )}
                        <Badge variant="secondary">{it.category}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
