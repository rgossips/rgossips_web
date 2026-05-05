"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
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

  const goToCategory = (label) => {
    router.push(`/brands/search?category=${encodeURIComponent(label)}`);
  };

  return (
    <div className="px-4 lg:px-6 space-y-8 bg-slate-50/50 overflow-hidden w-full py-10">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Creator Categories
        </h2>
        <button
          onClick={() => router.push("/brands/search")}
          className="text-sm font-bold text-[#5B3DF5] flex items-center gap-1 hover:opacity-70 cursor-pointer"
        >
          View All <ChevronRight size={14} />
        </button>
      </div>

      {/* Main Content Layout: Grid + Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT: Category Grids/Carousel */}
        <div className="flex-1 space-y-8">
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

          {/* Selection Cards (Who Are You Looking For?) */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ y: -4 }}
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

        {/* RIGHT: Trust Score Sidebar (Hidden on Mobile) */}
        <aside className="hidden lg:block w-[380px]">
          <div className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-24">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-slate-900">
                Your Trust Score
              </h3>
              <span className="bg-orange-50 text-orange-500 text-sm font-bold px-3 py-1 rounded-full border border-orange-100">
                10%
              </span>
            </div>
            <p className="text-slate-400 text-sm mb-6 font-medium">
              Unlock premium features
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full mb-10 overflow-hidden">
              <div className="bg-orange-500 h-full w-[10%] rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
            </div>

            {/* Locked Feature Notice */}
            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <Zap size={20} className="text-orange-400 fill-orange-400" />
              </div>
              <p className="text-slate-600 text-xs font-semibold leading-relaxed px-4">
                You cannot contact creators yet. Verify your work email to start
                connecting.
              </p>
            </div>

            <button className="w-full cursor-pointer mt-8 bg-[#131722] hover:scale-[105%] text-white py-4 rounded-2xl font-bold text-sm hover:bg-black transition-all active:scale-95">
              Verify My Email
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
