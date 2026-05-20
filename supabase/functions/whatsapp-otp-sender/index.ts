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

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Generate a cryptographically secure 6-digit OTP
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = String(100000 + (array[0] % 900000));

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
