"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type VendorRole = Database["public"]["Enums"]["vendor_role"];

export type VendorState = { ok: boolean; message: string };

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length ? v : null;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function saveVendor(
  _prev: VendorState,
  formData: FormData,
): Promise<VendorState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const supabase = await createClient();
  const id = str(formData, "id");

  const name = str(formData, "name");
  if (!name) return { ok: false, message: "Name is required." };

  const slug = str(formData, "slug") ?? slugify(name);

  const payload = {
    name,
    slug,
    role: String(formData.get("role") ?? "other") as VendorRole,
    description: str(formData, "description"),
    website_url: str(formData, "website_url"),
    contact_name: str(formData, "contact_name"),
    contact_phone: str(formData, "contact_phone"),
    logo_url: str(formData, "logo_url"),
    featured_photo_url: str(formData, "featured_photo_url"),
    featured: formData.get("featured") === "on",
  };

  if (id) {
    const { error } = await supabase.from("vendors").update(payload).eq("id", id);
    if (error) {
      console.error("vendor update failed:", error.message);
      return { ok: false, message: `Couldn't save: ${error.message}` };
    }
    revalidatePath("/admin/vendors");
    revalidatePath(`/admin/vendors/${id}`);
    revalidatePath(`/vendors/${slug}`);
    return { ok: true, message: "Vendor saved." };
  }

  const { data, error } = await supabase
    .from("vendors")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    console.error("vendor insert failed:", error.message);
    return { ok: false, message: `Couldn't create: ${error.message}` };
  }
  revalidatePath("/admin/vendors");
  redirect(`/admin/vendors/${data.id}`);
}

export async function deleteVendor(formData: FormData): Promise<void> {
  await requireStaff();
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) console.error("vendor delete failed:", error.message);
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}
