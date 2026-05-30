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
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/services";

const STATUS_BANNER = {
  pending_quote: {
    title: "Quote request submitted",
    body: "Our team is reviewing your brief — we'll respond with a quote within the SLA.",
    accent: "from-amber-500 to-orange-500",
    icon: Clock,
  },
  quoted: {
    title: "Your quote is ready!",
    body: "Review the details below and pay 50% to kick off the project.",
    accent: "from-emerald-500 to-teal-500",
    icon: Mail,
  },
  counter_offered: {
    title: "Counter offer sent",
    body: "Awaiting the team's response to your counter offer.",
    accent: "from-orange-500 to-rose-500",
    icon: Send,
  },
  accepted: {
    title: "Quote accepted — pay to start",
    body: "Pay your advance to begin production.",
    accent: "from-emerald-500 to-teal-500",
    icon: CheckCircle2,
  },
  paid_advance: {
    title: "Advance received — work starting",
    body: "We've received your advance. Production begins now.",
    accent: "from-violet-500 to-fuchsia-500",
    icon: Check,
  },
  in_progress: {
    title: "Work in progress",
    body: "Our team is on it. Updates land in this thread.",
    accent: "from-violet-500 to-fuchsia-500",
    icon: Clock,
  },
  draft_ready: {
    title: "Your draft is ready for review",
    body: "Preview the draft and either approve or request a revision.",
    accent: "from-amber-500 to-orange-500",
    icon: Mail,
  },
  revision_requested: {
    title: "Revision in progress",
    body: "Your notes are with the team — a new draft is on the way.",
    accent: "from-orange-500 to-rose-500",
    icon: Clock,
  },
  paid_final: {
    title: "Final payment received — wrapping up",
    body: "Your files are being prepared for delivery.",
    accent: "from-emerald-500 to-teal-500",
    icon: Check,
  },
  completed: {
    title: "Order completed! Your files are ready",
    body: "Download your files below and leave a quick review.",
    accent: "from-emerald-500 to-teal-500",
    icon: CheckCircle2,
  },
  declined: {
    title: "Request declined",
    body: "This request didn't move forward. You can submit a fresh brief any time.",
    accent: "from-gray-400 to-gray-500",
    icon: X,
  },
  expired: {
    title: "Quote expired",
    body: "The validity period passed without action. Submit a fresh request to continue.",
    accent: "from-gray-400 to-gray-500",
    icon: AlertCircle,
  },
};

