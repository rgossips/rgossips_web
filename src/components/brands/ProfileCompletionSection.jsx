"use client";

import React from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";

// Drop-in replacement for TrustSection on the brand search page. Uses the
// same hook so we stay in sync with the brand profile page, but renders a
// profile-completion bar instead of the trust score.
export const ProfileCompletionSection = () => {
  const { completion, loading } = useBrandTrustScore();

  const pct = loading ? 0 : completion?.percent || 0;
  const missing = completion?.missing || [];
  const filled = completion?.filled || [];
  const total = (filled?.length || 0) + (missing?.length || 0);
  const complete = pct >= 100 && total > 0;

  return (
    <div className="flex items-center flex-col lg:flex-row w-full px-3 lg:px-0 gap-3 lg:gap-5">
      {/* Floating Search (mobile) */}
      <div className="bg-white flex-1 w-full lg:w-auto rounded-3xl p-4 flex lg:hidden items-center justify-between shadow-xl shadow-slate-200/50 border border-[#E4E9F4]">
        <p className="text-[#9C97B8] text-sm font-medium pl-2">
          Looking for 10 nano creators, 15L...
        </p>
        <button className="bg-[#6A66C9] p-2.5 rounded-2xl text-white cursor-pointer">
          <Plus size={24} />
        </button>
      </div>

      {/* Profile Completion Card */}
      <Link
        href="/brands/profile"
        className="bg-[#1F1F1F] w-full lg:min-w-[280px] rounded-4xl p-6 flex justify-between items-center text-white cursor-pointer hover:bg-[#2A2A2A] transition-colors"
      >
        <div>
          <p className="text-[#6B6785] text-[10px] font-bold uppercase tracking-wider mb-1">
            Profile Completion
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">{pct}%</span>
            {complete ? (
              <span className="text-emerald-400 text-xs font-bold inline-flex items-center gap-1">
                <CheckCircle2 size={12} /> Complete
              </span>
            ) : missing.length > 0 ? (
              <span className="text-amber-300 text-xs font-bold">
                Add {missing[0]}
              </span>
            ) : null}
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                complete ? "bg-emerald-400" : "bg-[#6A66C9]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Count chip — the circular progress ring was dropped per design
            feedback; the linear bar already shows completion. */}
        <span
          className={`text-[10px] font-black italic px-3 py-1.5 rounded-full border shrink-0 ${
            complete ? "text-emerald-400 border-emerald-400" : "text-[#8B7BF7] border-[#6A66C9]"
          }`}
        >
          {complete ? "DONE" : `${filled.length}/${total || 3}`}
        </span>
      </Link>
    </div>
  );
};
