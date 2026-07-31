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

type TripCard = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  planning_status: PlanningStatus;
  owner: string | null;
  filled: number;
  waiversSigned: number;
  roomsAssigned: number;
};

function formatDates(start: string | null, end: string | null): string {
  if (!start) return "Dates TBD";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

export default async function TripsBoardPage() {
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
        <PageHeader title="Trips" />
        <EmptyState>Couldn&apos;t load trips: {error.message}</EmptyState>
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
      console.error("trips board: owners load failed", ownersError.message);
    }
    for (const o of owners ?? []) {
      if (o.full_name) ownerNames.set(o.id, o.full_name);
    }
  }

  // Attendee readiness per trip — one query, grouped in JS (cheap at this scale).
  const { data: attendeeRows, error: attendeeError } = await supabase
    .from("trip_attendees")
    .select("trip_id, waiver_signed_at, room_assignment");
  if (attendeeError) {
    console.error("trips board: attendee counts failed", attendeeError.message);
  }
  type Readiness = { filled: number; waivers: number; rooms: number };
  const readinessByTrip = new Map<string, Readiness>();
  for (const row of attendeeRows ?? []) {
    const r = readinessByTrip.get(row.trip_id) ?? {
      filled: 0,
      waivers: 0,
      rooms: 0,
    };
    r.filled += 1;
    if (row.waiver_signed_at) r.waivers += 1;
    if (row.room_assignment) r.rooms += 1;
    readinessByTrip.set(row.trip_id, r);
  }

  const cards: TripCard[] = (trips ?? []).map((t) => {
    const r = readinessByTrip.get(t.id);
    return {
      id: t.id,
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      capacity: t.capacity,
      planning_status: t.planning_status,
      owner: t.planning_owner_id
        ? (ownerNames.get(t.planning_owner_id) ?? null)
        : null,
      filled: r?.filled ?? 0,
      waiversSigned: r?.waivers ?? 0,
      roomsAssigned: r?.rooms ?? 0,
    };
  });

  return (
    <div>
      <PageHeader
        title="Trips"
        subtitle="Every trip as a card. Move it through the season from scoping to wrapped."
      />

      {cards.length === 0 ? (
        <EmptyState>No trips yet.</EmptyState>
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
                      <Link key={c.id} href={`/admin/trips/${c.id}`}>
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
                            {c.filled > 0 && (
                              <p>
                                Waivers {c.waiversSigned}/{c.filled} · Rooms{" "}
                                {c.roomsAssigned}/{c.filled}
                              </p>
                            )}
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
