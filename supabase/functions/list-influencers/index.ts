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

    // Try selecting all columns — schema may or may not include `city`, so
    // use `*` to avoid the whole query failing if a column is missing.
    const { data, error } = await supabase
      .from("influencer_profiles")
      .select("*")
      .order("followers_count", { ascending: false })
      .limit(500);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Normalize shape for the frontend
    const influencers = (data || []).map((r: any) => ({
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
      status: r.status || "active",
    }));

    return new Response(
      JSON.stringify({ influencers }),
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
