import { Resend } from "resend";

const FROM =
  process.env.RESEND_FROM_EMAIL ?? "The Pintail Experience <hello@thepintailexperience.com>";

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

/**
 * Sends an email via Resend. If RESEND_API_KEY isn't set, it logs and returns
 * { skipped: true } instead of throwing — so the rest of a flow still works
 * during the build phase before the key is added.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!emailConfigured()) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipped sending "${opts.subject}" to`,
      opts.to,
    );
    return { ok: false, skipped: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });

  if (error) {
    console.error("[email] send failed:", error);
    return { ok: false, error: String(error) };
  }
  return { ok: true };
}

// --- Branded templates -----------------------------------------------------

function shell(body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#1f2421;color:#eee7e0;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 28px;">
      <p style="text-align:center;color:#e5c188;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 24px;">The Pintail Experience</p>
      ${body}
      <hr style="border:none;border-top:1px solid rgba(140,106,63,.35);margin:32px 0;" />
      <p style="color:#c9bca8;font-size:12px;text-align:center;margin:0;">For the inspired sportsman.</p>
    </div>
  </body></html>`;
}

export function welcomeEmailHtml(opts: {
  name?: string | null;
  signInUrl: string;
}): string {
  return shell(`
    <h1 style="color:#eee7e0;font-size:26px;margin:0 0 16px;">Welcome${opts.name ? `, ${opts.name}` : ""}.</h1>
    <p style="font-size:16px;line-height:1.6;color:#eee7e0;">
      Your place on The Pintail Experience is confirmed. Set up your profile and
      add the app to your home screen — it'll carry the trip with you from today
      until long after we've left the blind.
    </p>
    <p style="text-align:center;margin:28px 0;">
      <a href="${opts.signInUrl}" style="background:#e5c188;color:#1f2421;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;display:inline-block;">Set up your profile</a>
    </p>`);
}

export function inquiryNotificationHtml(opts: {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
}): string {
  const row = (label: string, value: string) =>
    `<p style="font-size:15px;line-height:1.5;color:#eee7e0;margin:0 0 10px;">
       <span style="color:#e5c188;font-family:Arial,sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${label}</span><br/>${value}</p>`;
  return shell(`
    <h1 style="color:#eee7e0;font-size:24px;margin:0 0 20px;">New inquiry</h1>
    ${row("Name", opts.name)}
    ${row("Email", `<a href="mailto:${opts.email}" style="color:#e5c188;">${opts.email}</a>`)}
    ${opts.phone ? row("Phone", opts.phone) : ""}
    ${opts.message ? row("Message", opts.message.replace(/\n/g, "<br/>")) : ""}`);
}

export function paymentReminderHtml(opts: {
  name?: string | null;
  tripName: string;
  balanceLabel: string;
  paidLabel: string;
  totalLabel: string;
  payUrl?: string | null;
}): string {
  return shell(`
    <h1 style="color:#eee7e0;font-size:24px;margin:0 0 16px;">A note on your balance${opts.name ? `, ${opts.name}` : ""}</h1>
    <p style="font-size:16px;line-height:1.6;color:#eee7e0;">
      Thank you for joining us for <strong style="color:#e5c188;">${opts.tripName}</strong>.
      Here's where your payment stands:
    </p>
    <table style="width:100%;margin:20px 0;border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px;color:#eee7e0;">
      <tr><td style="padding:6px 0;color:#c9bca8;">Trip total</td><td style="padding:6px 0;text-align:right;">${opts.totalLabel}</td></tr>
      <tr><td style="padding:6px 0;color:#c9bca8;">Paid so far</td><td style="padding:6px 0;text-align:right;">${opts.paidLabel}</td></tr>
      <tr><td style="padding:10px 0 0;border-top:1px solid rgba(140,106,63,.35);color:#e5c188;font-weight:bold;">Balance due</td><td style="padding:10px 0 0;border-top:1px solid rgba(140,106,63,.35);text-align:right;color:#e5c188;font-weight:bold;">${opts.balanceLabel}</td></tr>
    </table>
    ${
      opts.payUrl
        ? `<p style="text-align:center;margin:28px 0;">
             <a href="${opts.payUrl}" style="background:#e5c188;color:#1f2421;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;display:inline-block;">Make a payment</a>
           </p>`
        : `<p style="font-size:15px;color:#c9bca8;">Reach out to the hosts to arrange your payment.</p>`
    }`);
}

export function broadcastEmailHtml(opts: {
  title: string;
  body: string;
}): string {
  const paragraphs = opts.body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="font-size:16px;line-height:1.6;color:#eee7e0;">${p.replace(/\n/g, "<br/>")}</p>`,
    )
    .join("");
  return shell(`
    <h1 style="color:#eee7e0;font-size:24px;margin:0 0 16px;">${opts.title}</h1>
    ${paragraphs}`);
}
