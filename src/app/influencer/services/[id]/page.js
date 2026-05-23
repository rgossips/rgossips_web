"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Check,
  Clock,
  Flame,
  MessageSquare,
  Info,
  Image as ImageIcon,
  Film,
  Loader2,
} from "lucide-react";
import { fetchServiceBySlug, formatINR, iconForName } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  // Latest order this user has for this service, if any. Shown in the right
  // rail so they can pick up where they left off.
  const [latestOrder, setLatestOrder] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServiceBySlug(id);
      if (cancelled) return;
      setService(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!service?.id || !user?.id) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("service_orders")
        .select("id, order_number, status, total_amount, quoted_amount, advance_pct, quote_valid_until, created_at")
        .eq("user_id", user.id)
        .eq("service_id", service.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setLatestOrder(data || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [service?.id, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-pink-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-bold text-slate-600">Service not found</p>
        <button
          onClick={() => router.push("/influencer/services")}
          className="mt-4 text-sm font-bold text-pink-500 hover:underline cursor-pointer"
        >
          Back to All Services
        </button>
      </div>
    );
  }

  const Icon = iconForName(service.icon_name);
  const tagColor = service.accent || "bg-rose-100 text-rose-600";

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => router.push("/influencer/services")}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title block */}
            <div>
              <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${tagColor}`}>
                {service.tag}
              </span>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 mt-2 leading-tight">
                {service.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span className="text-[12px] font-black text-slate-700">
                    {Number(service.rating_avg || 0).toFixed(1)}
                    <span className="text-slate-400 font-bold"> ({service.reviews_count || 0} reviews)</span>
                  </span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                  Available Now
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Clock size={11} /> {service.quote_sla_hours} hr quote SLA
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Flame size={11} className="text-orange-500" /> {service.booked_this_month} booked this month
                </span>
              </div>
            </div>

            {/* Hero — featured image overrides the gradient when present */}
            {service.featured_image_url ? (
              <div className="relative aspect-[2.4/1] rounded-3xl overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.featured_image_url}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`relative aspect-[2.4/1] rounded-3xl bg-gradient-to-br ${service.hero_gradient} flex items-center justify-center overflow-hidden`}>
                <Icon size={68} strokeWidth={1.4} className="text-white/85" />
              </div>
            )}

            {/* Gallery thumbnails */}
            <Thumbnails service={service} />

            {/* About */}
            <section>
              <h2 className="text-base font-black text-slate-900 mb-2">About this service</h2>
              <p className="text-[13px] text-slate-600 leading-relaxed">{service.about}</p>
            </section>

            {/* What's included */}
            <section>
              <h2 className="text-base font-black text-slate-900 mb-3">What's included</h2>
              <ul className="space-y-2">
                {(Array.isArray(service.included) ? service.included : []).map((line) => (
                  <li key={line} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="lg:sticky lg:top-24 space-y-4">
            {latestOrder && (
              <LatestOrderCard order={latestOrder} onOpen={() => router.push(`/influencer/services/orders/${latestOrder.id}`)} />
            )}
          <aside className="space-y-4 bg-white rounded-3xl border border-slate-100 p-5 lg:p-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Starting at
              </p>
              <p className="text-3xl font-black text-slate-900 leading-tight">
                {formatINR(service.price_starting)}
                {service.price_suffix && (
                  <span className="text-[12px] font-bold text-slate-400">
                    {service.price_suffix}
                  </span>
                )}
              </p>
              {service.price_to && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Most {service.tag.toLowerCase()} priced between {formatINR(service.price_starting)} – {formatINR(service.price_to)} depending on length, complexity, and revisions.
                </p>
              )}
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 flex gap-2 items-start text-[11px] text-rose-700">
              <Info size={14} className="text-rose-500 shrink-0 mt-0.5" />
              <p>
                Final price is custom-quoted after we review your raw footage and requirements. Quote sent within {service.quote_sla_hours} hours.
              </p>
            </div>

            {Array.isArray(service.packages) && service.packages.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Typical packages
                </p>
                {service.packages.map((p) => (
                  <div key={p.name} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-b-0">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-[13px] font-black text-slate-900 leading-tight">{p.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.spec}</p>
                    </div>
                    <p className="text-[13px] font-black text-slate-900 whitespace-nowrap">
                      ~{formatINR(p.price)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                onClick={() => router.push(`/influencer/services/${service.slug}/quote`)}
                className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-100"
              >
                <MessageSquare size={15} /> Get Custom Quote
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
              <Stat label="Quote turnaround" value={`${service.quote_sla_hours} hrs`} />
              <Stat label="Delivery time" value={service.delivery_days} />
              <Stat label="Payment split" value={service.payment_split} />
            </div>
          </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_PILL = {
  pending_quote: { label: "Awaiting quote", class: "bg-amber-50 text-amber-700" },
  quoted: { label: "Quote ready", class: "bg-emerald-50 text-emerald-700" },
  counter_offered: { label: "Counter sent", class: "bg-orange-50 text-orange-700" },
  accepted: { label: "Quote accepted", class: "bg-emerald-50 text-emerald-700" },
  paid_advance: { label: "Advance paid", class: "bg-violet-50 text-violet-700" },
  in_progress: { label: "In progress", class: "bg-violet-50 text-violet-700" },
  draft_ready: { label: "Draft ready", class: "bg-amber-50 text-amber-700" },
  revision_requested: { label: "Revision sent", class: "bg-orange-50 text-orange-700" },
  paid_final: { label: "Final paid", class: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", class: "bg-blue-50 text-blue-700" },
  declined: { label: "Declined", class: "bg-gray-100 text-gray-500" },
  expired: { label: "Expired", class: "bg-gray-100 text-gray-500" },
};

function LatestOrderCard({ order, onOpen }) {
  const pill = STATUS_PILL[order.status] || { label: order.status, class: "bg-slate-100 text-slate-600" };
  const amount =
    order.total_amount ||
    order.quoted_amount ||
    0;

  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-gradient-to-br from-pink-50 via-rose-50 to-violet-50 rounded-3xl border border-pink-100 p-5 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">
          Your latest request
        </p>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${pill.class}`}>
          {pill.label}
        </span>
      </div>
      <p className="text-[11px] font-mono text-slate-400 mt-1">{order.order_number}</p>
      {amount > 0 && (
        <p className="text-2xl font-black text-slate-900 mt-2 leading-tight">
          ₹{Number(amount).toLocaleString("en-IN")}
        </p>
      )}
      <p className="text-[12px] font-bold text-pink-500 mt-2">Open order →</p>
    </button>
  );
}

function Thumbnails({ service }) {
  const gallery = Array.isArray(service.gallery) ? service.gallery : [];
  if (gallery.length === 0) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {gallery.map((g, i) => (
        <a
          key={i}
          href={g.url}
          target="_blank"
          rel="noopener noreferrer"
          className="aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-pink-300 transition-colors relative cursor-pointer block group"
          title={g.caption || ""}
        >
          {g.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={g.url}
              alt={g.caption || ""}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Film size={24} />
            </div>
          )}
          <span className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/60 text-white">
            {g.type}
          </span>
        </a>
      ))}
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-[14px] font-black text-slate-900 leading-tight">{value}</p>
      <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">{label}</p>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-3">
      <div className={`w-9 h-9 rounded-full ${review.color || "bg-slate-400"} text-white text-[11px] font-black flex items-center justify-center shrink-0`}>
        {review.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-[13px] font-black text-slate-900">{review.name}</p>
          <p className="text-[10px] text-slate-400">{review.ago}</p>
        </div>
        <p className="text-[12px] text-slate-600 leading-snug mt-1">{review.text}</p>
      </div>
    </div>
  );
}
