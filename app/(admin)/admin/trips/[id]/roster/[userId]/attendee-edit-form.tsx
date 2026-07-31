"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  updateAttendee,
  sendPaymentReminder,
  type AttendeeState,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCents } from "@/lib/utils";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ROLES = ["attendee", "staff", "founder", "admin"];
const PAYMENT = ["unpaid", "deposit", "paid_in_full", "refunded"];

const initialState: AttendeeState = { ok: false, message: "" };

export function AttendeeEditForm({
  person,
  tripId,
  tripName,
  priceCents,
  payUrl,
  attendee,
}: {
  person: { id: string; full_name: string | null; role: string };
  tripId: string | null;
  tripName: string | null;
  priceCents: number | null;
  payUrl: string | null;
  attendee: {
    payment_status: string;
    amount_paid_cents: number;
    room_assignment: string | null;
    waiver_signed_at: string | null;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateAttendee,
    initialState,
  );
  const [reminderState, reminderAction, reminding] = useActionState(
    sendPaymentReminder,
    initialState,
  );

  // Live balance as the amount-paid field is edited.
  const [paidInput, setPaidInput] = useState(
    attendee ? String(attendee.amount_paid_cents / 100) : "",
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  useEffect(() => {
    if (reminderState.ok) toast.success(reminderState.message);
    else if (reminderState.message) toast.error(reminderState.message);
  }, [reminderState]);

  const paidCents = Math.round((Number(paidInput.replace(/[$,\s]/g, "")) || 0) * 100);
  const balanceCents =
    priceCents != null ? Math.max(priceCents - paidCents, 0) : null;

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
              {/* Payment */}
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="amount_paid">Amount paid ($)</Label>
                  <Input
                    id="amount_paid"
                    name="amount_paid"
                    inputMode="decimal"
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              {priceCents != null && (
                <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Trip total</span>
                    <span>{formatCents(priceCents)}</span>
                  </div>
                  <div className="mt-1 flex justify-between font-medium">
                    <span>Balance due</span>
                    <span className={balanceCents === 0 ? "text-primary" : "text-amber-400"}>
                      {formatCents(balanceCents)}
                    </span>
                  </div>
                </div>
              )}

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

        {/* Payment reminder — its own action so it doesn't save the form. */}
        {tripId && priceCents != null && balanceCents !== null && balanceCents > 0 && (
          <form action={reminderAction} className="mt-3 border-t border-border pt-3">
            <input type="hidden" name="user_id" value={person.id} />
            <input type="hidden" name="trip_id" value={tripId} />
            <Button
              type="submit"
              variant="outline"
              disabled={reminding}
              className="w-full"
            >
              {reminding ? "Sending…" : "Send payment reminder"}
            </Button>
            {!payUrl && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Add a payment link on the trip Overview so the email can include
                a pay button.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
