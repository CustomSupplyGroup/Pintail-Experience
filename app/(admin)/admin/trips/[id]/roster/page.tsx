import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

type PaymentStatus = "unpaid" | "deposit" | "paid_in_full" | "refunded";

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  deposit: "Deposit",
  paid_in_full: "Paid",
  refunded: "Refunded",
};

const PAYMENT_VARIANT: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  unpaid: "destructive",
  deposit: "outline",
  paid_in_full: "default",
  refunded: "secondary",
};

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name, capacity")
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
      "user_id, payment_status, waiver_signed_at, dietary_notes, users(full_name, email)",
    )
    .eq("trip_id", trip.id);

  if (error) {
    console.error("roster: attendees read failed", error.message);
    return (
      <div>
        <Link
          href={`/admin/trips/${id}?tab=manage`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Manage
        </Link>
        <div className="mt-2">
          <PageHeader title="Roster" />
        </div>
        <EmptyState>Couldn&apos;t load the roster: {error.message}</EmptyState>
      </div>
    );
  }

  const people = (rows ?? [])
    .map((r) => ({
      user_id: r.user_id,
      payment_status: r.payment_status as PaymentStatus,
      waiver_signed: Boolean(r.waiver_signed_at),
      dietary: (r.dietary_notes ?? "").trim(),
      full_name:
        (r.users as { full_name: string | null } | null)?.full_name ?? null,
      email: (r.users as { email: string | null } | null)?.email ?? "—",
    }))
    .sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));

  return (
    <div>
      <Link
        href={`/admin/trips/${id}?tab=manage`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Manage
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <PageHeader
          title="Roster"
          subtitle={`${people.length} of ${trip.capacity ?? "—"} seats · ${trip.name}`}
        />
        <Link
          href="/admin/invite"
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Waiver</th>
                <th className="px-4 py-3 font-medium">Dietary</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr
                  key={p.user_id}
                  className="border-b border-border last:border-0 hover:bg-accent/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/trips/${id}/roster/${p.user_id}`}
                      className="font-medium hover:text-primary"
                    >
                      {p.full_name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={PAYMENT_VARIANT[p.payment_status]}>
                      {PAYMENT_LABEL[p.payment_status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {p.waiver_signed ? (
                      <Badge variant="default">Signed</Badge>
                    ) : (
                      <Badge variant="destructive">Not signed</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.dietary ? (
                      <span
                        className="text-amber-400"
                        title={p.dietary}
                        aria-label={`Dietary note: ${p.dietary}`}
                      >
                        ● {p.dietary.length > 24 ? `${p.dietary.slice(0, 24)}…` : p.dietary}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
