import React from "react";
import { Plus } from "lucide-react";

export const TrustSection = () => {
  return (
    <div className="flex items-center flex-col lg:flex-row w-screen px-3 gap-3 lg:gap-5">
      {/* Floating Search */}
      <div className="bg-white flex-1 w-full lg:w-auto rounded-3xl p-4 flex lg:hidden items-center justify-between shadow-xl shadow-slate-200/50 border border-slate-100">
        <p className="text-slate-400 text-sm font-medium pl-2">
          Looking for 10 nano creators, 15L...
        </p>
        <button className="bg-[#5B3DF5] p-2.5 rounded-2xl text-white">
          <Plus size={24} />
        </button>
      </div>

      {/* Trust Score Card */}
      <div className="bg-[#1F1F1F] w-full lg:max-w-[40%] rounded-4xl p-6 flex justify-between items-center text-white">
        <div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            Your Trust Score
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">840</span>
            <span className="text-emerald-400 text-xs font-bold">+12% ★</span>
          </div>
        </div>

        {/* Score Ring */}
        <div className="relative flex items-center justify-center w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
          <div className="absolute inset-0 rounded-full border-4 border-[#5B3DF5] border-t-transparent -rotate-45" />
          <span className="text-[10px] font-black italic">HIGH</span>
        </div>
      </div>
    </div>
  );
};
