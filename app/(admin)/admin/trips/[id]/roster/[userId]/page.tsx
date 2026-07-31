import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendeeEditForm } from "./attendee-edit-form";

export default async function AttendeeDetailPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name, price_cents, payment_url")
    .eq("id", id)
    .maybeSingle();

  if (tripError) {
    console.error("attendee: trip read failed", tripError.message);
    return (
      <div>
        <Link
          href={`/admin/trips/${id}/roster`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to roster
        </Link>
        <div className="mt-2">
          <PageHeader title="Attendee" />
        </div>
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: person, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, phone, bio, intro_note")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("attendee fetch failed:", error.message);
    return (
      <div>
        <Link
          href={`/admin/trips/${id}/roster`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to roster
        </Link>
        <div className="mt-2">
          <PageHeader title="Attendee" />
        </div>
        <EmptyState>Couldn&apos;t load this attendee: {error.message}</EmptyState>
      </div>
    );
  }
  if (!person) notFound();

  const { data: attendee, error: attendeeError } = await supabase
    .from("trip_attendees")
    .select(
      "payment_status, amount_paid_cents, room_assignment, waiver_signed_at, shirt_size, jacket_size, hat_size, glove_size, boot_size, dietary_notes, prayer_request",
    )
    .eq("trip_id", trip.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (attendeeError) {
    console.error("attendee: trip_attendees read failed", attendeeError.message);
  }

  const sizes = [
    ["Shirt", attendee?.shirt_size],
    ["Jacket", attendee?.jacket_size],
    ["Hat", attendee?.hat_size],
    ["Glove", attendee?.glove_size],
    ["Boot", attendee?.boot_size],
  ].filter(([, v]) => v);

  return (
    <div>
      <Link
        href={`/admin/trips/${id}/roster`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to roster
      </Link>
      <div className="mt-2">
        <PageHeader title={person.full_name ?? "Attendee"} subtitle={person.email} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AttendeeEditForm
          person={person}
          tripId={trip.id}
          tripName={trip.name}
          priceCents={trip.price_cents}
          payUrl={trip.payment_url}
          attendee={
            attendee
              ? {
                  payment_status: attendee.payment_status,
                  amount_paid_cents: attendee.amount_paid_cents,
                  room_assignment: attendee.room_assignment,
                  waiver_signed_at: attendee.waiver_signed_at,
                }
              : null
          }
        />

        <div className="space-y-6">
          {person.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Bio
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{person.bio}</CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                Sizes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {sizes.length ? (
                <ul className="space-y-1">
                  {sizes.map(([label, value]) => (
                    <li key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span>{value}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Not provided yet.</p>
              )}
            </CardContent>
          </Card>

          {attendee?.dietary_notes && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="text-sm font-normal text-primary">
                  Dietary / allergies
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{attendee.dietary_notes}</CardContent>
            </Card>
          )}

          {attendee?.prayer_request && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  Prayer request
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm italic">
                {attendee.prayer_request}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
