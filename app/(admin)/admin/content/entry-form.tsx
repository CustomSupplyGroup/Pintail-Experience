"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveEntry, type ContentState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: ContentState = { ok: false, message: "" };

export type Entry = {
  id: string;
  title: string;
  day_offset: number | null;
  sort: number;
  body_md: string | null;
  scripture_reference: string | null;
  audio_mux_id: string | null;
  video_mux_id: string | null;
  discussion_questions: string[];
  published: boolean;
};

export function EntryForm({
  seriesId,
  entry,
}: {
  seriesId: string;
  entry?: Entry;
}) {
  const [state, formAction, pending] = useActionState(saveEntry, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !entry;
  const uid = entry?.id ?? "new";

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      if (isNew) formRef.current?.reset();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, isNew]);

  return (
    <form
      action={formAction}
      ref={formRef}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <input type="hidden" name="series_id" value={seriesId} />
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div className="grid gap-4 sm:grid-cols-[1fr_110px_110px]">
        <div className="space-y-2">
          <Label htmlFor={`title-${uid}`}>Title</Label>
          <Input
            id={`title-${uid}`}
            name="title"
            defaultValue={entry?.title ?? ""}
            placeholder="The weight of a calling"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`day_offset-${uid}`}>Day offset</Label>
          <Input
            id={`day_offset-${uid}`}
            name="day_offset"
            type="number"
            defaultValue={entry?.day_offset ?? ""}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`sort-${uid}`}>Sort</Label>
          <Input
            id={`sort-${uid}`}
            name="sort"
            type="number"
            defaultValue={entry?.sort ?? 0}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`scripture_reference-${uid}`}>Scripture reference</Label>
        <Input
          id={`scripture_reference-${uid}`}
          name="scripture_reference"
          defaultValue={entry?.scripture_reference ?? ""}
          placeholder="1 Kings 19:11-13"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`body_md-${uid}`}>Body (Markdown)</Label>
        <Textarea
          id={`body_md-${uid}`}
          name="body_md"
          rows={10}
          className="font-mono text-sm"
          defaultValue={entry?.body_md ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`discussion_questions-${uid}`}>
          Discussion questions (one per line)
        </Label>
        <Textarea
          id={`discussion_questions-${uid}`}
          name="discussion_questions"
          rows={3}
          defaultValue={(entry?.discussion_questions ?? []).join("\n")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`audio_mux_id-${uid}`}>Audio Mux ID</Label>
          <Input
            id={`audio_mux_id-${uid}`}
            name="audio_mux_id"
            defaultValue={entry?.audio_mux_id ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`video_mux_id-${uid}`}>Video Mux ID</Label>
          <Input
            id={`video_mux_id-${uid}`}
            name="video_mux_id"
            defaultValue={entry?.video_mux_id ?? ""}
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <Checkbox name="published" defaultChecked={entry?.published ?? false} />
        <span>Published (visible to attendees)</span>
      </label>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : entry ? "Save entry" : "Add entry"}
      </Button>
    </form>
  );
}
