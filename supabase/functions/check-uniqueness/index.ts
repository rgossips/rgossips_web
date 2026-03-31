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

      if (infInsta.data || brandInsta.data || brandInvite.data || infInvite.data) {
        conflicts.push("instagram");
        // Determine the source for better error messages
        if (infInsta.data || infInvite.data) {
          instagramConflictSource = "influencer";
        } else {
          instagramConflictSource = "brand";
        }
      }
    }

    return new Response(
      JSON.stringify({ conflicts, instagramConflictSource }),
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
