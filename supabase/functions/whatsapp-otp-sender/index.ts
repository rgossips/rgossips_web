import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, role } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Light shape guard — reject obviously bogus phones before doing any
    // billable work. The client already formats to E.164-ish; we just
    // re-check digit count so a bad payload can't waste a WA send.
    const phoneDigits = String(phone).replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ─── Rate limit (migration 034) ────────────────────────────────
    // Three caps stop unauthenticated attackers from draining the WA
    // budget by spamming this endpoint:
    //   1. 60s cooldown per phone — accidental double-tap protection
    //   2. ≤ 5 sends per phone per rolling hour — targeted abuse
    //   3. ≤ 20 sends per IP per rolling hour — scattershot abuse
    //
    // IP is best-effort. Behind Cloudflare we read cf-connecting-ip;
    // otherwise the first hop of x-forwarded-for; otherwise "unknown"
    // (all unknown traffic shares a bucket — a feature, since direct
    // origin requests are not normal).
    const ip =
      req.headers.get("cf-connecting-ip") ||
      (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
      "unknown";
    const COOLDOWN_MS = 60 * 1000;
    const PHONE_HOURLY_CAP = 5;
    const IP_HOURLY_CAP = 20;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const cooldownCutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();

    const [cooldownRes, phoneCountRes, ipCountRes] = await Promise.all([
      supabaseAdmin
        .from("otp_send_log")
        .select("sent_at")
        .eq("phone", phone)
        .gte("sent_at", cooldownCutoff)
        .limit(1),
      supabaseAdmin
        .from("otp_send_log")
        .select("id", { count: "exact", head: true })
        .eq("phone", phone)
        .gte("sent_at", oneHourAgo),
      supabaseAdmin
        .from("otp_send_log")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("sent_at", oneHourAgo),
    ]);

    if ((cooldownRes.data || []).length > 0) {
      const lastSentMs = new Date((cooldownRes.data as any[])[0].sent_at).getTime();
      const waitSecs = Math.max(1, Math.ceil((lastSentMs + COOLDOWN_MS - Date.now()) / 1000));
      return new Response(
        JSON.stringify({ error: `Please wait ${waitSecs}s before requesting another OTP.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if ((phoneCountRes.count ?? 0) >= PHONE_HOURLY_CAP) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests for this number. Try again in an hour." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if ((ipCountRes.count ?? 0) >= IP_HOURLY_CAP) {
      return new Response(
        JSON.stringify({ error: "Too many OTP requests from your network. Try again in an hour." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test-phone bypass — for QA test logins seeded by seed-test-users.
    // Phone is already normalised on the client (+91…). We compare against
    // the bare-digits form the verifier later reads from the row.
    const TEST_PHONES = new Set(["919999999990", "919999999991"]);
    const TEST_OTP = "123456";
    const isTestPhone = TEST_PHONES.has(phone.replace(/\+/g, ""));

    // Generate a cryptographically secure 6-digit OTP — replaced by the
    // fixed test value for QA accounts so they don't need a real WhatsApp.
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = isTestPhone ? TEST_OTP : String(100000 + (array[0] % 900000));

    // Store OTP in database with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Invalidate any previous OTPs for this phone
    await supabaseAdmin.from("otp_verifications").delete().eq("phone", phone);

    // Insert new OTP
    const { error: dbError } = await supabaseAdmin.from("otp_verifications").insert({
      phone,
      otp,
      expires_at: expiresAt,
      verified: false,
    });

    if (dbError) {
      console.error("DB Error:", dbError);
      return new Response(JSON.stringify({ error: "Failed to store OTP" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Log this send so the rate-limit caps see it on the next call.
    // We log here (before the WA HTTP call) so a hung/failed send still
    // counts against the cap — otherwise an attacker can force failures
    // and burst past the cap. Non-blocking on insert errors so a log
    // outage doesn't break sign-up.
    supabaseAdmin
      .from("otp_send_log")
      .insert({ phone, ip })
      .then((res: any) => {
        if (res?.error) console.error("otp_send_log insert failed:", res.error.message);
      });

    // Skip the actual WhatsApp send for test phones — they're QA-only and
    // we don't want to spend Meta credit on them.
    if (isTestPhone) {
      return new Response(
        JSON.stringify({ success: true, message: "Test OTP ready (bypass)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP via WhatsApp Cloud API
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_ID")!;
    const metaToken = Deno.env.get("META_ACCESS_TOKEN")!;
    const templateName = Deno.env.get("WHATSAPP_TEMPLATE") || "hello_world";
    const useTemplate = Deno.env.get("WHATSAPP_USE_TEMPLATE") !== "false";

    // Build message body: use template for production, plain text for testing.
    //
    // The AUTHENTICATION-category template stores its "Copy code" button as a
    // URL button (Meta rewrites OTP/COPY_CODE templates that way under the
    // hood — see the generated wa.me/otp/code URL on the template). So the
    // outgoing payload uses sub_type: "url" with the OTP as a text parameter,
    // not the legacy sub_type: "copy_code" / coupon_code shape.
    const messageBody = useTemplate
      ? {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: templateName,
            language: { code: "en_US" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otp }],
              },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: otp }],
              },
            ],
          },
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: {
            preview_url: false,
            body: `Your RGossips verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
          },
        };

    // v22 — required for AUTHENTICATION templates with the
    // add_security_recommendation flag and the URL-button OTP shape Meta
    // rewrites copy-code templates into. v21 accepts the send and returns a
    // wamid but silently drops delivery for this body shape.
    const whatsappResponse = await fetch(`https://graph.facebook.com/v22.0/${whatsappPhoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${metaToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageBody),
    });

    const whatsappData = await whatsappResponse.json();
    // Surface the wamid + recipient resolution in the function logs so we can
    // confirm Meta accepted vs only-validated each send.
    console.log(
      "WhatsApp send →",
      JSON.stringify({
        status: whatsappResponse.status,
        wamid: whatsappData?.messages?.[0]?.id,
        wa_id: whatsappData?.contacts?.[0]?.wa_id,
        error: whatsappData?.error,
      })
    );

    if (!whatsappResponse.ok) {
      console.error("WhatsApp API Error:", JSON.stringify(whatsappData));
      // Surface the actual WhatsApp error for debugging
      const waError = whatsappData?.error?.message || whatsappData?.error?.error_data?.details || "Failed to send WhatsApp message";
      return new Response(JSON.stringify({ error: waError }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent via WhatsApp" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
