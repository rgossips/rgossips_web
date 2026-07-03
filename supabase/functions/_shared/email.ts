// Shared branded-email helpers for edge functions.
//
// Pattern mirrors what create-profile / stripe-webhook / razorpay-webhook
// have inlined — a thin HTML wrapper + a fetch-to-send-email invocation.
// Consolidating into _shared/ so referral-event emails don't drift from
// the transactional look-and-feel over time.
//
// Import as:
//   import { sendBrandedEmail } from "../_shared/email.ts";
//
// The caller passes a Supabase admin client (SupabaseClient) + either a
// resolved email OR a userId (influencer / brand id) to look up. Errors
// are logged and swallowed — email must never break a webhook path.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

function renderEmailHtml(o: {
  preheader?: string;
  title: string;
  body: string; // HTML
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const cta =
    o.ctaUrl && o.ctaLabel
      ? `<div style="margin:28px 0 8px;">
           <a href="${o.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#9810FA,#E60076);color:#ffffff !important;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:14px;">${o.ctaLabel}</a>
         </div>`
      : "";
  const footer =
    o.footerNote ||
    "You're receiving this because you have an RGossips account. Questions? Just reply to this email.";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  ${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;visibility:hidden;">${o.preheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F7FB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #f1f5f9;border-radius:20px;padding:32px;">
        <tr><td>
          <div style="font-weight:900;font-size:18px;letter-spacing:-0.3px;background:linear-gradient(135deg,#9810FA,#E60076);-webkit-background-clip:text;background-clip:text;color:#9810FA;margin-bottom:18px;">RGossips</div>
          <h1 style="font-size:22px;font-weight:800;margin:0 0 14px;line-height:1.3;color:#0f172a;">${o.title}</h1>
          <div style="font-size:14px;line-height:1.65;color:#475569;">${o.body}</div>
          ${cta}
          <div style="font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:18px;margin-top:28px;line-height:1.6;">${footer}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function resolveEmail(admin: SupabaseClient, userId: string): Promise<string> {
  // Try influencer_profiles first, then brand_profiles, then auth.users.
  try {
    const { data: inf } = await admin
      .from("influencer_profiles")
      .select("email")
      .eq("influencer_id", userId)
      .maybeSingle();
    if (inf?.email) return inf.email;
  } catch { /* silent */ }
  try {
    const { data: br } = await admin
      .from("brand_profiles")
      .select("contact_email")
      .eq("brand_id", userId)
      .maybeSingle();
    if (br?.contact_email) return br.contact_email;
  } catch { /* silent */ }
  try {
    const authRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")!}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
      {
        headers: {
          apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        },
      }
    );
    const u = await authRes.json();
    if (u?.email) return u.email;
  } catch { /* silent */ }
  return "";
}

export async function sendBrandedEmail(
  admin: SupabaseClient,
  opts: {
    userId?: string;
    to?: string;
    subject: string;
    title: string;
    body: string; // HTML
    ctaLabel?: string;
    ctaPath?: string; // relative path — combined with https://rgossips.com
    preheader?: string;
  }
): Promise<void> {
  try {
    const to = opts.to || (opts.userId ? await resolveEmail(admin, opts.userId) : "");
    if (!to) return; // Silent skip — user has no email on file
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.error("sendBrandedEmail skipped: missing SUPABASE_URL / SERVICE_ROLE_KEY");
      return;
    }
    const ctaUrl = opts.ctaPath ? `https://rgossips.com${opts.ctaPath}` : undefined;
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify({
        to,
        subject: opts.subject,
        html: renderEmailHtml({
          preheader: opts.preheader || opts.subject,
          title: opts.title,
          body: opts.body,
          ctaLabel: opts.ctaLabel,
          ctaUrl,
        }),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.error) console.error("sendBrandedEmail send-email returned:", data.error);
  } catch (e) {
    console.error("sendBrandedEmail failed:", (e as any)?.message);
  }
}
