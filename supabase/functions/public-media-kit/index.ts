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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Try influencer profile first
    const { data: influencer, error: infError } = await supabaseAdmin
      .from("influencer_profiles")
      .select(
        "full_name, username, instagram_handle, profile_photo_url, custom_profile_photo_url, followers_count, follows_count, media_count, categories, services, bio, created_at, service_rates, location, email, phone, tiktok_url, youtube_url, facebook_url"
      )
      .eq("influencer_id", userId)
      .maybeSingle();

    if (influencer) {
      const profile = {
        fullName: influencer.full_name,
        username: influencer.username,
        instagramHandle: influencer.instagram_handle,
        profilePhotoUrl: influencer.profile_photo_url,
        customProfilePhotoUrl: influencer.custom_profile_photo_url,
        followersCount: influencer.followers_count,
        followsCount: influencer.follows_count,
        mediaCount: influencer.media_count,
        categories: influencer.categories,
        services: influencer.services,
        bio: influencer.bio,
        createdAt: influencer.created_at,
        serviceRates: influencer.service_rates,
        location: influencer.location,
        email: influencer.email,
        phone: influencer.phone,
        tiktokUrl: influencer.tiktok_url,
        youtubeUrl: influencer.youtube_url,
        facebookUrl: influencer.facebook_url,
      };
      return new Response(
        JSON.stringify({ profile, role: "influencer" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Try brand profile
    const { data: brand, error: brandError } = await supabaseAdmin
      .from("brand_profiles")
      .select(
        "brand_name, contact_name, logo_url, instagram_username, gstin_trade_name, categories, created_at"
      )
      .eq("brand_id", userId)
      .maybeSingle();

    if (brand) {
      return new Response(
        JSON.stringify({
          profile: {
            full_name: brand.gstin_trade_name || brand.brand_name || brand.contact_name,
            profile_photo_url: brand.logo_url,
            instagram_handle: brand.instagram_username,
            categories: brand.categories,
          },
          role: "brand",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Profile not found" }),
      { status: 404, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
