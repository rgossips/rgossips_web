"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { X, ShieldCheck, Sparkles, RefreshCcw } from "lucide-react";

// Shared transparency modal explaining how the brand trust score works.
// Same content + visual lives in two places: brand homepage Hero/Trust
// chip and the brand profile's "How your trust score is calculated"
// button. Driven by the same data the scoring functions in
// src/lib/brandProfile.js use, so changes to weights / cold-start cap
// only need to be updated in one place there and reflected in copy here.

const PILLARS = [
  { key: "influencerReviews", weight: "30%" },
  { key: "campaignExecution", weight: "25%" },
  { key: "verification", weight: "20%" },
  { key: "communication", weight: "15%" },
  { key: "platformEngagement", weight: "10%" },
];

const HIGHLIGHTS = [
  { key: "fairToEveryone", Icon: ShieldCheck, iconBg: "from-pink-500 to-rose-500" },
  { key: "newBrands", Icon: Sparkles, iconBg: "from-amber-500 to-orange-500" },
  { key: "alwaysCurrent", Icon: RefreshCcw, iconBg: "from-indigo-500 to-blue-500" },
];

export default function TrustScoreInfoModal({ open, onClose }) {
  const t = useTranslations("BrandsTrustScoreInfoModal");

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
            aria-label={t("close")}
          >
            <X size={16} />
          </button>
          <h2 className="text-xl font-black text-white tracking-tight pr-8">
            {t("title")}
          </h2>
          <p className="text-xs text-white/85 leading-relaxed mt-2">
            {t("intro")}
          </p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-6 bg-white">
          {/* Scale */}
          <section>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              {t("scale.heading")}
            </p>
            <div className="h-3 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-400 to-violet-500 mb-2" />
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>{t("scale.low")}</span>
              <span>{t("scale.mid")}</span>
              <span>{t("scale.high")}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-3">
              {t("scale.description")}
            </p>
          </section>

          {/* Pillars */}
          <section className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t("pillars.heading")}
            </p>
            {PILLARS.map((p) => (
              <div key={p.key}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <h3 className="text-sm font-extrabold text-slate-900">{t(`pillars.items.${p.key}.label`)}</h3>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 shrink-0">
                    {p.weight}
                  </span>
                </div>
                <div className="h-[2px] rounded-full bg-gradient-to-r from-purple-400/60 via-pink-400/60 to-rose-400/60 mb-2" />
                <p className="text-[11px] text-slate-500 leading-relaxed">{t(`pillars.items.${p.key}.desc`)}</p>
              </div>
            ))}
          </section>

          {/* Good to know */}
          <section className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t("highlights.heading")}
            </p>
            {HIGHLIGHTS.map(({ key, Icon, iconBg }) => (
              <div
                key={key}
                className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center text-white shrink-0 shadow-md`}
                >
                  <Icon size={16} />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-extrabold text-slate-900">{t(`highlights.items.${key}.title`)}</span>{" "}
                  {t(`highlights.items.${key}.desc`)}
                </p>
              </div>
            ))}
          </section>

          <p className="text-[10px] text-slate-400 leading-relaxed text-center pt-2">
            {t("footer")}
          </p>
        </div>
      </div>
    </div>
  );
}