export default function ServiceOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, role } = useAuth();
  const supabase = createClient();

  const [order, setOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null); // 'accept' | 'counter' | 'decline' | 'approve' | 'revision'
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [mode, setMode] = useState(null); // 'counter' | 'decline' | 'revision'
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
    if (ms <= 0) return "Expired";
    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    return `${d}d ${h}h`;
  }, [order?.quote_valid_until]);

  // Kicks off the Stripe Checkout flow for the advance (50%) — or, when
  // status is draft_ready, the final 50%. Redirects in-place to Stripe.
  const payViaStripe = async (phase) => {
    setActionLoading(phase === "advance" ? "accept" : "approve");
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      // Status stays at 'quoted' while we hand off to Stripe. If the user
      // cancels in the Checkout page the order remains 'quoted' and they
      // can try again (or counter / decline). Only the webhook's successful
      // payment event flips the order forward — preventing "accepted but
      // never paid" zombie orders.
      const res = await fetch(`${supabaseUrl}/functions/v1/service-payment-checkout`, {
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
      if (!data?.url) throw new Error("No checkout URL returned");
      window.location.href = data.url; // hand off to Stripe
    } catch (e) {
      setError(e.message || "Failed to start payment");
      setActionLoading(null);
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
      setError(e.message || "Failed to submit review");
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
      setError(e.message || "Failed to request revision");
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
      setError(e.message || "Failed");
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
        <p className="text-base font-bold text-slate-600">Order not found</p>
        <button
          onClick={() => router.push("/influencer/services")}
          className="mt-4 text-sm font-bold text-pink-500 hover:underline cursor-pointer"
        >
          Back to Services
        </button>
      </div>
    );
  }

  const banner = STATUS_BANNER[order.status] || STATUS_BANNER.pending_quote;
  const BannerIcon = banner.icon;
  const isQuoted = order.status === "quoted";

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
            <ArrowLeft size={14} /> Back
          </button>
          <button
            onClick={() => refresh()}
            title="Refresh status"
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-pink-500 px-3 py-1.5 rounded-full hover:bg-white transition-all cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Status banner */}
        <div className={`rounded-2xl bg-gradient-to-r ${banner.accent} text-white p-5 lg:p-6 flex items-center gap-4 shadow-md`}>
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <BannerIcon size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg lg:text-xl font-black leading-tight">{banner.title}</h1>
            <p className="text-[12px] lg:text-[13px] text-white/85 mt-0.5">
              Order #{order.order_number} · {order.service_title}
            </p>
          </div>
          {isQuoted && validityRemaining && (
            <div className="hidden sm:block text-right shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-white/70">Quote valid for</p>
              <p className="text-base font-black">{validityRemaining}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card title="Project summary">
              <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{order.description}</p>
            </Card>

            {isQuoted && order.final_formats && (
              <Card title="What you'll get">
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
              <Card title="Project specifications">
                <div className="grid grid-cols-2 gap-3">
                  <Spec
                    label="Delivery date"
                    value={order.quoted_delivery_date ? new Date(order.quoted_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  />
                  <Spec label="Turnaround" value={order.quoted_turnaround_days ? `${order.quoted_turnaround_days} days` : "—"} />
                  <Spec label="Revisions" value={`${order.revisions_allowed} rounds`} />
                  <Spec label="Final formats" value={order.final_formats || "—"} />
                </div>
              </Card>
            )}

            {order.quote_message && (
              <Card title="Note from our team">
                <p className="text-[13px] text-slate-700 bg-amber-50 border border-amber-100 rounded-xl p-3 leading-relaxed">
                  {order.quote_message}
                </p>
              </Card>
            )}

            {messages.length > 0 && (
              <Card title="Messages">
                <div className="space-y-3">
                  {messages.map((m) => (
                    <Message key={m.id} message={m} mine={m.sender_id === user?.id} />
                  ))}
                </div>
              </Card>
            )}

            {events.length > 0 && (
              <Card title="Order timeline">
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
            {isQuoted && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Total project cost
                  </p>
                  <p className="text-3xl font-black text-slate-900 leading-tight">
                    {formatINR(order.total_amount)}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-[12px]">
                  <Row label="Subtotal" value={formatINR(order.quoted_amount || 0)} />
                  {/* Platform fee removed — service orders don't charge one. */}
                  <div className="border-t border-slate-200 pt-1.5">
                    <Row label="Total" value={formatINR(order.total_amount || 0)} bold />
                  </div>
                  <Row
                    label={`Pay now (${order.advance_pct}%)`}
                    value={formatINR(Math.round((order.total_amount || 0) * order.advance_pct / 100))}
                    pink
                  />
                  <Row
                    label={`Pay on delivery (${100 - order.advance_pct}%)`}
                    value={formatINR((order.total_amount || 0) - Math.round((order.total_amount || 0) * order.advance_pct / 100))}
                    muted
                  />
                </div>

                {error && <p className="text-[12px] text-red-500 font-semibold">{error}</p>}

                {mode === null && (
                  <>
                    <button
                      onClick={() => payViaStripe("advance")}
                      disabled={!!actionLoading}
                      className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-100 disabled:opacity-60"
                    >
                      {actionLoading === "accept" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Accept &amp; Pay {formatINR(Math.round((order.total_amount || 0) * order.advance_pct / 100))}
                    </button>
                    <button
                      onClick={() => setMode("counter")}
                      disabled={!!actionLoading}
                      className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer hover:border-pink-200 hover:text-pink-500"
                    >
                      <MessageSquare size={14} /> Negotiate
                    </button>
                    <button
                      onClick={() => setMode("decline")}
                      disabled={!!actionLoading}
                      className="w-full text-[12px] font-bold text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      Decline this quote
                    </button>
                  </>
                )}

                {mode === "counter" && (
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder="Your counter (₹)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    />
                    <textarea
                      rows={3}
                      value={counterMessage}
                      onChange={(e) => setCounterMessage(e.target.value)}
                      placeholder="Why does this price work better for you?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode(null)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-[12px] font-black text-slate-500 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => respond("counter", { counterAmount, counterMessage })}
                        disabled={!!actionLoading || !counterAmount}
                        className="flex-1 py-2 rounded-xl btn-purple text-white text-[12px] font-black cursor-pointer disabled:opacity-60"
                      >
                        {actionLoading === "counter" ? "Sending…" : "Send counter"}
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
                      placeholder="Optional — short reason"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMode(null)}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 rounded-xl border border-slate-200 text-[12px] font-black text-slate-500 cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => respond("decline", { declineReason })}
                        disabled={!!actionLoading}
                        className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black cursor-pointer disabled:opacity-60"
                      >
                        {actionLoading === "decline" ? "Declining…" : "Confirm decline"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 pt-1">
                  <Info size={10} /> Secure payment via Stripe
                </div>
              </div>
            )}

            {/* Counter sent — shown to user while admin reviews */}
            {order.status === "counter_offered" && order.counter_amount && (
              <Card title="Your counter offer">
                <p className="text-2xl font-black text-slate-900 leading-tight">
                  {formatINR(order.counter_amount)}
                </p>
                {order.counter_message && (
                  <p className="text-[12px] text-slate-500 mt-2 italic">"{order.counter_message}"</p>
                )}
                <p className="text-[11px] text-slate-400 mt-3">
                  Awaiting our team's response. We'll notify you on WhatsApp.
                </p>
              </Card>
            )}

            {/* Two ways forward — approve & pay final, or request a revision */}
            {order.status === "draft_ready" && (
              <DraftReviewSidebar
                order={order}
                payViaStripe={payViaStripe}
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
              <Card title="Revision in progress">
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  Our team is on your revision. {order.revisions_used} of {order.revisions_allowed} revision rounds used.
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  We'll notify you when the next draft lands.
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

            <Card title="Order details">
              <Spec label="Order ID" value={order.order_number} />
              <Spec label="Service" value={order.service_title} />
              {order.quoted_delivery_date && (
                <Spec
                  label="Expected delivery"
                  value={new Date(order.quoted_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                />
              )}
              <Spec label="Submitted" value={new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
            </Card>
          </aside>
        </div>
      </div>
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
            PREVIEW
          </p>
        )}
        <a
          href={order.draft_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label="Open draft preview"
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
          Open preview ↗
        </a>
      </div>
      {isWatermarked && (
        <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-[11px] text-amber-700 flex items-start gap-2">
          <Info size={12} className="text-amber-500 shrink-0 mt-0.5" />
          <p>
            This draft is watermarked. You can review the full quality and approve, or request changes.
            Watermarks will be removed and final files unlocked once you pay the remaining{" "}
            {formatINR(
              (order.total_amount || 0) -
                Math.round(((order.total_amount || 0) * (order.advance_pct || 50)) / 100)
            )}
            .
          </p>
        </div>
      )}
      {order.draft_note && (
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Note from editor</p>
          <p className="text-[13px] text-slate-700 mt-1 leading-relaxed">{order.draft_note}</p>
        </div>
      )}
    </div>
  );
}

function DraftReviewSidebar({
  order,
  payViaStripe,
  actionLoading,
  error,
  mode,
  setMode,
  revisionNote,
  setRevisionNote,
  requestRevision,
}) {
  const total = order.total_amount || 0;
  const advance = Math.round((total * (order.advance_pct || 50)) / 100);
  const dueNow = total - advance;
  const revsLeft = (order.revisions_allowed || 0) - (order.revisions_used || 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Two ways forward
      </p>

      {/* Approve & pay final */}
      <div className="bg-emerald-50 rounded-xl p-3 space-y-1.5 text-[12px]">
        <p className="text-[11px] font-black text-emerald-700 inline-flex items-center gap-1">
          <CheckCircle2 size={12} /> Looks good as-is?
        </p>
        <Row label="Total project" value={formatINR(total)} />
        <Row label="Paid (advance)" value={`–${formatINR(advance)}`} muted />
        <div className="border-t border-emerald-200 pt-1.5">
          <Row label="Due now" value={formatINR(dueNow)} bold />
        </div>
      </div>

      <div className="bg-pink-50 rounded-xl p-3 text-center">
        <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">Pay to unlock final files</p>
        <p className="text-xl font-black text-slate-900 mt-1">{formatINR(dueNow)}</p>
      </div>

      <button
        onClick={() => payViaStripe("final")}
        disabled={!!actionLoading}
        className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-100 disabled:opacity-60"
      >
        {actionLoading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        Approve &amp; Pay Final {formatINR(dueNow)}
      </button>

      {error && <p className="text-[12px] text-red-500 font-semibold">{error}</p>}

      {/* Revision */}
      <div className="bg-amber-50 rounded-xl p-3 mt-2">
        <p className="text-[11px] font-black text-amber-700 inline-flex items-center gap-1">
          ✎ Need changes?
        </p>
        <p className="text-[11px] text-amber-700 mt-1 leading-snug">
          {revsLeft > 0
            ? `Use one of your ${revsLeft} revision${revsLeft === 1 ? "" : "s"} to request changes. No additional payment required.`
            : "You've used all your revision rounds. Reach out via support for additional changes."}
        </p>
      </div>

      {mode !== "revision" && (
        <button
          onClick={() => setMode("revision")}
          disabled={revsLeft <= 0 || !!actionLoading}
          className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer hover:border-pink-200 hover:text-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✎ Request Revision
        </button>
      )}

      {mode === "revision" && (
        <div className="space-y-2">
          <textarea
            rows={4}
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="Be specific — which parts need to change?"
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
              Cancel
            </button>
            <button
              onClick={requestRevision}
              disabled={!!actionLoading || revisionNote.trim().length < 5}
              className="flex-1 py-2 rounded-xl btn-purple text-white text-[12px] font-black cursor-pointer disabled:opacity-60"
            >
              {actionLoading === "revision" ? "Sending…" : "Send revision"}
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center pt-1">
        Once approved, files become permanently available in your order history.
      </p>
    </div>
  );
}

function DownloadList({ files }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Download your files
        </p>
        <span className="text-[10px] text-slate-400">All files available permanently in your order history</span>
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
              Download ↓
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewPanel({ existing, submitting, onSubmit }) {
  // Read-only "thank you" if there's already a row.
  if (existing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
          Review submitted
        </p>
        <p className="text-2xl font-black text-slate-900 mt-1 leading-tight">
          {existing.overall}.0 ★
        </p>
        <p className="text-[12px] text-slate-500 mt-2">
          Thanks for the feedback — it helps other creators discover the service.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-[11px]">
          <SubScore label="Quality" value={existing.quality} />
          <SubScore label="Communication" value={existing.communication} />
          <SubScore label="On-time delivery" value={existing.on_time_delivery} />
          <SubScore label="Value for money" value={existing.value_for_money} />
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
          Rate your experience
        </p>
        <p className="text-[11px] text-pink-500 mt-0.5">Help others discover the best RGossips services</p>
      </div>

      <div>
        <p className="text-[11px] text-slate-500 text-center">Tap to rate ({overall} star{overall === 1 ? "" : "s"} selected)</p>
        <div className="flex justify-center mt-1">
          <StarRow value={overall} onChange={setOverall} size={26} />
        </div>
      </div>

      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your experience… (optional)"
        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
      />

      <div className="grid grid-cols-2 gap-3 pt-1">
        <SubAxis label="Quality" value={quality} onChange={setQuality} />
        <SubAxis label="Communication" value={communication} onChange={setCommunication} />
        <SubAxis label="On-time delivery" value={onTime} onChange={setOnTime} />
        <SubAxis label="Value for money" value={value} onChange={setValue} />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSubmit({ overall, quality, communication, on_time_delivery: onTime, value_for_money: value, text })}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl btn-purple text-white text-[13px] font-black cursor-pointer disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit Review"}
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
            aria-label={`${v} star${v === 1 ? "" : "s"}`}
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
