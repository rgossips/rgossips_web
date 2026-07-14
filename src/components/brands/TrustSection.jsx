"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";
import TrustScoreInfoModal from "@/components/brands/TrustScoreInfoModal";
import InfoBadge from "@/components/brands/InfoBadge";

// Band → ring color. Bands match the spec's five-tier ladder
// (Elite / Trusted / Established / Emerging / Building Trust).
const BAND_RING = {
  "Elite":          "#10b981", // emerald
  "Trusted":        "#3b82f6", // blue
  "Established":    "#5B3DF5", // indigo
  "Emerging":       "#f59e0b", // amber
  "Building Trust": "#64748b", // slate
};

export const TrustSection = () => {
  const t = useTranslations("BrandsTrustSection");
  const { trust } = useBrandTrustScore();
  const [trustInfoOpen, setTrustInfoOpen] = useState(false);
  const min = trust?.scaleMin ?? 300;
  const max = trust?.scaleMax ?? 900;
  const score = trust?.score || min;
  const band = trust?.band || "Building Trust";
  // Ring sweep tracks position within the 300–900 range, not score/max,
  // so a 600 lands roughly half-way around the ring instead of two-thirds.
  const ringPct = Math.min(100, Math.max(0, ((score - min) / (max - min)) * 100));

  // SVG ring (radius 26, circumference ≈ 163.4)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (ringPct / 100) * circumference;

  const ringColor = BAND_RING[band] || "#f59e0b";

  return (
    <div className="flex items-center flex-col lg:flex-row w-full px-3 lg:px-0 gap-3 lg:gap-5">
      {/* Floating Search */}
      <div className="bg-white flex-1 w-full lg:w-auto rounded-3xl p-4 flex lg:hidden items-center justify-between shadow-xl shadow-slate-200/50 border border-slate-100">
        <p className="text-slate-400 text-sm font-medium pl-2">
          {t("searchPlaceholder")}
        </p>
        <button className="bg-[#5B3DF5] p-2.5 rounded-2xl text-white cursor-pointer">
          <Plus size={24} />
        </button>
      </div>

      {/* Trust Score Card */}
      <div className="bg-[#1F1F1F] w-full lg:min-w-[280px] rounded-4xl p-6 flex justify-between items-center text-white">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              {t("yourTrustScore")}
            </p>
            <button
              onClick={() => setTrustInfoOpen(true)}
              className="cursor-pointer hover:scale-110 transition-transform inline-flex"
              aria-label={t("infoAriaLabel")}
              title={t("infoTitle")}
            >
              <InfoBadge size={16} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{score}</span>
            <span className="text-slate-500 text-xs font-bold">{t("scoreOutOf", { max })}</span>
          </div>
          {trust?.coldStart && (
            <p className="text-amber-400 text-[9px] font-bold mt-1 uppercase tracking-wider">
              {t("coldStartCap", { cap: trust.coldStartCap })}
            </p>
          )}
        </div>

        {/* Score Ring */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <svg className="absolute inset-0" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke="#2A2A2A"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 32 32)"
            />
          </svg>
          <span className="text-[9px] font-black italic text-center leading-tight px-1">{band}</span>
        </div>
      </div>

      <TrustScoreInfoModal open={trustInfoOpen} onClose={() => setTrustInfoOpen(false)} />
    </div>
  );
};
