"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveVendor, type VendorState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ROLES = [
  "lodge",
  "dog_handler",
  "photographer",
  "leather_goods",
  "speaker",
  "other",
];

const initialState: VendorState = { ok: false, message: "" };

type Vendor = {
  id: string;
  name: string;
  slug: string;
  role: string;
  description: string | null;
  website_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  featured_photo_url: string | null;
  notes: string | null;
  featured: boolean;
} | null;

export function VendorForm({ vendor }: { vendor: Vendor }) {
  const [state, formAction, pending] = useActionState(saveVendor, initialState);

  useEffect(() => {
    if (state.ok) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      {vendor && <input type="hidden" name="id" value={vendor.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={vendor?.name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Type</Label>
          <select
            id="role"
            name="role"
            defaultValue={vendor?.role ?? "other"}
            className={selectClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug (optional — auto from name)</Label>
        <Input id="slug" name="slug" defaultValue={vendor?.slug ?? ""} placeholder="pine-hill-lodge" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea
          id="description"
          name="description"
          rows={6}
          defaultValue={vendor?.description ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input id="contact_name" name="contact_name" defaultValue={vendor?.contact_name ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact phone</Label>
          <Input id="contact_phone" name="contact_phone" defaultValue={vendor?.contact_phone ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website_url">Website URL</Label>
        <Input id="website_url" name="website_url" type="url" defaultValue={vendor?.website_url ?? ""} placeholder="https://" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input id="logo_url" name="logo_url" type="url" defaultValue={vendor?.logo_url ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="featured_photo_url">Hero photo URL</Label>
          <Input id="featured_photo_url" name="featured_photo_url" type="url" defaultValue={vendor?.featured_photo_url ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Internal notes (private)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={vendor?.notes ?? ""}
          placeholder="Anything the team should know — pricing, quirks, relationship history."
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <Checkbox name="featured" defaultChecked={vendor?.featured ?? false} />
        <span>Featured (show on the public marketing site)</span>
      </label>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : vendor ? "Save vendor" : "Create vendor"}
      </Button>
    </form>
  );
}
