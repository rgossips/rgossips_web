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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch registered brand profiles
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("brand_profiles")
      .select("brand_id, brand_name, contact_name, logo_url, instagram_username, categories, gstin_trade_name, is_verified, status, created_at");

    if (profError) console.error("Brand profiles error:", profError.message);

    // Fetch brand invitations (pending + claimed)
    const { data: invitations, error: invError } = await supabaseAdmin
      .from("brand_invitations")
      .select("id, brand_name, instagram_username, logo_url, notes, status, created_at, claimed_by, brand_profile_id");

    if (invError) console.error("Brand invitations error:", invError.message);

    // Build a set of claimed invitation IDs to avoid duplicates
    const claimedProfileIds = new Set(
      (invitations || [])
        .filter((inv: any) => inv.brand_profile_id)
        .map((inv: any) => inv.brand_profile_id)
    );

    const brands: any[] = [];

    // Add registered brand profiles
    for (const p of profiles || []) {
      brands.push({
        id: p.brand_id,
        name: p.gstin_trade_name || p.brand_name || p.contact_name || "",
        category: (p.categories && p.categories.length > 0) ? p.categories[0] : "General",
        categories: p.categories || [],
        logo: p.logo_url || "",
        instagram: p.instagram_username || "",
        isVerified: p.is_verified || false,
        isRegistered: true,
        activeCampaigns: 0,
        rating: 0,
        followers: "0",
        minBudget: 0,
        maxBudget: 0,
        payout: "On request",
      });
    }

    // Add brand invitations that are NOT already claimed by a registered profile
    for (const inv of invitations || []) {
      // Skip if this invitation's brand already exists as a registered profile
      if (inv.brand_profile_id && claimedProfileIds.has(inv.brand_profile_id)) {
        continue;
      }
      // Also skip if a registered brand has the same instagram
      const igLower = (inv.instagram_username || "").toLowerCase();
      const alreadyRegistered = brands.some(
        (b) => b.instagram && b.instagram.toLowerCase() === igLower
      );
      if (alreadyRegistered) continue;

      // Parse notes for category and verification
      let category = "General";
      let isVerified = false;
      try {
        const notes = typeof inv.notes === "string" ? JSON.parse(inv.notes) : inv.notes;
        if (notes?.category) category = notes.category;
        if (notes?.instagram_verified) isVerified = true;
      } catch {}

      brands.push({
        id: inv.id,
        name: inv.brand_name || "",
        category,
        categories: [category],
        logo: inv.logo_url || "",
        instagram: inv.instagram_username || "",
        isVerified,
        isRegistered: false,
        activeCampaigns: 0,
        rating: 0,
        followers: "0",
        minBudget: 0,
        maxBudget: 0,
        payout: "On request",
      });
    }

    // Count active campaigns per brand
    const { data: campaigns } = await supabaseAdmin
      .from("campaigns")
      .select("brand_id, status");

    if (campaigns) {
      const campaignCounts: Record<string, number> = {};
      for (const c of campaigns) {
        if (c.status === "active" || c.status === "open") {
          campaignCounts[c.brand_id] = (campaignCounts[c.brand_id] || 0) + 1;
        }
      }
      for (const brand of brands) {
        brand.activeCampaigns = campaignCounts[brand.id] || 0;
      }
    }

    return new Response(
      JSON.stringify({ brands }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
