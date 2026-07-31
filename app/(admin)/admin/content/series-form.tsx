"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveSeries, type ContentState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const initialState: ContentState = { ok: false, message: "" };

export type Series = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
} | null;

export function SeriesForm({ series }: { series: Series }) {
  const [state, formAction, pending] = useActionState(saveSeries, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {series && <input type="hidden" name="id" value={series.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={series?.title ?? ""}
            placeholder="Dawn & Dominion"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kind">Kind</Label>
          <select
            id="kind"
            name="kind"
            defaultValue={series?.kind ?? "devotional"}
            className={selectClass}
          >
            <option value="devotional">devotional</option>
            <option value="curriculum">curriculum</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={series?.description ?? ""}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : series ? "Save series" : "Create series"}
      </Button>
    </form>
  );
}
