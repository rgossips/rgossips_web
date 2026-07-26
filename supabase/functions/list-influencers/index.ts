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
    // Pagination bounds. Default = 50 (brands find-creators paginates
    // with a Load More button). MAX_LIMIT is the hard ceiling per call
    // — bumped from 500 to 2000 for the "list everything" callers
    // (BrandsCarousel, TopPicksCarousel etc.) that don't paginate yet.
    const MAX_LIMIT = 2000;
    let limit = 50;
    let offset = 0;
    let q = "";
    // Filters bundle — keys match the FilterDrawer's group names
    // normalised to snake_case. Each value is an array of accepted
    // strings. Empty / missing arrays mean "don't filter on that key".
    let filters: {
      categories?: string[];
      followerBuckets?: string[];
      locations?: string[];
      genders?: string[];
      profileTypes?: string[];
      languages?: string[];
    } = {};
    let sort: "followers_desc" | "followers_asc" | "alpha" = "followers_desc";
    try {
      const body = await req.json();
      if (Number.isFinite(body?.limit)) limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(body.limit)));
      if (Number.isFinite(body?.offset)) offset = Math.max(0, Math.floor(body.offset));
      if (typeof body?.q === "string") q = body.q.trim().toLowerCase();
      if (body?.filters && typeof body.filters === "object") filters = body.filters;
      if (body?.sort === "followers_asc" || body?.sort === "alpha") sort = body.sort;
    } catch {
      // No body / not JSON → defaults.
    }

    // Follower / creator-type bucket → [min, max) range table.
    // Mirrors src/app/brands/search/page.js so the two stay consistent.
    const FOLLOWER_RANGES: Record<string, [number, number]> = {
      "0 - 10k": [0, 10_000],
      "10k - 50k": [10_000, 50_000],
      "50k - 100k": [50_000, 100_000],
      "100k - 500k": [100_000, 500_000],
      "500k - 1M": [500_000, 1_000_000],
      "1M+": [1_000_000, Number.POSITIVE_INFINITY],
      Nano: [0, 10_000],
      Micro: [10_000, 100_000],
      Macro: [100_000, 1_000_000],
      Mega: [1_000_000, Number.POSITIVE_INFINITY],
    };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Paginate so we don't silently cap large directories at 500 rows.
    // Supabase REST defaults to 1000 max per page; we walk until exhausted.
    // Explicit column lists — select("*") was pulling EVERY column of
    // every profile into function memory per request, including
    // instagram_access_token (never returned, but a needless secret in
    // the hot path) and heavy jsonb blobs. Trimming the select cuts the
    // Postgres→function payload to roughly a quarter.
    // NOTE: `languages` is NOT a column on influencer_profiles — the
    // Content Language data only exists on invitation notes. The old
    // select("*") masked this (r.languages was just undefined).
    const PROFILE_COLS =
      "influencer_id, full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url, followers_count, follows_count, media_count, categories, location, services, service_rates, gender, creator_type, content_languages, media_kit_published, status";
    const PAGE = 1000;
    const pageThrough = async (
      table: string,
      build: (q: any) => any,
      cols = "*",
    ): Promise<any[]> => {
      const out: any[] = [];
      for (let from = 0; ; from += PAGE) {
        const q = build(supabase.from(table).select(cols)).range(from, from + PAGE - 1);
        const { data, error } = await q;
        if (error) throw error;
        if (!data || data.length === 0) break;
        out.push(...data);
        if (data.length < PAGE) break;
      }
      return out;
    };

    // Registered influencers. Status filtering happens in SQL now —
    // deactivated/pending_deletion rows never leave Postgres.
    let profilesData: any[];
    try {
      profilesData = await pageThrough(
        "influencer_profiles",
        (q) =>
          q
            .not("status", "in", "(deactivated,pending_deletion)")
            .order("followers_count", { ascending: false }),
        PROFILE_COLS,
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
      invitesData = await pageThrough(
        "influencer_invitations",
        (q) => q.eq("status", "pending"),
        "id, full_name, instagram_username, profile_photo_url, notes, status",
      );
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
      // Registered influencers store content languages in the
      // `content_languages` text[] column (invited stubs fall back to
      // invitation-notes `meta.languages`, mapped further down).
      languages: Array.isArray(r.content_languages) ? r.content_languages : [],
      creator_type: r.creator_type || "",
      // B4 — the client only renders the media-kit action when a kit
      // actually exists; otherwise /kit/<handle> would 404.
      media_kit_published: !!r.media_kit_published,
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

    // Apply search + filters BEFORE sort + slice, so the page always
    // returns a full 50 matching rows when there's more data behind it.
    // Free-text search matches name / username / instagram handle AND
    // (B3) categories + city — the search placeholder promises "name,
    // username or category" so a "beauty" query must hit the Beauty &
    // Skincare creators, not just people with beauty in their name.
    let filtered = merged;
    if (q) {
      filtered = filtered.filter((r: any) => {
        const cats = Array.isArray(r.categories) ? r.categories.join(" ") : "";
        const hay = `${r.full_name || ""} ${r.username || ""} ${r.instagram_handle || ""} ${cats} ${r.city || ""}`.toLowerCase();
        return hay.includes(q);
      });
    }
    if (filters.categories?.length) {
      const wanted = new Set(filters.categories);
      filtered = filtered.filter((r: any) =>
        Array.isArray(r.categories) && r.categories.some((c: string) => wanted.has(c)),
      );
    }
    // Follower Count buckets — accepts both the FilterDrawer's chip
    // labels (e.g. "10k - 50k") and the Creator Type synonyms
    // (Nano/Micro/Macro/Mega). Server treats them as a union.
    const followerBuckets = [
      ...(filters.followerBuckets || []),
    ];
    if (followerBuckets.length) {
      const ranges = followerBuckets
        .map((b) => FOLLOWER_RANGES[b])
        .filter(Boolean) as [number, number][];
      if (ranges.length) {
        filtered = filtered.filter((r: any) => {
          const n = r.followers_count || 0;
          return ranges.some(([lo, hi]) => n >= lo && n < hi);
        });
      }
    }
    if (filters.locations?.length) {
      const wanted = filters.locations.map((s) => s.toLowerCase());
      filtered = filtered.filter((r: any) => {
        const city = (r.city || "").toLowerCase();
        if (!city) return false;
        return wanted.some((l) => city.includes(l) || l.includes(city));
      });
    }
    if (filters.genders?.length) {
      const wanted = filters.genders.map((s) => s.toLowerCase());
      filtered = filtered.filter((r: any) => {
        const g = (r.gender || "").toLowerCase();
        if (!g) return false;
        return wanted.some((s) => {
          if (s.startsWith("male")) return g === "male" || g === "m";
          if (s.startsWith("female")) return g === "female" || g === "f";
          return g.includes(s) || s.includes(g);
        });
      });
    }
    if (filters.profileTypes?.length) {
      // Client sends the DB enum value directly (meme_page / celebrity).
      const wanted = new Set(filters.profileTypes.map((s) => s.toLowerCase()));
      filtered = filtered.filter((r: any) => {
        const stored = (r.creator_type || "").toLowerCase();
        if (!stored) return false;
        return wanted.has(stored);
      });
    }
    if (filters.languages?.length) {
      const wanted = filters.languages.map((s) => s.toLowerCase());
      filtered = filtered.filter((r: any) => {
        const langs = Array.isArray(r.languages) ? r.languages.map((s: any) => String(s).toLowerCase()) : [];
        if (langs.length === 0) return false;
        return wanted.some((sel) => langs.some((il: string) => il.includes(sel) || sel.includes(il)));
      });
    }

    // Sort the filtered set. followers_desc is the default; alpha and
    // followers_asc are the FilterDrawer's other two options.
    if (sort === "followers_asc") {
      // True low-to-high on follower count. Only un-enriched INVITATION stubs
      // (inv_* ids, no synced IG data) sink to the bottom so they don't dominate
      // the top — a REGISTERED creator who genuinely has 0 followers sorts
      // normally (at the top), which is what low-to-high should show.
      const key = (r: any) => {
        const n = Number(r.followers_count) || 0;
        if (n > 0) return n;
        return String(r.influencer_id || "").startsWith("inv_") ? Number.POSITIVE_INFINITY : 0;
      };
      filtered.sort((a: any, b: any) => key(a) - key(b));
    } else if (sort === "alpha") {
      filtered.sort((a: any, b: any) =>
        (a.full_name || a.username || "").localeCompare(b.full_name || b.username || ""),
      );
    } else {
      filtered.sort((a: any, b: any) => (b.followers_count || 0) - (a.followers_count || 0));
    }

    // Slice to the requested page. We return `total` so the client can
    // paginate intelligently (e.g. show "showing 25 of 412 creators").
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({ influencers: page, total, limit, offset }),
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
