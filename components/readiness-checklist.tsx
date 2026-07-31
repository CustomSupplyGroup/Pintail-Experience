import Link from "next/link";
import { Check, ChevronRight, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ReadinessRow = {
  label: string;
  done: boolean;
  href: string;
  hint?: string;
};

/**
 * "Before you go" — Profile · Waiver · Payment (or whatever rows are passed).
 * Champagne check when done, bronze circle + chevron to the fix when pending.
 */
export function ReadinessChecklist({
  rows,
  title = "Before you go",
}: {
  rows: ReadinessRow[];
  title?: string;
}) {
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-sm font-normal text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        {rows.map((row) =>
          row.done ? (
            <div
              key={row.label}
              className="flex items-center gap-3 px-6 py-3 text-sm"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-4" />
              </span>
              <span className="flex-1">{row.label}</span>
              {row.hint && (
                <span className="text-xs text-muted-foreground">{row.hint}</span>
              )}
            </div>
          ) : (
            <Link
              key={row.label}
              href={row.href}
              className="flex items-center gap-3 px-6 py-3 text-sm transition-colors hover:bg-accent/40"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full text-pintail-bronze">
                <Circle className="size-4" />
              </span>
              <span className="flex-1">{row.label}</span>
              {row.hint && (
                <span className="text-xs text-muted-foreground">{row.hint}</span>
              )}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ),
        )}
      </CardContent>
    </Card>
  );
}
