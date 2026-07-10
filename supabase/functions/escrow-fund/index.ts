// Brand-side escrow funding: when the brand approves an application with
// an agreed rate, this function creates a one-shot Razorpay Order for
// that rate. The client then opens Razorpay Checkout against the order
// to actually capture funds; on success the client calls
// update-application-status with { escrowOrderId, escrowPaymentId,
// agreedRate } which flips the application to status=approved and
// escrow_status=held.
//
// Architecture note: this uses the *standard* Razorpay (Payments) keys —
// the same ones we already use for subscription billing — not the
// RazorpayX keys. Funds land in our settlement account; we then pay
// out to the creator from RazorpayX when the brand clicks Release.

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

    const { applicationId, agreedRate } = (await req.json().catch(() => ({}))) as {
      applicationId?: string;
      agreedRate?: number;
    };
    if (!applicationId) return json({ error: "applicationId required" }, 400);
    const rupees = Number(agreedRate);
    if (!Number.isFinite(rupees) || rupees <= 0) {
      return json({ error: "agreedRate must be a positive number" }, 400);
    }

    // Verify the caller actually owns the campaign behind this application,
    // so a brand can't fund someone else's deal.
    const { data: app, error: appErr } = await supabase
      .from("campaign_applications")
      .select("id, campaign_id, influencer_id, status, escrow_status, brand_offered_rate, campaigns(brand_id, title)")
      .eq("id", applicationId)
      .single();
    if (appErr || !app) return json({ error: "Application not found" }, 404);

    const brandOwner = (app as any).campaigns?.brand_id;
    if (brandOwner !== userRes.user.id) return json({ error: "forbidden" }, 403);

    // Idempotency: if a 'held' or already-paid order exists, return it
    // instead of creating a new one. Prevents duplicate charges if the
    // brand double-clicks Approve.
    if (app.escrow_status === "held" && (app as any).escrow_order_id) {
      return json({
        ok: true,
        order_id: (app as any).escrow_order_id,
        amount_paise: (app as any).escrow_amount,
        already_held: true,
      });
    }
    // B15 negotiation flow: escrow can only be funded once the creator
    // has accepted the brand's priced offer. Funding a merely-pending
    // application would skip the influencer's consent step.
    if (app.status !== "offer_accepted") {
      return json({ error: `Application is in state '${app.status}' — the creator must accept your offer before you fund escrow.` }, 409);
    }
    // The amount is the accepted offer — the brand can't quietly change
    // the number at payment time. agreedRate from the client is only a
    // display hint; mismatch is rejected.
    const acceptedRate = Number((app as any).brand_offered_rate || 0);
    if (acceptedRate > 0 && Math.round(rupees) !== Math.round(acceptedRate)) {
      return json({ error: `Amount mismatch: the accepted offer is ₹${acceptedRate}.` }, 409);
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return json({ error: "Razorpay keys not configured" }, 500);

    const amountPaise = Math.round(rupees * 100);

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      signal: AbortSignal.timeout(15000),
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        // Razorpay caps receipt at 40 chars; the UUID alone is 36, so we
        // drop the "escrow:" prefix. Notes carry the discriminator.
        receipt: applicationId,
        notes: {
          type: "campaign_escrow",
          application_id: applicationId,
          campaign_id: app.campaign_id,
          influencer_id: app.influencer_id,
          brand_id: brandOwner,
          campaign_title: (app as any).campaigns?.title || "",
        },
      }),
    });
    const orderBody = await orderRes.json().catch(() => ({}));
    if (!orderRes.ok) {
      return json(
        { error: "Could not create Razorpay order", razorpay: orderBody },
        502
      );
    }

    // Stash the order id + amount on the application. We don't flip
    // escrow_status to 'held' yet — that happens after the payment
    // actually clears (handled in update-application-status when the
    // client confirms the payment success callback).
    await supabase
      .from("campaign_applications")
      .update({
        escrow_order_id: (orderBody as any).id,
        escrow_amount: amountPaise,
      })
      .eq("id", applicationId);

    return json({
      ok: true,
      order_id: (orderBody as any).id,
      key_id: keyId,
      amount_paise: amountPaise,
      currency: "INR",
    });
  } catch (e) {
    return json({ error: String((e as any)?.message || e) }, 500);
  }
});
