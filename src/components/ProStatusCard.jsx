import { Card } from "@/components/ui/card";
import { ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";

export function ProStatusCard() {
  return (
    <div className="lg:px-10 pb-6 w-full flex items-center justify-center">
      <Card className="w-full p-4 md:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-3">
        {/* ROW 1: Avatar + Name + Earnings */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Image
              width={48}
              height={48}
              src="https://i.pravatar.cc/150?u=jones"
              alt="User"
              className="w-11 h-11 md:w-12 md:h-12 rounded-full border-2 border-white shadow-sm object-cover"
            />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-800 leading-tight">
              Hi, Jones
            </h1>
            <p className="text-xs font-bold text-emerald-600 tracking-wide">
              EARNINGS:{" "}
              <span className="text-slate-900">₹2,00,000</span>
            </p>
          </div>
        </div>

        {/* ROW 2: Brands CTA */}
        <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Sparkles size={18} className="text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-snug">
              <span className="bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent font-bold">
                142 brands
              </span>{" "}
              are looking for creators in your niche
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0 ml-2" />
        </div>

        {/* ROW 3: Pro Trial Status */}
        <div className="flex items-center justify-between bg-white border border-slate-100 rounded-2xl px-4 py-3">
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">✦</span>
              <span className="text-xs font-bold tracking-wider text-slate-700">
                PRO TRIAL ACTIVE
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#9810fa] to-[#e60076]"
                style={{ width: "90%" }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-extrabold leading-none text-slate-800">
              27
            </span>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
              days left
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
