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

    // Fetch registered brand profiles — use * to avoid missing-column failures
    const { data: profiles, error: profError } = await supabaseAdmin
      .from("brand_profiles")
      .select("*");

    if (profError) console.error("Brand profiles error:", profError.message);

    // Fetch brand invitations (pending + claimed)
    const { data: invitations, error: invError } = await supabaseAdmin
      .from("brand_invitations")
      .select("*");

    if (invError) console.error("Brand invitations error:", invError.message);

    const brands: any[] = [];

    // Add registered brand profiles
    for (const p of profiles || []) {
      brands.push({
        id: p.brand_id,
        name:
          p.gstin_trade_name ||
          p.brand_name ||
          p.contact_name ||
          (p.instagram_username ? `@${p.instagram_username}` : "Unnamed Brand"),
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

    // Build a set of brand_ids we actually loaded from brand_profiles
    const registeredBrandIds = new Set(brands.map((b) => b.id));
    // Normalized Instagram handles of registered brands (ignore empty)
    const registeredInstagrams = new Set(
      brands
        .map((b) => (b.instagram || "").toLowerCase())
        .filter((h) => h.length > 0)
    );

    // Add brand invitations that are NOT represented by a registered profile
    for (const inv of invitations || []) {
      // Skip only if the invitation links to a profile we actually loaded.
      // (A dangling brand_profile_id should NOT hide the invitation.)
      if (inv.brand_profile_id && registeredBrandIds.has(inv.brand_profile_id)) {
        continue;
      }
      // Skip if a registered brand has the same Instagram handle
      // (only applies when both sides have a non-empty handle)
      const igLower = (inv.instagram_username || "").toLowerCase();
      if (igLower && registeredInstagrams.has(igLower)) {
        continue;
      }

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
        // Fall back to Instagram handle if brand_name is missing — otherwise
        // the card renders as blank and looks "missing" to the user.
        name: inv.brand_name || (inv.instagram_username ? `@${inv.instagram_username}` : "Unnamed Brand"),
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

    // Count active campaigns per brand (via brand_id or brand_invitation_id)
    const { data: campaigns } = await supabaseAdmin
      .from("campaigns")
      .select("brand_id, brand_invitation_id, status");

    if (campaigns) {
      const campaignCounts: Record<string, number> = {};
      for (const c of campaigns as any[]) {
        if (c.status === "active" || c.status === "open") {
          // Count by brand_invitation_id (most campaigns link this way)
          if (c.brand_invitation_id) {
            campaignCounts[c.brand_invitation_id] = (campaignCounts[c.brand_invitation_id] || 0) + 1;
          }
          // Also count by brand_id (for registered brands)
          if (c.brand_id) {
            campaignCounts[c.brand_id] = (campaignCounts[c.brand_id] || 0) + 1;
          }
        }
      }
      for (const brand of brands) {
        brand.activeCampaigns = campaignCounts[brand.id] || 0;
      }
    }

    return new Response(
      JSON.stringify({
        brands,
        _debug: {
          profilesCount: profiles?.length || 0,
          invitationsCount: invitations?.length || 0,
          profileError: profError?.message || null,
          inviteError: invError?.message || null,
        },
      }),
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
