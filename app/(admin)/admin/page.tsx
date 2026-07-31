import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { daysUntil } from "@/lib/dates";

type UpcomingHunt = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  filled: number;
  waiversSigned: number;
  roomsAssigned: number;
};

function formatDates(start: string | null, end: string | null): string {
  if (!start) return "Dates TBD";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

/** First name from a full name, or "—" when we don't have one. */
function firstName(full: string | null | undefined): string {
  const n = (full ?? "").trim().split(" ")[0];
  return n || "—";
}

/** "Mark, Trevor, John +2" — at most three names, then a "+K" overflow. */
function nameList(names: string[]): string {
  const shown = names.slice(0, 3).join(", ");
  const extra = names.length - 3;
  return extra > 0 ? `${shown} +${extra}` : shown;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Every trip that isn't in the past, soonest first. trips[0] is the one that
  // needs you next.
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id, name, start_date, end_date, capacity")
    .neq("status", "past")
    .order("start_date", { ascending: true });
  if (tripsError) {
    console.error("dashboard trips load failed:", tripsError.message);
  }
  const soonest = (trips ?? [])[0] ?? null;

  // New Inquiries — leads that haven't been touched yet.
  const { count: newInquiryCount, error: inquiriesError } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  if (inquiriesError) {
    console.error("dashboard inquiries count failed:", inquiriesError.message);
  }

  // Action-queue names for the soonest trip: who still owes money, who still
  // owes a waiver.
  const unpaidNames: string[] = [];
  const waiverNames: string[] = [];
  if (soonest) {
    const { data: attendees, error: attendeesError } = await supabase
      .from("trip_attendees")
      .select("payment_status, waiver_signed_at, users(full_name)")
      .eq("trip_id", soonest.id);
    if (attendeesError) {
      console.error(
        "dashboard action queue load failed:",
        attendeesError.message,
      );
    }
    for (const a of attendees ?? []) {
      const name = firstName(
        (a.users as { full_name: string | null } | null)?.full_name,
      );
      if (a.payment_status === "unpaid") unpaidNames.push(name);
      if (!a.waiver_signed_at) waiverNames.push(name);
    }
  }

  // Readiness fractions for the Upcoming Trips list — one grouped query.
  const tripIds = (trips ?? []).map((t) => t.id);
  const readinessByTrip = new Map<
    string,
    { filled: number; waivers: number; rooms: number }
  >();
  if (tripIds.length) {
    const { data: rows, error: rowsError } = await supabase
      .from("trip_attendees")
      .select("trip_id, waiver_signed_at, room_assignment")
      .in("trip_id", tripIds);
    if (rowsError) {
      console.error("dashboard readiness load failed:", rowsError.message);
    }
    for (const row of rows ?? []) {
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
  }

  const hunts: UpcomingHunt[] = (trips ?? []).map((t) => {
    const r = readinessByTrip.get(t.id);
    return {
      id: t.id,
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      capacity: t.capacity,
      filled: r?.filled ?? 0,
      waiversSigned: r?.waivers ?? 0,
      roomsAssigned: r?.rooms ?? 0,
    };
  });

  const inquiryCount = inquiriesError ? 0 : (newInquiryCount ?? 0);

  const queue = [
    unpaidNames.length > 0 && {
      key: "unpaid",
      href: `/admin/trips/${soonest?.id}/roster`,
      text: `${unpaidNames.length} unpaid`,
      names: nameList(unpaidNames),
    },
    waiverNames.length > 0 && {
      key: "waivers",
      href: `/admin/trips/${soonest?.id}/roster`,
      text: `${waiverNames.length} waivers outstanding`,
      names: nameList(waiverNames),
    },
    inquiryCount > 0 && {
      key: "inquiries",
      href: "/admin/inquiries",
      text: `${inquiryCount} new ${inquiryCount === 1 ? "inquiry" : "inquiries"}`,
      names: null,
    },
  ].filter(Boolean) as {
    key: string;
    href: string;
    text: string;
    names: string | null;
  }[];

  return (
    <div>
      <PageHeader
        title="Control Room"
        subtitle="Everything you need to run The Pintail Experience."
      />

      {/* Header stat — the countdown to the next trip. */}
      <div className="mb-8">
        {soonest ? (
          <p className="font-heading text-4xl italic tracking-tight">
            {daysUntil(soonest.start_date)}{" "}
            {daysUntil(soonest.start_date) === 1 ? "day" : "days"} to{" "}
            {soonest.name}
          </p>
        ) : (
          <p className="font-heading text-2xl italic tracking-tight text-muted-foreground">
            No trips on the calendar. Enjoy the quiet.
          </p>
        )}
      </div>

      {/* Action queue — the short list of things that need you today. */}
      <section className="mb-8">
        <h2 className="mb-3 font-heading text-xl italic tracking-tight">
          Action queue
        </h2>
        {queue.length === 0 ? (
          <EmptyState>All clear. Nothing needs you today.</EmptyState>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {queue.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="text-sm">
                    <span className="font-medium">{row.text}</span>
                    {row.names && (
                      <span className="text-muted-foreground"> — {row.names}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Upcoming Trips — seats filled and readiness per trip. */}
      <div>
        <h2 className="mb-3 font-heading text-xl italic tracking-tight">
          Upcoming Trips
        </h2>
        {tripsError ? (
          <EmptyState>Couldn&apos;t load trips: {tripsError.message}</EmptyState>
        ) : hunts.length === 0 ? (
          <EmptyState>No upcoming trips on the books.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {hunts.map((h) => {
              const capacity = h.capacity ?? 0;
              const isFull = capacity > 0 && h.filled >= capacity;
              const seatsLeft = Math.max(capacity - h.filled, 0);
              return (
                <li key={h.id}>
                  <Link
                    href={`/admin/trips/${h.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                  >
                    <div>
                      <p className="font-serif text-lg">{h.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDates(h.start_date, h.end_date)}
                      </p>
                      {h.filled > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Waivers {h.waiversSigned}/{h.filled} · Rooms{" "}
                          {h.roomsAssigned}/{h.filled}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {isFull ? (
                        <Badge variant="default">Full</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {capacity > 0 ? `${seatsLeft} seats open` : "No cap set"}
                        </Badge>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {h.filled}
                        {capacity > 0 ? ` / ${capacity}` : ""} filled
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
