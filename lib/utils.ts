import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Whole days from *now* until a bare `YYYY-MM-DD` date, counted in the viewer's
 * local timezone. Appending `T00:00:00` forces local-midnight parsing instead of
 * UTC-midnight, which otherwise makes the countdown a day off west of UTC.
 * Returns a non-negative integer (0 once the date has arrived/passed).
 */
export function daysUntilDate(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const target = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ms = target.getTime() - startOfToday.getTime()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}
