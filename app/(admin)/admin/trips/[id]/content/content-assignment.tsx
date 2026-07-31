"use client";

import { useRef } from "react";
import { assignContent, unassignContent } from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export type AssignableSeries = {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  assigned: boolean;
};

function SeriesToggle({
  tripId,
  series,
}: {
  tripId: string;
  series: AssignableSeries;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = series.assigned ? unassignContent : assignContent;

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="series_id" value={series.id} />
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary">
        <Checkbox
          defaultChecked={series.assigned}
          onCheckedChange={() => formRef.current?.requestSubmit()}
        />
        <span className="flex-1">
          <span className="font-medium">{series.title}</span>
          {series.description && (
            <span className="block text-xs text-muted-foreground">
              {series.description}
            </span>
          )}
        </span>
        <Badge variant="secondary">{series.kind}</Badge>
      </label>
    </form>
  );
}

export function ContentAssignmentList({
  tripId,
  series,
}: {
  tripId: string;
  series: AssignableSeries[];
}) {
  if (series.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No content series yet. Author one in the content library.
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {series.map((s) => (
        <SeriesToggle key={s.id} tripId={tripId} series={s} />
      ))}
    </div>
  );
}
