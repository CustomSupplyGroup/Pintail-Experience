"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ScheduleItem = {
  id: string;
  start_time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
};

export type ScheduleDay = { day: number; items: ScheduleItem[] };

const CATEGORY_TONE: Record<string, string> = {
  hunt: "text-primary",
  teaching: "text-primary",
  meal: "text-muted-foreground",
  rest: "text-muted-foreground",
  travel: "text-muted-foreground",
  special: "text-primary",
};

function fmt(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const h12 = hour % 12 || 12;
  return `${h12}:${m}${ampm}`;
}

/** Minutes-since-midnight for a "HH:MM[:SS]" time, or null. */
function toMinutes(t: string | null): number | null {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// The viewer's local time as minutes-since-midnight, read hydration-safely:
// the server (and first client render) sees null, then the real clock takes
// over after hydration. Cached so getSnapshot stays stable across renders.
let nowCache: number | null = null;
function nowSnapshot(): number {
  if (nowCache === null) {
    const n = new Date();
    nowCache = n.getHours() * 60 + n.getMinutes();
  }
  return nowCache;
}
function useNowMinutes(): number | null {
  return useSyncExternalStore(
    () => () => {},
    nowSnapshot,
    () => null,
  );
}

export function ScheduleView({
  days,
  currentDay,
  isLive,
}: {
  days: ScheduleDay[];
  currentDay: number | null;
  isLive: boolean;
}) {
  // Auto-land on the current day when the trip is live; otherwise Day 1.
  const initialDay =
    isLive && currentDay != null && days.some((d) => d.day === currentDay)
      ? currentDay
      : (days[0]?.day ?? 1);
  const [selectedDay, setSelectedDay] = useState(initialDay);

  // Current local time — null on the server/first render, real clock after.
  const nowMinutes = useNowMinutes();

  const active = days.find((d) => d.day === selectedDay) ?? days[0];
  const viewingCurrentDay = isLive && currentDay === selectedDay;

  // Index of the "now" item: the last one whose time has started. The first
  // item at/after now is "next"; the one before it is "now".
  const nowIndex = useMemo(() => {
    if (!viewingCurrentDay || nowMinutes == null || !active) return -1;
    const mins = active.items.map((it) => toMinutes(it.start_time));
    const firstUpcoming = mins.findIndex((m) => m != null && m >= nowMinutes);
    if (firstUpcoming === -1) return active.items.length - 1; // all underway/past
    if (firstUpcoming === 0) return 0; // nothing has started yet
    return firstUpcoming - 1;
  }, [viewingCurrentDay, nowMinutes, active]);

  const goRelative = (delta: number) => {
    const idx = days.findIndex((d) => d.day === selectedDay);
    const next = days[idx + delta];
    if (next) setSelectedDay(next.day);
  };

  const touchStartX = useRef<number | null>(null);

  if (!active) return null;

  return (
    <div>
      {/* Sticky day tabs */}
      <div className="sticky top-0 z-10 -mx-6 mb-6 border-b border-border bg-background/95 px-6 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-5 overflow-x-auto">
          {days.map((d) => {
            const isActive = d.day === selectedDay;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDay(d.day)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "shrink-0 border-b-2 pb-1 text-[13px] font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                Day {d.day}
              </button>
            );
          })}
        </div>
      </div>

      <section
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? start) - start;
          if (Math.abs(dx) < 60) return;
          goRelative(dx < 0 ? 1 : -1);
        }}
      >
        <h2 className="mb-3 font-serif text-2xl text-primary">
          Day {active.day}
        </h2>
        <ul className="space-y-4">
          {active.items.map((it, i) => {
            const isNow = i === nowIndex;
            const isPast = viewingCurrentDay && nowIndex >= 0 && i < nowIndex;
            return (
              <li
                key={it.id}
                className={cn("flex gap-4", isPast && "opacity-60")}
              >
                <span className="flex w-20 shrink-0 items-center gap-1 pt-0.5 text-base font-medium tabular-nums text-muted-foreground">
                  {isNow && (
                    <span
                      aria-hidden="true"
                      className="inline-block size-1.5 shrink-0 rounded-full bg-pintail-ember"
                    />
                  )}
                  {fmt(it.start_time)}
                </span>
                <div className="border-l border-border pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-serif text-lg leading-tight">
                      {it.title}
                    </p>
                    {isNow && (
                      <span className="rounded-full bg-pintail-ember/15 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-pintail-ember">
                        Now
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={CATEGORY_TONE[it.category]}
                    >
                      {it.category}
                    </Badge>
                  </div>
                  {it.location && (
                    <p className="text-sm text-muted-foreground">
                      {it.location}
                    </p>
                  )}
                  {it.description && (
                    <p className="mt-1 text-sm text-foreground/80">
                      {it.description}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
