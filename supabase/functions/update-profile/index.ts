import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { userId, table, ...fields } = await req.json();

    if (!userId || !table) {
      return new Response(
        JSON.stringify({ error: "userId and table are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    if (table !== "influencer_profiles" && table !== "brand_profiles") {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const idCol = table === "brand_profiles" ? "brand_id" : "influencer_id";

    // Build update object from provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (fields.categories !== undefined) updateData.categories = fields.categories;
    if (fields.services !== undefined) updateData.services = fields.services;
    if (fields.notificationsEnabled !== undefined) updateData.notifications_enabled = fields.notificationsEnabled;

    // Also support updating basic profile fields
    if (fields.name !== undefined) updateData.full_name = fields.name;
    if (fields.username !== undefined) updateData.username = fields.username;
    if (fields.instagram !== undefined) updateData.instagram_handle = fields.instagram;
    if (fields.profilePictureUrl !== undefined) updateData.profile_photo_url = fields.profilePictureUrl;
    if (fields.followersCount !== undefined) updateData.followers_count = fields.followersCount;
    if (fields.followsCount !== undefined) updateData.follows_count = fields.followsCount;
    if (fields.mediaCount !== undefined) updateData.media_count = fields.mediaCount;
    if (fields.subscriptionPlan !== undefined) updateData.subscription_plan = fields.subscriptionPlan;
    if (fields.billingCycle !== undefined) updateData.billing_cycle = fields.billingCycle;
    if (fields.bio !== undefined) updateData.bio = fields.bio;
    if (fields.mediaKitPublished !== undefined) updateData.media_kit_published = fields.mediaKitPublished;
    if (fields.customProfilePhotoUrl !== undefined) updateData.custom_profile_photo_url = fields.customProfilePhotoUrl || null;
    if (fields.location !== undefined) updateData.location = fields.location;
    if (fields.email !== undefined) updateData.email = fields.email;
    if (fields.phone !== undefined) updateData.phone = fields.phone;
    if (fields.address !== undefined) updateData.address = fields.address;
    if (fields.serviceRates !== undefined) updateData.service_rates = fields.serviceRates;
    if (fields.tiktokUrl !== undefined) updateData.tiktok_url = fields.tiktokUrl;
    if (fields.youtubeUrl !== undefined) updateData.youtube_url = fields.youtubeUrl;
    if (fields.facebookUrl !== undefined) updateData.facebook_url = fields.facebookUrl;
    if (fields.instagramAccessToken !== undefined) updateData.instagram_access_token = fields.instagramAccessToken;
    if (fields.instagramTokenExpiresAt !== undefined) updateData.instagram_token_expires_at = fields.instagramTokenExpiresAt;
    if (fields.topReels !== undefined) updateData.top_reels = fields.topReels;

    const { error: dbError } = await supabaseAdmin
      .from(table)
      .update(updateData)
      .eq(idCol, userId);

    if (dbError) {
      console.error("DB Error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile: " + dbError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error: " + (err?.message || String(err)) }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
