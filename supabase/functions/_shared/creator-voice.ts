// Builds a compact creator "voice + profile" summary for AI tools, so every
// generation sounds like the creator (voice-matching) and knows their niche,
// audience and rates. All fields are optional — the tools degrade gracefully
// when Instagram data is missing (manual inputs still work).

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface CreatorVoice {
  name: string;
  handle: string;
  categories: string[];
  languages: string[];
  city: string;
  bio: string;
  followers: number;
  engagementRate: number | null;
  audience: string;               // one-line demographics summary
  sampleCaptions: string[];       // recent captions for voice-matching
  reelRate: number | null;        // service_rates.reels if set
}

export async function buildCreatorVoice(admin: SupabaseClient, userId: string): Promise<CreatorVoice | null> {
  // NOTE: `city` is NOT a column on influencer_profiles (selecting it 42703s
  // and nulls the whole query → empty voice → tools ask for info / hallucinate).
  // Location lives in `location` only.
  const { data: p, error } = await admin
    .from("influencer_profiles")
    .select(
      "full_name, username, instagram_handle, categories, content_languages, location, bio, followers_count, engagement_rate, audience_demographics, top_reels, service_rates",
    )
    .eq("influencer_id", userId)
    .maybeSingle();
  if (error) console.error("buildCreatorVoice select failed:", error.message);
  if (!p) return null;

  const arr = (v: any): string[] => (Array.isArray(v) ? v.map(String).filter(Boolean) : []);
  const demo = p.audience_demographics || {};
  const topCity = Array.isArray(demo.topCities) && demo.topCities[0]?.name ? demo.topCities[0].name : "";
  const topAge = Array.isArray(demo.ageRanges) && demo.ageRanges[0]?.range ? demo.ageRanges[0].range : "";
  const genderF = demo.gender?.female ?? demo.gender?.F;
  const audienceBits = [
    topCity && `mostly ${topCity}`,
    topAge && `${topAge} age band`,
    typeof genderF === "number" && `${Math.round(genderF)}% female`,
  ].filter(Boolean);

  const captions = arr((p.top_reels || []).map((r: any) => r?.caption)).slice(0, 5);
  const rates = p.service_rates || {};

  return {
    name: p.full_name || "",
    handle: p.instagram_handle || p.username || "",
    categories: arr(p.categories),
    languages: arr(p.content_languages),
    city: p.location || "",
    bio: p.bio || "",
    followers: p.followers_count || 0,
    engagementRate: typeof p.engagement_rate === "number" ? p.engagement_rate : null,
    audience: audienceBits.join(", "),
    sampleCaptions: captions,
    reelRate: typeof rates.reels === "number" ? rates.reels : Number(rates.reels) || null,
  };
}

export function voiceToPrompt(v: CreatorVoice): string {
  const lines = [
    `CREATOR: ${v.name}${v.handle ? ` (@${v.handle})` : ""}`,
    v.categories.length && `NICHE: ${v.categories.join(", ")}`,
    v.languages.length && `LANGUAGES: ${v.languages.join(", ")}`,
    v.city && `BASED IN: ${v.city}`,
    v.followers && `FOLLOWERS: ${v.followers}`,
    v.engagementRate != null && `ENGAGEMENT RATE: ${v.engagementRate}%`,
    v.audience && `AUDIENCE: ${v.audience}`,
    v.bio && `BIO: ${v.bio}`,
    v.sampleCaptions.length && `PAST CAPTIONS (match this voice):\n- ${v.sampleCaptions.join("\n- ")}`,
  ].filter(Boolean);
  return lines.join("\n");
}
