// Admin-only: resolve an escrow dispute by either refunding the brand
// (Razorpay refund on the original payment) or releasing the held funds
// to the creator (schedules a normal payout).
//
// Body: { applicationId, decision: "refund_brand" | "release_to_creator",
//         note?: string }
//
// Auth: caller must be in admin_profiles. We verify by selecting the
// row via service-role (RLS would self-gate but admins-only is more
// explicit here).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: userRes, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userRes?.user) return json({ error: "unauthorized" }, 401);

    // Admin gate.
    const { data: admin } = await supabase
      .from("admin_profiles")
      .select("id, role")
      .eq("id", userRes.user.id)
      .maybeSingle();
    if (!admin) return json({ error: "forbidden — admin only" }, 403);

    const { applicationId, decision, note } = (await req.json().catch(() => ({}))) as {
      applicationId?: string;
      decision?: "refund_brand" | "release_to_creator";
      note?: string;
    };
    if (!applicationId || !decision) {
      return json({ error: "applicationId and decision required" }, 400);
    }
    if (decision !== "refund_brand" && decision !== "release_to_creator") {
      return json({ error: "decision must be refund_brand or release_to_creator" }, 400);
    }

    const { data: app, error: appErr } = await supabase
      .from("campaign_applications")
      .select(
        "id, influencer_id, escrow_payment_id, escrow_amount, escrow_status, campaign_id, campaigns(brand_id, title)"
      )
      .eq("id", applicationId)
      .single();
    if (appErr || !app) return json({ error: "Application not found" }, 404);
    if (app.escrow_status !== "disputed") {
      return json({ error: `Escrow is not disputed (current: ${app.escrow_status})` }, 409);
    }

    const nowIso = new Date().toISOString();

    if (decision === "refund_brand") {
      const keyId = Deno.env.get("RAZORPAY_KEY_ID")!;
      const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
      if (!app.escrow_payment_id) {
        return json({ error: "No payment id on this application to refund" }, 400);
      }
      const refundRes = await fetch(
        `https://api.razorpay.com/v1/payments/${app.escrow_payment_id}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: app.escrow_amount,
            notes: {
              reason: "admin_dispute_resolution",
              application_id: applicationId,
              note: note || "",
            },
          }),
        }
      );
      const refundBody = await refundRes.json().catch(() => ({}));
      if (!refundRes.ok) {
        return json({ error: "Razorpay refund failed", razorpay: refundBody }, 502);
      }
      await supabase
        .from("campaign_applications")
        .update({
          escrow_status: "refunded",
          escrow_refund_id: (refundBody as any).id,
          dispute_resolution: "refund_brand",
          dispute_resolved_at: nowIso,
          status: "rejected",
        })
        .eq("id", applicationId);

      // Admin-initiated status change — log it for the audit trail
      // and so trust-score math sees that this was a system decision,
      // not a slow brand response.
      try {
        await supabase.from("application_status_history").insert({
          application_id: applicationId,
          from_status: (app as any).status || null,
          to_status: "rejected",
          changed_by: userRes.user.id,
          changed_by_role: "admin",
          reason: `Dispute resolved · refund issued (note: ${note || "—"})`,
        });
      } catch (e) {
        console.error("status-history insert failed:", e);
      }

      // Notify brand the refund is on its way.
      const brandOwner = (app as any).campaigns?.brand_id;
      if (brandOwner) {
        const amountInr = Math.round((app.escrow_amount || 0) / 100);
        await supabase.from("notifications").insert({
          user_id: brandOwner,
          type: "escrow_refunded",
          title: "Escrow refund issued",
          body: JSON.stringify({
            text: `Your escrow of ₹${amountInr.toLocaleString("en-IN")} for "${(app as any).campaigns?.title || "the campaign"}" has been refunded to your original payment method.`,
            link: `/brands/campaign/${app.campaign_id}`,
            applicationId,
          }),
          is_read: false,
        });
      }
      return json({ ok: true, decision, refund_id: (refundBody as any).id });
    }

    // release_to_creator → schedule a normal payout (instant — admin
    // override skips the plan-tier delay).
    await supabase
      .from("campaign_applications")
      .update({
        escrow_status: "released_pending",
        payout_status: "scheduled",
        payout_release_at: nowIso, // fire on next cron tick
        payout_scheduled_at: nowIso,
        dispute_resolution: "release_to_creator",
        dispute_resolved_at: nowIso,
        status: "payment",
      })
      .eq("id", applicationId);

    try {
      await supabase.from("application_status_history").insert({
        application_id: applicationId,
        from_status: (app as any).status || null,
        to_status: "payment",
        changed_by: userRes.user.id,
        changed_by_role: "admin",
        reason: `Dispute resolved · released to creator (note: ${note || "—"})`,
      });
    } catch (e) {
      console.error("status-history insert failed:", e);
    }

    const amountInr = Math.round((app.escrow_amount || 0) / 100);
    await supabase.from("notifications").insert({
      user_id: app.influencer_id,
      type: "payout_scheduled",
      title: "Admin released your payout",
      body: JSON.stringify({
        text: `Admin reviewed your case and released ₹${amountInr.toLocaleString("en-IN")} for "${(app as any).campaigns?.title || "the campaign"}". You'll receive it shortly.`,
        link: `/influencer/profile/payments`,
        applicationId,
      }),
      is_read: false,
    });

    return json({ ok: true, decision });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
