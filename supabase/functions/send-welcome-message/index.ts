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
    const { phone, name, role } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_ID")!;
    const metaToken = Deno.env.get("META_ACCESS_TOKEN")!;

    const displayName = name || "there";
    const roleLabel = role === "brand" ? "Brand" : "Creator";

    const messageBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "text",
      text: {
        preview_url: false,
        body:
          `🎉 Welcome to RS Gossips, ${displayName}!\n\n` +
          `Your ${roleLabel} account is all set up and ready to go.\n\n` +
          `Here's what you can do next:\n` +
          `✅ Complete your profile\n` +
          `✅ Explore campaigns & collaborations\n` +
          `✅ Connect with ${role === "brand" ? "top creators" : "brands"}\n\n` +
          `Got questions? We're here to help! 💬`,
      },
    };

    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v21.0/${whatsappPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageBody),
      }
    );

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("WhatsApp API Error:", JSON.stringify(whatsappData));
      const waError =
        whatsappData?.error?.message ||
        whatsappData?.error?.error_data?.details ||
        "Failed to send welcome message";
      return new Response(
        JSON.stringify({ error: waError }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Welcome message sent" }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
