import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Back-compat alias — date logic now lives in lib/dates.ts (single source).
export { daysUntil as daysUntilDate } from "./dates"

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

