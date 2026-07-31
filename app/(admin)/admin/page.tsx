import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type UpcomingHunt = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number | null;
  filled: number;
};

function formatDates(start: string | null, end: string | null): string {
  if (!start) return "Dates TBD";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Total Members — the whole community.
  const { count: memberCount, error: membersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });
  if (membersError) {
    console.error("dashboard members count failed:", membersError.message);
  }

  // New Inquiries — leads that haven't been touched yet.
  const { count: newInquiryCount, error: inquiriesError } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  if (inquiriesError) {
    console.error("dashboard inquiries count failed:", inquiriesError.message);
  }

  // Upcoming Hunts — every trip that isn't in the past, with seats filled/left.
  const { data: trips, error: tripsError } = await supabase
    .from("trips")
    .select("id, name, start_date, end_date, capacity")
    .neq("status", "past")
    .order("start_date", { ascending: true });
  if (tripsError) {
    console.error("dashboard trips load failed:", tripsError.message);
  }

  const hunts: UpcomingHunt[] = [];
  for (const t of trips ?? []) {
    const { count, error: countError } = await supabase
      .from("trip_attendees")
      .select("*", { count: "exact", head: true })
      .eq("trip_id", t.id);
    if (countError) {
      console.error(
        `dashboard attendee count failed for ${t.id}:`,
        countError.message,
      );
    }
    hunts.push({
      id: t.id,
      name: t.name,
      start_date: t.start_date,
      end_date: t.end_date,
      capacity: t.capacity,
      filled: count ?? 0,
    });
  }

  return (
    <div>
      <PageHeader
        title="Control Room"
        subtitle="Everything you need to run The Pintail Experience."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Members */}
        <Link href="/admin/members">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Total Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">
                {membersError ? "—" : (memberCount ?? 0)}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* New Inquiries */}
        <Link href="/admin/inquiries">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                New Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">
                {inquiriesError ? "—" : (newInquiryCount ?? 0)}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Upcoming Hunts */}
        <Link href="/admin/hunts" className="md:col-span-1">
          <Card className="h-full transition-colors hover:border-primary">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Upcoming Hunts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">
                {tripsError ? "—" : hunts.length}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Hunts detail — seats filled / left per trip. */}
      <div className="mt-8">
        <h2 className="mb-3 font-heading text-xl italic tracking-tight">
          Upcoming Hunts
        </h2>
        {tripsError ? (
          <EmptyState>Couldn&apos;t load hunts: {tripsError.message}</EmptyState>
        ) : hunts.length === 0 ? (
          <EmptyState>No upcoming hunts on the books.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {hunts.map((h) => {
              const capacity = h.capacity ?? 0;
              const isFull = capacity > 0 && h.filled >= capacity;
              const seatsLeft = Math.max(capacity - h.filled, 0);
              return (
                <li key={h.id}>
                  <Link
                    href={`/admin/hunts/${h.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                  >
                    <div>
                      <p className="font-serif text-lg">{h.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDates(h.start_date, h.end_date)}
                      </p>
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
