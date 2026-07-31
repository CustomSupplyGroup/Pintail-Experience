"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { Card, CardContent } from "@/components/ui/card";

export type DevotionalCard = {
  id: string;
  title: string;
  scripture: string;
  hasAudio: boolean;
  position: number; // 1-based place in the full ordered series
};

// Read-state lives in localStorage, keyed by devotional id (no schema change).
// Modeled as an external store so reads are hydration-safe (server renders
// "unread") and a mark-read write re-renders every mounted list.
const READ_KEY = "pintail:devotionals-read";
const listeners = new Set<() => void>();

function readSnapshot(): string {
  try {
    return localStorage.getItem(READ_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function markReadStore(id: string) {
  const set = new Set<string>(JSON.parse(readSnapshot()) as string[]);
  if (set.has(id)) return;
  set.add(id);
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...set]));
  } catch {
    // Non-fatal — the dot just won't persist across sessions.
  }
  for (const l of listeners) l();
}

/**
 * The devotional list as a journey: a progress line toward the trip, a
 * "Day N of total" label per entry, and an ember unread dot until the member
 * opens it.
 */
export function DevotionalsJourney({
  cards,
  total,
  releasedCount,
  tripName,
}: {
  cards: DevotionalCard[];
  total: number;
  releasedCount: number;
  tripName: string;
}) {
  const raw = useSyncExternalStore(subscribe, readSnapshot, () => "[]");
  const readIds = useMemo(
    () => new Set<string>(JSON.parse(raw) as string[]),
    [raw],
  );

  const pct = total > 0 ? Math.round((releasedCount / total) * 100) : 0;

  return (
    <div>
      {/* Progress toward the trip */}
      <div className="mb-6">
        <div className="h-1 w-full overflow-hidden rounded-full bg-pintail-bronze/30">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 font-sans-ui text-xs text-muted-foreground">
          Day {releasedCount} of {total} on the road to {tripName}
        </p>
      </div>

      <ul className="space-y-3">
        {cards.map((d) => {
          const unread = !readIds.has(d.id);
          return (
            <li key={d.id}>
              <Link
                href={`/devotionals/${d.id}`}
                onClick={() => markReadStore(d.id)}
              >
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="pt-6">
                    <p className="font-sans-ui text-[11px] uppercase tracking-wide text-primary">
                      Day {d.position} of {total}
                    </p>
                    <p className="mt-1 flex items-center gap-2 font-serif text-xl">
                      {unread && (
                        <span
                          aria-hidden="true"
                          className="inline-block size-1.5 shrink-0 rounded-full bg-pintail-ember"
                        />
                      )}
                      {d.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      {d.scripture && <span>{d.scripture}</span>}
                      {d.hasAudio && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-pintail-bronze px-2 py-0.5 text-[0.7rem] text-pintail-champagne">
                          ▸ audio
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
