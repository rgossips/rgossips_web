"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  X,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/services";
import GatewayPickerModal from "@/components/GatewayPickerModal";

// Razorpay Checkout SDK loader — same pattern used by the pricing page
// and the brand-side escrow funding flow. Lazy so we don't ship the
// SDK on every service-order page view.
const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => resolve());
    });
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

// Titles/bodies are resolved at render via t(`banner.${key}.title`) so
// they can't be translated at module scope. Each entry carries a stable
// `key` matching the message-catalog group.
const STATUS_BANNER = {
  pending_quote: {
    key: "pending_quote",
    accent: "from-amber-500 to-orange-500",
    icon: Clock,
  },
  quoted: {
    key: "quoted",
    accent: "from-emerald-500 to-teal-500",
    icon: Mail,
  },
  counter_offered: {
    key: "counter_offered",
    accent: "from-orange-500 to-rose-500",
    icon: Send,
  },
  accepted: {
    key: "accepted",
    accent: "from-emerald-500 to-teal-500",
    icon: CheckCircle2,
  },
  paid_advance: {
    key: "paid_advance",
    accent: "from-violet-500 to-fuchsia-500",
    icon: Check,
  },
  in_progress: {
    key: "in_progress",
    accent: "from-violet-500 to-fuchsia-500",
    icon: Clock,
  },
  draft_ready: {
    key: "draft_ready",
    accent: "from-amber-500 to-orange-500",
    icon: Mail,
  },
  revision_requested: {
    key: "revision_requested",
    accent: "from-orange-500 to-rose-500",
    icon: Clock,
  },
  paid_final: {
    key: "paid_final",
    accent: "from-emerald-500 to-teal-500",
    icon: Check,
  },
  completed: {
    key: "completed",
    accent: "from-emerald-500 to-teal-500",
    icon: CheckCircle2,
  },
  declined: {
    key: "declined",
    accent: "from-gray-400 to-gray-500",
    icon: X,
  },
  expired: {
    key: "expired",
    accent: "from-gray-400 to-gray-500",
    icon: AlertCircle,
  },
};

