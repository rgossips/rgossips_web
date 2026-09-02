"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Check, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { filterData } from "@/components/brands/FilterDrawer";

const CATEGORY_EMOJIS = {
  "Beauty & Skincare": "💄",
  "Fashion & Lifestyle": "👗",
  "Food & Beverage": "🍕",
  "Health, Fitness & Wellness": "🏋️",
  "Travel & Hospitality": "✈️",
  "Technology & Gadgets": "💻",
  "Parenting & Family": "👨‍👩‍👧",
  "Home & Decor": "🏠",
  "Finance & Personal Finance": "📈",
  "Education & Career": "🎓",
  "Gaming & Entertainment": "🎮",
  "Automobile & Mobility": "🚗",
  "Entrepreneurship & Business": "💼",
  "Sustainable & Eco-conscious Living": "🌱",
  "Pet Care & Animals": "🐾",
};

const CATEGORIES = filterData["Categories"].map((cat) => ({
  label: cat,
  emoji: CATEGORY_EMOJIS[cat] || "📌",
}));

const CategoryIcon = ({ label, emoji, index, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex flex-col items-center group cursor-pointer bg-white p-4 justify-center gap-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-[#5B3DF5]/30 hover:shadow-md w-full"
  >
    <div className="text-2xl transition-transform group-hover:-translate-y-1">
      {emoji}
    </div>
    <span className="text-[10px] lg:text-xs font-bold text-slate-500 group-hover:text-[#5B3DF5] transition-colors text-center leading-tight">
      {label}
    </span>
  </motion.button>
);

export const CategorySection = () => {
  const router = useRouter();
  const { completion } = useBrandTrustScore();

  const goToCategory = (label) => {
    router.push(`/brands/search?category=${encodeURIComponent(label)}`);
  };

  const completionPct = completion?.percent ?? 0;
  const missing = completion?.missing || [];
  const filled = completion?.filled || [];
  const allFields = [...filled.map((label) => ({ label, done: true })), ...missing.map((label) => ({ label, done: false }))];
  const completionColor =
    completionPct >= 100
      ? "text-emerald-500 bg-emerald-50 border-emerald-100"
      : completionPct >= 67
      ? "text-indigo-500 bg-indigo-50 border-indigo-100"
      : "text-orange-500 bg-orange-50 border-orange-100";
  const barColor =
    completionPct >= 100
      ? "bg-emerald-500"
      : completionPct >= 67
      ? "bg-indigo-500"
      : "bg-orange-500";

  return (
    <div className="px-4 lg:px-6 space-y-8 bg-slate-50/50 overflow-hidden w-full py-10">
      {/* Main Content Layout: Grid + Sidebar. The section header lives
          INSIDE the left column so the category grid's top edge lines
          up with the profile-completion card on the right (brand-side
          audit spacing fix #1). */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: Category Grids/Carousel */}
        <div className="flex-1 space-y-8">
          {/* Top Header */}
          <div className="flex justify-between items-center">
            <h2 className="bx-h2">
              Creator Categories
            </h2>
            <button
              onClick={() => router.push("/brands/search")}
              className="text-sm font-bold text-[#5B3DF5] flex items-center gap-1 hover:opacity-70 cursor-pointer"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>

          {/* MOBILE CAROUSEL */}
          <div className="lg:hidden">
            <Carousel opts={{ align: "start", dragFree: true }}>
              <CarouselContent className="-ml-2">
                {CATEGORIES.map((cat, i) => (
                  <CarouselItem key={cat.label} className="pl-2 basis-1/3">
                    <CategoryIcon
                      label={cat.label}
                      emoji={cat.emoji}
                      index={i}
                      onClick={() => goToCategory(cat.label)}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* DESKTOP GRID */}
          <div className="hidden lg:grid grid-cols-5 gap-4">
            {CATEGORIES.map((cat, i) => (
              <CategoryIcon
                key={cat.label}
                label={cat.label}
                emoji={cat.emoji}
                index={i}
                onClick={() => goToCategory(cat.label)}
              />
            ))}
          </div>

          {/* Selection Cards (Who Are You Looking For?)
              Route to the influencer search page pre-filtered by profile
              type. brands/search reads ?profileType= on mount and seeds
              the filter drawer's "Profile Type" chip so the list opens
              already narrowed. */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => router.push("/brands/search?profileType=meme_page")}
              className="bg-[#FFF7E6] p-6 rounded-[32px] flex flex-col justify-between h-40 border border-amber-100 cursor-pointer"
            >
              <span className="text-2xl">😂</span>
              <div>
                <h3 className="font-black text-[#5C3B00] text-xl">
                  Meme Pages
                </h3>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">
                  Viral & Trending
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => router.push("/brands/search?profileType=celebrity")}
              className="bg-[#FFF1F1] p-6 rounded-[32px] flex flex-col justify-between h-40 border border-red-50 cursor-pointer"
            >
              <span className="text-2xl">🎭</span>
              <div>
                <h3 className="font-black text-[#6B1D1D] text-xl">
                  Celebrities
                </h3>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">
                  A-list Artists
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: Profile completion sidebar */}
        <aside className="hidden lg:block w-[380px]">
          <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-slate-900">
                Profile completion
              </h3>
              <span className={`text-sm font-bold px-3 py-1 rounded-full border ${completionColor}`}>
                {completionPct}%
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-6 font-medium">
              {completionPct >= 100
                ? "All set — your profile is fully complete."
                : "Complete these to unlock the most trust"}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full mb-6 overflow-hidden">
              <div
                className={`${barColor} h-full rounded-full transition-all duration-500`}
                style={{ width: `${completionPct}%` }}
              />
            </div>

            {/* Field checklist */}
            <div className="space-y-2.5">
              {allFields.map((f) => (
                <div
                  key={f.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-slate-50/60 border border-slate-100"
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      f.done ? "bg-emerald-100 text-emerald-600" : "bg-white border border-slate-200 text-slate-300"
                    }`}
                  >
                    {f.done ? <Check size={14} /> : <Sparkles size={14} />}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      f.done ? "text-slate-700" : "text-slate-500"
                    }`}
                  >
                    {f.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/brands/profile")}
              className="w-full cursor-pointer mt-7 bg-[#131722] hover:scale-[105%] text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-all active:scale-95"
            >
              {completionPct >= 100 ? "Manage Profile" : "Complete Profile"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
