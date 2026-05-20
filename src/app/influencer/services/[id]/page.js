"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { findService, formatINR } from "@/lib/services";

export default function ServiceDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const service = findService(id);

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

  const Icon = service.icon;
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
                    {service.rating.toFixed(1)}
                    <span className="text-slate-400 font-bold"> ({service.reviews} reviews)</span>
                  </span>
                </div>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                  Available Now
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Clock size={11} /> {service.quoteSlaHours} hr quote SLA
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Flame size={11} className="text-orange-500" /> {service.bookedThisMonth} booked this month
                </span>
              </div>
            </div>

            {/* Hero */}
            <div className={`relative aspect-[2.4/1] rounded-3xl bg-gradient-to-br ${service.heroGradient} flex items-center justify-center overflow-hidden`}>
              <Icon size={68} strokeWidth={1.4} className="text-white/85" />
            </div>

            {/* Thumbnails */}
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
                {service.included.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-[13px] text-slate-700">
                    <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Recent reviews */}
            {service.recentReviews?.length > 0 && (
              <section>
                <h2 className="text-base font-black text-slate-900 mb-3">Recent reviews</h2>
                <div className="space-y-3">
                  {service.recentReviews.map((r, i) => (
                    <ReviewCard key={i} review={r} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="lg:sticky lg:top-24 space-y-4 bg-white rounded-3xl border border-slate-100 p-5 lg:p-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Starting at
              </p>
              <p className="text-3xl font-black text-slate-900 leading-tight">
                {formatINR(service.price)}
                {service.priceSuffix && (
                  <span className="text-[12px] font-bold text-slate-400">
                    {service.priceSuffix}
                  </span>
                )}
              </p>
              {service.priceTo && (
                <p className="text-[11px] text-slate-500 mt-1">
                  Most {service.tag.toLowerCase()} priced between {formatINR(service.price)} – {formatINR(service.priceTo)} depending on length, complexity, and revisions.
                </p>
              )}
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 flex gap-2 items-start text-[11px] text-rose-700">
              <Info size={14} className="text-rose-500 shrink-0 mt-0.5" />
              <p>
                Final price is custom-quoted after we review your raw footage and requirements. Quote sent within {service.quoteSlaHours} hours.
              </p>
            </div>

            {service.packages?.length > 0 && (
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
                onClick={() => router.push(`/influencer/services/${service.id}/quote`)}
                className="w-full py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-pink-100"
              >
                <MessageSquare size={15} /> Get Custom Quote
              </button>
              <button className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer hover:border-pink-200 hover:text-pink-500">
                <MessageSquare size={15} /> Ask a question
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
              <Stat label="Quote turnaround" value={`${service.quoteSlaHours} hrs`} />
              <Stat label="Delivery time" value={service.deliveryDays} />
              <Stat label="Payment split" value={service.paymentSplit} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Thumbnails({ service }) {
  const Icon = service.icon;
  // Static thumbnail row matching the screenshot — first tile mirrors the hero
  // icon, the rest are placeholder media icons.
  const tiles = [
    { Icon, active: true },
    { Icon: ImageIcon },
    { Icon: ImageIcon },
    { Icon: Film },
  ];
  const [active, setActive] = useState(0);
  return (
    <div className="grid grid-cols-4 gap-3">
      {tiles.map((t, i) => {
        const I = t.Icon;
        const isActive = i === active;
        return (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`aspect-[2.4/1] rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isActive
                ? "bg-white border-2 border-pink-500 shadow-sm"
                : "bg-slate-100 border border-slate-200 hover:border-slate-300"
            }`}
          >
            <I size={20} className={isActive ? "text-pink-500" : "text-slate-400"} strokeWidth={1.6} />
          </button>
        );
      })}
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
