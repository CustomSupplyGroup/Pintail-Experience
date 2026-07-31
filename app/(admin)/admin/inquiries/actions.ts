"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireStaff, FORBIDDEN_STATE } from "@/lib/auth";
import type { Database } from "@/lib/database.types";

type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];

export type InquiryState = { ok: boolean; message: string };

const VALID: InquiryStatus[] = ["new", "contacted", "qualified", "closed"];

export async function updateInquiryStatus(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  try {
    await requireStaff();
  } catch {
    return FORBIDDEN_STATE;
  }

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Missing inquiry id." };

  const status = String(formData.get("status") ?? "") as InquiryStatus;
  if (!VALID.includes(status)) {
    return { ok: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("inquiry status update failed:", error.message);
    return { ok: false, message: `Couldn't update: ${error.message}` };
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/admin");
  return { ok: true, message: "Status updated." };
}
