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
    const { applicationId, submissionLinks } = await req.json();

    if (!applicationId || !submissionLinks) {
      return new Response(
        JSON.stringify({ error: "applicationId and submissionLinks are required" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify the application exists and is in "approved" status
    const { data: app, error: fetchErr } = await supabaseAdmin
      .from("campaign_applications")
      .select("id, status")
      .eq("id", applicationId)
      .single();

    if (fetchErr || !app) {
      return new Response(
        JSON.stringify({ error: "Application not found" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const allowedStatuses = ["approved", "revision_needed", "accepted"];
    if (!allowedStatuses.includes(app.status)) {
      return new Response(
        JSON.stringify({ error: "Cannot submit deliverables in current status" }),
        { status: 200, headers: jsonHeaders }
      );
    }

    // Determine next status: accepted → live_submitted, otherwise → submitted
    const nextStatus = app.status === "accepted" ? "live_submitted" : "submitted";

    const { error: updateErr } = await supabaseAdmin
      .from("campaign_applications")
      .update({
        submission_links: submissionLinks,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(
        JSON.stringify({ error: "Failed to submit: " + updateErr.message }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (err) {
    console.error("Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: jsonHeaders }
    );
  }
});
