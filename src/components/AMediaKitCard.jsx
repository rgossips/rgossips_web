"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Eye, Sparkles } from "lucide-react";
import Image from "next/image";

export function AiMediaKitCard() {
  const stats = [
    { icon: <Users size={18} />, label: "FOLLOWERS", value: "12.4K" },
    { icon: <TrendingUp size={18} />, label: "ENG. RATE", value: "4.2%" },
    { icon: <Eye size={18} />, label: "AVG VIEWS", value: "8.5K" },
  ];

  return (
    <div className="w-full h-full flex justify-center">
      <Card className="w-full h-full flex flex-col p-6 lg:p-8 rounded-[32px] border-slate-200 border shadow-sm bg-white overflow-hidden">
        {/* 1. Header - Pushed to top */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              AI Media Kit
              <Sparkles size={20} className="text-blue-500 fill-blue-500/10" />
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
              Real-time analytics
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-black border border-blue-100">
            Preview
          </span>
        </div>

        {/* 2. Middle Section - flex-1 expands to fill space, items-center centers content */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 lg:py-12">
          {/* Avatar with larger presence */}
          <div className="relative mb-6">
            <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#9810fa] to-[#ff8ba7] shadow-lg">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white p-1 overflow-hidden">
                <Image
                  src="https://i.pravatar.cc/150?u=alexcreates"
                  alt="Alex Rivera"
                  width={96}
                  height={96}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h4 className="text-xl font-black text-slate-800 leading-tight">
              Alex Rivera
            </h4>
            <p className="text-sm font-bold text-slate-400 tracking-wide">
              @alexcreates
            </p>
          </div>

          {/* Stats Row - Spaced out better */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-slate-50/50 border border-slate-100 rounded-3xl py-4 transition-all hover:bg-slate-50 hover:border-slate-200"
              >
                <div className="text-slate-300 mb-2">{stat.icon}</div>
                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-1">
                  {stat.label}
                </span>
                <span className="text-base lg:text-lg font-black text-slate-800">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CTA Button - Pushed to bottom */}
        <button className="group relative w-full py-4 px-6 rounded-2xl font-black text-white cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#ec4899] transition-opacity group-hover:opacity-90" />
          <span className="relative flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
            Generate Media Kit
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </button>
      </Card>
    </div>
  );
}
