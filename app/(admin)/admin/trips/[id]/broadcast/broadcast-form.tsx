"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sendBroadcast, type BroadcastState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const initialState: BroadcastState = { ok: false, message: "" };

export function BroadcastForm({
  emailReady,
  tripId,
}: {
  emailReady: boolean;
  tripId: string;
}) {
  const [state, formAction, pending] = useActionState(
    sendBroadcast,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="trip_id" value={tripId} />
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Packing list is ready" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          name="body"
          rows={6}
          placeholder="Write your announcement…"
        />
      </div>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox name="send_email" disabled={!emailReady} className="mt-0.5" />
        <span className={emailReady ? "" : "text-muted-foreground"}>
          Also email every attendee
          {!emailReady && " (add RESEND_API_KEY to enable)"}
        </span>
      </label>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Posting…" : "Post announcement"}
      </Button>
    </form>
  );
}
