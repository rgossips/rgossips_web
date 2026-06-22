// Resolves an invitation token (currently the Instagram handle) into the
// invitation's role + auto-fill data. Used by the home / login flow when
// a user clicks the `?invited=<handle>` link emailed by the admin.
//
// Returns the same row whether the invitation lives in brand_invitations
// or influencer_invitations — the caller branches on `role` to decide
// which sign-up flow to launch.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const body = await req.json().catch(() => ({}));
    // Accept both `token` and `handle` so the caller can stay neutral on
    // what the URL param actually carries.
    const raw = (body.token || body.handle || body.invited || "").toString().trim();
    if (!raw) {
      return new Response(JSON.stringify({ error: "token is required" }), { status: 200, headers: jsonHeaders });
    }

    // Strip a leading @ in case the email link rendered it.
    const handle = raw.replace(/^@/, "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Search both invitation tables in parallel. A handle should only
    // appear in one of them; if the admin somehow created entries in
    // both, we prefer the brand row (matches existing wrong-role
    // precedence in instagram-login).
    const [brandRes, infRes] = await Promise.all([
      supabaseAdmin
        .from("brand_invitations")
        .select("id, brand_name, logo_url, instagram_username, status, notes")
        .ilike("instagram_username", handle)
        .maybeSingle(),
      supabaseAdmin
        .from("influencer_invitations")
        .select("id, full_name, profile_photo_url, instagram_username, status, notes")
        .ilike("instagram_username", handle)
        .maybeSingle(),
    ]);

    if (brandRes.data) {
      const inv = brandRes.data;
      return new Response(
        JSON.stringify({
          found: true,
          role: "brand",
          status: inv.status,
          invitation: {
            id: inv.id,
            name: inv.brand_name || "",
            instagram_username: inv.instagram_username || handle,
            logo_url: inv.logo_url || "",
            notes: inv.notes ?? null,
          },
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (infRes.data) {
      const inv = infRes.data;
      return new Response(
        JSON.stringify({
          found: true,
          role: "influencer",
          status: inv.status,
          invitation: {
            id: inv.id,
            name: inv.full_name || "",
            instagram_username: inv.instagram_username || handle,
            logo_url: inv.profile_photo_url || "",
            notes: inv.notes ?? null,
          },
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ found: false, message: "No invitation found for this link." }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error: " + ((err as any)?.message || String(err)) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
