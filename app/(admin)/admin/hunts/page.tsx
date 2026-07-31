import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";

type PlanningStatus = Database["public"]["Enums"]["planning_status"];

const COLUMNS: { status: PlanningStatus; label: string }[] = [
  { status: "scoping", label: "Scoping" },
  { status: "booked", label: "Booked" },
  { status: "prepping", label: "Prepping" },
  { status: "ready", label: "Ready" },
  { status: "live", label: "Live" },
  { status: "wrapped", label: "Wrapped" },
];

type HuntCard = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  planning_status: PlanningStatus;
  owner: string | null;
  filled: number;
};

function formatDates(start: string | null, end: string | null): string {
  if (!start) return "Dates TBD";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

export default async function HuntsBoardPage() {
  const supabase = await createClient();

  const { data: trips, error } = await supabase
    .from("trips")
    .select(
      "id, name, start_date, end_date, capacity, planning_status, planning_owner_id",
    )
    .order("start_date", { ascending: true });

  if (error) {
    return (
      <div>
        <PageHeader title="Hunts" />
        <EmptyState>Couldn&apos;t load hunts: {error.message}</EmptyState>
      </div>
    );
  }

  // Owner names.
  const ownerIds = [
    ...new Set(
      (trips ?? [])
        .map((t) => t.planning_owner_id)
        .filter((v): v is string => Boolean(v)),
    ),
  ];
  const ownerNames = new Map<string, string>();
  if (ownerIds.length) {
    const { data: owners, error: ownersError } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", ownerIds);
    if (ownersError) {
      console.error("hunts board: owners load failed", ownersError.message);
    }
    for (const o of owners ?? []) {
      if (o.full_name) ownerNames.set(o.id, o.full_name);
    }
  }

  // Attendee counts per trip.
  const { data: attendeeRows, error: attendeeError } = await supabase
    .from("trip_attendees")
    .select("trip_id");
  if (attendeeError) {
    console.error("hunts board: attendee counts failed", attendeeError.message);
  }
  const filledByTrip = new Map<string, number>();
  for (const row of attendeeRows ?? []) {
    filledByTrip.set(row.trip_id, (filledByTrip.get(row.trip_id) ?? 0) + 1);
  }

  const cards: HuntCard[] = (trips ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    start_date: t.start_date,
    end_date: t.end_date,
    capacity: t.capacity,
    planning_status: t.planning_status,
    owner: t.planning_owner_id
      ? (ownerNames.get(t.planning_owner_id) ?? null)
      : null,
    filled: filledByTrip.get(t.id) ?? 0,
  }));

  return (
    <div>
      <PageHeader
        title="Hunts"
        subtitle="Every trip as a card. Drag it through the season from scoping to wrapped."
      />

      {cards.length === 0 ? (
        <EmptyState>No hunts yet.</EmptyState>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const columnCards = cards.filter(
              (c) => c.planning_status === col.status,
            );
            return (
              <div key={col.status} className="w-64 shrink-0">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {columnCards.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnCards.map((c) => {
                    const capacity = c.capacity ?? 0;
                    const isFull = capacity > 0 && c.filled >= capacity;
                    return (
                      <Link key={c.id} href={`/admin/hunts/${c.id}`}>
                        <Card
                          size="sm"
                          className="transition-colors hover:ring-primary"
                        >
                          <CardHeader>
                            <CardTitle className="font-serif text-base not-italic">
                              {c.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-xs text-muted-foreground">
                            <p>{formatDates(c.start_date, c.end_date)}</p>
                            <p>Owner: {c.owner ?? "Unassigned"}</p>
                            <p className={isFull ? "text-primary" : ""}>
                              {c.filled}
                              {capacity > 0 ? ` / ${capacity}` : ""} seats
                              {isFull ? " · Full" : ""}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                  {columnCards.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
