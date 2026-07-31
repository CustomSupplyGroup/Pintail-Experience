import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  VendorAssignmentList,
  type AssignableVendor,
} from "./vendor-assignment";

export default async function TripVendorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (tripError) {
    console.error("trip vendors: trip read failed", tripError.message);
    return (
      <div>
        <PageHeader title="Vendors" />
        <EmptyState>Couldn&apos;t load the trip: {tripError.message}</EmptyState>
      </div>
    );
  }
  if (!trip) notFound();

  const { data: vendors, error: vendorsError } = await supabase
    .from("vendors")
    .select("id, name, role")
    .order("name", { ascending: true });
  if (vendorsError) {
    console.error("trip vendors: vendors read failed", vendorsError.message);
    return (
      <div>
        <Link
          href={`/admin/trips/${id}?tab=manage`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Manage
        </Link>
        <div className="mt-2">
          <PageHeader title="Vendors" />
        </div>
        <EmptyState>Couldn&apos;t load vendors: {vendorsError.message}</EmptyState>
      </div>
    );
  }

  const { data: assigned, error: assignedError } = await supabase
    .from("trip_vendors")
    .select("vendor_id, role_on_trip")
    .eq("trip_id", trip.id);
  if (assignedError) {
    console.error("trip vendors: assignments read failed", assignedError.message);
  }

  const assignedMap = new Map<string, string | null>();
  for (const row of assigned ?? []) {
    assignedMap.set(row.vendor_id, row.role_on_trip);
  }

  const list: AssignableVendor[] = (vendors ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    role: v.role,
    assigned: assignedMap.has(v.id),
    role_on_trip: assignedMap.get(v.id) ?? null,
  }));

  return (
    <div>
      <Link
        href={`/admin/trips/${id}?tab=manage`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Manage
      </Link>
      <div className="mt-2 flex items-end justify-between gap-4">
        <PageHeader
          title="Vendors"
          subtitle={`Assign vendors to ${trip.name}. Toggle to add or remove.`}
        />
        <Link
          href="/admin/vendors"
          className={buttonVariants({ variant: "outline", className: "mb-6" })}
        >
          Edit vendor CRM
        </Link>
      </div>

      <VendorAssignmentList tripId={trip.id} vendors={list} />
    </div>
  );
}
