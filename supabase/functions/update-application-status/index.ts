import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status: 200, headers: jsonHeaders });

// HMAC-SHA256(order_id|payment_id, key_secret) — Razorpay's standard
// client-side signature scheme. We verify here so a forged Checkout
// success payload can't escalate an application to 'approved' without
// real money being captured.
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): Promise<boolean> {
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!secret) return false;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${orderId}|${paymentId}`));
    const hex = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex === signature;
  } catch (_e) {
    return false;
  }
}

// Fan-out a high-priority dispute notification to every app_admin so the
// admin app surfaces it on the home page. Service-role bypasses RLS so
// we don't need to expose a separate admin-list endpoint.
async function notifyAdminsOfDispute(
  supabase: any,
  applicationId: string,
  reason?: string
) {
  try {
    const { data: admins } = await supabase.from("admin_profiles").select("id");
    if (!Array.isArray(admins) || admins.length === 0) return;
    const rows = admins.map((a: { id: string }) => ({
      user_id: a.id,
      type: "dispute_opened",
      priority: "high",
      title: "Escrow dispute opened",
      body: JSON.stringify({
        text: `A brand rejected an application after funding escrow. ${reason ? `Reason: ${reason}` : ""}`.trim(),
        link: `/dashboard/disputes/${applicationId}`,
        applicationId,
      }),
      is_read: false,
    }));
    await supabase.from("notifications").insert(rows);
  } catch (e) {
    console.error("notifyAdminsOfDispute failed:", e);
  }
}

const VALID_STATUSES = new Set([
  "pending",
  "approved",
  "submitted",
  "revision_needed",
  "accepted",
  "live_submitted",
  "payment",
  "completed",
  "rejected",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const {
      applicationId,
      brandId,
      status,
      agreedRate,
      rejectionReason,
      revisionNote,
      revisionLinks,
      // Escrow payment confirmation (only sent on the Approve transition).
      // Razorpay Checkout returns these from the client on success; we use
      // them to flip escrow_status to 'held' and record the funded payment
      // alongside the application.
      escrowPaymentId,
      escrowOrderId,
      escrowSignature,
    } = await req.json();

    if (!applicationId || !brandId || !status) {
      return ok({ error: "applicationId, brandId and status are required" });
    }
    if (!VALID_STATUSES.has(status)) {
      return ok({ error: "Invalid status" });
    }

    // Load the application so we can verify ownership
    const { data: app, error: appErr } = await supabase
      .from("campaign_applications")
      .select("id, campaign_id, status")
      .eq("id", applicationId)
      .single();
    const previousStatus = app?.status;

    if (appErr || !app) return ok({ error: "Application not found" });

    // Verify the brand owns the campaign
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("brand_id")
      .eq("campaign_id", app.campaign_id)
      .single();

    if (campErr || !campaign) return ok({ error: "Campaign not found" });
    if (campaign.brand_id !== brandId) return ok({ error: "Not authorized" });

    // Build update payload
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved" && typeof agreedRate === "number" && agreedRate > 0) {
      updates.final_agreed_rate = agreedRate;

      // Approve must be accompanied by a paid escrow — verify the Razorpay
      // signature so a client can't fake the payment, then flip the escrow
      // columns. If no payment info is sent, reject the transition; the
      // brand must complete Checkout first.
      if (!escrowPaymentId || !escrowOrderId || !escrowSignature) {
        return ok({ error: "Escrow payment is required to approve. Open Razorpay Checkout first." });
      }
      const ok_sig = await verifyRazorpaySignature(escrowOrderId, escrowPaymentId, escrowSignature);
      if (!ok_sig) return ok({ error: "Razorpay signature verification failed" });

      updates.escrow_payment_id = escrowPaymentId;
      updates.escrow_order_id = escrowOrderId;
      updates.escrow_status = "held";
      updates.escrow_funded_at = new Date().toISOString();
      // escrow_amount was stamped by escrow-fund when the order was created
      // Fire-and-forget notification + email to the creator. We do this
      // after the row update succeeds (further down).
    }

    // Rejection on a funded escrow opens a dispute instead of just marking
    // rejected — the brand's money is on the line so admin has to resolve.
    if (status === "rejected") {
      const { data: existing } = await supabase
        .from("campaign_applications")
        .select("escrow_status")
        .eq("id", applicationId)
        .single();
      if (existing?.escrow_status === "held") {
        updates.escrow_status = "disputed";
        updates.dispute_reason = rejectionReason || "Brand rejected the application after funding escrow";
        updates.dispute_opened_at = new Date().toISOString();
        await notifyAdminsOfDispute(supabase, applicationId, rejectionReason);
      }
    }

    if (status === "rejected" && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    if (status === "revision_needed") {
      updates.rejection_reason = JSON.stringify({
        note: revisionNote || "",
        links: Array.isArray(revisionLinks) ? revisionLinks : [],
        // Track the stage we're returning from so the next submit can route
        // back to the same stage (live_submitted vs submitted) instead of
        // defaulting to "submitted".
        from: previousStatus || "",
      });
    }

    const { error: updateErr } = await supabase
      .from("campaign_applications")
      .update(updates)
      .eq("id", applicationId);

    if (updateErr) return ok({ error: "Failed to update: " + updateErr.message });

    // Append a status-history row so trust-score response-time SLAs and
    // accurate revision-round counts have something to read. Status
    // change is the source of truth for "when did the brand reply".
    // Fire-and-forget — the status update is already persisted.
    if (previousStatus !== status) {
      try {
        await supabase.from("application_status_history").insert({
          application_id: applicationId,
          from_status: previousStatus || null,
          to_status: status,
          changed_by: brandId || null,
          changed_by_role: "brand",
          reason:
            status === "rejected"
              ? rejectionReason || null
              : status === "revision_needed"
              ? revisionNote || null
              : null,
        });
      } catch (e) {
        console.error("status-history insert failed:", e);
      }
    }

    // Creator notification + email on escrow funded (status flipped to
    // approved with escrow paid). This is what tells the creator the
    // brand has skin in the game and they can start working.
    if (status === "approved" && updates.escrow_status === "held") {
      try {
        const { data: full } = await supabase
          .from("campaign_applications")
          .select(
            "influencer_id, escrow_amount, campaign_id, campaigns(title, brand_id, brand_profiles:brand_id(brand_name, gstin_trade_name))"
          )
          .eq("id", applicationId)
          .single();
        const amountInr = Math.round(((full as any)?.escrow_amount || 0) / 100);
        const campaignTitle = (full as any)?.campaigns?.title || "your campaign";
        const brand = (full as any)?.campaigns?.brand_profiles || {};
        const brandName = brand.brand_name || brand.gstin_trade_name || "The brand";

        await supabase.from("notifications").insert({
          user_id: (full as any)?.influencer_id,
          type: "escrow_funded",
          title: "Brand funded escrow for your campaign",
          body: JSON.stringify({
            text: `${brandName} has funded ₹${amountInr.toLocaleString("en-IN")} into escrow for "${campaignTitle}". Start working on your deliverables!`,
            link: `/influencer/offers/${(full as any)?.campaign_id}`,
            applicationId,
          }),
          is_read: false,
        });

        const { data: creatorAuth } = await supabase.auth.admin.getUserById(
          (full as any)?.influencer_id
        );
        const creatorEmail = creatorAuth?.user?.email;
        if (creatorEmail) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
            },
            body: JSON.stringify({
              to: creatorEmail,
              subject: `${brandName} funded ₹${amountInr.toLocaleString("en-IN")} for "${campaignTitle}"`,
              html: `<p>Great news — <strong>${brandName}</strong> has approved your application and funded ₹${amountInr.toLocaleString("en-IN")} into escrow for the campaign "<strong>${campaignTitle}</strong>".</p>
                     <p>You can now start working on your deliverables. Once your live submission is approved, your payout will be released based on your plan tier.</p>
                     <p><a href="https://rgossips.com/influencer/offers/${(full as any)?.campaign_id}">View the campaign →</a></p>`,
            }),
          });
        }
      } catch (e) {
        console.error("escrow-funded notification failed:", e);
      }
    }

    // Creator notification for transitions the brand initiates. Approved
    // is handled by the escrow-funded block above (different payload).
    // Accepted = brand approved drafts → influencer can post live.
    // Revision_needed = brand wants changes.
    // Rejected = brand killed the application (note: if escrow was held,
    // the dispute fanout already ran above — but the creator still
    // deserves to know).
    if (status === "accepted" || status === "revision_needed" || status === "rejected") {
      try {
        const { data: full } = await supabase
          .from("campaign_applications")
          .select("influencer_id, campaign_id, campaigns(title)")
          .eq("id", applicationId)
          .single();
        const influencerId = (full as any)?.influencer_id;
        const campaignId = (full as any)?.campaign_id;
        const campaignTitle = (full as any)?.campaigns?.title || "your campaign";

        const COPY: Record<string, { title: string; text: string }> = {
          accepted: {
            title: "Drafts accepted",
            text: `The brand accepted your drafts for "${campaignTitle}". Time to post live and submit the links.`,
          },
          revision_needed: {
            title: "Revision requested",
            text: `The brand asked for a revision on your submission for "${campaignTitle}".`,
          },
          rejected: {
            title: "Application rejected",
            text: `Your application for "${campaignTitle}" was rejected${rejectionReason ? `: ${rejectionReason}` : "."}`,
          },
        };
        const copy = COPY[status];

        if (influencerId && copy) {
          await supabase.from("notifications").insert({
            user_id: influencerId,
            type: `app_${status}`,
            title: copy.title,
            body: JSON.stringify({
              text: copy.text,
              link: `/influencer/offers/${campaignId}`,
              campaignId,
              applicationId,
            }),
            is_read: false,
          });
        }
      } catch (e) {
        console.error("Failed to create influencer notification:", e);
      }
    }

    // Refresh cached IG insights whenever the application enters a stage
    // where live links matter (payment, completed). Fire-and-forget — the
    // status change shouldn't fail if the refresh hits a token issue.
    if (status === "payment" || status === "completed" || status === "live_submitted") {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await fetch(`${supabaseUrl}/functions/v1/refresh-application-metrics`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
          },
          body: JSON.stringify({ applicationId }),
        });
      } catch (e) {
        console.error("Metrics refresh kick-off failed:", e);
      }
    }

    // Notify the brand when the status change is NOT initiated by them.
    // (brandId is passed only from brand UI — admin won't pass it, so a
    // missing brandId means "external" change that the brand should know about.)
    // Also notify on `completed` so the brand always learns when deals wrap up.
    try {
      const { data: campApp } = await supabase
        .from("campaign_applications")
        .select("id, campaign_id, influencer_id, campaigns(brand_id, title)")
        .eq("id", applicationId)
        .single();

      const brandOwnerId = (campApp as any)?.campaigns?.brand_id;
      const campaignTitle = (campApp as any)?.campaigns?.title || "your campaign";
      const campaignId = (campApp as any)?.campaign_id;

      // Only notify when the status change originates outside the brand
      // (i.e. no brandId in payload, or brandId doesn't match) AND there's
      // a brand to notify.
      if (brandOwnerId && brandOwnerId !== brandId) {
        const { data: influencer } = await supabase
          .from("influencer_profiles")
          .select("full_name, username, instagram_handle")
          .eq("influencer_id", (campApp as any)?.influencer_id)
          .single();
        const displayName =
          influencer?.full_name ||
          influencer?.username ||
          (influencer?.instagram_handle ? `@${influencer.instagram_handle}` : "an influencer");
        const statusLabel =
          status === "completed" ? "marked completed" : `updated to ${status.replace("_", " ")}`;
        await supabase.from("notifications").insert({
          user_id: brandOwnerId,
          type: `app_${status}`,
          title: `Application ${statusLabel}`,
          body: JSON.stringify({
            text: `${displayName}'s application for "${campaignTitle}" was ${statusLabel}.`,
            link: `/brands/campaign/${campaignId}`,
            campaignId,
            applicationId,
          }),
          is_read: false,
        });
      }
    } catch (e) {
      console.error("Failed to create brand notification:", e);
    }

    return ok({ success: true });
  } catch (err) {
    return ok({
      error: "Internal server error: " + ((err as any)?.message || String(err)),
    });
  }
});
