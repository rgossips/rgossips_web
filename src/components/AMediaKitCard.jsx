import { Card } from "@/components/ui/card";
import { Instagram, ArrowRight, BarChart3, Users, Eye } from "lucide-react";

export function AiMediaKitCard() {
  return (
    <Card className="w-full max-w-3xl overflow-hidden rounded-3xl border-slate-200  border shadow-sm bg-white relative">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Media Kit
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Professional analytics in seconds.
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
            Free with trial
          </span>
        </div>

        {/* Preview Identity Section */}
        <div className="relative rounded-2xl bg-slate-50 border border-slate-100 p-6 mb-6 overflow-hidden">
          {/* Decorative background blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#9810fa]/10 to-transparent rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar with Gradient Ring */}
            <div className="p-1 rounded-full bg-gradient-to-tr from-[#9810fa] to-[#ff8ba7] mb-4 shadow-md">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-slate-200 animate-pulse" />
              </div>
            </div>

            <h4 className="text-lg font-bold text-slate-800">Your Name</h4>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-6">
              <Instagram size={14} className="text-pink-500" />
              <span>@yourhandle</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 w-full pt-6 border-t border-slate-200/60">
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                  Followers
                </p>
                <div className="h-1.5 w-10 bg-slate-200 rounded-full mx-auto" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                  Eng. Rate
                </p>
                <div className="h-1.5 w-10 bg-slate-200 rounded-full mx-auto" />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                  Avg. Views
                </p>
                <div className="h-1.5 w-10 bg-slate-200 rounded-full mx-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Area */}
        <div className="space-y-4">
          <p className="text-center text-sm text-slate-500 px-4">
            Connect your socials to sync real-time data and generate your kit.
          </p>

          <button className="group relative w-full py-4 px-6 rounded-2xl font-bold text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#9810fa] to-[#e60076] transition-opacity group-hover:opacity-90" />
            <span className="relative flex items-center justify-center gap-2 ">
              Generate My Media Kit
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </button>

          <p className="text-center text-[11px] text-slate-400">
            No credit card required for preview
          </p>
        </div>
      </div>
    </Card>
  );
}
