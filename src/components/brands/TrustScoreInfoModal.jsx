"use client";

import React from "react";
import { X, ShieldCheck, Sparkles, RefreshCcw } from "lucide-react";

// Shared transparency modal explaining how the brand trust score works.
// Same content + visual lives in two places: brand homepage Hero/Trust
// chip and the brand profile's "How your trust score is calculated"
// button. Driven by the same data the scoring functions in
// src/lib/brandProfile.js use, so changes to weights / cold-start cap
// only need to be updated in one place there and reflected in copy here.

const PILLARS = [
  {
    label: "Influencer Reviews",
    weight: "30%",
    desc: "Ratings from influencers you've collaborated with — on brief clarity, fair negotiation, quality of feedback, and overall experience.",
  },
  {
    label: "Campaign Execution Quality",
    weight: "25%",
    desc: "How smoothly you take campaigns from approval to completion — finishing what you start, with minimal back-and-forth.",
  },
  {
    label: "Verification & Identity",
    weight: "20%",
    desc: "How complete your verified business details are (PAN, GSTIN, bank, and more). Fully verified brands rank higher.",
  },
  {
    label: "Communication Quality",
    weight: "15%",
    desc: "How promptly you respond at each step — approving applications, negotiating, and giving draft feedback — and how clear that feedback is.",
  },
  {
    label: "Platform Engagement",
    weight: "10%",
    desc: "Staying active on RGossips — keeping your profile complete (category, about, logo) and running campaigns.",
  },
];

const HIGHLIGHTS = [
  {
    Icon: ShieldCheck,
    iconBg: "from-pink-500 to-rose-500",
    title: "Fair to everyone.",
    desc: "Payment behaviour is never scored — all payments are secured upfront through escrow, so it's identical for every brand.",
  },
  {
    Icon: Sparkles,
    iconBg: "from-amber-500 to-orange-500",
    title: "New brands start fairly.",
    desc: "Until you complete 3 campaigns, your score is capped at 720 — so it reflects a real, proven track record.",
  },
  {
    Icon: RefreshCcw,
    iconBg: "from-indigo-500 to-blue-500",
    title: "Always current.",
    desc: "Your score is recalculated regularly as new reviews, campaigns, and activity come in — improvements show up quickly.",
  },
];

export default function TrustScoreInfoModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* Gradient header */}
        <div className="relative px-6 py-6 bg-gradient-to-br from-[#9333ea] via-[#ec4899] to-[#3b82f6]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <h2 className="text-xl font-black text-white tracking-tight pr-8">
            How Your Trust Score Works
          </h2>
          <p className="text-xs text-white/85 leading-relaxed mt-2">
            Your Trust Score is a single number from 300 to 900 that helps
            influencers see, at a glance, how reliable and rewarding it is
            to work with your brand.
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 bg-white">
          {/* Scale */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              The 300–900 Scale
            </p>
            <div className="h-3 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-violet-500 mb-2" />
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>300 · Building Trust</span>
              <span>Established</span>
              <span>900 · Elite</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-3">
              The higher your score, the more visibility and trust your
              campaigns earn on RGossips. It is built from five factors,
              each contributing a fixed share:
            </p>
          </section>

          {/* Pillars */}
          <section className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              What goes into it
            </p>
            {PILLARS.map((p) => (
              <div key={p.label}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900">{p.label}</h3>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 shrink-0">
                    {p.weight}
                  </span>
                </div>
                <div className="h-[2px] rounded-full bg-gradient-to-r from-purple-400/60 via-pink-400/60 to-rose-400/60 mb-2" />
                <p className="text-[11px] text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </section>

          {/* Good to know */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Good to know
            </p>
            {HIGHLIGHTS.map(({ Icon, iconBg, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-white shrink-0 shadow-md`}
                >
                  <Icon size={16} />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-extrabold text-slate-900">{title}</span>{" "}
                  {desc}
                </p>
              </div>
            ))}
          </section>

          <p className="text-[10px] text-slate-400 leading-relaxed text-center pt-2">
            Your Trust Score is informational and updates automatically.
            RGossips · operated by Rude Labs Pvt. Ltd.
          </p>
        </div>
      </div>
    </div>
  );
}
