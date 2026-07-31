import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

function fmt(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return `${h12}:${m}${ampm}`;
}

const CATEGORY_TONE: Record<string, string> = {
  hunt: "text-primary",
  teaching: "text-primary",
  meal: "text-muted-foreground",
  rest: "text-muted-foreground",
  travel: "text-muted-foreground",
  special: "text-primary",
};

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("schedule_items")
    .select("id, day_number, start_time, title, description, location, category")
    .eq("visible_to_attendees", true)
    .order("day_number", { ascending: true })
    .order("start_time", { ascending: true, nullsFirst: true });

  const byDay = new Map<number, typeof items>();
  for (const it of items ?? []) {
    if (!byDay.has(it.day_number)) byDay.set(it.day_number, []);
    byDay.get(it.day_number)!.push(it);
  }

  return (
    <div>
      <PageHeader title="Schedule" subtitle="The run-of-show, day by day." />
      {error ? (
        <EmptyState>Couldn&apos;t load the schedule right now.</EmptyState>
      ) : !items || items.length === 0 ? (
        <EmptyState>The schedule will be published before the trip.</EmptyState>
      ) : (
        <div className="space-y-8">
          {[...byDay.entries()].map(([day, dayItems]) => (
            <section key={day}>
              <h2 className="mb-3 font-serif text-2xl text-primary">Day {day}</h2>
              <ul className="space-y-4">
                {dayItems!.map((it) => (
                  <li key={it.id} className="flex gap-4">
                    <span className="w-16 shrink-0 pt-0.5 text-sm tabular-nums text-muted-foreground">
                      {fmt(it.start_time)}
                    </span>
                    <div className="border-l border-border pl-4">
                      <div className="flex items-center gap-2">
                        <p className="font-serif text-lg leading-tight">
                          {it.title}
                        </p>
                        <Badge variant="secondary" className={CATEGORY_TONE[it.category]}>
                          {it.category}
                        </Badge>
                      </div>
                      {it.location && (
                        <p className="text-sm text-muted-foreground">{it.location}</p>
                      )}
                      {it.description && (
                        <p className="mt-1 text-sm text-foreground/80">
                          {it.description}
                        </p>
                      )}
                    </div>
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
