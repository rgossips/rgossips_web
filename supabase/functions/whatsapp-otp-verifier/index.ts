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
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

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

    // Step 4: Find or create user by phone number
    // Supabase stores phone WITHOUT '+' prefix (e.g., "917204909749")
    let userId: string;

    // Try to create user via Admin REST API (use normalizedPhone without '+')
    const createRes = await authAdminFetch("users", "POST", {
      phone: normalizedPhone,
      phone_confirm: true,
    });

    if (createRes.ok) {
      userId = createRes.data.id;
    } else {
      console.error("Create user response:", createRes.status, JSON.stringify(createRes.data));

      // User already exists — find by phone
      const listRes = await authAdminFetch("users?page=1&per_page=1000");
      if (!listRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to list users: " + JSON.stringify(listRes.data) }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const existingUser = listRes.data?.users?.find((u: any) =>
        u.phone === normalizedPhone ||
        u.phone === normalizedPhone.slice(2) ||
        u.phone === `+${normalizedPhone}`
      );

      if (!existingUser) {
        const allPhones = listRes.data?.users?.map((u: any) => u.phone) || [];
        console.error("Looking for:", normalizedPhone, "Found phones:", allPhones);
        return new Response(
          JSON.stringify({ error: "Could not find existing user" }),
          { status: 200, headers: jsonHeaders }
        );
      }

      userId = existingUser.id;
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
