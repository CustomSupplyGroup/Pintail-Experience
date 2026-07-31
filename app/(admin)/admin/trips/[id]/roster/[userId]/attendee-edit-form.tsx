"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateAttendee, type AttendeeState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ROLES = ["attendee", "staff", "founder", "admin"];
const PAYMENT = ["unpaid", "deposit", "paid_in_full", "refunded"];

const initialState: AttendeeState = { ok: false, message: "" };

export function AttendeeEditForm({
  person,
  tripId,
  tripName,
  attendee,
}: {
  person: { id: string; full_name: string | null; role: string };
  tripId: string | null;
  tripName: string | null;
  attendee: {
    payment_status: string;
    room_assignment: string | null;
    waiver_signed_at: string | null;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateAttendee,
    initialState,
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Manage attendee</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="user_id" value={person.id} />
          {tripId && <input type="hidden" name="trip_id" value={tripId} />}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={person.full_name ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={person.role}
              className={selectClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {tripId ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment status</Label>
                <select
                  id="payment_status"
                  name="payment_status"
                  defaultValue={attendee?.payment_status ?? "unpaid"}
                  className={selectClass}
                >
                  {PAYMENT.map((p) => (
                    <option key={p} value={p}>
                      {p.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_assignment">Room assignment</Label>
                <Input
                  id="room_assignment"
                  name="room_assignment"
                  defaultValue={attendee?.room_assignment ?? ""}
                  placeholder="Cabin 2, bunk A"
                />
              </div>

              <label className="flex items-center gap-3 text-sm">
                <Checkbox
                  name="waiver_signed"
                  defaultChecked={Boolean(attendee?.waiver_signed_at)}
                />
                <span>
                  Waiver received
                  {attendee?.waiver_signed_at
                    ? ` (${new Date(attendee.waiver_signed_at).toLocaleDateString()})`
                    : ""}
                </span>
              </label>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active trip — trip details unavailable.
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {tripName && (
            <p className="text-center text-xs text-muted-foreground">
              Editing for {tripName}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
