import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { RosterFilters, type PaymentStatus, type RosterRow } from "./roster-filters";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name, capacity, price_cents")
    .eq("id", id)
    .maybeSingle();

  if (tripError) {
    console.error("roster: trip read failed", tripError.message);
    return (
      <div>
        <PageHeader title="Roster" />
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: rows, error } = await supabase
    .from("trip_attendees")
    .select(
      "user_id, payment_status, amount_paid_cents, waiver_signed_at, dietary_notes, users(full_name, email)",
    )
    .eq("trip_id", trip.id);

  if (error) {
    console.error("roster: attendees read failed", error.message);
    return (
      <div>
        <PageHeader title="Roster" />
        <EmptyState>Couldn&apos;t load the roster: {error.message}</EmptyState>
      </div>
    );
  }

  const people: RosterRow[] = (rows ?? [])
    .map((r) => ({
      user_id: r.user_id,
      payment_status: r.payment_status as PaymentStatus,
      amount_paid_cents: r.amount_paid_cents ?? 0,
      waiver_signed: Boolean(r.waiver_signed_at),
      dietary: (r.dietary_notes ?? "").trim(),
      full_name:
        (r.users as { full_name: string | null } | null)?.full_name ?? null,
      email: (r.users as { email: string | null } | null)?.email ?? "—",
    }))
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <PageHeader
          title="Roster"
          subtitle={`${people.length} of ${trip.capacity ?? "—"} seats · ${trip.name}`}
        />
        <Link
          href={`/admin/invite?trip=${id}`}
          className={buttonVariants({ className: "mb-6" })}
        >
          Invite attendees
        </Link>
      </div>

      {people.length === 0 ? (
        <EmptyState>
          No one has been added yet. Attendees appear here once they&apos;re
          invited.
        </EmptyState>
      ) : (
        <RosterFilters
          tripId={id}
          rows={people}
          priceCents={trip.price_cents}
        />
      )}
    </div>
  );
}
