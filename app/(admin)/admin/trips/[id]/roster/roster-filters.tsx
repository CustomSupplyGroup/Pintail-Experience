"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn, formatCents } from "@/lib/utils";

export type PaymentStatus = "unpaid" | "deposit" | "paid_in_full" | "refunded";

export type RosterRow = {
  user_id: string;
  payment_status: PaymentStatus;
  amount_paid_cents: number;
  waiver_signed: boolean;
  dietary: string;
  full_name: string | null;
  email: string;
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  deposit: "Deposit",
  paid_in_full: "Paid",
  refunded: "Refunded",
};

const PAYMENT_VARIANT: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  unpaid: "destructive",
  deposit: "outline",
  paid_in_full: "default",
  refunded: "secondary",
};

type FilterKey = "all" | "paid_in_full" | "deposit" | "unpaid" | "unsigned";

const CHIPS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid_in_full", label: "Paid" },
  { key: "deposit", label: "Deposit" },
  { key: "unpaid", label: "Unpaid" },
  { key: "unsigned", label: "Unsigned" },
];

function matches(row: RosterRow, key: FilterKey): boolean {
  switch (key) {
    case "all":
      return true;
    case "unsigned":
      return !row.waiver_signed;
    default:
      return row.payment_status === key;
  }
}

export function RosterFilters({
  tripId,
  rows,
  priceCents,
}: {
  tripId: string;
  rows: RosterRow[];
  priceCents: number | null;
}) {
  const [active, setActive] = useState<FilterKey>("all");

  const counts = Object.fromEntries(
    CHIPS.map((c) => [c.key, rows.filter((r) => matches(r, c.key)).length]),
  ) as Record<FilterKey, number>;

  const visible = rows.filter((r) => matches(r, active));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 font-sans text-xs">
        {CHIPS.map((chip) => {
          // Hide empty chips — except "All", which always shows.
          if (chip.key !== "all" && counts[chip.key] === 0) return null;
          const isActive = active === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setActive(chip.key)}
              className={cn(
                "rounded-full border px-3 py-1 transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {chip.label} {counts[chip.key]}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Waiver</th>
              <th className="px-4 py-3 font-medium">Dietary</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr
                key={p.user_id}
                className="border-b border-border last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/trips/${tripId}/roster/${p.user_id}`}
                    className="font-medium hover:text-primary"
                  >
                    {p.full_name ?? "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={PAYMENT_VARIANT[p.payment_status]}>
                    {PAYMENT_LABEL[p.payment_status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {priceCents == null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    (() => {
                      const bal = Math.max(priceCents - p.amount_paid_cents, 0);
                      return (
                        <span className={bal === 0 ? "text-primary" : "text-amber-400"}>
                          {formatCents(p.amount_paid_cents)}
                          <span className="text-muted-foreground">
                            {" "}/ {formatCents(priceCents)}
                          </span>
                          {bal > 0 && (
                            <span className="block text-xs text-muted-foreground">
                              {formatCents(bal)} due
                            </span>
                          )}
                        </span>
                      );
                    })()
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.waiver_signed ? (
                    <Badge variant="default">Signed</Badge>
                  ) : (
                    <Badge variant="destructive">Not signed</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {p.dietary ? (
                    <span
                      className="text-amber-400"
                      title={p.dietary}
                      aria-label={`Dietary note: ${p.dietary}`}
                    >
                      ● {p.dietary.length > 24 ? `${p.dietary.slice(0, 24)}…` : p.dietary}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-muted-foreground"
                >
                  No one matches this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
