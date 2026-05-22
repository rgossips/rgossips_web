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
    const { userId, table, phone, name, username, instagram, profilePictureUrl, followersCount, followsCount, mediaCount, instagramAccessToken, instagramTokenExpiresAt, gstinData, gstin, invitationId } = await req.json();

    if (!userId || !table) {
      return new Response(
        JSON.stringify({ error: "userId and table are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Only allow known tables
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

    // Download Instagram profile picture and store in Supabase Storage (they expire otherwise)
    let storedProfilePictureUrl = profilePictureUrl || "";
    if (profilePictureUrl && (profilePictureUrl.includes("cdninstagram.com") || profilePictureUrl.includes("fbcdn.net"))) {
      try {
        const bucket = table === "influencer_profiles" ? "influencer-photos" : "brand-icons";
        await supabaseAdmin.storage.createBucket(bucket, { public: true, fileSizeLimit: 5 * 1024 * 1024, allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"] });

        const imgRes = await fetch(profilePictureUrl);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const buffer = new Uint8Array(await imgRes.arrayBuffer());
          const path = `profiles/${userId}.jpg`;
          const { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, { contentType, upsert: true });
          if (!uploadErr) {
            const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
            storedProfilePictureUrl = data.publicUrl;
          }
        }
      } catch (e) {
        console.error("Profile picture migration failed:", e);
        // Keep the original URL as fallback
      }
    }

    // Build the row based on table schema
    let row: Record<string, unknown>;

    if (table === "influencer_profiles") {
      row = {
        influencer_id: userId,
        full_name: name || "",
        username: username || instagram || "",
        instagram_handle: instagram || "",
        profile_photo_url: storedProfilePictureUrl,
        followers_count: followersCount || 0,
        follows_count: followsCount || 0,
        media_count: mediaCount || 0,
        instagram_access_token: instagramAccessToken || null,
        instagram_token_expires_at: instagramTokenExpiresAt || null,
        status: "active",
        updated_at: new Date().toISOString(),
      };
    } else {
      // brand_profiles
      // gstin can arrive either as a verified blob (legacy `gstinData`) or as
      // a plain user-entered string (`gstin`). Prefer the structured one so
      // re-using older clients keeps populating the metadata columns.
      const gstinValue = gstinData?.gstin || (gstin ? String(gstin).toUpperCase().trim() : "");
      row = {
        brand_id: userId,
        brand_name: gstinData?.tradeName || name || "",
        contact_name: name || "",
        contact_email: "",
        contact_phone: phone || "",
        instagram_username: instagram || "",
        logo_url: storedProfilePictureUrl,
        gstin: gstinValue,
        gstin_legal_name: gstinData?.legalName || "",
        gstin_trade_name: gstinData?.tradeName || "",
        gstin_business_type: gstinData?.businessType || "",
        gstin_status: gstinData?.gstStatus || "",
        gstin_registration_date: gstinData?.registrationDate || "",
        gstin_address: gstinData?.address || "",
        gstin_state: gstinData?.state || "",
        gstin_pincode: gstinData?.pincode || "",
        status: "active",
        updated_at: new Date().toISOString(),
      };
    }

    // Brands that sign up directly are verified by default
    // (they've already verified GSTIN + phone OTP during signup)
    if (table === "brand_profiles") {
      row.verification_status = "verified";
      row.is_verified = true;
      if (invitationId) {
        row.source = "admin_invited";
      } else {
        row.source = "direct_signup";
      }
    }

    const { error: dbError } = await supabaseAdmin.from(table).upsert(row);

    if (dbError) {
      console.error("DB Error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to create profile: " + dbError.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Clean up the leads entry — this number has now graduated from "tried to
    // sign in" to "actual user". Phone is stored without '+' in leads.
    if (phone) {
      try {
        const leadDigits = String(phone).replace(/\D/g, "");
        const leadPhone = leadDigits.startsWith("91") ? leadDigits : `91${leadDigits.slice(-10)}`;
        await supabaseAdmin.from("leads").delete().eq("phone", leadPhone);
      } catch (e) {
        console.error("Lead cleanup failed (non-fatal):", e);
      }
    }

    // Trigger Instagram refresh to populate engagement data immediately
    if (table === "influencer_profiles" && instagramAccessToken) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await fetch(`${supabaseUrl}/functions/v1/refresh-instagram`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
          body: JSON.stringify({ userId }),
        });
      } catch (e) {
        console.error("Background Instagram refresh failed:", e);
        // Non-blocking — profile is still created
      }
    }

    // Claim invitations on signup and migrate campaigns
    const igUsername = instagram || "";
    if (table === "brand_profiles") {
      const claimData = { status: "claimed", claimed_by: userId, claimed_at: new Date().toISOString(), brand_profile_id: userId };
      let claimedInvId: string | null = invitationId || null;

      if (invitationId) {
        await supabaseAdmin.from("brand_invitations").update(claimData).eq("id", invitationId).eq("status", "pending");
      } else if (igUsername) {
        // Find and claim by username
        const { data: inv } = await supabaseAdmin.from("brand_invitations").select("id").ilike("instagram_username", igUsername).eq("status", "pending").limit(1).single();
        if (inv) {
          claimedInvId = inv.id;
          await supabaseAdmin.from("brand_invitations").update(claimData).eq("id", inv.id);
        }
      }

      // Migrate any campaigns created for this invitation to the real brand_id
      if (claimedInvId) {
        await supabaseAdmin.from("campaigns").update({ brand_id: userId }).eq("brand_invitation_id", claimedInvId).is("brand_id", null);
      }
    } else if (table === "influencer_profiles") {
      const claimData = { status: "claimed", claimed_by: userId, claimed_at: new Date().toISOString(), influencer_profile_id: userId };
      if (invitationId) {
        await supabaseAdmin.from("influencer_invitations").update(claimData).eq("id", invitationId).eq("status", "pending");
      } else if (igUsername) {
        await supabaseAdmin.from("influencer_invitations").update(claimData).ilike("instagram_username", igUsername).eq("status", "pending");
      }
    }

    // Send welcome notification — tailored per role
    try {
      const isBrand = table === "brand_profiles";
      const greeting = name ? `Hey ${name}!` : "Welcome!";
      const welcomeText = isBrand
        ? `${greeting} Get bunch of influencers to promote your brand — post your first campaign to get started.`
        : `${greeting} Your account is ready. Complete your profile to start getting brand deals.`;
      const welcomeLink = isBrand ? "/brands/campaigns" : "/influencer";

      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        type: "welcome",
        title: "Welcome to RGossips! 🎉",
        body: JSON.stringify({ text: welcomeText, link: welcomeLink }),
        is_read: false,
      });
    } catch (e) {
      console.error("Failed to send welcome notification:", e);
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
