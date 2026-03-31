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
    const { instagramUsername, role } = await req.json();

    if (!instagramUsername || !role) {
      return new Response(
        JSON.stringify({ error: "instagramUsername and role are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (role !== "influencer" && role !== "brand") {
      return new Response(
        JSON.stringify({ error: "role must be 'influencer' or 'brand'" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Initialize Supabase client (for DB operations)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Step 1: Look up the user in the appropriate profile table
    let userId: string | null = null;

    if (role === "influencer") {
      const { data: profile, error } = await supabaseAdmin
        .from("influencer_profiles")
        .select("influencer_id")
        .eq("instagram_handle", instagramUsername)
        .limit(1)
        .single();

      if (error || !profile) {
        return new Response(
          JSON.stringify({
            error: "not_found",
            message: "No account found with this Instagram",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      userId = profile.influencer_id;
    } else {
      // role === "brand"
      const { data: profile, error } = await supabaseAdmin
        .from("brand_profiles")
        .select("brand_id")
        .eq("instagram_username", instagramUsername)
        .limit(1)
        .single();

      if (error || !profile) {
        return new Response(
          JSON.stringify({
            error: "not_found",
            message: "No account found with this Instagram",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      userId = profile.brand_id;
    }

    // Step 2: Generate session using temp password trick
    const tempPassword = crypto.randomUUID();

    // Set temp password via Admin REST API
    const updateRes = await authAdminFetch(`users/${userId}`, "PUT", {
      password: tempPassword,
    });

    if (!updateRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to prepare session: " + JSON.stringify(updateRes.data),
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Get the user's email from the admin response to sign in
    const userEmail = updateRes.data?.email;
    const userPhone = updateRes.data?.phone;

    // Sign in with temp password via GoTrue token endpoint
    // Use email if available, otherwise phone
    const signInBody: Record<string, string> = { password: tempPassword };
    if (userEmail) {
      signInBody.email = userEmail;
    } else if (userPhone) {
      signInBody.phone = userPhone;
    } else {
      return new Response(
        JSON.stringify({ error: "User has no email or phone for authentication" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const tokenRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signInBody),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Token error:", JSON.stringify(tokenData));
      return new Response(
        JSON.stringify({
          error:
            "Failed to create session: " +
            (tokenData?.error_description ||
              tokenData?.msg ||
              JSON.stringify(tokenData)),
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Note: temp password is a random UUID (unguessable), safe to leave as-is
    // Changing it here would invalidate the session we just created

    return new Response(
      JSON.stringify({
        success: true,
        session: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        },
        user: {
          id: userId,
          instagramUsername,
        },
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + (err?.message || String(err)),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
