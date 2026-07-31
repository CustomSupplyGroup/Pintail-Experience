import { notFound } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { TripOverviewForm, type TripOverview } from "./trip-overview-form";

async function headCount(
  promise: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  label: string,
): Promise<number> {
  const { count, error } = await promise;
  if (error) {
    console.error(`trip checklist "${label}" failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

type ChecklistItem = {
  label: string;
  done: boolean;
  partial: boolean;
  detail: string;
};

export default async function TripWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, name, location, start_date, end_date, status, planning_status, capacity, tagline, subtitle, price_cents, deposit_cents, payment_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("trip workspace: read failed", error.message);
    return (
      <EmptyState>Couldn&apos;t load this trip: {error.message}</EmptyState>
    );
  }
  if (!trip) notFound();

  // Derived checklist — all from existing data, no manual ticking. Deposits,
  // rooms and waivers are judged against the enrolled roster (not just > 0).
  const [enrolled, vendorCount, depositCount, roomCount, waiverCount, contentCount] =
    await Promise.all([
      headCount(
        supabase
          .from("trip_attendees")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", id),
        "enrolled",
      ),
      headCount(
        supabase
          .from("trip_vendors")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", id),
        "vendors",
      ),
      headCount(
        supabase
          .from("trip_attendees")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", id)
          .in("payment_status", ["deposit", "paid_in_full"]),
        "deposits",
      ),
      headCount(
        supabase
          .from("trip_attendees")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", id)
          .not("room_assignment", "is", null),
        "rooms",
      ),
      headCount(
        supabase
          .from("trip_attendees")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", id)
          .not("waiver_signed_at", "is", null),
        "waivers",
      ),
      headCount(
        supabase
          .from("trip_content")
          .select("*", { count: "exact", head: true })
          .eq("trip_id", id),
        "content",
      ),
    ]);

  // A roster-judged row: green only when every enrolled attendee is covered,
  // amber while partway there.
  function rosterRow(label: string, count: number, verb: string): ChecklistItem {
    const done = enrolled > 0 && count >= enrolled;
    return {
      label,
      done,
      partial: count > 0 && !done,
      detail: `${count}/${enrolled} ${verb}`,
    };
  }

  const checklist: ChecklistItem[] = [
    rosterRow("Deposits collected", depositCount, "paid"),
    rosterRow("Rooms assigned", roomCount, "assigned"),
    rosterRow("Waivers signed", waiverCount, "signed"),
    {
      label: "Vendors assigned",
      done: vendorCount > 0,
      partial: false,
      detail: `${vendorCount} assigned`,
    },
    {
      label: "Content scheduled",
      done: contentCount > 0,
      partial: false,
      detail: `${contentCount} series`,
    },
  ];
  const doneCount = checklist.filter((c) => c.done).length;

  const overview: TripOverview = {
    id: trip.id,
    name: trip.name,
    location: trip.location,
    start_date: trip.start_date,
    end_date: trip.end_date,
    status: trip.status,
    planning_status: trip.planning_status,
    capacity: trip.capacity,
    tagline: trip.tagline,
    subtitle: trip.subtitle,
    price_cents: trip.price_cents,
    deposit_cents: trip.deposit_cents,
    payment_url: trip.payment_url,
  };

  return (
    <div className="max-w-3xl">
      <TripOverviewForm trip={overview} />

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-heading text-xl italic tracking-tight">
            Checklist
          </h2>
          <span className="text-xs text-muted-foreground">
            {doneCount}/{checklist.length}
          </span>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Derived live from this trip&apos;s data — no manual ticking. Deposits,
          rooms and waivers turn green only once every attendee is covered.
        </p>
        <ul className="space-y-2">
          {checklist.map((c) => (
            <li
              key={c.label}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="flex items-center gap-3">
                {c.done ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" />
                  </span>
                ) : (
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full",
                      c.partial ? "text-amber-400" : "text-muted-foreground",
                    )}
                  >
                    <Circle className="size-4" />
                  </span>
                )}
                <span
                  className={cn(
                    "text-sm",
                    c.done ? "" : c.partial ? "text-amber-400" : "text-muted-foreground",
                  )}
                >
                  {c.label}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs",
                  c.partial ? "text-amber-400" : "text-muted-foreground",
                )}
              >
                {c.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
