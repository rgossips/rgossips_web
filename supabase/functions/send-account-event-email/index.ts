// Sends a small set of pre-approved account-event emails (deactivation,
// deletion-pending, deletion-restored, etc.) to the caller's own
// mailbox. The caller's JWT is the source of truth for both identity
// and recipient — the request body only carries an event key, so the
// client can never specify an arbitrary recipient and abuse this as an
// open relay.
//
// Body: { event: "deactivated" | "deletion_pending" | "deletion_restored" | "reactivated", role?: "influencer" | "brand" }
// Auth: signed-in user (default JWT verification ON).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

type EventKey = "deactivated" | "deletion_pending" | "deletion_restored" | "reactivated";

interface Body {
  event: EventKey;
  role?: "influencer" | "brand";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // The default JWT verification means we get an Authorization header
  // with the user's token. Decode it with the anon-key client to pull
  // out the user record server-side — never trust a body-supplied userId.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing bearer token" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_DEFAULT_KEY") || "";

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const event = String(body?.event || "") as EventKey;
  const allowedEvents: EventKey[] = ["deactivated", "deletion_pending", "deletion_restored", "reactivated"];
  if (!allowedEvents.includes(event)) {
    return new Response(JSON.stringify({ error: "Unknown event" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  // Resolve the caller from their access token.
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const userId = userData?.user?.id || "";
  if (!userId) {
    return new Response(JSON.stringify({ error: "Could not resolve user from token" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Look up the email + display name from whichever profile table
  // matches the requested role (or both if not specified — first match
  // wins). The mailbox is server-derived; the client doesn't get to
  // pick.
  const role = body.role;
  let to = "";
  let displayName = "";
  let resolvedRole: "influencer" | "brand" | "" = "";
  if (!role || role === "influencer") {
    const { data } = await admin
      .from("influencer_profiles")
      .select("email, full_name")
      .eq("influencer_id", userId)
      .maybeSingle();
    if (data?.email) {
      to = data.email;
      displayName = data.full_name || "";
      resolvedRole = "influencer";
    }
  }
  if (!to && (!role || role === "brand")) {
    const { data } = await admin
      .from("brand_profiles")
      .select("contact_email, contact_name, brand_name")
      .eq("brand_id", userId)
      .maybeSingle();
    if (data?.contact_email) {
      to = data.contact_email;
      displayName = data.contact_name || data.brand_name || "";
      resolvedRole = "brand";
    }
  }
  if (!to) {
    // Fall back to auth.users.email (rare on phone-OTP signups).
    try {
      const authRes = await fetch(
        `${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
        {
          headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
        }
      );
      const u = await authRes.json();
      to = u?.email || "";
    } catch {}
  }
  if (!to) {
    // No email on file — nothing to send. Return success so the client
    // flow isn't blocked; the in-app action already happened.
    return new Response(JSON.stringify({ success: true, skipped: "no_email_on_file" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const firstName = (displayName || "").split(" ")[0] || "there";
  const isBrand = resolvedRole === "brand";
  const accountLabel = isBrand ? "brand account" : "account";

  // Pre-canned templates. Each event maps to a subject + body. CTA
  // optional — for deactivation we send users back to /login, for
  // pending deletion we point at the grievance mailbox.
  const tpl = (() => {
    switch (event) {
      case "deactivated":
        return {
          subject: `Your RGossips ${accountLabel} has been deactivated`,
          preheader: "Sign back in any time to reactivate.",
          title: `Hey ${firstName}, your ${accountLabel} is paused`,
          body: `<p>We've deactivated your RGossips ${accountLabel} as requested. Your profile is hidden, you'll stop receiving campaign / collaboration notifications, and your data is preserved for 30 days.</p>
                 <p>Want to come back? Sign in again with the same phone number and confirm reactivation — your profile, settings and history will be restored exactly as you left them.</p>
                 <p style="font-size:12px;color:#94a3b8;margin-top:18px;">If you didn't deactivate this account, reply to this email straight away.</p>`,
          ctaLabel: "Sign in to reactivate",
          ctaUrl: "https://rgossips.com/login",
        };
      case "deletion_pending":
        return {
          subject: `Your RGossips ${accountLabel} is scheduled for deletion`,
          preheader: "You have 30 days to change your mind.",
          title: `Hey ${firstName}, deletion is queued`,
          body: `<p>We've scheduled your RGossips ${accountLabel} for permanent deletion. Your profile is hidden today, and after a 30-day grace period we'll delete the account and associated data for good.</p>
                 <p>Changed your mind? Reply to this email or write to <a href="mailto:grievance@rgossips.com">grievance@rgossips.com</a> within 30 days and we'll restore your account.</p>
                 <p style="font-size:12px;color:#94a3b8;margin-top:18px;">After the 30-day window we cannot recover the account — this step is intentional.</p>`,
          ctaLabel: "Contact support",
          ctaUrl: "mailto:grievance@rgossips.com",
        };
      case "deletion_restored":
        return {
          subject: `Your RGossips ${accountLabel} has been restored`,
          preheader: "Welcome back.",
          title: `${firstName}, you're back`,
          body: `<p>We've cancelled the pending deletion on your RGossips ${accountLabel}. Your profile, history and settings are exactly where you left them.</p>`,
          ctaLabel: "Open dashboard",
          ctaUrl: isBrand ? "https://rgossips.com/brands" : "https://rgossips.com/influencer",
        };
      case "reactivated":
        return {
          subject: `Welcome back to RGossips`,
          preheader: "Your account is active again.",
          title: `${firstName}, you're back`,
          body: `<p>Your RGossips ${accountLabel} is active again. Pick up exactly where you left off — your profile, campaigns and history are unchanged.</p>`,
          ctaLabel: "Open dashboard",
          ctaUrl: isBrand ? "https://rgossips.com/brands" : "https://rgossips.com/influencer",
        };
    }
  })();

  await invokeSendEmail({
    to,
    subject: tpl.subject,
    html: renderEmailHtml({
      preheader: tpl.preheader,
      title: tpl.title,
      body: tpl.body,
      ctaLabel: tpl.ctaLabel,
      ctaUrl: tpl.ctaUrl,
    }),
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: jsonHeaders,
  });
});

// ── Shared email helpers ───────────────────────────────────────────────
// Mirrored from create-profile / stripe-webhook / razorpay-webhook. Keep
// in sync across all four files when the brand evolves.

async function invokeSendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}) {
  if (!opts.to) return;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.error("send-email skipped: missing SUPABASE_URL / SERVICE_ROLE_KEY");
      return;
    }
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(opts),
    });
    const data = await res.json();
    if (data?.error) console.error("send-email returned:", data.error);
  } catch (e) {
    console.error("send-email invocation failed:", (e as any)?.message);
  }
}

function renderEmailHtml(o: {
  preheader?: string;
  title: string;
  body: string;
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
          <div style="font-weight:900;font-size:18px;letter-spacing:-0.3px;color:#9810FA;margin-bottom:18px;">RGossips</div>
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
