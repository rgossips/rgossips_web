// Product reimbursement — the sub-flow where the creator buys the product
// themselves and the brand pays them back before deliverables begin.
//
//   awaiting_purchase  creator has been approved, has not bought yet
//        │ submitOrder      (creator: order id + what they paid)
//   submitted
//        │ markDelivered    (creator: it arrived)
//   delivered
//        │ verify           (brand: order checks out, reimbursed, reference)
//   reimbursed  ──▶ deliverables unlock
//
//        │ reject           (brand, from submitted or delivered, with a
//   rejected                 reason) ──▶ back to awaiting_purchase on the
//                            creator's next submitOrder
//
// Deliberately NOT a new status on campaign_applications.status. That column
// drives the whole application state machine (pending → offer_sent → …) and
// every surface that renders a step ladder from it. Reimbursement is an
// orthogonal gate that happens WHILE the application sits at `approved`, so
// it gets its own column — see migration 087.
//
// The money moves off-platform: `verify` records that the brand says they
// paid, with a free-text reference. RGossips is not the rail. That is a
// product decision, not an oversight.

// PINNED, unlike the other 61 functions which import @2 unpinned.
// On 2026-10-15 esm.sh resolved @2 to 2.118.0, whose
// auth-js@2.118.0/denonext/auth-js.mjs 404s, and every function deploy in
// this project failed to bundle. 2.117.0 resolves. Put this back to @2
// once esm.sh has healed, so it does not silently drift from the rest.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.0";
import { serveWithLogging } from "../_shared/serve.ts";
import { truncateText } from "../_shared/text.ts";
import { requiresReimbursement } from "../_shared/reimbursement.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

// Every refusal answers 200 with { error }, matching the rest of this
// codebase — the clients branch on the body, not the status code.
const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });

