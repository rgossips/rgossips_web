import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

  try {
    const { phone, otp, mode } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // "signin" mode never creates a new user — if the phone isn't already
    // registered we send the caller back with `no_user` so the UI can prompt
    // them to sign up instead.
    const isSignIn = mode === "signin";

    // Normalize phone: strip '+' for DB lookup
    const normalizedPhone = phone.replace(/\+/g, "");

    // Initialize Supabase client (for DB operations only)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Step 1: Look up the most recent unexpired, unverified OTP
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("phone", normalizedPhone)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.error("OTP fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "OTP expired or not found. Please request a new one." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Step 2: Verify the OTP matches
    if (otpRecord.otp !== otp) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP. Please try again." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Step 3: Mark OTP as verified
    await supabaseAdmin
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Step 4: Resolve auth user by phone.
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
          await supabaseAdmin
            .from("influencer_profiles")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("influencer_id", userId);
        }
      } else if (br) {
        resolvedRole = "brand";
        if (br.status === "deactivated") {
          await supabaseAdmin
            .from("brand_profiles")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("brand_id", userId);
        }
      }
    } catch (e) {
      console.error("Role lookup / reactivation failed (non-fatal):", e);
    }

    // Step 5: Generate session — set temp password, sign in, clear it
    const tempPassword = crypto.randomUUID();

    // Set temp password via Admin REST API
    const updateRes = await authAdminFetch(`users/${userId}`, "PUT", {
      password: tempPassword,
    });

    if (!updateRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to prepare session: " + JSON.stringify(updateRes.data) }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Sign in with temp password via GoTrue token endpoint
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: normalizedPhone,
        password: tempPassword,
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

    // Note: temp password is a random UUID (unguessable), safe to leave as-is
    // Changing it here would invalidate the session we just created

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
