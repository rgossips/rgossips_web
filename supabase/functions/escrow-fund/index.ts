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
import { razorpayCreds } from "../_shared/razorpay.ts";

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

    // RECOVERY. The check above only catches an escrow already recorded as
    // held, which leaves a real hole: escrow_status is flipped to 'held' by
    // update-application-status, from the CLIENT, after Razorpay Checkout
    // succeeds. If that call never lands — tab closed, network drop, browser
    // killed between payment and callback — Razorpay has captured the brand's
    // money while this row still shows no escrow. Pressing Approve again then
    // fell through to creating a SECOND order, so the brand could pay twice
    // and the first payment stayed orphaned with no way back.
    //
    // So: if we already minted an order for this application, ask Razorpay
    // whether it was paid before minting another. Same authoritative
    // order-status check verify-service-payment uses for service orders,
    // which exists for exactly this reason. Razorpay is the source of truth
    // about whether money moved; our DB is not.
    const existingOrderId = (app as any).escrow_order_id as string | null;
    if (existingOrderId) {
      // The BRAND pays escrow, so credentials follow the brand.
      const rkCreds = razorpayCreds(brandOwner);
      const rkId = rkCreds?.keyId;
      const rkSecret = rkCreds?.keySecret;
      if (rkId && rkSecret) {
        try {
          const auth = `Basic ${btoa(`${rkId}:${rkSecret}`)}`;
          const res = await fetch(
            `https://api.razorpay.com/v1/orders/${encodeURIComponent(existingOrderId)}`,
            { headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) },
          );
          const rzpOrder = await res.json().catch(() => ({}));
          if (res.ok && String(rzpOrder?.status) === "paid") {
            // Money is already with Razorpay for this application. Record it
            // rather than charging again. Best-effort payment id for the
            // audit trail; the status flip matters more than the stamp.
            let paymentId: string | null = null;
            try {
              const pRes = await fetch(
                `https://api.razorpay.com/v1/orders/${encodeURIComponent(existingOrderId)}/payments`,
                { headers: { Authorization: auth }, signal: AbortSignal.timeout(15000) },
              );
              const pBody = await pRes.json().catch(() => ({}));
              const captured = (pBody?.items || []).find(
                (x: any) => x?.status === "captured",
              );
              paymentId = captured?.id || null;
            } catch { /* stamp is optional */ }

            await supabase
              .from("campaign_applications")
              .update({
                status: "approved",
                escrow_status: "held",
                escrow_funded_at: new Date().toISOString(),
                ...(paymentId ? { escrow_payment_id: paymentId } : {}),
              })
              .eq("id", applicationId)
              // Only recover a row still waiting to be funded. Without the
              // status guard a late recovery could drag an application that
              // had already moved on (submitted, accepted, live) BACKWARDS to
              // approved. The escrow guard is belt-and-braces on top.
              .eq("status", "offer_accepted")
              // NOT .neq("escrow_status", "held"). In SQL, NULL <> 'held' is
              // NULL rather than true, so a plain neq silently skips every
              // row whose escrow_status is still NULL — which is exactly the
              // set this recovery exists to heal (41 such rows live today).
              // The row stayed unfunded while the brand's money sat paid at
              // Razorpay, and the next Approve minted another order.
              .or("escrow_status.is.null,escrow_status.neq.held");

            return json({
              ok: true,
              order_id: existingOrderId,
              amount_paise: (app as any).escrow_amount,
              already_held: true,
              recovered: true,
            });
          }
        } catch (e) {
          // Razorpay unreachable. Fall through and mint a new order rather
          // than blocking the brand — the worst case is an unused order,
          // which costs nothing, whereas refusing to proceed strands them.
          console.error("escrow order recovery check failed:", String(e));
        }
      }
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

    const fundCreds = razorpayCreds(brandOwner);
    const keyId = fundCreds?.keyId;
    const keySecret = fundCreds?.keySecret;
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
