"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search, ChevronRight, RefreshCw } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import { formatINR } from "@/lib/services";

const STATUS_PILL = {
  pending_quote: { key: "pendingQuote", class: "bg-amber-50 text-amber-700" },
  quoted: { key: "quoted", class: "bg-emerald-50 text-emerald-700" },
  counter_offered: { key: "counterOffered", class: "bg-orange-50 text-orange-700" },
  accepted: { key: "accepted", class: "bg-emerald-50 text-emerald-700" },
  paid_advance: { key: "paidAdvance", class: "bg-violet-50 text-violet-700" },
  in_progress: { key: "inProgress", class: "bg-violet-50 text-violet-700" },
  draft_ready: { key: "draftReady", class: "bg-amber-50 text-amber-700" },
  revision_requested: { key: "revisionRequested", class: "bg-orange-50 text-orange-700" },
  paid_final: { key: "paidFinal", class: "bg-emerald-50 text-emerald-700" },
  completed: { key: "completed", class: "bg-blue-50 text-blue-700" },
  declined: { key: "declined", class: "bg-gray-100 text-gray-500" },
  expired: { key: "expired", class: "bg-gray-100 text-gray-500" },
};

const TABS = [
  { id: "all", key: "all" },
  { id: "active", key: "active" },
  { id: "completed", key: "completed" },
  { id: "declined", key: "declined" },
];

const ACTIVE_STATUSES = new Set([
  "pending_quote",
  "quoted",
  "counter_offered",
  "accepted",
  "paid_advance",
  "in_progress",
  "draft_ready",
  "revision_requested",
  "paid_final",
]);

// A quote can sit at status='quoted' (or counter_offered) past its
// quote_valid_until — the server only flips it to 'expired' on the next
// touch. Treat both list pill + tab filtering as if it had already
// flipped, so the influencer sees the truth immediately.
const isQuoteExpired = (order) => {
  if (!order?.quote_valid_until) return false;
  if (order.status !== "quoted" && order.status !== "counter_offered") return false;
  return new Date(order.quote_valid_until).getTime() < Date.now();
};
const effectiveStatus = (order) =>
  isQuoteExpired(order) ? "expired" : order.status;

export default function ServiceRequestsHistoryPage() {
  const t = useTranslations("InfluencerServicesOrders");
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Pulled out of the effect so the refresh button can re-fetch without
  // toggling the loading skeleton on every click.
  const loadOrders = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("service_orders")
      .select("id, order_number, service_title, status, total_amount, quoted_amount, advance_pct, quote_valid_until, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;
    (async () => {
      await loadOrders();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await loadOrders(); } finally { setRefreshing(false); }
  };

  const counts = useMemo(() => {
    const out = { all: orders.length, active: 0, completed: 0, declined: 0 };
    for (const o of orders) {
      const s = effectiveStatus(o);
      if (ACTIVE_STATUSES.has(s)) out.active += 1;
      else if (s === "completed") out.completed += 1;
      else if (s === "declined" || s === "expired") out.declined += 1;
    }
    return out;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const s = effectiveStatus(o);
      if (tab === "active" && !ACTIVE_STATUSES.has(s)) return false;
      if (tab === "completed" && s !== "completed") return false;
      if (tab === "declined" && s !== "declined" && s !== "expired") return false;
      if (!q) return true;
      return (
        (o.service_title || "").toLowerCase().includes(q) ||
        (o.order_number || "").toLowerCase().includes(q)
      );
    });
  }, [orders, tab, query]);

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-6 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/influencer/profile")}
            className="p-2.5 cursor-pointer bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100 transition-colors"
            aria-label={t("back")}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 leading-tight tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title={t("refreshStatus")}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-pink-500 px-3 py-2 rounded-full hover:bg-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> {t("refresh")}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 h-11 bg-white border-none rounded-2xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`text-[12px] font-bold px-3.5 py-2 rounded-full whitespace-nowrap transition cursor-pointer inline-flex items-center gap-1.5 ${
                tab === tabItem.id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t(`tabs.${tabItem.key}`)}
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                tab === tabItem.id ? "bg-white/20" : "bg-slate-100 text-slate-600"
              }`}>
                {counts[tabItem.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-pink-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl text-slate-400 font-bold">
            {orders.length === 0 ? t("empty.noOrders") : t("empty.noneInView")}
            {orders.length === 0 && (
              <div className="mt-3">
                <button
                  onClick={() => router.push("/influencer/services")}
                  className="text-sm font-bold text-pink-500 hover:underline cursor-pointer"
                >
                  {t("empty.browseServices")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((o) => (
              <OrderRow key={o.id} order={o} onClick={() => router.push(`/influencer/services/orders/${o.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, onClick }) {
  const t = useTranslations("InfluencerServicesOrders");
  const s = effectiveStatus(order);
  const pillDef = STATUS_PILL[s];
  const pill = pillDef
    ? { label: t(`status.${pillDef.key}`), class: pillDef.class }
    : { label: s, class: "bg-slate-100 text-slate-600" };
  const amount = order.total_amount || order.quoted_amount || 0;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-3xl border border-slate-100 p-4 lg:p-5 hover:shadow-md hover:border-slate-200 transition-all flex items-center gap-4 cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-[11px] font-mono text-slate-400">{order.order_number}</p>
          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${pill.class}`}>
            {pill.label}
          </span>
        </div>
        <p className="text-sm font-black text-slate-900 mt-1 truncate">{order.service_title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="hidden sm:block text-right shrink-0">
        {amount > 0 && (
          <p className="text-base font-black text-slate-900">{formatINR(amount)}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-slate-300 shrink-0" />
    </button>
  );
}
