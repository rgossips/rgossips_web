"use client";

import React from "react";
import { motion } from "motion/react";
import { ChevronRight, Sparkles } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const CATEGORIES = [
  { label: "Tech", emoji: "💻" },
  { label: "Lifestyle", emoji: "🧘" },
  { label: "Fashion", emoji: "👗" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Food", emoji: "🍕" },
  { label: "Travel", emoji: "✈️" },
];

const CategoryIcon = ({ label, emoji, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="flex flex-col items-center gap-2 group cursor-pointer"
  >
    <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1 group-active:scale-95">
      {emoji}
    </div>
    <span className="text-xs font-bold text-slate-500 group-hover:text-[#5B3DF5] transition-colors">
      {label}
    </span>
  </motion.div>
);

export const CategorySection = () => {
  return (
    <div className="px-4 lg:px-6 space-y-8 bg-slate-50/50 overflow-hidden max-w-full w-full">
      {/* Categories Header */}
      <div className="px-6 flex justify-between items-end">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Categories
        </h2>
        <button className="text-sm font-bold text-[#5B3DF5] hover:opacity-70 transition-opacity">
          View all
        </button>
      </div>

      {/* Categories Carousel */}
      <div className="px-6">
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {CATEGORIES.map((cat, i) => (
              <CarouselItem
                key={cat.label}
                className="pl-4 basis-1/4 sm:basis-1/5 md:basis-1/6"
              >
                <CategoryIcon label={cat.label} emoji={cat.emoji} index={i} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Selection Cards */}
      <div className="px-6 space-y-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Who Are You Looking For?
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Influencers Card */}
          <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#E9F0FF] p-5 rounded-4xl flex flex-col justify-between h-44 border border-blue-100 cursor-pointer shadow-sm hover:shadow-blue-100/50 transition-shadow"
          >
            <div className="w-12 h-12  rounded-2xl flex items-center justify-center">
              <Sparkles className="text-yellow-500" size={20} />
            </div>
            <div>
              <h3 className="font-black text-[#1C115A] text-lg">Influencers</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">
                  Micro & Macro
                </span>
                <ChevronRight size={14} className="text-blue-400" />
              </div>
            </div>
          </motion.div>

          {/* Celebrities Card */}
          <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#FFF1F1] p-5 rounded-4xl flex flex-col justify-between h-44 border border-red-50 cursor-pointer shadow-sm hover:shadow-red-100/50 transition-shadow"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl">
              🎭
            </div>
            <div>
              <h3 className="font-black text-[#6B1D1D] text-lg">Celebrities</h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  A-list Artists
                </span>
                <ChevronRight size={14} className="text-red-300" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
