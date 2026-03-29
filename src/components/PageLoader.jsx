"use client";

import { Loader2 } from "lucide-react";

/** Full-page centered loader — use as loading state for pages */
export function PageLoader({ message = "Loading..." }) {
  return (
    <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-100" />
          <Loader2
            size={48}
            className="absolute inset-0 animate-spin text-[#E60076]"
            strokeWidth={2.5}
          />
        </div>
        <p className="text-sm text-slate-500 font-semibold">{message}</p>
      </div>
    </div>
  );
}

/** Inline spinner for buttons — replaces button text while loading */
export function ButtonSpinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" />;
}

/** Small inline loader for sections inside a page */
export function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={28} className="animate-spin text-[#E60076]" />
    </div>
  );
}
