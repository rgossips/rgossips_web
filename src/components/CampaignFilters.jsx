"use client";
import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Check, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function CampaignFilters({ onClose, filterData }) {
  const { categories, platforms, statusOptions } = filterData;

  return (
    <>
      {/* Dark Overlay - Both mobile and desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
      />

      {/* Modal - Full screen on mobile, centered on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-60 bg-white flex flex-col overflow-y-auto scrollbar-hide mb-16 lg:inset-auto lg:left-1/2 lg:top-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[90%] lg:max-w-2xl lg:max-h-[90vh] lg:rounded-[40px] lg:mb-0 lg:shadow-2xl"
      >
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
            <button
              onClick={onClose}
              className="w-10 cursor-pointer h-10 rounded-full bg-[#FFEBF5] flex items-center justify-center text-[#E60076]"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-800">Filters</h2>
            <button className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Reset
            </button>
          </div>

          <div className="space-y-8">
            {/* Category Grid */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Category</h3>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className="py-2.5 rounded-xl border border-slate-100 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* Budget Range - Custom Slider Style */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">
                  Budget Range
                </h3>
                <div className="w-6 h-6 rounded-lg bg-[#00BA88] flex items-center justify-center text-white">
                  <DollarSign size={14} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Min
                  </p>
                  <p className="text-sm font-black text-[#00BA88]">₹10K</p>
                </div>
                <div className="h-[2px] w-8 bg-slate-100" />
                <div className="flex-1 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Max
                  </p>
                  <p className="text-sm font-black text-[#00BA88]">₹50K</p>
                </div>
              </div>
              <div className="relative h-1.5 bg-slate-100 rounded-full mt-2">
                <div className="absolute left-[20%] right-[40%] h-full bg-[#00BA88] rounded-full" />
                <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#00BA88] rounded-full shadow-sm" />
                <div className="absolute right-[40%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#00BA88] rounded-full shadow-sm" />
              </div>
            </section>

            {/* Platforms */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Platforms</h3>
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <div
                    key={p.label}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#E60076]">
                      {p.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {p.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Options Toggle */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Ending Soon
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Show campaigns ending within 7 days
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-[#E60076]" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Verified Brands Only
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Show only verified brand campaigns
                    </p>
                  </div>
                  <Switch className="data-[state=checked]:bg-[#E60076]" />
                </div>
              </div>
            </section>

            {/* Status Segmented Control */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Status</h3>
              <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                      status === "Active"
                        ? "bg-[#E60076] text-white shadow-md shadow-pink-100"
                        : "text-slate-400"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-6 flex gap-4 lg:rounded-b-[40px]">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer h-14 rounded-2xl font-bold border-slate-100 text-slate-400"
            onClick={onClose}
          >
            Reset
          </Button>
          <Button className="flex-1 cursor-pointer h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-pink-200 hover:opacity-90 transition-all">
            Apply Filters
          </Button>
        </div>
      </motion.div>
    </>
  );
}
