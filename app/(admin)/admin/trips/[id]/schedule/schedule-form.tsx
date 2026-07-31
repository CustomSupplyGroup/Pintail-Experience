"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveScheduleItem, type ScheduleState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const CATEGORIES = ["hunt", "meal", "teaching", "rest", "travel", "special"];

const initialState: ScheduleState = { ok: false, message: "" };

type Item = {
  id: string;
  day_number: number;
  start_time: string | null;
  end_time: string | null;
  title: string;
  description: string | null;
  location: string | null;
  category: string;
  visible_to_attendees: boolean;
} | null;

function hhmm(t: string | null): string {
  return t ? t.slice(0, 5) : "";
}

export function ScheduleForm({
  item,
  tripId,
}: {
  item: Item;
  tripId: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    saveScheduleItem,
    initialState,
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      {tripId && <input type="hidden" name="trip_id" value={tripId} />}

      <div className="grid grid-cols-[100px_1fr] gap-4">
        <div className="space-y-2">
          <Label htmlFor="day_number">Day</Label>
          <Input
            id="day_number"
            name="day_number"
            type="number"
            min={1}
            defaultValue={item?.day_number ?? 1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={item?.title ?? ""} placeholder="Morning hunt" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start</Label>
          <Input id="start_time" name="start_time" type="time" defaultValue={hhmm(item?.start_time ?? null)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End</Label>
          <Input id="end_time" name="end_time" type="time" defaultValue={hhmm(item?.end_time ?? null)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={item?.category ?? "special"}
            className={selectClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" defaultValue={item?.location ?? ""} placeholder="North blind" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={item?.description ?? ""}
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <Checkbox
          name="visible_to_attendees"
          defaultChecked={item?.visible_to_attendees ?? true}
        />
        <span>Visible to attendees</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : item ? "Save item" : "Add item"}
      </Button>
    </form>
  );
}
