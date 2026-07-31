import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { VendorForm } from "../vendor-form";
import { VendorContactForm, type VendorContact } from "../vendor-contact-form";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { deleteVendor, deleteVendorContact } from "../actions";

type Trip = {
  id: string;
  name: string;
  start_date: string | null;
  status: string;
};

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select(
      "id, name, slug, role, description, website_url, contact_name, contact_phone, logo_url, featured_photo_url, notes, featured",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("edit vendor: read failed", error.message);
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/vendors"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to vendors
        </Link>
        <div className="mt-2">
          <PageHeader title="Edit vendor" />
        </div>
        <EmptyState>Couldn&apos;t load this vendor: {error.message}</EmptyState>
      </div>
    );
  }

  if (!vendor) notFound();

  const { data: contactRows, error: contactsError } = await supabase
    .from("vendor_contacts")
    .select("id, name, role, email, phone, notes")
    .eq("vendor_id", id)
    .order("created_at", { ascending: true });
  if (contactsError) {
    console.error("edit vendor: contacts load failed", contactsError.message);
  }
  const contacts: VendorContact[] = contactRows ?? [];

  const { data: tripVendorRows, error: tripsError } = await supabase
    .from("trip_vendors")
    .select("role_on_trip, trips(id, name, start_date, status)")
    .eq("vendor_id", id);
  if (tripsError) {
    console.error("edit vendor: trip history load failed", tripsError.message);
  }
  const tripHistory = (tripVendorRows ?? [])
    .map((r) => ({
      role_on_trip: r.role_on_trip,
      trip: r.trips as Trip | null,
    }))
    .filter((r): r is { role_on_trip: string | null; trip: Trip } =>
      Boolean(r.trip),
    )
    .sort((a, b) =>
      (b.trip.start_date ?? "").localeCompare(a.trip.start_date ?? ""),
    );

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/vendors"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to vendors
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageHeader title={vendor.name} subtitle={vendor.role.replace(/_/g, " ")} />
        <form action={deleteVendor}>
          <input type="hidden" name="id" value={vendor.id} />
          <ConfirmSubmitButton
            variant="ghost"
            size="sm"
            className="mt-1 text-destructive"
            confirmText={`Delete "${vendor.name}"? This can't be undone.`}
          >
            Delete
          </ConfirmSubmitButton>
        </form>
      </div>

      <VendorForm vendor={vendor} />

      {/* Contacts */}
      <section className="mt-10">
        <h2 className="mb-3 font-heading text-xl italic tracking-tight">
          Contacts
        </h2>
        {contactsError ? (
          <EmptyState>
            Couldn&apos;t load contacts: {contactsError.message}
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {contacts.map((c) => (
              <div key={c.id} className="space-y-2">
                <VendorContactForm vendorId={vendor.id} contact={c} />
                <form action={deleteVendorContact} className="text-right">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="vendor_id" value={vendor.id} />
                  <ConfirmSubmitButton
                    variant="ghost"
                    size="xs"
                    className="text-destructive"
                    confirmText={`Remove contact "${c.name}"?`}
                  >
                    Remove contact
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No contacts yet — add the first below.
              </p>
            )}
            <div>
              <p className="mb-2 text-sm font-medium">Add a contact</p>
              <VendorContactForm vendorId={vendor.id} />
            </div>
          </div>
        )}
      </section>

      {/* Trip history */}
      <section className="mt-10">
        <h2 className="mb-3 font-heading text-xl italic tracking-tight">
          Trip history
        </h2>
        {tripsError ? (
          <EmptyState>
            Couldn&apos;t load trip history: {tripsError.message}
          </EmptyState>
        ) : tripHistory.length === 0 ? (
          <EmptyState>Not assigned to any trips yet.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {tripHistory.map(({ trip, role_on_trip }) => (
              <li key={trip.id}>
                <Link
                  href={`/admin/trips/${trip.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-primary"
                >
                  <div>
                    <p className="font-serif text-lg">{trip.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {trip.start_date ?? "Dates TBD"}
                      {role_on_trip ? ` · ${role_on_trip}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">{trip.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
