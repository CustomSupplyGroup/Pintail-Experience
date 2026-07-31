"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// One shared tab row for every trip-scoped page. Overview is the trip root;
// the rest hang off it. Trip Info lives at /pages for historical reasons.
const SECTIONS = [
  { label: "Overview", segment: "" },
  { label: "Roster", segment: "roster" },
  { label: "Schedule", segment: "schedule" },
  { label: "Vendors", segment: "vendors" },
  { label: "Content", segment: "content" },
  { label: "Trip Info", segment: "pages" },
  { label: "Photos", segment: "photos" },
  { label: "Broadcast", segment: "broadcast" },
] as const;

export function TripTabs({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const base = `/admin/trips/${tripId}`;

  return (
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {SECTIONS.map((s) => {
        const href = s.segment ? `${base}/${s.segment}` : base;
        const active = s.segment
          ? pathname.startsWith(`${base}/${s.segment}`)
          : pathname === base;
        return (
          <Link
            key={s.label}
            href={href}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
