import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TripOverviewForm, type TripOverview } from "./trip-overview-form";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "manage", label: "Manage" },
  { key: "checklist", label: "Checklist" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Every one of these is scoped to THIS trip — the card owns them.
function areaLinks(id: string) {
  return [
    { href: `/admin/trips/${id}/roster`, label: "Roster", desc: "Attendees, payment, waivers, rooms" },
    { href: `/admin/trips/${id}/schedule`, label: "Schedule", desc: "Day-by-day agenda" },
    { href: `/admin/trips/${id}/vendors`, label: "Vendors", desc: "Assign from the master CRM" },
    { href: `/admin/trips/${id}/content`, label: "Content", desc: "Assign devotional & curriculum series" },
    { href: `/admin/trips/${id}/pages`, label: "Trip Info", desc: "Logistics & info pages" },
    { href: `/admin/trips/${id}/photos`, label: "Photos", desc: "Gallery uploads" },
    { href: `/admin/trips/${id}/broadcast`, label: "Broadcast", desc: "In-app + email announcements" },
  ];
}

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

export default async function TripWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab: TabKey = TABS.some((t) => t.key === tab)
    ? (tab as TabKey)
    : "overview";

  const supabase = await createClient();

  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      "id, name, location, start_date, end_date, status, planning_status, capacity, tagline, subtitle, planning_owner_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("trip workspace: read failed", error.message);
    return (
      <div>
        <Link
          href="/admin/trips"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to trips
        </Link>
        <div className="mt-2">
          <PageHeader title="Trip" />
        </div>
        <EmptyState>Couldn&apos;t load this trip: {error.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  let ownerName: string | null = null;
  if (trip.planning_owner_id) {
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", trip.planning_owner_id)
      .maybeSingle();
    if (ownerError) {
      console.error("trip workspace: owner load failed", ownerError.message);
    }
    ownerName = owner?.full_name ?? null;
  }

  // Derived checklist — all from existing data, no manual ticking.
  const [vendorCount, depositCount, roomCount, waiverCount, contentCount] =
    await Promise.all([
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

  const checklist = [
    { label: "Vendors assigned", done: vendorCount > 0, detail: `${vendorCount} assigned` },
    { label: "Deposits collected", done: depositCount > 0, detail: `${depositCount} paid` },
    { label: "Rooms assigned", done: roomCount > 0, detail: `${roomCount} assigned` },
    { label: "Waivers signed", done: waiverCount > 0, detail: `${waiverCount} signed` },
    { label: "Content scheduled", done: contentCount > 0, detail: `${contentCount} series` },
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
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/trips"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to trips
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <PageHeader
          title={trip.name}
          subtitle={`${ownerName ? `Owner: ${ownerName} · ` : ""}${trip.start_date ?? "Dates TBD"}`}
        />
      </div>
      <div className="-mt-4 mb-6 flex items-center gap-2">
        <Badge variant="secondary">{trip.planning_status}</Badge>
        <Badge variant={trip.status === "live" ? "default" : "outline"}>
          {trip.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Checklist {doneCount}/{checklist.length}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/trips/${id}?tab=${t.key}`}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm transition-colors",
              activeTab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "overview" && <TripOverviewForm trip={overview} />}

      {activeTab === "manage" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Everything below belongs to <span className="text-foreground">{trip.name}</span> —
            edits here apply only to this trip.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {areaLinks(id).map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  className="block rounded-lg border border-border p-4 transition-colors hover:border-primary"
                >
                  <p className="font-serif text-lg">{a.label}</p>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "checklist" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Derived live from this trip&apos;s data — no manual ticking. Fill in
            the areas under Manage and these light up on their own.
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
                    <span className="flex size-6 items-center justify-center rounded-full text-muted-foreground">
                      <Circle className="size-4" />
                    </span>
                  )}
                  <span className={cn("text-sm", c.done ? "" : "text-muted-foreground")}>
                    {c.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
