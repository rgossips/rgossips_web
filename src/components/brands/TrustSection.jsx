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

        {/* Band chip — the progress ring was dropped per design feedback;
            the numeric score already communicates magnitude. */}
        <span
          className="text-[10px] font-black italic text-center leading-tight px-3 py-1.5 rounded-full border"
          style={{ color: ringColor, borderColor: ringColor }}
        >
          {band}
        </span>
      </div>

      <TrustScoreInfoModal open={trustInfoOpen} onClose={() => setTrustInfoOpen(false)} />
    </div>
  );
};
