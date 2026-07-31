"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { inviteAttendees, type InviteState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: InviteState = { ok: false, message: "" };

export function InviteForm({ tripId }: { tripId?: string | null }) {
  const [state, formAction, pending] = useActionState(
    inviteAttendees,
    initialState,
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {tripId && <input type="hidden" name="trip" value={tripId} />}
      <div className="space-y-2">
        <Label htmlFor="emails">Emails</Label>
        <Textarea
          id="emails"
          name="emails"
          rows={8}
          placeholder={"mark@example.com\nTrevor Smith <trevor@example.com>"}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending invites…" : "Send invites"}
      </Button>
    </form>
  );
}
