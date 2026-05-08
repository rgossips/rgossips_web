"use client";

import React from "react";
import { Plus } from "lucide-react";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";

export const TrustSection = () => {
  const { trust } = useBrandTrustScore();
  const score = trust?.score || 0;
  const band = trust?.band || "LOW";
  const ringPct = Math.min(100, Math.max(0, (score / 1000) * 100));

  // SVG ring (radius 26, circumference ≈ 163.4)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (ringPct / 100) * circumference;

  const ringColor =
    band === "HIGH" ? "#10b981" : band === "GOOD" ? "#5B3DF5" : "#f59e0b";

  return (
    <div className="flex items-center flex-col lg:flex-row w-full px-3 lg:px-0 gap-3 lg:gap-5">
      {/* Floating Search */}
      <div className="bg-white flex-1 w-full lg:w-auto rounded-3xl p-4 flex lg:hidden items-center justify-between shadow-xl shadow-slate-200/50 border border-slate-100">
        <p className="text-slate-400 text-sm font-medium pl-2">
          Looking for 10 nano creators, 15L...
        </p>
        <button className="bg-[#5B3DF5] p-2.5 rounded-2xl text-white cursor-pointer">
          <Plus size={24} />
        </button>
      </div>

      {/* Trust Score Card */}
      <div className="bg-[#1F1F1F] w-full lg:min-w-[280px] rounded-4xl p-6 flex justify-between items-center text-white">
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            Your Trust Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{score}</span>
            <span className="text-slate-500 text-xs font-bold">/1000</span>
          </div>
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
          <span className="text-[10px] font-black italic">{band}</span>
        </div>
      </div>
    </div>
  );
};
