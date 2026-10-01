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
import { serveWithLogging } from "../_shared/serve.ts";

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

// Header-safe subject line.
//
// denomailer 1.6.0 mangles any subject containing a non-ASCII character. It
// quoted-printable-encodes it into an RFC 2047 encoded-word but leaves literal
// spaces inside (illegal - they must be _ or =20) and then wraps the result
// with a body-style soft break instead of folding it as a header. That breaks
// the header block: the mail client shows a raw "=?utf-8?Q?..." string as the
// subject, and every header after it - From, To, Date, Content-Type - lands in
// the body as plain text. One rupee sign, or a curly apostrophe out of a
// campaign title, is enough; escrow receipts, payment confirmations and the
// subscribe nudges have all been going out unreadable.
//
// We never need an encoded-word: transliterate to ASCII and denomailer emits
// the subject verbatim. "Rs" for the rupee sign, straight quotes, hyphens for
// dashes, accents flattened, anything left over dropped.
//
// Stripping CR/LF is the important half. Subjects interpolate campaign titles
// and brand names that somebody typed, and a newline in a header is header
// injection - the corruption above is what that looks like by accident.
//
// Character classes are built from strings rather than regex literals so the
// code points stay legible and survive an editor normalising the file.
const SMART_QUOTES = new RegExp("[‘’‚‛]", "g");
const SMART_DQUOTES = new RegExp("[“”„‟]", "g");
const DASHES = new RegExp("[–—―]", "g");
const ELLIPSIS = new RegExp("…", "g");
const RUPEE = new RegExp("₹", "g");
// nbsp, the en/em quad family, hair space, zero-width space, narrow nbsp.
const EXOTIC_SPACE = new RegExp("[  -​  ]", "g");
// Combining accents left behind by NFKD.
const COMBINING = new RegExp("[̀-ͯ]", "g");

function headerSafe(value: string | undefined, max = 200): string {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(SMART_QUOTES, "'")
    .replace(SMART_DQUOTES, '"')
    .replace(DASHES, "-")
    .replace(ELLIPSIS, "...")
    .replace(RUPEE, "Rs ")
    .replace(EXOTIC_SPACE, " ")
    // Flatten accented Latin (Jose with an acute -> Jose) before dropping
    // whatever is still not ASCII.
    .normalize("NFKD")
    .replace(COMBINING, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
// Strip trailing whitespace from every line of a body.
//
// Quoted-printable must escape a space that ends a line, so a line holding
// nothing but template indentation encodes as "=20" - and denomailer leaves
// that visible in the delivered mail. Any template with a conditional block
// on its own indented line hits this the moment the block is empty: the
// approval email shipped a stray "=20" above its button exactly that way,
// and renderUserStatusEmail in the admin portal has the same shape.
//
// Trailing whitespace is meaningless in HTML and noise in plain text, so
// removing it here costs nothing and fixes every caller at once.
function tidyBody(value: string | undefined): string | undefined {
  if (!value) return value;
  const TRAILING = new RegExp("[ \\t]+$");
  return value
    .split("\n")
    .map((line) => line.replace(TRAILING, ""))
    .join("\n");
}

function asList(v: string | string[] | undefined): string[] | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v.filter(Boolean) : [v];
}

serveWithLogging("send-email", async (req) => {
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
  const fromDisplay = headerSafe(fromName || Deno.env.get("SMTP_FROM_NAME") || "RGossips", 64) || "RGossips";

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
      // Headers only — the HTML/text bodies below keep their rupee signs and
      // smart quotes, which encode fine.
      subject: headerSafe(subject),
      // denomailer treats html + content as two separate alternatives.
      // If we only have HTML and no plain-text fallback, derive a
      // crude text version so non-HTML clients (and spam filters that
      // penalise HTML-only) still get something readable.
      content: tidyBody(text || (html ? stripHtml(html) : "")) || "",
      html: tidyBody(html) || undefined,
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
