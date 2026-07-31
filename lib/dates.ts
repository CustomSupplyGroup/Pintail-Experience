// One place for date parsing/formatting. Bare `YYYY-MM-DD` values are parsed as
// LOCAL midnight (append T00:00:00) so countdowns and "current day" never land a
// day off for viewers west of UTC.

export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Whole days from today until `dateStr` (0 once it has arrived/passed). */
export function daysUntil(dateStr: string | null | undefined): number {
  const target = parseLocalDate(dateStr);
  if (!target) return 0;
  const ms = target.getTime() - startOfToday().getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** "Dec 30 – Jan 3, 2027" style range; year only on the end (or start if no end). */
export function fmtRange(
  start: string | null,
  end: string | null,
): string {
  const s = parseLocalDate(start);
  if (!s) return "Dates to come";
  const md: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const e = parseLocalDate(end);
  const left = s.toLocaleDateString("en-US", md);
  const right = e
    ? e.toLocaleDateString("en-US", { ...md, year: "numeric" })
    : s.toLocaleDateString("en-US", { year: "numeric" });
  return e ? `${left} – ${right}` : `${left}, ${right}`;
}

/** Long form: "December 30, 2026". */
export function fmtDate(dateStr: string | null): string {
  const d = parseLocalDate(dateStr);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * 1-based trip day for today, or null if today is outside [start, end].
 * Day 1 = start_date. If end is null, treats it as a single-day trip.
 */
export function currentTripDay(
  start: string | null,
  end: string | null,
): number | null {
  const s = parseLocalDate(start);
  if (!s) return null;
  const e = parseLocalDate(end) ?? s;
  const today = startOfToday();
  if (today.getTime() < s.getTime() || today.getTime() > e.getTime()) {
    return null;
  }
  return Math.floor((today.getTime() - s.getTime()) / 86_400_000) + 1;
}

/** True once today is past the trip's end date. */
export function isTripOver(end: string | null): boolean {
  const e = parseLocalDate(end);
  if (!e) return false;
  return startOfToday().getTime() > e.getTime();
}
