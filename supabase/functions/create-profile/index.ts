import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Shared email helpers ───────────────────────────────────────────────
// Edge Functions can't share Deno code through the local FS easily, so the
// helpers are inlined in every function that needs them (create-profile,
// stripe-webhook, razorpay-webhook, send-account-event-email). Keep them
// byte-for-byte aligned across files — if you tweak one, mirror to the
// others or the brand will drift email-to-email.

async function invokeSendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}) {
  if (!opts.to) return;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      console.error("send-email skipped: missing SUPABASE_URL / SERVICE_ROLE_KEY");
      return;
    }
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(opts),
    });
    const data = await res.json();
    if (data?.error) console.error("send-email returned:", data.error);
  } catch (e) {
    console.error("send-email invocation failed:", (e as any)?.message);
  }
}

// Lightweight branded HTML wrapper. Tables / inline styles are used so
// the email looks consistent in Gmail, Outlook and Apple Mail. preheader
// is the hidden snippet inboxes show in the message-list preview.
function renderEmailHtml(o: {
  preheader?: string;
  title: string;
  body: string; // HTML
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const cta =
    o.ctaUrl && o.ctaLabel
      ? `<div style="margin:28px 0 8px;">
           <a href="${o.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#9810FA,#E60076);color:#ffffff !important;font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:14px;">${o.ctaLabel}</a>
         </div>`
      : "";
  const footer =
    o.footerNote ||
    "You're receiving this because you have an RGossips account. Questions? Just reply to this email.";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F7FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  ${o.preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;visibility:hidden;">${o.preheader}</div>` : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F8F7FB;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#ffffff;border:1px solid #f1f5f9;border-radius:20px;padding:32px;">
        <tr><td>
          <div style="font-weight:900;font-size:18px;letter-spacing:-0.3px;background:linear-gradient(135deg,#9810FA,#E60076);-webkit-background-clip:text;background-clip:text;color:#9810FA;margin-bottom:18px;">RGossips</div>
          <h1 style="font-size:22px;font-weight:800;margin:0 0 14px;line-height:1.3;color:#0f172a;">${o.title}</h1>
          <div style="font-size:14px;line-height:1.65;color:#475569;">${o.body}</div>
          ${cta}
          <div style="font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:18px;margin-top:28px;line-height:1.6;">${footer}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Auth-user helpers (Option A: create the user here, atomically) ──────
// Direct calls to the GoTrue admin REST API with the service-role key.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function authAdminFetch(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { data, ok: res.ok, status: res.status };
}

// Find an existing auth user by phone (matches the '91…' / bare-10 / '+91…'
// variants GoTrue may hold).
async function findAuthUserByPhone(normalizedPhone: string): Promise<any | null> {
  const listRes = await authAdminFetch("users?page=1&per_page=1000");
  if (!listRes.ok) return null;
  return (
    (listRes.data?.users || []).find(
      (u: any) =>
        u.phone === normalizedPhone ||
        u.phone === normalizedPhone.slice(2) ||
        u.phone === `+${normalizedPhone}`
    ) || null
  );
}

// Issue a session for a user via the stable per-user password stored in
// app_metadata (same scheme as whatsapp-otp-verifier — never rotate it, or
// GoTrue invalidates other-device sessions).
async function issueSession(userId: string, normalizedPhone: string) {
  const userLookup = await authAdminFetch(`users/${userId}`);
  let sessionPassword: string | undefined =
    userLookup?.data?.app_metadata?.session_password;
  if (!sessionPassword) {
    sessionPassword = crypto.randomUUID();
    const setRes = await authAdminFetch(`users/${userId}`, "PUT", {
      password: sessionPassword,
      app_metadata: {
        ...(userLookup?.data?.app_metadata || {}),
        session_password: sessionPassword,
      },
    });
    if (!setRes.ok) return null;
  }
  const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SERVICE_ROLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ phone: normalizedPhone, password: sessionPassword }),
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) return null;
  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { table, phone, name, username, instagram, profilePictureUrl, followersCount, followsCount, mediaCount, instagramAccessToken, instagramTokenExpiresAt, gstinData, gstin, invitationId, referralCode, deviceFingerprint } = await req.json();
    // Signup IP — best-effort read from the edge proxy's forwarded-for
    // header. Forwarded on to attribute-referral for fraud attribution.
    const signupIp = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "";

    // Only allow known tables
    if (table !== "influencer_profiles" && table !== "brand_profiles") {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if (!phone) {
      return new Response(
        JSON.stringify({ error: "phone is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Option A: create the auth user here, atomically with the profile ──
    // The client no longer sends a userId — the signup verifier only proved
    // phone ownership (it stamped otp_verifications.verified_at) and created
    // NO auth user. We now (1) validate that proof, (2) create or reuse the
    // auth user, (3) write the profile, rolling the user back if that fails.
    const digits = String(phone).replace(/\D/g, "");
    const last10 = digits.slice(-10);
    const normalizedPhone = `91${last10}`;

    // (1) Proof-of-phone: a verified OTP row for this phone, minted within
    // the freshness window. Without it, refuse — nobody can create an
    // account for a phone they didn't just verify.
    const PROOF_MAX_AGE_MS = 30 * 60 * 1000;
    const proofCutoff = new Date(Date.now() - PROOF_MAX_AGE_MS).toISOString();
    const { data: proofRow } = await supabaseAdmin
      .from("otp_verifications")
      .select("id, verified_at")
      .eq("phone", normalizedPhone)
      .eq("verified", true)
      .gte("verified_at", proofCutoff)
      .order("verified_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!proofRow) {
      return new Response(
        JSON.stringify({
          error: "phone_not_verified",
          message: "Your phone verification has expired. Please verify your number again.",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // (2) Resolve the auth user. If one already exists for this phone AND it
    // has a profile in either table, this is a real duplicate — send them to
    // sign in. If it exists with NO profile (a legacy orphan from the old
    // flow), reuse it and heal. Otherwise create it fresh.
    let userId: string;
    let createdHere = false;
    const existingUser = await findAuthUserByPhone(normalizedPhone);
    if (existingUser) {
      const [{ data: infP }, { data: brP }] = await Promise.all([
        supabaseAdmin.from("influencer_profiles").select("influencer_id").eq("influencer_id", existingUser.id).maybeSingle(),
        supabaseAdmin.from("brand_profiles").select("brand_id").eq("brand_id", existingUser.id).maybeSingle(),
      ]);
      if (infP || brP) {
        return new Response(
          JSON.stringify({
            error: "already_registered",
            message: "This number is already registered. Please sign in instead.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      userId = existingUser.id; // orphan → reuse and heal
    } else {
      const createRes = await authAdminFetch("users", "POST", {
        phone: normalizedPhone,
        phone_confirm: true,
      });
      if (!createRes.ok || !createRes.data?.id) {
        // Race: another request created it between our lookup and now.
        const raced = await findAuthUserByPhone(normalizedPhone);
        if (!raced) {
          console.error("create-profile: auth user creation failed:", createRes.status, JSON.stringify(createRes.data));
          return new Response(
            JSON.stringify({ error: "Could not create your account. Please try again." }),
            { status: 200, headers: jsonHeaders }
          );
        }
        userId = raced.id;
      } else {
        userId = createRes.data.id;
        createdHere = true;
      }
    }

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

      // Carry the admin-curated classification from the pending invitation
      // onto the real profile row. The admin invite/edit forms pack
      // creator_type, categories, city, gender into influencer_invitations.
      // notes (JSON trailer); those become top-level columns here so the
      // brand-side directory (list-influencers) serves them from the
      // profile once claimed instead of losing them. Best-effort — a
      // missing/garbled invitation must never block signup.
      try {
        const igUser = instagram || username || "";
        let invNotes: any = null;
        if (invitationId) {
          const { data } = await supabaseAdmin
            .from("influencer_invitations")
            .select("notes")
            .eq("id", invitationId)
            .eq("status", "pending")
            .maybeSingle();
          invNotes = data?.notes ?? null;
        } else if (igUser) {
          const { data } = await supabaseAdmin
            .from("influencer_invitations")
            .select("notes")
            .ilike("instagram_username", igUser)
            .eq("status", "pending")
            .limit(1)
            .maybeSingle();
          invNotes = data?.notes ?? null;
        }
        if (invNotes) {
          let meta: any = {};
          if (typeof invNotes === "object") meta = invNotes;
          else { try { meta = JSON.parse(invNotes); } catch { meta = {}; } }
          if (meta.creator_type === "meme_page" || meta.creator_type === "celebrity") {
            row.creator_type = meta.creator_type;
          }
          if (Array.isArray(meta.categories) && meta.categories.length > 0) {
            row.categories = meta.categories;
          }
          if (typeof meta.gender === "string" && meta.gender) {
            row.gender = meta.gender;
          }
          // Admin packs city as a (possibly comma-joined) string; the
          // profile's scalar location column mirrors that format.
          if (typeof meta.city === "string" && meta.city) {
            row.location = meta.city;
          }
        }
      } catch (e) {
        console.error("Invitation metadata carry-over failed (non-fatal):", (e as any)?.message);
      }
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
        profile_photo_url: storedProfilePictureUrl,
        // IG OAuth columns — mandatory for new signups via migration 031.
        // Stays null only if the caller forgot to pass them (we'll catch
        // that via the InstagramRequiredGate on the dashboard).
        instagram_access_token: instagramAccessToken || null,
        instagram_token_expires_at: instagramTokenExpiresAt || null,
        followers_count: followersCount || 0,
        follows_count: followsCount || 0,
        media_count: mediaCount || 0,
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
      // Compensating rollback: if WE created the auth user this call, delete
      // it so a failed profile write can't leave an orphaned phone user.
      // (A reused legacy orphan is left alone — deleting it would be a
      // surprise removal of a pre-existing account.)
      if (createdHere) {
        try {
          await authAdminFetch(`users/${userId}`, "DELETE");
        } catch (e) {
          console.error("Rollback of auth user failed:", (e as any)?.message);
        }
      }
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

      // Welcome RC bonus. 50 RC lands the moment an influencer profile is
      // created, but stays locked for 30 days before it can be redeemed
      // — the lock discourages create-account/redeem/delete abuse. We
      // skip this if a WELCOME_BONUS row already exists for this user
      // (idempotent on retries / re-invocations of create-profile).
      try {
        const { data: existingBonus } = await supabaseAdmin
          .from("reward_credits_ledger")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "WELCOME_BONUS")
          .limit(1)
          .maybeSingle();
        if (!existingBonus) {
          const WELCOME_RC = 50;
          const now = new Date();
          const unlocksAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
          const { data: bal } = await supabaseAdmin
            .from("v_reward_credits_balance")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle();
          const newBalance = (bal?.balance || 0) + WELCOME_RC;
          await supabaseAdmin.from("reward_credits_ledger").insert({
            user_id: userId,
            delta_rc: WELCOME_RC,
            reason: "WELCOME_BONUS",
            balance_after: newBalance,
            unlocks_at: unlocksAt,
            expires_at: expiresAt,
            note: "Welcome bonus — unlocks after 30 days",
          });
        }
      } catch (e) {
        console.error("Welcome RC bonus insert failed (non-fatal):", (e as any)?.message);
      }

      // Refer & Earn attribution. Fire-and-forget — a bad referral
      // code (expired, self-referral, referrer cancelled) must never
      // block signup. attribute-referral itself is defensive.
      if (referralCode) {
        try {
          const url = `${Deno.env.get("SUPABASE_URL")!}/functions/v1/attribute-referral`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
            },
            body: JSON.stringify({
              userId,
              referralCode,
              deviceFingerprint: deviceFingerprint || null,
              signupIp: signupIp || null,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!data?.attributed) {
            console.log("attribute-referral skipped:", data?.reason);
          }
        } catch (e) {
          console.error("attribute-referral call failed:", (e as any)?.message || e);
        }
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

    // Welcome email — only if we have an email to send to. New phone-OTP
    // signups typically don't have one yet (it gets added later via the
    // profile editor); when it lands the user sees the welcome email
    // then. Lookup tries the profile row first, then auth.users.
    try {
      let email = "";
      if (table === "influencer_profiles") {
        const { data } = await supabaseAdmin
          .from("influencer_profiles")
          .select("email")
          .eq("influencer_id", userId)
          .maybeSingle();
        email = data?.email || "";
      } else {
        const { data } = await supabaseAdmin
          .from("brand_profiles")
          .select("contact_email")
          .eq("brand_id", userId)
          .maybeSingle();
        email = data?.contact_email || "";
      }
      if (!email) {
        // Fall back to whatever's on auth.users — phone-OTP signups
        // usually leave this blank but social-login flows can populate it.
        try {
          const authRes = await fetch(
            `${Deno.env.get("SUPABASE_URL")!}/auth/v1/admin/users/${encodeURIComponent(userId)}`,
            {
              headers: {
                apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
              },
            }
          );
          const u = await authRes.json();
          email = u?.email || "";
        } catch (_) { /* non-fatal */ }
      }

      if (email) {
        const isBrand = table === "brand_profiles";
        const greeting = name ? `Hey ${name}` : "Welcome to RGossips";
        const subject = isBrand
          ? "Welcome to RGossips — let's get your first campaign live"
          : "Welcome to RGossips — your creator profile is ready";
        const intro = isBrand
          ? "Your brand account is live on RGossips. Post your first campaign to start reaching India's verified creators."
          : "Your creator account is live on RGossips. Complete your profile to unlock brand deals and your AI media kit.";
        const ctaLabel = isBrand ? "Post a campaign" : "Open dashboard";
        const ctaPath = isBrand ? "/brands/campaigns" : "/influencer";

        await invokeSendEmail({
          to: email,
          subject,
          html: renderEmailHtml({
            preheader: subject,
            title: greeting,
            body: `<p>${intro}</p><p>If you have any questions, just reply to this email — we read every message.</p>`,
            ctaLabel,
            ctaUrl: `https://rgossips.com${ctaPath}`,
          }),
        });
      }
    } catch (e) {
      console.error("Welcome email send failed (non-fatal):", (e as any)?.message);
    }

    // Profile is committed — the account now definitively exists. Issue a
    // session so the client can sign the user in, and consume the phone
    // proof so it can't be replayed to mint another account.
    let session: { access_token: string; refresh_token: string } | null = null;
    try {
      session = await issueSession(userId, normalizedPhone);
    } catch (e) {
      console.error("Session issuance failed (profile still created):", (e as any)?.message);
    }
    try {
      await supabaseAdmin.from("otp_verifications").delete().eq("phone", normalizedPhone);
    } catch (_) { /* non-fatal */ }

    return new Response(
      JSON.stringify({ success: true, userId, session }),
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
