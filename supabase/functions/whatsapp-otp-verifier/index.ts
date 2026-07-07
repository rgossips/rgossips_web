import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log, hashId } from "../_shared/log.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Max wrong guesses per issued OTP before the code is burned. With the
// sender's 60s cooldown + 5/phone/hr cap, this bounds total guesses to a
// couple dozen per hour against a 900k keyspace — brute-force infeasible.
const MAX_OTP_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Helper: call Supabase Auth Admin REST API directly
  const authAdminFetch = async (path: string, method = "GET", body?: unknown) => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    return { data, ok: res.ok, status: res.status };
  };

  const rid = crypto.randomUUID();

  try {
    const { phone, otp, mode, reactivate } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }
    const phoneHash = await hashId(String(phone));

    // "signin" mode never creates a new user — if the phone isn't already
    // registered we send the caller back with `no_user` so the UI can prompt
    // them to sign up instead.
    const isSignIn = mode === "signin";

    // Normalize phone: strip '+' for DB lookup
    const normalizedPhone = phone.replace(/\+/g, "");

    // Initialize Supabase client (for DB operations only)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Steps 1+2: Atomically look up the newest active OTP, enforce the
    // attempt ceiling, and check the code — all under a row lock in the
    // DB so parallel guesses can't bypass the counter (TOCTOU). This is
    // the brute-force guard: without it a 6-digit code (900k keyspace,
    // 5-min window) could be guessed with unlimited concurrent requests,
    // which is a practical account-takeover primitive.
    const { data: verifyRows, error: verifyErr } = await supabaseAdmin.rpc(
      "consume_otp_attempt",
      { p_phone: normalizedPhone, p_code: String(otp), p_max: MAX_OTP_ATTEMPTS }
    );
    if (verifyErr) {
      log.error("otp.verify.rpc_failed", { rid, phoneHash }, verifyErr);
      return new Response(
        JSON.stringify({ error: "Could not verify OTP. Please try again." }),
        { status: 200, headers: jsonHeaders }
      );
    }
    const outcome = Array.isArray(verifyRows) ? verifyRows[0] : verifyRows;
    const vstatus: string = outcome?.status || "no_code";

    if (vstatus === "no_code") {
      log.warn("otp.verify.no_active_code", { rid, phoneHash });
      return new Response(
        JSON.stringify({ error: "OTP expired or not found. Please request a new one." }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if (vstatus === "locked_out") {
      log.warn("otp.verify.locked_out", { rid, phoneHash });
      return new Response(
        JSON.stringify({
          error: "too_many_attempts",
          message: "Too many incorrect codes. Please request a new OTP.",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if (vstatus === "invalid" || outcome?.matched !== true) {
      const remaining = Number(outcome?.remaining ?? 0);
      log.warn("otp.verify.bad_code", { rid, phoneHash, remaining });
      return new Response(
        JSON.stringify({
          error: "invalid_otp",
          message: `Invalid OTP. ${remaining} attempt(s) left before you'll need a new code.`,
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Matched. The code is left un-consumed here on purpose: the
    // reactivation short-circuit below (deactivated account needing an
    // explicit confirm) asks the client to re-submit the same code with
    // reactivate:true, so it must still be findable. It's marked
    // verified=true just before we issue the session (and all codes for
    // the phone are deleted at the end).
    log.info("otp.verify.matched", { rid, phoneHash, mode });

    // ── Signup: prove phone ownership, but DON'T create the auth user ──
    // Option A (deferred auth-user creation). On signup we no longer mint
    // an auth user or a session here — that used to leave an orphaned
    // phone user if onboarding was abandoned before create-profile ran.
    // Instead we stamp the OTP row as a short-lived proof-of-phone and let
    // create-profile create the user + profile atomically. The proof is
    // the (phone, verified_at) marker on otp_verifications, consumed by
    // create-profile. Reactivation is a sign-in-only concern, so signup
    // never reaches the logic below.
    if (!isSignIn) {
      await supabaseAdmin
        .from("otp_verifications")
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq("phone", normalizedPhone)
        .eq("otp", String(otp));
      log.info("otp.verify.phone_proved", { rid, phoneHash });
      return new Response(
        JSON.stringify({ success: true, phoneVerified: true, phone: normalizedPhone }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Step 4: Resolve auth user by phone (sign-in only from here down).
    // Supabase stores phone WITHOUT '+' prefix (e.g., "917204909749").
    let userId: string;

    // For sign-in we look up FIRST and never create — if nothing matches the
    // function returns `no_user` so the UI can prompt to sign up instead.
    const findExisting = async () => {
      const listRes = await authAdminFetch("users?page=1&per_page=1000");
      if (!listRes.ok) return null;
      return (listRes.data?.users || []).find((u: any) =>
        u.phone === normalizedPhone ||
        u.phone === normalizedPhone.slice(2) ||
        u.phone === `+${normalizedPhone}`
      ) || null;
    };

    if (isSignIn) {
      const existing = await findExisting();
      if (!existing) {
        return new Response(
          JSON.stringify({ error: "no_user", message: "This number isn't registered yet. Please sign up first." }),
          { status: 200, headers: jsonHeaders }
        );
      }
      userId = existing.id;
    } else {
      // Sign-up — try to create, fall back to existing on conflict.
      const createRes = await authAdminFetch("users", "POST", {
        phone: normalizedPhone,
        phone_confirm: true,
      });

      if (createRes.ok) {
        userId = createRes.data.id;
      } else {
        console.error("Create user response:", createRes.status, JSON.stringify(createRes.data));
        const existing = await findExisting();
        if (!existing) {
          return new Response(
            JSON.stringify({ error: "Could not find existing user" }),
            { status: 200, headers: jsonHeaders }
          );
        }
        userId = existing.id;
      }
    }

    // Look up which role this user actually has so the caller can route them
    // and so we can reject role-mismatch sign-ins. Also flip status back to
    // 'active' if the user previously soft-deactivated — signing in IS the
    // reactivation gesture per product design.
    //
    // `pending_deletion` is different: only admin can restore. We refuse the
    // sign-in here so a user can't accidentally cancel their own deletion.
    let resolvedRole: string | null = null;
    try {
      const [{ data: inf }, { data: br }] = await Promise.all([
        supabaseAdmin.from("influencer_profiles").select("influencer_id, status").eq("influencer_id", userId).maybeSingle(),
        supabaseAdmin.from("brand_profiles").select("brand_id, status, deleted_at").eq("brand_id", userId).maybeSingle(),
      ]);

      if (br?.status === "pending_deletion") {
        return new Response(
          JSON.stringify({
            error: "pending_deletion",
            message: "Your brand account is scheduled for deletion. Email grievance@rgossips.com to restore it before it's permanently removed.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      if (inf?.status === "pending_deletion") {
        return new Response(
          JSON.stringify({
            error: "pending_deletion",
            message: "Your account is scheduled for deletion. Email grievance@rgossips.com to restore it before it's permanently removed.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      if (inf) {
        resolvedRole = "influencer";
        if (inf.status === "deactivated") {
          // Reactivation is now an explicit gesture, not a silent side-effect
          // of signing in. The login UI catches this error and re-submits
          // the same OTP with reactivate: true after the user confirms.
          if (!reactivate) {
            return new Response(
              JSON.stringify({
                error: "deactivated",
                role: "influencer",
                message: "Your account is deactivated. Confirm to reactivate it and sign back in.",
              }),
              { status: 200, headers: jsonHeaders }
            );
          }
          await supabaseAdmin
            .from("influencer_profiles")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("influencer_id", userId);
          // Best-effort welcome-back email. Server lookup of the
          // recipient mailbox — fire-and-forget.
          fireReactivationEmail(supabaseAdmin, userId, "influencer").catch(() => {});
        }
      } else if (br) {
        resolvedRole = "brand";
        if (br.status === "deactivated") {
          if (!reactivate) {
            return new Response(
              JSON.stringify({
                error: "deactivated",
                role: "brand",
                message: "Your brand account is deactivated. Confirm to reactivate it and sign back in.",
              }),
              { status: 200, headers: jsonHeaders }
            );
          }
          await supabaseAdmin
            .from("brand_profiles")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("brand_id", userId);
          fireReactivationEmail(supabaseAdmin, userId, "brand").catch(() => {});
        }
      }
    } catch (e) {
      console.error("Role lookup / reactivation failed (non-fatal):", e);
    }

    // OTP is being honoured for a real sign-in (or confirmed reactivation)
    // — mark it consumed now so a stale client can't reuse it. The match
    // path in consume_otp_attempt leaves the code un-consumed (so the
    // reactivation re-submit can find it), so we burn it here by
    // phone + code value instead of the row id.
    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified: true })
      .eq("phone", normalizedPhone)
      .eq("otp", String(otp));

    // Step 5: Generate session.
    //
    // CRITICAL: do NOT rotate the password on every sign-in. GoTrue
    // invalidates ALL existing sessions for the user when their password
    // changes, which is why signing in on phone B used to log phone A
    // out. We store a stable per-user random password in app_metadata
    // (private, server-only) and reuse it forever — only generated on
    // first sign-in (or written by the one-shot backfill for legacy
    // users).
    //
    // app_metadata is signed and never exposed to the client via JWT
    // claims (only `user_metadata` is), so the stored password stays
    // server-side. The actual access path is the service-role key,
    // which is the same trust boundary as everything else this edge
    // function does.
    const userLookup = await authAdminFetch(`users/${userId}`);
    const existingPassword: string | undefined =
      userLookup?.data?.app_metadata?.session_password;
    let sessionPassword: string;
    if (existingPassword) {
      sessionPassword = existingPassword;
    } else {
      sessionPassword = crypto.randomUUID();
      const setRes = await authAdminFetch(`users/${userId}`, "PUT", {
        password: sessionPassword,
        app_metadata: {
          ...(userLookup?.data?.app_metadata || {}),
          session_password: sessionPassword,
        },
      });
      if (!setRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to prepare session: " + JSON.stringify(setRes.data) }),
          { status: 200, headers: jsonHeaders }
        );
      }
    }

    // Sign in with the stable password via GoTrue token endpoint.
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        password: sessionPassword,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Token error:", JSON.stringify(tokenData));
      return new Response(
        JSON.stringify({ error: "Failed to create session: " + (tokenData?.error_description || tokenData?.msg || JSON.stringify(tokenData)) }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Clean up used OTP records
    await supabaseAdmin
      .from("otp_verifications")
      .delete()
      .eq("phone", normalizedPhone);

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        },
        user: {
          id: userId,
          phone: normalizedPhone,
          role: resolvedRole,
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Fires a "welcome back" email when a deactivated account is reactivated
// during sign-in. Pure best-effort — caller doesn't await the result so
// a mail outage can't break the sign-in flow.
async function fireReactivationEmail(
  admin: any,
  userId: string,
  role: "influencer" | "brand"
) {
  try {
    let to = "";
    let displayName = "";
    if (role === "influencer") {
      const { data } = await admin
        .from("influencer_profiles")
        .select("email, full_name")
        .eq("influencer_id", userId)
        .maybeSingle();
      to = data?.email || "";
      displayName = data?.full_name || "";
    } else {
      const { data } = await admin
        .from("brand_profiles")
        .select("contact_email, contact_name, brand_name")
        .eq("brand_id", userId)
        .maybeSingle();
      to = data?.contact_email || "";
      displayName = data?.contact_name || data?.brand_name || "";
    }
    if (!to) return;
    const firstName = (displayName || "").split(" ")[0] || "there";
    const isBrand = role === "brand";
    const accountLabel = isBrand ? "brand account" : "account";
    const dashHref = isBrand ? "https://rgossips.com/brands" : "https://rgossips.com/influencer";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F8F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F7FB;padding:24px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #f1f5f9;border-radius:20px;padding:32px;">
        <tr><td>
          <div style="font-weight:900;font-size:18px;color:#9810FA;margin-bottom:18px;">RGossips</div>
          <h1 style="font-size:22px;font-weight:800;margin:0 0 14px;color:#0f172a;">${firstName}, welcome back</h1>
          <div style="font-size:14px;line-height:1.65;color:#475569;">
            <p>Your RGossips ${accountLabel} is active again. Pick up where you left off — your profile, campaigns and history are exactly as you left them.</p>
          </div>
          <div style="margin:28px 0 8px;">
            <a href="${dashHref}" style="display:inline-block;background:linear-gradient(135deg,#9810FA,#E60076);color:#ffffff !important;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:14px;">Open dashboard</a>
          </div>
          <div style="font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:18px;margin-top:28px;">If you didn't reactivate this account, reply to this email straight away.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    await fetch(`${Deno.env.get("SUPABASE_URL")!}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      },
      body: JSON.stringify({
        to,
        subject: "Welcome back to RGossips",
        html,
      }),
    });
  } catch (e) {
    console.error("Reactivation email failed:", (e as any)?.message);
  }
}
