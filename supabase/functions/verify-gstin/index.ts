const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GSTIN_API_KEY = "df383d44194e064fe78bcd4a208d0f46";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { gstin } = await req.json();

    if (!gstin || gstin.length !== 15) {
      return new Response(
        JSON.stringify({ error: "Valid 15-character GSTIN is required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const res = await fetch(
      `https://sheet.gstincheck.co.in/check/${GSTIN_API_KEY}/${gstin}`
    );

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "GSTIN verification service unavailable" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const result = await res.json();

    if (!result.flag) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: result.message || "GSTIN not found",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const d = result.data;

    // Extract relevant business details
    const gstinData = {
      gstin: d.gstin,
      legalName: d.lgnm || "",
      tradeName: d.tradeNam || "",
      businessType: d.ctb || "",
      gstStatus: d.sts || "",
      registrationDate: d.rgdt || "",
      dealerType: d.dty || "",
      businessNature: d.nba || [],
      address:
        d.pradr?.adr || "",
      state: d.pradr?.addr?.stcd || "",
      district: d.pradr?.addr?.dst || "",
      pincode: d.pradr?.addr?.pncd || "",
    };

    return new Response(
      JSON.stringify({ verified: true, data: gstinData }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Unexpected error:", err?.message || err);
    return new Response(
      JSON.stringify({
        error:
          "Internal server error: " + (err?.message || String(err)),
      }),
      { status: 200, headers: jsonHeaders }
    );
  }
});
