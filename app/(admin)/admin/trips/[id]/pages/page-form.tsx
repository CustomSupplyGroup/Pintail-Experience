"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { savePage, type PageState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: PageState = { ok: false, message: "" };

type TripPage = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  sort_order: number;
  visible: boolean;
} | null;

export function PageForm({
  page,
  tripId,
}: {
  page: TripPage;
  tripId: string | null;
}) {
  const [state, formAction, pending] = useActionState(savePage, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {page && <input type="hidden" name="id" value={page.id} />}
      {tripId && <input type="hidden" name="trip_id" value={tripId} />}

      <div className="grid grid-cols-[1fr_120px] gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            defaultValue={page?.title ?? ""}
            placeholder="Packing list"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Order</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={page?.sort_order ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (optional — auto from title)</Label>
        <Input id="slug" name="slug" defaultValue={page?.slug ?? ""} placeholder="packing-list" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content (Markdown)</Label>
        <Textarea
          id="content"
          name="content"
          rows={16}
          className="font-mono text-sm"
          defaultValue={page?.content ?? ""}
          placeholder={"## What to bring\n\n- Waders\n- Warm layers\n- A good knife"}
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <Checkbox name="visible" defaultChecked={page?.visible ?? true} />
        <span>Visible to attendees</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : page ? "Save page" : "Create page"}
      </Button>
    </form>
  );
}