serveWithLogging("application-reimbursement", async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const {
      action,
      applicationId,
      influencerId,
      brandId,
      orderId,
      amountPaise,
      reference,
      reason,
    } = await req.json();

    if (!action || !applicationId) {
      return ok({ error: "action and applicationId are required" });
    }
    if (!brandId && !influencerId) {
      return ok({ error: "brandId or influencerId is required" });
    }

    const { data: app, error: appErr } = await supabase
      .from("campaign_applications")
      .select("id, campaign_id, influencer_id, status, reimbursement_status")
      .eq("id", applicationId)
      .single();
    if (appErr || !app) return ok({ error: "Application not found" });

    const { data: campaign } = await supabase
      .from("campaigns")
      .select("campaign_id, brand_id, title, description")
      .eq("campaign_id", app.campaign_id)
      .single();
    if (!campaign) return ok({ error: "Campaign not found" });

    if (!requiresReimbursement(campaign.description as string)) {
      return ok({
        error: "reimbursement_not_enabled",
        message: "This campaign does not include product reimbursement.",
      });
    }

    const isCreator = !brandId && !!influencerId;
    if (isCreator && app.influencer_id !== influencerId) {
      return ok({ error: "Not authorized" });
    }
    if (!isCreator && campaign.brand_id !== brandId) {
      return ok({ error: "Not authorized" });
    }

    const current = String(app.reimbursement_status || "not_required");
    const now = new Date().toISOString();

    const notify = async (userId: string, title: string, text: string) => {
      // Best effort — a notification must never fail the state change.
      try {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "application_status",
          title,
          body: JSON.stringify({
            text,
            link: isCreator
              ? `/brands/campaign/${campaign.campaign_id}`
              : `/influencer/offers/${campaign.campaign_id}`,
          }),
        });
      } catch (e) {
        console.error("reimbursement notify failed:", (e as any)?.message || e);
      }
    };

    // ── CREATOR: submit the order ────────────────────────────────────
    if (action === "submitOrder") {
      if (!isCreator) return ok({ error: "Not authorized" });
      // `rejected` is a legal starting point: that is the whole purpose of
      // a rejection — the creator corrects the order id and resubmits.
      if (!["awaiting_purchase", "rejected", "submitted"].includes(current)) {
        return ok({
          error: "wrong_stage",
          message: "This order can no longer be edited.",
        });
      }
      const id = String(orderId || "").trim();
      if (!id) return ok({ error: "order_id_required", message: "Enter the order ID from your purchase." });

      const paise = Number(amountPaise);
      if (!Number.isFinite(paise) || paise <= 0) {
        return ok({
          error: "amount_required",
          message: "Enter what you paid for the product.",
        });
      }

      const { error } = await supabase
        .from("campaign_applications")
        .update({
          reimbursement_status: "submitted",
          reimbursement_order_id: truncateText(id, 120),
          reimbursement_amount_paise: Math.round(paise),
          reimbursement_submitted_at: now,
          // Clear the previous refusal so a resubmission does not keep
          // showing the creator why the LAST attempt was rejected.
          reimbursement_reject_reason: null,
          updated_at: now,
        })
        .eq("id", applicationId);
      if (error) return ok({ error: error.message });

      await notify(
        campaign.brand_id as string,
        "Order submitted for reimbursement",
        `A creator submitted order ${truncateText(id, 40)} on "${truncateText(String(campaign.title || ""), 60)}". Verify it to reimburse them.`,
      );
      return ok({ success: true, reimbursementStatus: "submitted" });
    }

    // ── CREATOR: the product arrived ─────────────────────────────────
    if (action === "markDelivered") {
      if (!isCreator) return ok({ error: "Not authorized" });
      if (current !== "submitted") {
        return ok({
          error: "wrong_stage",
          message: "Submit your order details first.",
        });
      }
      const { error } = await supabase
        .from("campaign_applications")
        .update({
          reimbursement_status: "delivered",
          reimbursement_delivered_at: now,
          updated_at: now,
        })
        .eq("id", applicationId);
      if (error) return ok({ error: error.message });

      await notify(
        campaign.brand_id as string,
        "Product delivered — reimbursement due",
        `A creator confirmed their product arrived on "${truncateText(String(campaign.title || ""), 60)}". Verify the order and reimburse them.`,
      );
      return ok({ success: true, reimbursementStatus: "delivered" });
    }

    // ── BRAND: verified and paid ─────────────────────────────────────
    if (action === "verify") {
      if (isCreator) return ok({ error: "Not authorized" });
      if (!["submitted", "delivered"].includes(current)) {
        return ok({
          error: "wrong_stage",
          message: "There is nothing to verify on this application yet.",
        });
      }
      const { error } = await supabase
        .from("campaign_applications")
        .update({
          reimbursement_status: "reimbursed",
          reimbursement_reference: reference
            ? truncateText(String(reference), 200)
            : null,
          reimbursement_reviewed_at: now,
          reimbursement_reviewed_by: brandId,
          reimbursement_paid_at: now,
          reimbursement_reject_reason: null,
          updated_at: now,
        })
        .eq("id", applicationId);
      if (error) return ok({ error: error.message });

      await notify(
        app.influencer_id as string,
        "You have been reimbursed",
        `The brand verified your order on "${truncateText(String(campaign.title || ""), 60)}" and reimbursed you. You can now submit your deliverables.`,
      );
      return ok({ success: true, reimbursementStatus: "reimbursed" });
    }

    // ── BRAND: something is wrong with it ────────────────────────────
    if (action === "reject") {
      if (isCreator) return ok({ error: "Not authorized" });
      if (!["submitted", "delivered"].includes(current)) {
        return ok({ error: "wrong_stage", message: "There is nothing to reject yet." });
      }
      const why = String(reason || "").trim();
      if (!why) {
        // A refusal the creator cannot act on is worse than no refusal —
        // same rule as campaign review and deliverable revisions.
        return ok({
          error: "reason_required",
          message: "Tell the creator what to fix.",
        });
      }
      const { error } = await supabase
        .from("campaign_applications")
        .update({
          reimbursement_status: "rejected",
          reimbursement_reject_reason: truncateText(why, 500),
          reimbursement_reviewed_at: now,
          reimbursement_reviewed_by: brandId,
          updated_at: now,
        })
        .eq("id", applicationId);
      if (error) return ok({ error: error.message });

      await notify(
        app.influencer_id as string,
        "Reimbursement needs attention",
        `The brand could not verify your order on "${truncateText(String(campaign.title || ""), 60)}": ${truncateText(why, 120)}`,
      );
      return ok({ success: true, reimbursementStatus: "rejected" });
    }

    return ok({ error: "Unknown action" });
  } catch (err) {
    console.error("Error:", (err as any)?.message || err);
    return ok({ error: "Internal server error" });
  }
});
