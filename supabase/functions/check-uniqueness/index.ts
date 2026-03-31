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
    const { phone, gstin, instagram } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const conflicts: string[] = [];

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
      const [infInsta, brandInsta, brandInvite] = await Promise.all([
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
      ]);

      if (infInsta.data || brandInsta.data || brandInvite.data) {
        conflicts.push("instagram");
      }
    }

    return new Response(
      JSON.stringify({ conflicts }),
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
