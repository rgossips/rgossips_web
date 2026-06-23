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

    // Cross-check: see if this Instagram exists in the OTHER role's tables
    if (role === "influencer") {
      // Check if it exists as a brand or brand invitation
      const [brandCheck, inviteCheck] = await Promise.all([
        supabaseAdmin.from("brand_profiles").select("brand_id").ilike("instagram_username", instagramUsername).maybeSingle(),
        supabaseAdmin.from("brand_invitations").select("id").ilike("instagram_username", instagramUsername).eq("status", "pending").maybeSingle(),
      ]);
      if (brandCheck.data || inviteCheck.data) {
        return new Response(
          JSON.stringify({
            error: "wrong_role",
            message: "This Instagram is registered as a Brand. Please sign in as a Brand instead.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
    } else {
      // Check if it exists as an influencer or influencer invitation
      const [infCheck, infInviteCheck] = await Promise.all([
        supabaseAdmin.from("influencer_profiles").select("influencer_id").ilike("instagram_handle", instagramUsername).maybeSingle(),
        supabaseAdmin.from("influencer_invitations").select("id").ilike("instagram_username", instagramUsername).eq("status", "pending").maybeSingle(),
      ]);
      if (infCheck.data || infInviteCheck.data) {
        return new Response(
          JSON.stringify({
            error: "wrong_role",
            message: "This Instagram is registered as an Influencer. Please sign in as an Influencer instead.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
    }

    if (role === "influencer") {
      const { data: profile, error } = await supabaseAdmin
        .from("influencer_profiles")
        .select("influencer_id")
        .eq("instagram_handle", instagramUsername)
        .limit(1)
        .single();

      if (error || !profile) {
        // Influencer not found — check influencer_invitations
        const { data: invitation } = await supabaseAdmin
          .from("influencer_invitations")
          .select("id, full_name, profile_photo_url, instagram_username")
          .ilike("instagram_username", instagramUsername)
          .eq("status", "pending")
          .limit(1)
          .single();

        if (invitation) {
          return new Response(
            JSON.stringify({
              error: "invitation_found",
              message: "You've been pre-registered. Complete your profile to get started.",
              invitation: {
                id: invitation.id,
                full_name: invitation.full_name,
                profile_photo_url: invitation.profile_photo_url,
                instagram_username: invitation.instagram_username,
              },
            }),
            { status: 200, headers: jsonHeaders }
          );
        }

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
        // Brand not found in brand_profiles — check brand_invitations
        const { data: invitation } = await supabaseAdmin
          .from("brand_invitations")
          .select("id, brand_name, logo_url, instagram_username")
          .ilike("instagram_username", instagramUsername)
          .eq("status", "pending")
          .limit(1)
          .single();

        if (invitation) {
          // Found a pending invitation — tell frontend to complete signup
          return new Response(
            JSON.stringify({
              error: "invitation_found",
              message: "Your brand has been pre-registered. Complete your profile to get started.",
              invitation: {
                id: invitation.id,
                brand_name: invitation.brand_name,
                logo_url: invitation.logo_url,
                instagram_username: invitation.instagram_username,
              },
            }),
            { status: 200, headers: jsonHeaders }
          );
        }

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

    // Step 2: Generate session.
    //
    // Stable per-user password stored in app_metadata.session_password.
    // We do NOT rotate it on every sign-in — that would invalidate every
    // existing session on every device. First-ever sign-in generates +
    // persists the password; subsequent sign-ins reuse it.
    const userLookup = await authAdminFetch(`users/${userId}`);
    if (!userLookup.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to load user: " + JSON.stringify(userLookup.data) }),
        { status: 200, headers: jsonHeaders }
      );
    }
    const existingPassword: string | undefined =
      userLookup.data?.app_metadata?.session_password;
    let sessionPassword: string;
    if (existingPassword) {
      sessionPassword = existingPassword;
    } else {
      sessionPassword = crypto.randomUUID();
      const setRes = await authAdminFetch(`users/${userId}`, "PUT", {
        password: sessionPassword,
        app_metadata: {
          ...(userLookup.data?.app_metadata || {}),
          session_password: sessionPassword,
        },
      });
      if (!setRes.ok) {
        return new Response(
          JSON.stringify({
            error: "Failed to prepare session: " + JSON.stringify(setRes.data),
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
    }

    // Get the user's email from the admin response to sign in
    const userEmail = userLookup.data?.email;
    const userPhone = userLookup.data?.phone;

    // Sign in with the stable password via GoTrue token endpoint
    // Use email if available, otherwise phone
    const signInBody: Record<string, string> = { password: sessionPassword };
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

    // Session created. Password is unchanged — other devices' sessions
    // remain valid.

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
