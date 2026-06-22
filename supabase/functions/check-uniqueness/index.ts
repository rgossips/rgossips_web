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

  try {
    const { phone, gstin, instagram, role } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const conflicts: string[] = [];
    let instagramConflictSource = "";
    // "profile" → an actual account exists with this IG (treat as conflict)
    // "invitation" → only a pending invitation row exists (NOT a conflict —
    //   the caller should route the user into the invitation flow instead
    //   of telling them to sign in)
    let instagramConflictKind: "profile" | "invitation" | "" = "";

    // Check phone in auth.users via RPC (uses service role, can access auth schema)
    if (phone) {
      const rawDigits = phone.replace(/\D/g, "");
      const fullPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;

      const { data, error } = await supabaseAdmin.rpc("check_phone_exists", {
        phone_number: fullPhone,
      });

      if (!error && data === true) {
        conflicts.push("phone");
      }
    }

    // Check GSTIN in brand_profiles
    if (gstin) {
      const { data } = await supabaseAdmin
        .from("brand_profiles")
        .select("brand_id")
        .eq("gstin", gstin)
        .maybeSingle();

      if (data) {
        conflicts.push("gstin");
      }
    }

    // Check Instagram across all tables (profiles + invitations)
    if (instagram) {
      const handle = instagram.toLowerCase();
      const [infInsta, brandInsta, brandInvite, infInvite] = await Promise.all([
        supabaseAdmin
          .from("influencer_profiles")
          .select("influencer_id")
          .ilike("instagram_handle", handle)
          .maybeSingle(),
        supabaseAdmin
          .from("brand_profiles")
          .select("brand_id")
          .ilike("instagram_username", handle)
          .maybeSingle(),
        supabaseAdmin
          .from("brand_invitations")
          .select("id")
          .ilike("instagram_username", handle)
          .maybeSingle(),
        supabaseAdmin
          .from("influencer_invitations")
          .select("id")
          .ilike("instagram_username", handle)
          .maybeSingle(),
      ]);

      const profileMatch = infInsta.data || brandInsta.data;
      const inviteMatch = brandInvite.data || infInvite.data;

      // A real existing account is a true conflict — the user must sign
      // in instead of creating a duplicate. A pending invitation is NOT
      // a conflict; we surface it as `instagramConflictKind: "invitation"`
      // so the client can flip into the invitation flow.
      if (profileMatch) {
        conflicts.push("instagram");
        instagramConflictKind = "profile";
        instagramConflictSource = (infInsta.data) ? "influencer" : "brand";
      } else if (inviteMatch) {
        instagramConflictKind = "invitation";
        instagramConflictSource = (infInvite.data) ? "influencer" : "brand";
      }
    }

    return new Response(
      JSON.stringify({ conflicts, instagramConflictSource, instagramConflictKind }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + (err?.message || String(err)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
