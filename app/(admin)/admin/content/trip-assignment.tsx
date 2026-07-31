"use client";

import { useRef } from "react";
import {
  saveTripContentAssignment,
  removeTripContentAssignment,
} from "./actions";
import { Checkbox } from "@/components/ui/checkbox";

export type AssignableTrip = {
  id: string;
  name: string;
  start_date: string | null;
  assigned: boolean;
};

function TripToggle({
  seriesId,
  trip,
}: {
  seriesId: string;
  trip: AssignableTrip;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = trip.assigned
    ? removeTripContentAssignment
    : saveTripContentAssignment;

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="series_id" value={seriesId} />
      <input type="hidden" name="trip_id" value={trip.id} />
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:border-primary">
        <Checkbox
          defaultChecked={trip.assigned}
          onCheckedChange={() => formRef.current?.requestSubmit()}
        />
        <span className="flex-1">{trip.name}</span>
        <span className="text-xs text-muted-foreground">
          {trip.start_date ?? "Dates TBD"}
        </span>
      </label>
    </form>
  );
}

export function TripAssignmentList({
  seriesId,
  trips,
}: {
  seriesId: string;
  trips: AssignableTrip[];
}) {
  if (trips.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No trips to assign to yet.
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {trips.map((t) => (
        <TripToggle key={t.id} seriesId={seriesId} trip={t} />
      ))}
    </div>
  );
}
