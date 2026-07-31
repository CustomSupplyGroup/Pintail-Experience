"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail, inquiryNotificationHtml } from "@/lib/email";

export type InquiryState = { ok: boolean; message: string };

const FROM_FALLBACK =
  process.env.RESEND_FROM_EMAIL ?? "hello@thepintailexperience.com";

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!name || !email) {
    return { ok: false, message: "Name and email are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert({
    name,
    email,
    phone,
    message,
    trip_interest: "the-pintail-experience",
  });

  if (error) {
    console.error("submitInquiry failed:", error.message);
    return { ok: false, message: "Something went wrong. Please try again." };
  }

  // Notify the founder. Non-fatal: a missing key or send failure must not turn a
  // saved lead into a visitor-facing error — log it and still say thanks.
  try {
    const to = process.env.INQUIRY_NOTIFY_TO ?? FROM_FALLBACK;
    const result = await sendEmail({
      to,
      subject: `New Pintail inquiry — ${name}`,
      html: inquiryNotificationHtml({ name, email, phone, message }),
    });
    if (!result.ok && !result.skipped) {
      console.error("inquiry notification failed to send:", result.error);
    }
  } catch (e) {
    console.error("inquiry notification threw:", e);
  }

  return {
    ok: true,
    message: "Thank you — we'll be in touch about future trips.",
  };
}
