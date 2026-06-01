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

    // Paginate so we don't silently cap large directories at 500 rows.
    // Supabase REST defaults to 1000 max per page; we walk until exhausted.
    const PAGE = 1000;
    const pageThrough = async (
      table: string,
      build: (q: any) => any,
    ): Promise<any[]> => {
      const out: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const q = build(supabase.from(table).select("*")).range(from, from + PAGE - 1);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) break;
        out.push(...data);
        if (data.length < PAGE) break;
      }
      return out;
    };

    // Registered influencers
    let profilesData: any[];
    try {
      profilesData = await pageThrough("influencer_profiles", (q) =>
        q.order("followers_count", { ascending: false })
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: e?.message || "Failed to load profiles" }),
        { status: 200, headers: jsonHeaders }
      );
    }
    const profilesRes = { data: profilesData };

    // Honour the "Public Profile" toggle from Privacy & Security
    // (user_preferences.privacy_prefs.publicProfile). When false, the
    // creator should be invisible to brand search. We default to public
    // so creators who never opened the setting page are still listed —
    // matches the DEFAULT_PREFS shape in src/components/PrivacySettings.jsx.
    const privateIds = new Set<string>();
    try {
      const prefRows = await pageThrough("user_preferences", (q) =>
        q.select("user_id, privacy_prefs")
      );
      for (const r of prefRows as any[]) {
        if (r?.privacy_prefs && r.privacy_prefs.publicProfile === false) {
          privateIds.add(String(r.user_id));
        }
      }
    } catch (e) {
      // Pref lookup is best-effort — if it fails we fall back to "everyone
      // visible" rather than denying the whole directory.
      console.error("user_preferences page error:", e);
    }
    // Build a handle-blocklist *before* we drop rows from profilesData, so
    // we can also suppress any orphan invitation row for the same creator
    // — otherwise hiding the registered profile would just unveil the
    // pre-signup invitation row in the merge step below.
    const hiddenHandles = new Set<string>();
    if (privateIds.size > 0) {
      for (const r of profilesData) {
        if (privateIds.has(String(r.influencer_id))) {
          const h = (r.instagram_handle || r.username || "").toLowerCase().trim();
          if (h) hiddenHandles.add(h);
        }
      }
      profilesData = profilesData.filter((r) => !privateIds.has(String(r.influencer_id)));
      // profilesRes was built before the filter ran, so its `.data`
      // reference still pointed at the unfiltered array. Re-sync it so the
      // .map below sees the filtered list.
      profilesRes.data = profilesData;
    }

    // Admin-invited (not yet registered) influencers
    let invitesData: any[] = [];
    try {
      invitesData = await pageThrough("influencer_invitations", (q) => q.eq("status", "pending"));
    } catch (e) {
      console.error("invitations page error:", e);
    }
    const invitesRes = { data: invitesData };

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
      // Surface the rate card so the brand-side Pocket Friendly Creators
      // section can filter by reel price. Values are strings on the
      // influencer side; consumers should Number()-coerce before compare.
      services: r.services || [],
      service_rates: r.service_rates || {},
      // Gender + languages power the brand-side search filters.
      gender: r.gender || "",
      languages: Array.isArray(r.languages) ? r.languages : [],
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

    const invites = (invitesRes.data || [])
      // Drop any invitation whose handle belongs to a creator we just hid
      // for privacy — otherwise the pre-signup invite row would still
      // surface them on the brand-side directory.
      .filter((r: any) => {
        const h = String(r.instagram_username || "").toLowerCase().trim();
        return !hiddenHandles.has(h);
      })
      .map((r: any) => {
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
        // Admin bulk-invite form packs gender + languages into the notes
        // blob (see admin actions.ts), so surface them the same way.
        gender: meta.gender || "",
        languages: Array.isArray(meta.languages) ? meta.languages : [],
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
