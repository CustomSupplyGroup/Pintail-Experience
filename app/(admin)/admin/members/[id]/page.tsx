import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

type Trip = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

function initials(name: string | null, email: string): string {
  const source = (name ?? email).trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMonth(date: string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDates(start: string | null, end: string | null): string {
  if (!start) return "Dates TBD";
  if (!end || end === start) return start;
  return `${start} – ${end}`;
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("users")
    .select(
      "id, full_name, email, phone, city, bio, photo_url, avatar_url, member_since, role",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("member detail: read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/members"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to members
        </Link>
        <div className="mt-2">
          <PageHeader title="Member" />
        </div>
        <EmptyState>Couldn&apos;t load this member: {error.message}</EmptyState>
      </div>
    );
  }
  if (!member) notFound();

  const { data: attendeeRows, error: tripError } = await supabase
    .from("trip_attendees")
    .select(
      "payment_status, trips(id, name, start_date, end_date, status)",
    )
    .eq("user_id", id);
  if (tripError) {
    console.error("member detail: trip history failed", tripError.message);
  }

  const history = (attendeeRows ?? [])
    .map((r) => ({
      payment_status: String(r.payment_status),
      trip: r.trips as Trip | null,
    }))
    .filter((r): r is { payment_status: string; trip: Trip } => Boolean(r.trip))
    .sort((a, b) =>
      (b.trip.start_date ?? "").localeCompare(a.trip.start_date ?? ""),
    );

  const photo = member.photo_url ?? member.avatar_url;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/members"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to members
      </Link>

      <div className="mt-4 flex items-start gap-5">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            className="size-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-medium text-muted-foreground">
            {initials(member.full_name, member.email)}
          </span>
        )}
        <div>
          <h1 className="font-heading text-3xl italic tracking-tight">
            {member.full_name ?? "Unnamed member"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Member since {formatMonth(member.member_since)}
            {member.city ? ` · ${member.city}` : ""}
          </p>
          <Badge variant="secondary" className="mt-2">
            {member.role}
          </Badge>
        </div>
      </div>

      {member.bio && (
        <p className="mt-6 font-serif text-base leading-relaxed text-muted-foreground">
          {member.bio}
        </p>
      )}

      <div className="mt-6 grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Email
          </p>
          <p className="mt-1 text-sm">{member.email}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Phone
          </p>
          <p className="mt-1 text-sm">{member.phone ?? "—"}</p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 font-heading text-xl italic tracking-tight">
        Trip history
      </h2>
      {tripError ? (
        <EmptyState>Couldn&apos;t load trip history: {tripError.message}</EmptyState>
      ) : history.length === 0 ? (
        <EmptyState>Not on any trips yet.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {history.map(({ trip, payment_status }) => (
            <li key={trip.id}>
              <Link
                href={`/admin/trips/${trip.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
              >
                <div>
                  <p className="font-serif text-lg">{trip.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDates(trip.start_date, trip.end_date)}
                  </p>
                </div>
                <Badge variant="secondary">{payment_status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
