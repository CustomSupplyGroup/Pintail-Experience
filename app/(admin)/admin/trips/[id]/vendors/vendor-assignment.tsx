"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  assignVendor,
  unassignVendor,
  saveVendorRole,
  type VendorRoleState,
} from "./actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type AssignableVendor = {
  id: string;
  name: string;
  role: string;
  assigned: boolean;
  role_on_trip: string | null;
};

const initialRoleState: VendorRoleState = { ok: false, message: "" };

function RoleForm({
  tripId,
  vendor,
}: {
  tripId: string;
  vendor: AssignableVendor;
}) {
  const [state, formAction, pending] = useActionState(
    saveVendorRole,
    initialRoleState,
  );

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="mt-3 flex items-end gap-2">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="vendor_id" value={vendor.id} />
      <div className="flex-1 space-y-1">
        <label
          htmlFor={`role_on_trip_${vendor.id}`}
          className="text-xs text-muted-foreground"
        >
          Role on this trip
        </label>
        <Input
          id={`role_on_trip_${vendor.id}`}
          name="role_on_trip"
          defaultValue={vendor.role_on_trip ?? ""}
          placeholder="Lead guide, photographer…"
        />
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

function VendorRow({
  tripId,
  vendor,
}: {
  tripId: string;
  vendor: AssignableVendor;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  // Controlled so a declined unassign confirm leaves the box visually checked.
  const [checked, setChecked] = useState(vendor.assigned);
  const action = vendor.assigned ? unassignVendor : assignVendor;

  return (
    <div className="rounded-lg border border-border p-3">
      <form action={action} ref={formRef}>
        <input type="hidden" name="trip_id" value={tripId} />
        <input type="hidden" name="vendor_id" value={vendor.id} />
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <Checkbox
            checked={checked}
            onCheckedChange={(next) => {
              // Unassigning is the destructive path — confirm before removing.
              if (
                vendor.assigned &&
                next === false &&
                !window.confirm(`Remove ${vendor.name} from this trip?`)
              ) {
                return;
              }
              setChecked(next === true);
              formRef.current?.requestSubmit();
            }}
          />
          <span className="flex-1 font-medium">{vendor.name}</span>
          <Badge variant="secondary">{vendor.role.replace(/_/g, " ")}</Badge>
        </label>
      </form>
      {vendor.assigned && <RoleForm tripId={tripId} vendor={vendor} />}
    </div>
  );
}

export function VendorAssignmentList({
  tripId,
  vendors,
}: {
  tripId: string;
  vendors: AssignableVendor[];
}) {
  if (vendors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No vendors in the master list yet.
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {vendors.map((v) => (
        <VendorRow key={v.id} tripId={tripId} vendor={v} />
      ))}
    </div>
  );
}
