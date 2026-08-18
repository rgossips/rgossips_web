// File a content report.
//
// Required by Play's UGC policy and Apple Guideline 1.2 — an app carrying
// user-visible content must let users report it in-app. Writes to
// content_reports (see migration 059); the admin app owns the queue from
// there.
//
// The caller's identity comes from the JWT, never the body: a reporter_id
// taken from the client would let anyone file reports as someone else, which
// matters because reports carry moderation weight.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ENTITY_TYPES = new Set([
  "user",
  "campaign",
  "application",
  "deliverable",
  "media_kit",
  "service",
]);

const REASONS = new Set([
  "spam",
  "harassment",
  "hate_speech",
  "sexual_content",
  "violence",
  "scam_or_fraud",
  "impersonation",
  "intellectual_property",
  "other",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  try {
    const { reportedUserId, entityType, entityId, reason, details } =
      await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Identify the reporter from the bearer token.
    const authHeader = req.headers.get("authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    const reporterId = userRes?.user?.id;
    if (userErr || !reporterId) {
      return new Response(JSON.stringify({ error: "Not signed in." }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    if (!reportedUserId || !entityType || !reason) {
      return new Response(
        JSON.stringify({
          error: "reportedUserId, entityType and reason are required",
        }),
        { status: 200, headers: jsonHeaders }
      );
    }
    if (!ENTITY_TYPES.has(entityType)) {
      return new Response(JSON.stringify({ error: "Unknown entityType." }), {
        status: 200,
        headers: jsonHeaders,
      });
    }
    if (!REASONS.has(reason)) {
      return new Response(JSON.stringify({ error: "Unknown reason." }), {
        status: 200,
        headers: jsonHeaders,
      });
    }
    if (reportedUserId === reporterId) {
      return new Response(
        JSON.stringify({ error: "You can't report yourself." }),
        { status: 200, headers: jsonHeaders }
      );
    }
    // entity_id is required for everything except a whole-user report; the DB
    // enforces this too, but a clear message beats a constraint violation.
    const resolvedEntityId = entityType === "user" ? null : entityId || null;
    if (entityType !== "user" && !resolvedEntityId) {
      return new Response(
        JSON.stringify({ error: "entityId is required for this entityType." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    const { error: insertErr } = await supabaseAdmin
      .from("content_reports")
      .insert({
        reporter_id: reporterId,
        reported_user: reportedUserId,
        entity_type: entityType,
        entity_id: resolvedEntityId,
        reason,
        details: details ? String(details).trim().slice(0, 1000) : null,
      });

    if (insertErr) {
      // The partial unique index rejects a second OPEN report on the same
      // entity by the same reporter. That is a success from the user's point
      // of view — it is already in the queue — so don't surface an error.
      if (insertErr.code === "23505") {
        return new Response(
          JSON.stringify({
            success: true,
            alreadyReported: true,
            message: "You've already reported this. Our team is reviewing it.",
          }),
          { status: 200, headers: jsonHeaders }
        );
      }
      console.error("content_reports insert failed:", insertErr.message);
      return new Response(
        JSON.stringify({ error: "Could not submit the report. Please try again." }),
        { status: 200, headers: jsonHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Thanks — our team will review this within 24 hours.",
      }),
      { status: 200, headers: jsonHeaders }
    );
  } catch (e) {
    console.error("report-content failed:", e);
    return new Response(
      JSON.stringify({ error: "Could not submit the report. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
