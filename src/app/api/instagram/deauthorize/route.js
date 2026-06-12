import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Meta calls this when a user revokes our Instagram permission. The body
// is a `signed_request` (base64-encoded JSON signed with the app secret).
// On success we clear the user's stored Instagram credentials so the
// next refresh doesn't try to use a token that's already revoked.
//
// Meta's spec:
//   https://developers.facebook.com/docs/development/create-an-app/instagram-business-app/configure
//   https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow/#confirm
//
// Response shape: 200 with empty body is the documented minimum. Some
// docs suggest a JSON confirmation_code + url — we return that shape too
// since it doesn't hurt and helps when the dashboard probes the endpoint.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";

function parseSignedRequest(signedRequest, secret) {
  if (!signedRequest || !secret) return null;
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;
  const sig = base64UrlDecode(encodedSig);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  // Constant-time comparison
  if (sig.length !== expected.length || !crypto.timingSafeEqual(sig, expected)) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(payload).toString("utf8"));
  } catch {
    return null;
  }
}

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

export async function POST(req) {
  try {
    const form = await req.formData().catch(() => null);
    const signedRequest = form ? String(form.get("signed_request") || "") : "";
    const data = parseSignedRequest(signedRequest, APP_SECRET);

    if (!data?.user_id) {
      return Response.json(
        { error: "Invalid signed_request" },
        { status: 400 }
      );
    }

    // Clear the user's Instagram credentials. Match on the IG numeric id
    // we stored at connect time. Failure here is logged, not surfaced —
    // Meta only cares about the 200.
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
      );
      await supabase
        .from("influencer_profiles")
        .update({
          instagram_access_token: null,
          instagram_token_expires_at: null,
          instagram_user_id: null,
        })
        .eq("instagram_user_id", String(data.user_id));
    } catch (e) {
      console.error("Deauthorize cleanup failed:", e);
    }

    // Meta accepts an empty 200; we return a confirmation block to make
    // the dashboard's probe happy and to give support a paper trail.
    const confirmationCode = crypto
      .createHash("sha256")
      .update(`deauth:${data.user_id}:${Date.now()}`)
      .digest("hex")
      .slice(0, 20);

    return Response.json({
      url: `https://rgossips.com/instagram/deletion-status?id=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error("Deauthorize handler error:", err);
    return new Response("error", { status: 500 });
  }
}

// GET is just so Meta's "test the URL" probe + browser visits return
// something sensible instead of a 405.
export async function GET() {
  return Response.json({ ok: true, endpoint: "instagram-deauthorize" });
}
