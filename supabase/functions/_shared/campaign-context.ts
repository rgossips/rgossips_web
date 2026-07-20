// Builds structured campaign context for AI tools. The brand-campaigns brief
// packs rich fields (hashtags, mentions, dos/donts) as a JSON blob after a
// `\n\n---\n` separator in `campaigns.description`; this unpacks it (mirrors
// brand-campaigns/index.ts unpackDescription) and returns a tidy object every
// tool can drop into a prompt.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

function unpackDescription(raw: string | null): { body: string; meta: Record<string, any> } {
  if (!raw) return { body: "", meta: {} };
  const idx = raw.indexOf("\n\n---\n");
  if (idx < 0) {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return { body: "", meta: parsed };
      } catch { /* body text */ }
    }
    return { body: raw, meta: {} };
  }
  try {
    return { body: raw.slice(0, idx), meta: JSON.parse(raw.slice(idx + 6)) };
  } catch {
    return { body: raw, meta: {} };
  }
}

export interface CampaignContext {
  campaignId: string;
  title: string;
  brief: string;
  categories: string[];
  cities: string[];
  deliverables: string[];        // e.g. ["reels:2","stories:3"]
  requiredHashtags: string[];
  brandHandles: string[];        // @mentions to tag
  dos: string;
  donts: string;
  budgetPerInfluencer: number | null;
  deadline: string | null;
}

// Returns null if the campaign isn't found. Uses the service-role client.
export async function buildCampaignContext(admin: SupabaseClient, campaignId: string): Promise<CampaignContext | null> {
  const { data: c } = await admin
    .from("campaigns")
    .select("campaign_id, title, description, target_categories, target_cities, content_types_required, budget_per_influencer, application_deadline")
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!c) return null;
  const { body, meta } = unpackDescription(c.description);
  const arr = (v: any): string[] => (Array.isArray(v) ? v.map(String) : []);
  return {
    campaignId: c.campaign_id,
    title: c.title || "",
    brief: (body || "").trim(),
    categories: arr(c.target_categories),
    cities: arr(c.target_cities),
    deliverables: arr(c.content_types_required),
    requiredHashtags: arr(meta.required_hashtags),
    brandHandles: arr(meta.brand_handles_to_tag),
    dos: String(meta.content_dos || ""),
    donts: String(meta.content_donts || ""),
    budgetPerInfluencer: c.budget_per_influencer ?? null,
    deadline: c.application_deadline || null,
  };
}

// Render the context as a compact prompt block tools can prepend.
export function contextToPrompt(ctx: CampaignContext): string {
  const lines = [
    `CAMPAIGN: ${ctx.title}`,
    ctx.brief && `BRIEF: ${ctx.brief}`,
    ctx.categories.length && `CATEGORIES: ${ctx.categories.join(", ")}`,
    ctx.cities.length && `CITIES: ${ctx.cities.join(", ")}`,
    ctx.deliverables.length && `DELIVERABLES: ${ctx.deliverables.join(", ")}`,
    ctx.requiredHashtags.length && `REQUIRED HASHTAGS: ${ctx.requiredHashtags.join(" ")}`,
    ctx.brandHandles.length && `TAG THESE HANDLES: ${ctx.brandHandles.join(" ")}`,
    ctx.dos && `DO: ${ctx.dos}`,
    ctx.donts && `DON'T: ${ctx.donts}`,
    ctx.deadline && `DEADLINE: ${ctx.deadline}`,
  ].filter(Boolean);
  return lines.join("\n");
}
