import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Meta's data-deletion-request callback. Triggered when a user asks Meta
// to delete their data on our app. We must respond with:
//   { url: "<status URL>", confirmation_code: "<unique code>" }
// and then process the deletion in the background.
//
// Status URL is a page on our domain the user can visit to see whether
// the deletion has completed. We use a simple ?id=<code> page.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";

function parseSignedRequest(signedRequest, secret) {
  if (!signedRequest || !secret) return null;
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;
  const sig = base64UrlDecode(encodedSig);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
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

    const confirmationCode = crypto
      .createHash("sha256")
      .update(`del:${data.user_id}:${Date.now()}`)
      .digest("hex")
      .slice(0, 20);

    // Best-effort synchronous cleanup of the Instagram-linked fields.
    // The Meta spec gives up to 30 days; we only nuke the IG-derived
    // data here (not the full RGossips account, which the user can
    // delete through the in-app flow). If you want full deletion to
    // also fire from here, swap in a call to deleteUserFully().
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
          instagram_handle: null,
          followers_count: null,
          follows_count: null,
          media_count: null,
          engagement_rate: null,
          top_reels: null,
        })
        .eq("instagram_user_id", String(data.user_id));
    } catch (e) {
      console.error("Data-deletion cleanup failed:", e);
    }

    return Response.json({
      url: `https://rgossips.com/instagram/deletion-status?id=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (err) {
    console.error("Data-deletion handler error:", err);
    return new Response("error", { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, endpoint: "instagram-data-deletion" });
}
