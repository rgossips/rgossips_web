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
  const [actionLoading, setActionLoading] = useState(null); // 'accept' | 'counter' | 'decline'
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [mode, setMode] = useState(null); // 'counter' | 'decline'

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
      // For "advance" we first flip the quote to 'accepted' (so the user's
      // intent is recorded) and then hand off to Stripe. The webhook will
      // mark advance_paid + status='in_progress' on a successful payment.
      if (phase === "advance" && order.status === "quoted") {
        await fetch(`${supabaseUrl}/functions/v1/respond-to-quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ userId: user?.id, orderId: id, action: "accept" }),
        });
      }
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

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-6 space-y-5">
        <button
          onClick={() => router.push("/influencer/services")}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Services
        </button>

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
                  <Row label="Platform fee" value={formatINR(order.platform_fee_amount || 0)} />
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
                      placeholder={`Your counter (₹), excl. ${order.platform_fee_amount ? "platform fee" : ""}`}
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
