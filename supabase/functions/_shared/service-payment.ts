// Shared service-order payment application.
//
// Used by:
//   - razorpay-webhook (payment.captured) — the normal source of truth.
//   - verify-service-payment — client-triggered fallback for when the Razorpay
//     webhook is disabled/dropped, mirroring reconcile-subscription for
//     subscriptions. Both call this so the status flip, timeline event, and
//     notifications are byte-for-byte identical whichever path lands first.
//
// Idempotent: re-checks advance_paid / final_paid before mutating, so a webhook
// retry AND a client verify racing each other can't double-progress an order.

export async function applyServicePaymentCaptured(
  supabase: any,
  {
    orderId,
    phase,
    paymentId,
    amountPaise,
  }: { orderId: string; phase: string; paymentId: string; amountPaise: number },
) {
  if (!orderId) return { received: true, skipped: "service_payment: no order_id" };

  const { data: order, error: oErr } = await supabase
    .from("service_orders")
    .select("id, user_id, status, service_title, advance_paid, final_paid")
    .eq("id", orderId)
    .maybeSingle();
  if (oErr || !order) {
    return { received: true, skipped: `service_payment: order ${orderId} not found` };
  }

  const now = new Date().toISOString();
  const amountRupees = Math.round(Number(amountPaise || 0) / 100);

  if (phase === "advance") {
    if (order.advance_paid) return { received: true, skipped: "advance already paid" };
    const { error } = await supabase
      .from("service_orders")
      .update({
        advance_paid: true,
        advance_paid_at: now,
        // Same column shape as the Stripe path — we just stamp the razorpay
        // payment id where stripe would have stamped its session id.
        advance_stripe_session_id: paymentId,
        status: "in_progress",
        updated_at: now,
      })
      .eq("id", orderId);
    if (error) {
      console.error("Advance payment update failed:", error.message);
      return { received: true, error: error.message };
    }
    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: "advance_paid",
      label: `Quote accepted & advance paid (₹${amountRupees.toLocaleString("en-IN")})`,
      meta: { amount: amountRupees, payment_id: paymentId, gateway: "razorpay" },
    });
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "service_advance_paid",
      title: "Advance received — work begins",
      body: JSON.stringify({
        text: `${order.service_title}: advance received, our team is on it.`,
        link: `/influencer/services/orders/${orderId}`,
        orderId,
      }),
      is_read: false,
    });
    // Admin fan-out — so ops knows to start work and upload the draft URL.
    try {
      const { data: admins } = await supabase.from("admin_profiles").select("id");
      if (Array.isArray(admins) && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            type: "service_advance_paid_admin",
            priority: "high",
            title: "Advance paid — upload the draft",
            body: JSON.stringify({
              text: `${order.service_title}: advance of ₹${amountRupees.toLocaleString("en-IN")} received. Start work and deliver the draft URL.`,
              link: `/dashboard/quote-requests/${orderId}`,
              orderId,
            }),
            is_read: false,
          })),
        );
      }
    } catch (e) {
      console.error("admin advance-paid fan-out failed:", (e as any)?.message || e);
    }
  } else if (phase === "final") {
    if (order.final_paid) return { received: true, skipped: "final already paid" };
    const { error } = await supabase
      .from("service_orders")
      .update({
        final_paid: true,
        final_paid_at: now,
        final_stripe_session_id: paymentId,
        status: "paid_final",
        updated_at: now,
      })
      .eq("id", orderId);
    if (error) {
      console.error("Final payment update failed:", error.message);
      return { received: true, error: error.message };
    }
    await supabase.from("service_order_events").insert({
      order_id: orderId,
      type: "final_paid",
      label: `Final payment received (₹${amountRupees.toLocaleString("en-IN")})`,
      meta: { amount: amountRupees, payment_id: paymentId, gateway: "razorpay" },
    });
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: "service_final_paid",
      title: "Final payment received",
      body: JSON.stringify({
        text: `${order.service_title}: we'll deliver your final files shortly.`,
        link: `/influencer/services/orders/${orderId}`,
        orderId,
      }),
      is_read: false,
    });
    // Admin fan-out — final payment cleared, ops needs to upload the final
    // deliverable files via DeliverFinalForm.
    try {
      const { data: admins } = await supabase.from("admin_profiles").select("id");
      if (Array.isArray(admins) && admins.length > 0) {
        await supabase.from("notifications").insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            type: "service_final_paid_admin",
            priority: "high",
            title: "Final paid — deliver the files",
            body: JSON.stringify({
              text: `${order.service_title}: final ₹${amountRupees.toLocaleString("en-IN")} received. Upload the deliverable files to complete the order.`,
              link: `/dashboard/quote-requests/${orderId}`,
              orderId,
            }),
            is_read: false,
          })),
        );
      }
    } catch (e) {
      console.error("admin final-paid fan-out failed:", (e as any)?.message || e);
    }
  }

  return { received: true, orderId, phase, gateway: "razorpay" };
}
