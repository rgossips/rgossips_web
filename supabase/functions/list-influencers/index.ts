import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Registered influencers
    const profilesRes = await supabase
      .from("influencer_profiles")
      .select("*")
      .order("followers_count", { ascending: false })
      .limit(500);

    if (profilesRes.error) {
      return new Response(
        JSON.stringify({ error: profilesRes.error.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Admin-invited (not yet registered) influencers
    const invitesRes = await supabase
      .from("influencer_invitations")
      .select("*")
      .eq("status", "pending")
      .limit(500);

    const profiles = (profilesRes.data || []).map((r: any) => ({
      influencer_id: r.influencer_id,
      full_name: r.full_name || "",
      username: r.username || "",
      instagram_handle: r.instagram_handle || "",
      profile_photo_url: r.custom_profile_photo_url || r.profile_photo_url || "",
      followers_count: r.followers_count || 0,
      follows_count: r.follows_count || 0,
      media_count: r.media_count || 0,
      categories: r.categories || [],
      city: r.city || r.location || "",
    }));

    // The admin form packs the extras (categories, city, gender, languages,
    // and a display string for followers like "1.4M") into a JSON blob on
    // influencer_invitations.notes — they aren't top-level columns. Parse it
    // here so the brand-side search surfaces them.
    const parseFollowerString = (s: any): number => {
      if (s == null) return 0;
      if (typeof s === "number") return s;
      const raw = String(s).trim().toLowerCase().replace(/,/g, "");
      const num = parseFloat(raw);
      if (!Number.isFinite(num)) return 0;
      if (raw.endsWith("m")) return Math.round(num * 1_000_000);
      if (raw.endsWith("k")) return Math.round(num * 1_000);
      return Math.round(num);
    };

    const parseNotes = (notes: any) => {
      if (!notes) return {};
      if (typeof notes === "object") return notes;
      try {
        return JSON.parse(notes);
      } catch {
        return {};
      }
    };

    const invites = (invitesRes.data || []).map((r: any) => {
      const meta = parseNotes(r.notes);
      return {
        // Prefix invitation IDs to avoid collisions with registered profiles
        influencer_id: `inv_${r.id}`,
        full_name: r.full_name || "",
        username: r.instagram_username || "",
        instagram_handle: r.instagram_username || "",
        profile_photo_url: r.profile_photo_url || "",
        followers_count: parseFollowerString(meta.followers ?? r.followers_count),
        follows_count: r.follows_count || 0,
        media_count: r.media_count || 0,
        categories: Array.isArray(meta.categories) ? meta.categories : [],
        city: meta.city || r.city || "",
      };
    });

    // Merge, de-dupe by instagram_handle (registered wins)
    const seen = new Set<string>();
    const merged: any[] = [];
    for (const row of [...profiles, ...invites]) {
      const key = (row.instagram_handle || row.username || row.influencer_id).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }

    // Sort by followers desc
    merged.sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0));

    return new Response(
      JSON.stringify({ influencers: merged }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Internal server error: " + ((err as any)?.message || String(err)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
