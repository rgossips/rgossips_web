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

    // Special action: restore the original Instagram-derived brand logo.
    // create-profile stores the IG picture at brand-icons/profiles/{userId}.jpg
    // during signup — we check whether that file still exists and, if so,
    // set logo_url back to its public URL.
    if (table === "brand_profiles" && fields.revertBrandLogo === true) {
      const { data: list } = await supabaseAdmin.storage
        .from("brand-icons")
        .list("profiles", { search: `${userId}.jpg` });

      const hasOriginal = Array.isArray(list) && list.some((f: any) => f?.name === `${userId}.jpg`);

      if (!hasOriginal) {
        return new Response(
          JSON.stringify({ error: "No original logo available to revert to." }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("brand-icons")
        .getPublicUrl(`profiles/${userId}.jpg`);
      // Cache-bust so the browser refreshes even when the URL matches
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: revertErr } = await supabaseAdmin
        .from("brand_profiles")
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq("brand_id", userId);

      if (revertErr) {
        return new Response(
          JSON.stringify({ error: "Failed to revert: " + revertErr.message }),
          { status: 200, headers: jsonHeaders }
        );
      }

      return new Response(
        JSON.stringify({ success: true, logoUrl }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Build update object from provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (fields.categories !== undefined) updateData.categories = fields.categories;
    if (fields.services !== undefined) updateData.services = fields.services;
    if (fields.notificationsEnabled !== undefined) updateData.notifications_enabled = fields.notificationsEnabled;
    if (fields.welcomeRewardSeen !== undefined) updateData.welcome_reward_seen = !!fields.welcomeRewardSeen;

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
    // Bio is capped at 500 chars everywhere (matches the media-kit editor's
    // maxLength) — enforce it here too so AI-applied / API bios can't exceed it.
    if (fields.bio !== undefined) updateData.bio = fields.bio == null ? fields.bio : String(fields.bio).slice(0, 500);
    if (fields.mediaKitPublished !== undefined) updateData.media_kit_published = fields.mediaKitPublished;
    // Media-kit template change is plan-gated and counted server-side so a
    // determined client can't bypass the cap. Starter → Classic only;
    // Pro → all 5 with a 3-save lifetime cap; Elite → unlimited.
    // Trial users inherit Pro (mirrors getEffectivePlan on the client).
    if (table === "influencer_profiles" && fields.mediaKitTemplate !== undefined) {
      const nextTemplate = String(fields.mediaKitTemplate || "classic");

      const TEMPLATE_MIN_PLAN: Record<string, "starter" | "pro" | "elite"> = {
        classic: "starter",
        glass_blue: "pro",
        editorial_noir: "pro",
        // Bento Sunset + Neo-Brutalist are Elite-only — Pro is capped at
        // the first three designs. Keep this map in sync with
        // MEDIA_KIT_TEMPLATES in src/lib/plans.js.
        bento_sunset: "elite",
        neo_brutalist: "elite",
      };
      const PLAN_RANK: Record<string, number> = { starter: 1, pro: 2, elite: 3 };
      const TEMPLATE_LIMITS: Record<string, number> = { starter: 0, pro: 3, elite: Infinity };

      const { data: current } = await supabaseAdmin
        .from("influencer_profiles")
        .select("subscription_plan, media_kit_template, media_kit_template_changes, created_at")
        .eq("influencer_id", userId)
        .maybeSingle();

      // Trial users (no explicit plan, within 30 days of signup) get Pro
      // perks, matching getEffectivePlan on the client.
      const TRIAL_DAYS = 30;
      const createdMs = current?.created_at ? new Date(current.created_at).getTime() : 0;
      const inTrial = createdMs > 0 && (Date.now() - createdMs) / 86_400_000 < TRIAL_DAYS;
      const rawPlan = String(current?.subscription_plan || "").toLowerCase();
      const effectivePlan = rawPlan === "pro" || rawPlan === "elite" || rawPlan === "starter"
        ? rawPlan
        : inTrial ? "pro" : "starter";

      const requiredRank = PLAN_RANK[TEMPLATE_MIN_PLAN[nextTemplate] || "starter"] || 0;
      if ((PLAN_RANK[effectivePlan] || 0) < requiredRank) {
        return new Response(
          JSON.stringify({ error: `Your plan doesn't include the "${nextTemplate}" template. Upgrade to unlock it.` }),
          { status: 200, headers: jsonHeaders }
        );
      }

      const limit = TEMPLATE_LIMITS[effectivePlan] ?? 0;
      const used = current?.media_kit_template_changes || 0;
      const sameAsCurrent = current?.media_kit_template === nextTemplate;
      // Re-selecting the template you're already on is a no-op — don't burn
      // a change. Only a real switch increments the counter.
      if (!sameAsCurrent && isFinite(limit) && used >= limit) {
        return new Response(
          JSON.stringify({
            error: `You've used your ${limit} template change${limit === 1 ? "" : "s"} on the Pro plan. Upgrade to Elite for unlimited switches.`,
            templateChangesUsed: used,
            templateChangesLimit: limit,
          }),
          { status: 200, headers: jsonHeaders }
        );
      }

      updateData.media_kit_template = nextTemplate;
      if (!sameAsCurrent) {
        updateData.media_kit_template_changes = used + 1;
      }
    }
    if (fields.customProfilePhotoUrl !== undefined) updateData.custom_profile_photo_url = fields.customProfilePhotoUrl || null;
    if (fields.location !== undefined) updateData.location = fields.location;
    // Content languages the creator publishes in (text[]). Coerce to an array
    // of trimmed non-empty strings; anything else becomes an empty array.
    if (fields.contentLanguages !== undefined) {
      updateData.content_languages = Array.isArray(fields.contentLanguages)
        ? fields.contentLanguages.map((l: unknown) => String(l).trim()).filter(Boolean)
        : [];
    }
    // Gender — self-service (previously only admin could set it). Allow-
    // listed to the values the brand-side Gender filter understands;
    // anything else (including "") clears the field.
    if (fields.gender !== undefined) {
      const g = String(fields.gender || "").toLowerCase();
      const ALLOWED_GENDERS = new Set(["male", "female", "non_binary", "prefer_not_to_say"]);
      updateData.gender = ALLOWED_GENDERS.has(g) ? g : null;
    }
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

    // Brand-specific columns
    if (table === "brand_profiles") {
      if (fields.brandName !== undefined) updateData.brand_name = fields.brandName;
      if (fields.contactName !== undefined) updateData.contact_name = fields.contactName;
      if (fields.contactEmail !== undefined) updateData.contact_email = fields.contactEmail;
      if (fields.contactPhone !== undefined) updateData.contact_phone = fields.contactPhone;
      // Column is website_url — the old `website` mapping wrote to a
      // non-existent column and failed every save that included it.
      if (fields.website !== undefined) updateData.website_url = fields.website || null;
      // "About the brand" — shown to influencers on the brand page.
      if (fields.aboutBrand !== undefined) updateData.full_description = fields.aboutBrand ? String(fields.aboutBrand).slice(0, 1000) : null;
      if (fields.instagramUsername !== undefined) updateData.instagram_username = fields.instagramUsername;
      if (fields.logoUrl !== undefined) updateData.logo_url = fields.logoUrl || null;
      // GSTIN-derived display fields. We let the brand override these on
      // their profile because the autoverified values can be stale or
      // wrong; ops still has access to the raw `gstin` for audit.
      if (fields.gstinLegalName !== undefined) updateData.gstin_legal_name = fields.gstinLegalName;
      if (fields.gstinTradeName !== undefined) updateData.gstin_trade_name = fields.gstinTradeName;
      if (fields.gstinBusinessType !== undefined) updateData.gstin_business_type = fields.gstinBusinessType;
      if (fields.gstinAddress !== undefined) updateData.gstin_address = fields.gstinAddress;
      if (fields.gstinState !== undefined) updateData.gstin_state = fields.gstinState;
      if (fields.gstinPincode !== undefined) updateData.gstin_pincode = fields.gstinPincode;
      // `name` prop maps to brand_name for brands (frontend uses the same key)
      if (fields.name !== undefined) {
        updateData.brand_name = fields.name;
        delete updateData.full_name;
      }
    }

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
