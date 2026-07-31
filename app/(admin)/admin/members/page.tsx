import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";

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
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("users")
    .select("id, full_name, email, photo_url, avatar_url, member_since")
    .order("full_name", { ascending: true });

  if (error) {
    return (
      <div>
        <PageHeader title="Members" />
        <EmptyState>Couldn&apos;t load members: {error.message}</EmptyState>
      </div>
    );
  }

  // Count how many trips each member is on.
  const { data: attendeeRows, error: attendeeError } = await supabase
    .from("trip_attendees")
    .select("user_id");
  if (attendeeError) {
    console.error("members: trip count load failed", attendeeError.message);
  }
  const tripCounts = new Map<string, number>();
  for (const row of attendeeRows ?? []) {
    tripCounts.set(row.user_id, (tripCounts.get(row.user_id) ?? 0) + 1);
  }

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="The Pintail community — everyone who's crossed the threshold."
      />

      {!users || users.length === 0 ? (
        <EmptyState>No members yet.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {users.map((u) => {
            const photo = u.photo_url ?? u.avatar_url;
            const trips = tripCounts.get(u.id) ?? 0;
            return (
              <li key={u.id}>
                <Link
                  href={`/admin/members/${u.id}`}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt=""
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {initials(u.full_name, u.email)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg">
                      {u.full_name ?? "Unnamed member"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <div className="hidden text-right text-sm text-muted-foreground sm:block">
                    <p>
                      {trips} {trips === 1 ? "trip" : "trips"}
                    </p>
                    <p className="text-xs">
                      Member since {formatMonth(u.member_since)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
