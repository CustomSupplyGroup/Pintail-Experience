"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { saveVendorContact, type ContactState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: ContactState = { ok: false, message: "" };

export type VendorContact = {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function VendorContactForm({
  vendorId,
  contact,
}: {
  vendorId: string;
  contact?: VendorContact;
}) {
  const [state, formAction, pending] = useActionState(
    saveVendorContact,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !contact;

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
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <input type="hidden" name="vendor_id" value={vendorId} />
      {contact && <input type="hidden" name="id" value={contact.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${contact?.id ?? "new"}`}>Name</Label>
          <Input
            id={`name-${contact?.id ?? "new"}`}
            name="name"
            defaultValue={contact?.name ?? ""}
            placeholder="Jane Whitfield"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`role-${contact?.id ?? "new"}`}>Role</Label>
          <Input
            id={`role-${contact?.id ?? "new"}`}
            name="role"
            defaultValue={contact?.role ?? ""}
            placeholder="Owner / Booking / Guide"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`email-${contact?.id ?? "new"}`}>Email</Label>
          <Input
            id={`email-${contact?.id ?? "new"}`}
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`phone-${contact?.id ?? "new"}`}>Phone</Label>
          <Input
            id={`phone-${contact?.id ?? "new"}`}
            name="phone"
            defaultValue={contact?.phone ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`notes-${contact?.id ?? "new"}`}>Notes</Label>
        <Textarea
          id={`notes-${contact?.id ?? "new"}`}
          name="notes"
          rows={2}
          defaultValue={contact?.notes ?? ""}
        />
      </div>

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : contact ? "Save contact" : "Add contact"}
      </Button>
    </form>
  );
}