export default function ServiceOrderDetailPage() {
  const t = useTranslations("InfluencerServicesOrdersId");
  const router = useRouter();
  const { id } = useParams();
  const { user, profile, role } = useAuth();
  const supabase = createClient();

  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // 'accept' | 'counter' | 'decline' | 'approve' | 'revision'
  // Independent flag for the full-screen payment overlay. Goes true the
  // moment the user picks a gateway from the picker and stays up until
  // the Razorpay modal renders (or Stripe redirects, or we error). We
  // can't gate the overlay on `actionLoading` alone because the Razorpay
  // modal keeps actionLoading set after it opens (so the dismissed-then-
  // retried path works) — but visually the Razorpay modal *is* the
  // status, so the overlay underneath would be redundant.
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [mode, setMode] = useState(null); // 'counter' | 'decline' | 'revision'
  // Which phase the gateway picker is currently open for. `null` = picker
  // closed. 'advance' = brand accepting & paying initial 50%; 'final' =
  // approve & release the remaining balance after drafts are ready.
  const [pickerPhase, setPickerPhase] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const refresh = async () => {
    if (!id) return;
    const [{ data: o }, { data: ev }, { data: msgs }] = await Promise.all([
      supabase.from("service_orders").select("*").eq("id", id).maybeSingle(),
      supabase.from("service_order_events").select("*").eq("order_id", id).order("occurred_at"),
      supabase.from("service_order_messages").select("*").eq("order_id", id).order("created_at"),
    ]);
    setOrder(o || null);
    setEvents(ev || []);
    setMessages(msgs || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // If we just came back from Stripe with ?paid=advance|final, poll briefly
  // so the page reflects the webhook update without the user refreshing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const paid = url.searchParams.get("paid");
    if (!paid) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      refresh();
      if (attempts >= 6) {
        clearInterval(interval);
        // Strip the query param so reloads don't keep polling.
        url.searchParams.delete("paid");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
      }
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validityRemaining = useMemo(() => {
    if (!order?.quote_valid_until) return null;
    const ms = new Date(order.quote_valid_until).getTime() - Date.now();
    if (ms <= 0) return t("validity.expired");
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    return t("validity.remaining", { d, h });
  }, [order?.quote_valid_until, t]);

  // Opens the gateway picker; the actual checkout call happens in
  // payViaGateway once the user picks Razorpay or Stripe. Keeping the
  // picker stateful + outside the dispatcher means the buttons get
  // disabled (actionLoading) only after the user has chosen.
  const openPayPicker = (phase) => {
    setError("");
    setPickerPhase(phase);
  };

  // Routes the actual checkout call. Stripe → hosted page redirect;
  // Razorpay → embedded checkout modal opened in-page. Either way the
  // webhook is the source of truth for status progression, so a user
  // closing the modal mid-payment can't leave the order in a half-state.
  //
  // While this runs, the page renders the PaymentBusyOverlay (full-
  // screen spinner) so the user doesn't keep mashing the button while
  // we set up the gateway. The overlay clears when Razorpay's modal
  // opens (or when an error fires).
  const payViaGateway = async (phase, gateway) => {
    setPickerPhase(null);
    setActionLoading(phase === "advance" ? "accept" : "approve");
    setPaymentBusy(true);
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const endpoint =
        gateway === "razorpay" ? "razorpay-service-checkout" : "service-payment-checkout";

      const res = await fetch(`${supabaseUrl}/functions/v1/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId: user?.id, orderId: id, phase }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);

      if (gateway === "stripe") {
        if (!data?.url) throw new Error(t("errors.noCheckoutUrl"));
        window.location.href = data.url;
        return;
      }

      // Razorpay path — open the embedded Checkout against the order.
      await loadRazorpayCheckout();
      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error(t("errors.razorpayLoad"));
      }
      // Razorpay prefill — saves the user from re-typing phone/email/
      // name in the checkout modal. Phone goes in with the +91 prefix
      // (Razorpay accepts both, but the prefixed form prevents a
      // country-code mismatch error if Razorpay's account is set to a
      // non-default country).
      const phoneDigits = String(user?.phone || profile?.contact_phone || "").replace(/\D/g, "");
      const prefillContact = phoneDigits
        ? phoneDigits.startsWith("91")
          ? `+${phoneDigits}`
          : `+91${phoneDigits.slice(-10)}`
        : undefined;

      const rzp = new window.Razorpay({
        key: data.key_id,
        order_id: data.order_id,
        amount: data.amount_paise,
        currency: data.currency || "INR",
        name: "RGossips",
        description: data.line_label || (phase === "advance" ? t("razorpay.serviceAdvance") : t("razorpay.serviceFinal")),
        theme: { color: "#5851DB" },
        prefill: {
          name: profile?.full_name || profile?.username || "",
          email: user?.email || profile?.email || "",
          contact: prefillContact,
        },
        handler: async () => {
          // Payment captured. The razorpay-webhook is the normal source of
          // truth for flipping the order status — but it may be disabled, so
          // we verify server-side here (mirrors reconcile-subscription). This
          // confirms with Razorpay that the order is actually paid, then
          // applies the same status flip. Best-effort + awaited so the status
          // is usually already updated by the time the success poll runs.
          try {
            await fetch(`${supabaseUrl}/functions/v1/verify-service-payment`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                userId: user?.id,
                orderId: id,
                phase,
                razorpayOrderId: data.order_id,
              }),
            });
          } catch {
            /* non-fatal — the ?paid poll (and webhook, if enabled) will catch up */
          }
          window.location.href = `/influencer/services/orders/${id}?paid=${phase}`;
        },
        modal: {
          ondismiss: () => setActionLoading(null),
        },
      });
      rzp.on("payment.failed", (resp) => {
        setError(resp?.error?.description || t("errors.paymentFailed"));
        setActionLoading(null);
      });
      rzp.open();
      // Razorpay modal is up — the full-screen overlay can come down.
      // (We keep actionLoading set so the underlying buttons stay
      // disabled until ondismiss / payment.failed clear it.)
      setPaymentBusy(false);
    } catch (e) {
      setError(e.message || t("errors.startPayment"));
      setActionLoading(null);
      setPaymentBusy(false);
    }
  };

  // Load any existing review for this order so the form collapses into a
  // read-only "thank you" once submitted.
  useEffect(() => {
    if (!id || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("service_reviews")
        .select("*")
        .eq("order_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) setMyReview(data || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id, supabase]);

  const submitReview = async (review) => {
    setReviewSubmitting(true);
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/submit-service-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId: user?.id, orderId: id, ...review }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setMyReview(review);
      await refresh();
    } catch (e) {
      setError(e.message || t("errors.submitReview"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  // POSTs to request-revision — only valid when status='draft_ready' and
  // there are revisions left.
  const requestRevision = async () => {
    setActionLoading("revision");
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/request-revision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId: user?.id, orderId: id, note: revisionNote }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.message || data.error);
      setMode(null);
      setRevisionNote("");
      await refresh();
    } catch (e) {
      setError(e.message || t("errors.requestRevision"));
    } finally {
      setActionLoading(null);
    }
  };

  const respond = async (action, extra = {}) => {
    setActionLoading(action);
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/respond-to-quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ userId: user?.id, orderId: id, action, ...extra }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setMode(null);
      setCounterAmount("");
      setCounterMessage("");
      setDeclineReason("");
      await refresh();
    } catch (e) {
      setError(e.message || t("errors.generic"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-pink-500" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-bold text-slate-600">{t("orderNotFound")}</p>
        <button
          onClick={() => router.push("/influencer/services")}
          className="mt-4 text-sm font-bold text-pink-500 hover:underline cursor-pointer"
        >
          {t("backToServices")}
        </button>
      </div>
    );
  }

  // A quote can sit past its valid-until window if the server hasn't
  // touched the row yet. Detect that case once and gate all
  // accept/counter/decline actions behind it — the user shouldn't be
  // able to pay an expired price the brand may no longer honour.
  const isQuoteExpired =
    !!order?.quote_valid_until &&
    (order.status === "quoted" || order.status === "counter_offered") &&
    new Date(order.quote_valid_until).getTime() < Date.now();

  const banner = STATUS_BANNER[isQuoteExpired ? "expired" : order.status] || STATUS_BANNER.pending_quote;
  const BannerIcon = banner.icon;
  // `isQuoted` previously meant "show accept/counter/decline UI". When
  // the quote is expired we want that UI replaced by an expired notice,
  // so flip the flag off in that case.
  const isQuoted = order.status === "quoted" && !isQuoteExpired;

  // Prefer the browser's history so the user lands wherever they came from
  // (notifications, the Services list, a chat link, etc.). When the order
  // page is opened directly (history of one entry) we fall back to the
  // Services list so the button is never a dead-end.
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/influencer/services");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
          >
            <ArrowLeft size={14} /> {t("back")}
          </button>
          <button
            onClick={() => refresh()}
            title={t("refreshTitle")}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-pink-500 px-3 py-1.5 rounded-full hover:bg-white transition-all cursor-pointer"
          >
            <RefreshCw size={13} /> {t("refresh")}
          </button>
        </div>

        {/* Status banner */}
        <div className={`rounded-2xl bg-gradient-to-r ${banner.accent} text-white p-5 lg:p-6 flex items-center gap-4 shadow-md`}>
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <BannerIcon size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg lg:text-xl font-black leading-tight">{t(`banner.${banner.key}.title`)}</h1>
            <p className="text-[12px] lg:text-[13px] text-white/85 mt-0.5">
              {t("orderLine", { number: order.order_number, title: order.service_title })}
            </p>
          </div>
          {isQuoted && validityRemaining && (
            <div className="hidden sm:block text-right shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-white/70">{t("quoteValidFor")}</p>
              <p className="text-base font-black">{validityRemaining}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card title={t("cards.projectSummary")}>
              <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{order.description}</p>
            </Card>

            {isQuoted && order.final_formats && (
              <Card title={t("cards.whatYouGet")}>
                <ul className="space-y-2">
                  {order.final_formats.split(/[\n,]/).map((line) => line.trim()).filter(Boolean).map((line) => (
                    <li key={line} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {isQuoted && (
              <Card title={t("cards.projectSpecs")}>
                <div className="grid grid-cols-2 gap-3">
                  <Spec
                    label={t("specs.deliveryDate")}
                    value={order.quoted_delivery_date ? new Date(order.quoted_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  />
                  <Spec label={t("specs.turnaround")} value={order.quoted_turnaround_days ? t("specs.daysValue", { days: order.quoted_turnaround_days }) : "—"} />
                  <Spec label={t("specs.revisions")} value={t("specs.rounds", { count: order.revisions_allowed })} />
                  <Spec label={t("specs.finalFormats")} value={order.final_formats || "—"} />
                </div>
              </Card>
            )}

            {order.quote_message && (
              <Card title={t("cards.noteFromTeam")}>
                <p className="text-[13px] text-slate-700 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
                  {order.quote_message}
                </p>
              </Card>
            )}

            {messages.length > 0 && (
              <Card title={t("cards.messages")}>
                <div className="space-y-3">
                  {messages.map((m) => (
                    <Message key={m.id} message={m} mine={m.sender_id === user?.id} />
                  ))}
                </div>
              </Card>
            )}

            {events.length > 0 && (
              <Card title={t("cards.orderTimeline")}>
                <ul className="space-y-3">
                  {events.map((e) => (
                    <li key={e.id} className="flex gap-3 text-[12px]">
                      <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-pink-500" />
                      <div>
                        <p className="font-semibold text-slate-700">{e.label}</p>
                        <p className="text-slate-400">{new Date(e.occurred_at).toLocaleString("en-IN")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Draft preview — visible from draft_ready onwards if a URL exists */}
            {order.draft_url && ["draft_ready", "revision_requested", "paid_final", "completed"].includes(order.status) && (
              <DraftPreviewBlock order={order} />
            )}

            {order.status === "completed" && Array.isArray(order.final_files) && order.final_files.length > 0 && (
              <DownloadList files={order.final_files} />
            )}
          </div>

          {/* ── RIGHT — pricing & actions ── */}
          <aside className="space-y-4">
            {/* Quote expired — replaces the accept/counter/decline action
                card. The price is no longer guaranteed, so we don't let
                the user pay; only path forward is to request a fresh
                quote (or browse other services). */}
            {isQuoteExpired && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <AlertCircle size={20} className="text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-900">{t("expired.heading")}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                      {t("expired.body", {
                        date: new Date(order.quote_valid_until).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }),
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/influencer/services/${order.service_slug || ""}`)}
                  className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black cursor-pointer shadow-md shadow-pink-100"
                >
                  {t("expired.requestNew")}
                </button>
                <button
                  onClick={() => router.push("/influencer/services")}
                  className="w-full py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 text-[12px] font-black cursor-pointer hover:border-pink-200 hover:text-pink-500"
                >
                  {t("expired.browseOther")}
                </button>
              </div>
            )}

            {isQuoted && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {t("pricing.totalProjectCost")}
                  </p>
                  <p className="text-3xl font-black text-slate-900 leading-tight">
                    {formatINR(order.total_amount)}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-[12px]">
                  <Row label={t("pricing.subtotal")} value={formatINR(order.quoted_amount || 0)} />
                  {/* Platform fee removed — service orders don't charge one. */}
                  <div className="border-t border-slate-200 pt-1.5">
                    <Row label={t("pricing.total")} value={formatINR(order.total_amount || 0)} bold />
                  </div>
                  <Row
                    label={t("pricing.payNow", { pct: order.advance_pct })}
                    value={formatINR(Math.round((order.total_amount || 0) * order.advance_pct / 100))}
                    pink
                  />
                  <Row
                    label={t("pricing.payOnDelivery", { pct: 100 - order.advance_pct })}
                    value={formatINR((order.total_amount || 0) - Math.round((order.total_amount || 0) * order.advance_pct / 100))}
                    muted
                  />
                </div>

                {error && <p className="text-[12px] text-red-500 font-semibold">{error}</p>}

                {mode === null && (
                  <>
                    <button
                      onClick={() => openPayPicker("advance")}
                      disabled={!!actionLoading}
                      className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-100 disabled:opacity-60"
                    >
                      {actionLoading === "accept" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {t("pricing.acceptAndPay", { amount: formatINR(Math.round((order.total_amount || 0) * order.advance_pct / 100)) })}
                    </button>
                    <button
                      onClick={() => setMode("counter")}
                      disabled={!!actionLoading}
                      className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer hover:border-pink-200 hover:text-pink-500"
                    >
                      <MessageSquare size={14} /> {t("pricing.negotiate")}
                    </button>
                    <button
                      onClick={() => setMode("decline")}
                      disabled={!!actionLoading}
                      className="w-full text-[12px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      {t("pricing.declineQuote")}
                    </button>
                  </>
                )}

                {mode === "counter" && (
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder={t("counter.amountPlaceholder")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    <textarea
                      rows={3}
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder={t("counter.messagePlaceholder")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode(null)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-[12px] font-black text-slate-500 cursor-pointer disabled:opacity-50"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={() => respond("counter", { counterAmount, counterMessage })}
                        disabled={!!actionLoading || !counterAmount}
                        className="flex-1 py-2 rounded-xl btn-purple text-white text-[12px] font-black cursor-pointer disabled:opacity-60"
                      >
                        {actionLoading === "counter" ? t("common.sending") : t("counter.send")}
                      </button>
                    </div>
                  </div>
                )}

                {mode === "decline" && (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder={t("decline.placeholder")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode(null)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-[12px] font-black text-slate-500 cursor-pointer disabled:opacity-50"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={() => respond("decline", { declineReason })}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black cursor-pointer disabled:opacity-60"
                      >
                        {actionLoading === "decline" ? t("decline.confirming") : t("decline.confirm")}
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 pt-1">
                  <Info size={10} /> {t("pricing.securePayment")}
                </div>
              </div>
            )}

            {/* Counter sent — shown to user while admin reviews */}
            {order.status === "counter_offered" && order.counter_amount && (
              <Card title={t("cards.yourCounterOffer")}>
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {formatINR(order.counter_amount)}
                </p>
                {order.counter_message && (
                  <p className="text-[12px] text-slate-500 mt-2 italic">"{order.counter_message}"</p>
                )}
                <p className="text-[11px] text-slate-400 mt-3">
                  {t("counterOffered.awaiting")}
                </p>
              </Card>
            )}

            {/* Two ways forward — approve & pay final, or request a revision */}
            {order.status === "draft_ready" && (
              <DraftReviewSidebar
                order={order}
                openPayPicker={openPayPicker}
                actionLoading={actionLoading}
                error={error}
                mode={mode}
                setMode={setMode}
                revisionNote={revisionNote}
                setRevisionNote={setRevisionNote}
                requestRevision={requestRevision}
              />
            )}

            {order.status === "revision_requested" && (
              <Card title={t("cards.revisionInProgress")}>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  {t("revisionRequested.body", { used: order.revisions_used, allowed: order.revisions_allowed })}
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  {t("revisionRequested.notify")}
                </p>
              </Card>
            )}

            {order.status === "completed" && (
              <ReviewPanel
                existing={myReview}
                submitting={reviewSubmitting}
                onSubmit={submitReview}
              />
            )}

            <Card title={t("cards.orderDetails")}>
              <Spec label={t("specs.orderId")} value={order.order_number} />
              <Spec label={t("specs.service")} value={order.service_title} />
              {order.quoted_delivery_date && (
                <Spec
                  label={t("specs.expectedDelivery")}
                  value={new Date(order.quoted_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                />
              )}
              <Spec label={t("specs.submitted")} value={new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
            </Card>
          </aside>
        </div>
      </div>

      {pickerPhase && (
        <GatewayPickerModal
          title={pickerPhase === "advance" ? t("gateway.payAdvance") : t("gateway.payFinal")}
          subtitle={t("gateway.subtitle")}
          onCancel={() => setPickerPhase(null)}
          onPick={(g) => payViaGateway(pickerPhase, g)}
        />
      )}

      {/* Full-screen overlay shown after the user picks Razorpay/Stripe
          and before the gateway UI takes over. Replaces the previous
          in-button spinner — clearer signal that something's happening
          and prevents stray taps on the page underneath. */}
      {paymentBusy && (
        <div className="fixed inset-0 z-200 bg-[#0F0F1A]/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-white/20" />
            <Loader2 size={64} strokeWidth={2.5} className="absolute inset-0 animate-spin text-[#E60076]" />
          </div>
          <p className="text-white text-sm font-bold">{t("overlay.openingCheckout")}</p>
        </div>
      )}
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      {children}
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 mb-2 last:mb-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-[13px] font-black text-slate-900 mt-0.5 leading-tight">{value}</p>
    </div>
  );
}

function Row({ label, value, bold, pink, muted }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold text-slate-900" : pink ? "text-pink-500 font-black" : muted ? "text-slate-400" : "text-slate-600"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Message({ message, mine }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
          mine
            ? "bg-pink-50 border border-pink-100 text-slate-700"
            : "bg-white border border-slate-100 text-slate-700"
        }`}
      >
        <p className="text-[10px] font-bold text-slate-400 mb-0.5 uppercase tracking-wider">
          {message.sender_role}
        </p>
        <p className="whitespace-pre-wrap">{message.body}</p>
      </div>
    </div>
  );
}

function DraftPreviewBlock({ order }) {
  const t = useTranslations("InfluencerServicesOrdersId");
  const isWatermarked = order.status === "draft_ready" || order.status === "revision_requested";
  return (
    <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
      <div className="aspect-[2.4/1] flex items-center justify-center relative">
        <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        {isWatermarked && (
          <p className="absolute inset-0 flex items-center justify-center text-white/15 text-7xl font-black tracking-widest rotate-[-15deg] select-none pointer-events-none">
            {t("draft.previewWatermark")}
          </p>
        )}
        <a
          href={order.draft_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={t("draft.openPreviewAria")}
        />
      </div>
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/95 text-[11px] text-slate-300">
        <span className="font-mono truncate">{order.service_title}</span>
        <a
          href={order.draft_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-pink-400 hover:underline font-bold cursor-pointer"
        >
          {t("draft.openPreview")}
        </a>
      </div>
      {isWatermarked && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-700 flex items-start gap-2">
          <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
          <p>
            {t("draft.watermarkNote", {
              amount: formatINR(
                (order.total_amount || 0) -
                  Math.round(((order.total_amount || 0) * (order.advance_pct || 50)) / 100)
              ),
            })}
          </p>
        </div>
      )}
      {order.draft_note && (
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("draft.noteFromEditor")}</p>
          <p className="text-[13px] text-slate-700 mt-1 leading-relaxed">{order.draft_note}</p>
        </div>
      )}
    </div>
  );
}

function DraftReviewSidebar({
  order,
  openPayPicker,
  actionLoading,
  error,
  mode,
  setMode,
  revisionNote,
  setRevisionNote,
  requestRevision,
}) {
  const t = useTranslations("InfluencerServicesOrdersId");
  const total = order.total_amount || 0;
  const advance = Math.round((total * (order.advance_pct || 50)) / 100);
  const dueNow = total - advance;
  const revsLeft = (order.revisions_allowed || 0) - (order.revisions_used || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {t("draftReview.twoWays")}
      </p>

      {/* Approve & pay final */}
      <div className="bg-emerald-50 rounded-xl p-3 space-y-1.5 text-[12px]">
        <p className="text-[11px] font-black text-emerald-700 inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> {t("draftReview.looksGood")}
        </p>
        <Row label={t("draftReview.totalProject")} value={formatINR(total)} />
        <Row label={t("draftReview.paidAdvance")} value={`–${formatINR(advance)}`} muted />
        <div className="border-t border-emerald-200 pt-1.5">
          <Row label={t("draftReview.dueNow")} value={formatINR(dueNow)} bold />
        </div>
      </div>

      <div className="bg-pink-50 rounded-xl p-3 text-center">
        <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">{t("draftReview.payToUnlock")}</p>
        <p className="text-xl font-black text-slate-900 mt-1">{formatINR(dueNow)}</p>
      </div>

      <button
        onClick={() => openPayPicker("final")}
        disabled={!!actionLoading}
        className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-100 disabled:opacity-60"
      >
        {actionLoading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {t("draftReview.approveAndPay", { amount: formatINR(dueNow) })}
      </button>

      {error && <p className="text-[12px] text-red-500 font-semibold">{error}</p>}

      {/* Revision */}
      <div className="bg-amber-50 rounded-xl p-3 mt-2">
        <p className="text-[11px] font-black text-amber-700 inline-flex items-center gap-1">
          {t("draftReview.needChanges")}
        </p>
        <p className="text-[11px] text-amber-700 mt-1 leading-snug">
          {revsLeft > 0
            ? t("draftReview.revisionsLeft", { count: revsLeft })
            : t("draftReview.noRevisionsLeft")}
        </p>
      </div>

      {mode !== "revision" && (
        <button
          onClick={() => setMode("revision")}
          disabled={revsLeft <= 0 || !!actionLoading}
          className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer hover:border-pink-200 hover:text-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("draftReview.requestRevision")}
        </button>
      )}

      {mode === "revision" && (
        <div className="space-y-2">
          <textarea
            rows={4}
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder={t("draftReview.notePlaceholder")}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode(null);
                setRevisionNote("");
              }}
              disabled={!!actionLoading}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-[12px] font-black text-slate-500 cursor-pointer disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={requestRevision}
              disabled={!!actionLoading || revisionNote.trim().length < 5}
              className="flex-1 py-2 rounded-xl btn-purple text-white text-[12px] font-black cursor-pointer disabled:opacity-60"
            >
              {actionLoading === "revision" ? t("common.sending") : t("draftReview.send")}
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center pt-1">
        {t("draftReview.footer")}
      </p>
    </div>
  );
}

function DownloadList({ files }) {
  const t = useTranslations("InfluencerServicesOrdersId");
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {t("download.title")}
        </p>
        <span className="text-[10px] text-slate-400">{t("download.permanentNote")}</span>
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {files.map((f, i) => (
          <li key={i} className="py-2.5 flex items-center justify-between gap-3 text-[13px]">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 truncate">{f.name}</p>
              {f.size && <p className="text-[11px] text-slate-400 mt-0.5">{f.size}</p>}
            </div>
            <a
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="text-pink-500 hover:underline font-bold text-[12px] whitespace-nowrap"
            >
              {t("download.download")}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewPanel({ existing, submitting, onSubmit }) {
  const t = useTranslations("InfluencerServicesOrdersId");
  // Read-only "thank you" if there's already a row.
  if (existing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
          {t("review.submitted")}
        </p>
        <p className="text-2xl font-black text-slate-900 mt-1 leading-tight">
          {existing.overall}.0 ★
        </p>
        <p className="text-[12px] text-slate-500 mt-2">
          {t("review.thanks")}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
          <SubScore label={t("review.quality")} value={existing.quality} />
          <SubScore label={t("review.communication")} value={existing.communication} />
          <SubScore label={t("review.onTimeDelivery")} value={existing.on_time_delivery} />
          <SubScore label={t("review.valueForMoney")} value={existing.value_for_money} />
        </div>
        {existing.text && (
          <p className="text-[12px] text-slate-600 mt-3 italic">"{existing.text}"</p>
        )}
      </div>
    );
  }

  return <ReviewForm submitting={submitting} onSubmit={onSubmit} />;
}

function SubScore({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-[13px] font-black text-slate-700 mt-0.5">{value ? `${value} ★` : "—"}</p>
    </div>
  );
}

function ReviewForm({ submitting, onSubmit }) {
  const t = useTranslations("InfluencerServicesOrdersId");
  const [overall, setOverall] = useState(5);
  const [quality, setQuality] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [onTime, setOnTime] = useState(5);
  const [value, setValue] = useState(5);
  const [text, setText] = useState("");

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {t("review.rateExperience")}
        </p>
        <p className="text-[11px] text-pink-500 mt-0.5">{t("review.helpOthers")}</p>
      </div>

      <div>
        <p className="text-[11px] text-slate-500 text-center">{t("review.tapToRate", { count: overall })}</p>
        <div className="flex justify-center mt-1">
          <StarRow value={overall} onChange={setOverall} size={26} />
        </div>
      </div>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("review.sharePlaceholder")}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
      />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <SubAxis label={t("review.quality")} value={quality} onChange={setQuality} />
        <SubAxis label={t("review.communication")} value={communication} onChange={setCommunication} />
        <SubAxis label={t("review.onTimeDelivery")} value={onTime} onChange={setOnTime} />
        <SubAxis label={t("review.valueForMoney")} value={value} onChange={setValue} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSubmit({ overall, quality, communication, on_time_delivery: onTime, value_for_money: value, text })}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl btn-purple text-white text-[13px] font-black cursor-pointer disabled:opacity-60"
        >
          {submitting ? t("review.submitting") : t("review.submit")}
        </button>
      </div>
    </div>
  );
}

function SubAxis({ label, value, onChange }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <StarRow value={value} onChange={onChange} size={14} />
    </div>
  );
}

function StarRow({ value, onChange, size = 18 }) {
  const t = useTranslations("InfluencerServicesOrdersId");
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const v = i + 1;
        const filled = v <= value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className="cursor-pointer transition-transform hover:scale-110"
            aria-label={t("review.starAria", { count: v })}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#fbbf24" : "transparent"} stroke={filled ? "#fbbf24" : "#cbd5e1"} strokeWidth="2">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
