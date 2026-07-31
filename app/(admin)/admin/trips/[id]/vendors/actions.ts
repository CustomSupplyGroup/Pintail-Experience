"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";

export async function assignVendor(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const tripId = String(formData.get("trip_id") ?? "");
  const vendorId = String(formData.get("vendor_id") ?? "");
  if (!tripId || !vendorId) return;
  const { error } = await supabase
    .from("trip_vendors")
    .upsert(
      { trip_id: tripId, vendor_id: vendorId },
      { onConflict: "trip_id,vendor_id" },
    );
  if (error) console.error("assignVendor failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/vendors`);
}

export async function unassignVendor(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const tripId = String(formData.get("trip_id") ?? "");
  const vendorId = String(formData.get("vendor_id") ?? "");
  if (!tripId || !vendorId) return;
  const { error } = await supabase
    .from("trip_vendors")
    .delete()
    .eq("trip_id", tripId)
    .eq("vendor_id", vendorId);
  if (error) console.error("unassignVendor failed:", error.message);
  revalidatePath(`/admin/trips/${tripId}/vendors`);
}

export type VendorRoleState = { ok: boolean; message: string };

export async function saveVendorRole(
  _prev: VendorRoleState,
  formData: FormData,
): Promise<VendorRoleState> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, message: "You don't have access to do that." };
  }
  const supabase = await createClient();
  const tripId = String(formData.get("trip_id") ?? "");
  const vendorId = String(formData.get("vendor_id") ?? "");
  if (!tripId || !vendorId) return { ok: false, message: "Missing vendor." };

  const roleOnTrip = String(formData.get("role_on_trip") ?? "").trim() || null;
  const { error } = await supabase
    .from("trip_vendors")
    .update({ role_on_trip: roleOnTrip })
    .eq("trip_id", tripId)
    .eq("vendor_id", vendorId);
  if (error) {
    console.error("saveVendorRole failed:", error.message);
    return { ok: false, message: `Couldn't save: ${error.message}` };
  }
  revalidatePath(`/admin/trips/${tripId}/vendors`);
  return { ok: true, message: "Role saved." };
}
