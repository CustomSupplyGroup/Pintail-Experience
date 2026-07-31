import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format integer cents as USD, dropping the ".00" on whole-dollar amounts. */
export function formatCents(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
}

/** Parse a dollar string ("2,400" or "2400.50") into integer cents, or null. */
export function dollarsToCents(input: string | null | undefined): number | null {
  if (input == null) return null
  const cleaned = input.replace(/[$,\s]/g, "").trim()
  if (cleaned === "") return null
  const dollars = Number(cleaned)
  if (Number.isNaN(dollars)) return null
  return Math.round(dollars * 100)
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
