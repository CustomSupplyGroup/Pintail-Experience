import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { HuntOverviewForm, type HuntOverview } from "./hunt-overview-form";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "checklist", label: "Checklist" },
  { key: "areas", label: "Areas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AREA_LINKS = [
  { href: "/admin/schedule", label: "Schedule", desc: "Day-by-day agenda" },
  { href: "/admin/vendors", label: "Vendors", desc: "Pick from the master CRM" },
  { href: "/admin/roster", label: "Roster", desc: "Attendees, payment, waivers" },
  { href: "/admin/content", label: "Content", desc: "Assign devotional & curriculum series" },
  { href: "/admin/pages", label: "Trip Info", desc: "Logistics & info pages" },
  { href: "/admin/photos", label: "Photos", desc: "Gallery uploads" },
  { href: "/admin/broadcast", label: "Broadcast", desc: "Announcements & push" },
];

async function headCount(
  promise: PromiseLike<{ count: number | null; error: { message: string } | null }>,
  label: string,
): Promise<number> {
  const { count, error } = await promise;
  if (error) {
    console.error(`hunt checklist "${label}" failed:`, error.message);
    return 0;
  }
  return count ?? 0;
}

export default async function HuntWorkspacePage({
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
    console.error("hunt workspace: read failed", error.message);
    return (
      <div>
        <Link
          href="/admin/hunts"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to hunts
        </Link>
        <div className="mt-2">
          <PageHeader title="Hunt" />
        </div>
        <EmptyState>Couldn&apos;t load this hunt: {error.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  // Owner name.
  let ownerName: string | null = null;
  if (trip.planning_owner_id) {
    const { data: owner, error: ownerError } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", trip.planning_owner_id)
      .maybeSingle();
    if (ownerError) {
      console.error("hunt workspace: owner load failed", ownerError.message);
    }
    ownerName = owner?.full_name ?? null;
  }

  // Derived checklist — all from existing data, no new table.
  const [
    vendorCount,
    depositCount,
    roomCount,
    waiverCount,
    contentCount,
  ] = await Promise.all([
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

  const overview: HuntOverview = {
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
        href="/admin/hunts"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to hunts
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

      {/* Tabs (links with ?tab=) */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/hunts/${id}?tab=${t.key}`}
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

      {activeTab === "overview" && <HuntOverviewForm hunt={overview} />}

      {activeTab === "checklist" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Derived live from the trip&apos;s data — no manual ticking. Fill in
            the underlying areas and these light up on their own.
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
                  <span
                    className={cn(
                      "text-sm",
                      c.done ? "" : "text-muted-foreground",
                    )}
                  >
                    {c.label}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{c.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === "areas" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Jump into each area&apos;s editor. These operate on the active
            experience — set this hunt&apos;s visibility to{" "}
            <span className="text-foreground">live</span> to edit it here.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {AREA_LINKS.map((a) => (
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
    </div>
  );
}
