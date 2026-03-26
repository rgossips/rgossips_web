"use client";

import { Card } from "@/components/ui/card";
import { ChevronRight, Sparkles, Zap } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

export function ProStatusCard() {
  const { profile } = useAuth();

  return (
    <div className="lg:px-10 pb-6 w-full flex items-center justify-center">
      <Card className="w-full p-4 lg:p-6 bg-white border border-slate-200 shadow-sm rounded-[32px] lg:rounded-3xl">
        {/* Main Container: Stacks on mobile, Rows on desktop */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-6 space-y-4 lg:space-y-0">
          {/* Section 1: Avatar + Name + Earnings */}
          <div className="flex items-center gap-4 lg:shrink-0">
            <div className="relative shrink-0">
              <Image
                width={56}
                height={56}
                src={profile?.profile_photo_url || "/default-avatar.svg"}
                alt={profile?.full_name || "User"}
                className="w-14 h-14 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm object-cover"
              />
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl lg:text-xl font-black text-slate-800 leading-tight">
                Hi, {profile?.full_name?.split(" ")[0] || "Jones"}
              </h1>
              <div className="inline-flex items-center px-2 py-0.5 bg-emerald-50 rounded-md">
                <p className="text-[10px] lg:text-xs font-bold text-emerald-600 tracking-tight">
                  EARNINGS:{" "}
                  <span className="text-slate-900 ml-1">₹2,00,000</span>
                </p>
              </div>
            </div>
          </div>

          {/* Vertical Divider - Desktop Only */}
          <div className="hidden lg:block w-px h-12 bg-slate-100 shrink-0" />

          {/* Section 2: Brands CTA Card */}
          <div className="flex-1 group cursor-pointer">
            <div className="flex items-center justify-between p-4 lg:p-0 lg:px-3 lg:py-2 bg-white border border-slate-100 rounded-2xl shadow-sm lg:shadow-lg hover:bg-slate-50 lg:hover:bg-transparent transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 lg:bg-slate-50 rounded-full">
                  <Sparkles size={18} className="text-purple-500" />
                </div>
                <p className="text-sm font-semibold text-slate-600 leading-snug">
                  <span className=" bg-gradient-to-r from-[#9810fa] to-[#e60076] text-transparent bg-clip-text font-bold">
                    142 brands
                  </span>
                  <br className="block lg:hidden" />
                  <span className="lg:ml-1">
                    are looking for creators in your niche
                  </span>
                </p>
              </div>
              <div className="p-1 bg-slate-50 rounded-full lg:bg-transparent">
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Vertical Divider - Desktop Only */}
          <div className="hidden lg:block w-px h-12 bg-slate-100 shrink-0" />

          {/* Section 3: Pro Trial Status Card */}
          <div className="p-4 lg:p-0 lg:px-3 lg:py-2 bg-white border border-slate-100 rounded-2xl shadow-sm lg:shadow-lg">
            <div className="flex items-center justify-between lg:gap-6">
              <div className="flex-1 lg:w-36">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} className="text-purple-600 fill-purple-600" />
                  <span className="text-[10px] lg:text-[11px] font-black tracking-widest text-slate-500 uppercase">
                    Pro Trial Active
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="relative w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#9810fa] to-[#e60076]"
                    style={{ width: "70%" }}
                  />
                </div>
              </div>

              {/* Day Counter */}
              <div className="pl-4 lg:pl-0 border-l lg:border-0 border-slate-100 text-center">
                <span className="text-3xl lg:text-3xl font-black bg-gradient-to-r from-[#9810fa] to-[#e60076] text-transparent bg-clip-text leading-none">
                  27
                </span>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                  days left
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
