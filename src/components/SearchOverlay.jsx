"use client";
import React from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchOverlay({ onClose, recentSearches }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      {/* Search Header */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-50">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[#FFEBF5] flex items-center justify-center text-[#E60076]"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="relative flex-1 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#E60076]"
            size={18}
          />
          <Input
            autoFocus
            placeholder="Search campaigns..."
            className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-slate-800 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#E60076]/20"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Searches</h3>
          <button className="text-xs font-bold text-slate-400 hover:text-[#E60076]">
            Clear All
          </button>
        </div>

        {/* Search Chips Grid */}
        <div className="flex flex-wrap gap-3">
          {recentSearches.map((term, index) => (
            <motion.button
              key={term}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-[13px] font-medium text-slate-600 shadow-sm hover:border-[#E60076]/30 hover:bg-pink-50/30 transition-all flex items-center gap-2"
            >
              {term}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
