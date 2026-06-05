// SMTP-based email sender. Routes everything through the Hostinger SMTP
// account (smtp.hostinger.com:465, SMTPS). Other edge functions invoke
// this with { to, subject, html / text } when they need to fire off a
// transactional email — welcome / OTP / payment receipt / campaign
// notification etc. Credentials live exclusively in Supabase Edge
// Function secrets, never in client code.
//
// Required secrets (Supabase Dashboard → Edge Functions → Manage Secrets):
//   SMTP_HOST         e.g. smtp.hostinger.com
//   SMTP_PORT         e.g. 465
//   SMTP_USER         e.g. no-reply@rgossips.com
//   SMTP_PASS         e.g. ************
//   SMTP_FROM_EMAIL   e.g. no-reply@rgossips.com  (optional — falls back to SMTP_USER)
//   SMTP_FROM_NAME    e.g. RGossips               (optional — falls back to "RGossips")
//   SMTP_TLS          "1" to force STARTTLS on port 587 (default: implicit SSL/TLS on 465)
//
// Request body (POST JSON):
//   {
//     to: string | string[],
//     subject: string,
//     html?: string,
//     text?: string,
//     cc?: string | string[],
//     bcc?: string | string[],
//     replyTo?: string,
//     fromName?: string,    // override the display name for one-off branded emails
//   }
//
// Deploy with default JWT verification ON so anonymous callers can't
// abuse it as an open relay. Other edge functions pass the service
// role key in Authorization to invoke. The client never calls this
// directly — it goes through specific feature endpoints (e.g.
// notifications, welcome) that internally invoke send-email.

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

interface SendEmailBody {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  fromName?: string;
}

function asList(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v.filter(Boolean) : [v];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "POST only" }),
      { status: 200, headers: jsonHeaders }
    );
  }

  let body: SendEmailBody;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 200, headers: jsonHeaders }
    );
  }

  const { to, subject, html, text, cc, bcc, replyTo, fromName } = body;

  if (!to || !subject || (!html && !text)) {
    return new Response(
      JSON.stringify({ error: "to, subject and one of html/text are required" }),
      { status: 200, headers: jsonHeaders }
    );
  }

  const host = Deno.env.get("SMTP_HOST");
  const portStr = Deno.env.get("SMTP_PORT");
  const user = Deno.env.get("SMTP_USER");
  const pass = Deno.env.get("SMTP_PASS");
  if (!host || !portStr || !user || !pass) {
    console.error("send-email missing SMTP_* secrets");
    return new Response(
      JSON.stringify({
        error: "Email is not configured on the server. Set SMTP_HOST/PORT/USER/PASS.",
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
  const port = Number(portStr);
  // 465 → implicit SSL/TLS. 587 → STARTTLS. Anything else respects the
  // SMTP_TLS=1 env to force STARTTLS even on non-standard ports.
  const useImplicitTls = port === 465 || Deno.env.get("SMTP_TLS") !== "1";

  const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || user;
  const fromDisplay = fromName || Deno.env.get("SMTP_FROM_NAME") || "RGossips";

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: useImplicitTls,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({
      from: `${fromDisplay} <${fromEmail}>`,
      to: asList(to)!,
      cc: asList(cc),
      bcc: asList(bcc),
      replyTo: replyTo || undefined,
      subject,
      // denomailer treats html + content as two separate alternatives.
      // If we only have HTML and no plain-text fallback, derive a
      // crude text version so non-HTML clients (and spam filters that
      // penalise HTML-only) still get something readable.
      content: text || (html ? stripHtml(html) : ""),
      html: html || undefined,
    });
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    const msg = (err as any)?.message || String(err);
    console.error("send-email SMTP failure:", msg);
    return new Response(
      JSON.stringify({ error: "Failed to send email: " + msg }),
      { status: 200, headers: jsonHeaders }
    );
  } finally {
    try { await client.close(); } catch {}
  }
});

// Cheap-and-cheerful HTML → text fallback so we always supply *some*
// plain-text alternative to the recipient. Strips tags, collapses
// whitespace, decodes a couple of common entities.
function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
