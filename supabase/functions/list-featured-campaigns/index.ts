// Returns the admin-curated campaign list used by the influencer home
// page "Deal Of The Day" and "Plan Your Stay With Us" carousels.
//
// We join featured_campaigns → campaigns and pull brand info (from
// brand_profiles or brand_invitations, mirroring list-campaigns) so the
// frontend doesn't have to re-do that lookup. Only `is_active=true`
// featured rows show up, and only campaigns that are still open / not
// past their deadline.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Pull the banner_image / gallery / extras the brand admin form packs into
// the campaign description JSON. Same shape used by list-campaigns.
function unpackDescription(raw: string | null) {
  if (!raw) return { body: "", meta: {} as Record<string, unknown> };
  const sep = raw.indexOf("\n---\n");
  if (sep < 0) {
    // Legacy rows: an empty-description campaign stored the bare meta
    // JSON with no separator. Recognise it so the blob doesn't render
    // as visible body text.
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          return { body: "", meta: parsed };
        }
      } catch { /* fall through — genuinely body text */ }
    }
    return { body: raw, meta: {} };
  }
  try {
    return { body: raw.slice(0, sep), meta: JSON.parse(raw.slice(sep + 5)) };
  } catch {
    return { body: raw, meta: {} };
  }
}

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

    // Body is optional. Newer callers send `{ section: 'stay' | 'campaign' }`
    // to pick which carousel they're feeding. Older callers (and a GET-
    // without-body) default to 'campaign' so the top StackedDeals strip
    // keeps working without a coordinated client deploy.
    let section: "campaign" | "stay" = "campaign";
    try {
      const body = await req.json();
      if (body?.section === "stay" || body?.section === "campaign") {
        section = body.section;
      }
    } catch {
      // No body / not JSON → default.
    }

    // Section title. 'stay' is now auto-curated (below) but we keep reading
    // the historical title key so an existing custom title still applies.
    const titleKey =
      section === "stay" ? "featured_section_title" : "featured_campaigns_section_title";
    const DEFAULT_SECTION_TITLE =
      section === "stay" ? "Plan your stay with us" : "FEATURED CAMPAIGNS";
    let sectionTitle = DEFAULT_SECTION_TITLE;
    try {
      const { data: setting } = await supabaseAdmin
        .from("homepage_settings")
        .select("value")
        .eq("key", titleKey)
        .maybeSingle();
      if (setting?.value) sectionTitle = setting.value;
    } catch {
      // Table missing in older deployments — fall back to default.
    }

    const CAMPAIGN_FIELDS =
      "campaign_id, title, brand_id, brand_invitation_id, description, target_cities, target_categories, campaign_end_date, application_deadline, status, created_at, budget_total, budget_per_influencer";

    // 'stay' ("Plan your stay with us") is AUTO-curated — the top 8 active
    // Travel & Hospitality campaigns, newest first. It is NOT admin-controlled
    // (the old featured_campaigns(section='stay') admin list + its dashboard
    // page were removed). The 'campaign' strip stays admin-curated.
    let campaigns: any[] = [];
    const orderMap = new Map<string, number>();
    if (section === "stay") {
      // `target_categories` is a `json` column (not jsonb/text[]), so the
      // array-contains operator can't run in SQL — pull the newest active
      // campaigns and filter for Travel & Hospitality in JS, then take 8.
      const { data } = await supabaseAdmin
        .from("campaigns")
        .select(CAMPAIGN_FIELDS)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(200);
      const num = (v: any) => Number(v) || 0;
      campaigns = (data || [])
        .filter(
          (c: any) =>
            Array.isArray(c.target_categories) &&
            c.target_categories.includes("Travel & Hospitality"),
        )
        // Costliest first — by total budget, then per-influencer payout, then
        // newest (the fetch is already created_at desc, so it's the tiebreak).
        .sort(
          (a: any, b: any) =>
            num(b.budget_total) - num(a.budget_total) ||
            num(b.budget_per_influencer) - num(a.budget_per_influencer),
        )
        .slice(0, 8);
    } else {
      const { data: featured, error: fErr } = await supabaseAdmin
        .from("featured_campaigns")
        .select("campaign_id, position")
        .eq("is_active", true)
        .eq("section", section)
        .order("position", { ascending: true });
      if (fErr) {
        return new Response(JSON.stringify({ error: fErr.message }), {
          status: 200,
          headers: jsonHeaders,
        });
      }
      const ids = (featured || []).map((r: any) => r.campaign_id);
      if (ids.length > 0) {
        const { data } = await supabaseAdmin
          .from("campaigns")
          .select(CAMPAIGN_FIELDS)
          .in("campaign_id", ids);
        campaigns = data || [];
      }
      (featured || []).forEach((r: any) => orderMap.set(r.campaign_id, r.position));
    }

    if (campaigns.length === 0) {
      return new Response(JSON.stringify({ campaigns: [], sectionTitle }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    // Brand lookups (both registered + invitation-based)
    const brandIds = [...new Set((campaigns || []).map((c: any) => c.brand_id).filter(Boolean))];
    const invIds = [...new Set((campaigns || []).map((c: any) => c.brand_invitation_id).filter(Boolean))];
    const brandMap: Record<string, { name: string; logo: string; instagram: string }> = {};

    if (brandIds.length > 0) {
      const { data: bp } = await supabaseAdmin
        .from("brand_profiles")
        .select("brand_id, brand_name, gstin_trade_name, logo_url, instagram_username")
        .in("brand_id", brandIds);
      (bp || []).forEach((p: any) => {
        brandMap[p.brand_id] = {
          name: p.gstin_trade_name || p.brand_name || "",
          logo: p.logo_url || "",
          instagram: p.instagram_username || "",
        };
      });
    }
    if (invIds.length > 0) {
      const { data: bi } = await supabaseAdmin
        .from("brand_invitations")
        .select("id, brand_name, logo_url, instagram_username")
        .in("id", invIds);
      (bi || []).forEach((inv: any) => {
        brandMap[inv.id] = {
          name: inv.brand_name || "",
          logo: inv.logo_url || "",
          instagram: inv.instagram_username || "",
        };
      });
    }

    // 'campaign' strip: admin-set ordering (featured.position). 'stay' keeps
    // the query order (created_at desc) since its orderMap is empty.
    const sortedCampaigns = campaigns.slice().sort((a: any, b: any) =>
      (orderMap.get(a.campaign_id) ?? 0) - (orderMap.get(b.campaign_id) ?? 0)
    );

    const out = sortedCampaigns.map((c: any) => {
      const brand = brandMap[c.brand_invitation_id] || brandMap[c.brand_id] || { name: "", logo: "", instagram: "" };
      const { body, meta } = unpackDescription(c.description);
      const m = meta as any;
      const banner = m.banner_image || brand.logo || "";
      const locationArr = Array.isArray(c.target_cities) && c.target_cities.length > 0
        ? c.target_cities
        : [];
      const location = locationArr.length > 0 ? locationArr.join(", ") : "Pan India";
      const category = (Array.isArray(c.target_categories) && c.target_categories[0]) || "Campaign";
      // Days left — null if no deadline set
      let daysLeft = null;
      const deadline = c.application_deadline || c.campaign_end_date;
      if (deadline) {
        const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        daysLeft = days >= 0 ? days : 0;
      }

      return {
        id: c.campaign_id,
        title: c.title || "Featured Campaign",
        location,
        category,
        bannerImage: banner,
        brandName: brand.name,
        brandLogo: brand.logo,
        brandInstagram: brand.instagram,
        description: body || "",
        daysLeft,
        // Client carousels render a live countdown — needs the raw ISO
        // timestamp, not just daysLeft.
        applicationDeadline: c.application_deadline || c.campaign_end_date || null,
        priceType: m.compensation_type || "Brand Collab",
      };
    });

    return new Response(JSON.stringify({ campaigns: out, sectionTitle }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), {
      status: 200,
      headers: jsonHeaders,
    });
  }
});
