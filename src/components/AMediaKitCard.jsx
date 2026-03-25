import { Card } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Eye } from "lucide-react";
import Image from "next/image";

export function AiMediaKitCard() {
  const stats = [
    { icon: <Users size={14} />, label: "FOLLOWS", value: "12.4K" },
    { icon: <TrendingUp size={14} />, label: "ENGAGE", value: "4.2%" },
    { icon: <Eye size={14} />, label: "VIEWS", value: "8.5K" },
  ];

  return (
    <Card className="w-full max-w-3xl overflow-hidden rounded-3xl border-slate-200 border shadow-sm bg-white">
      <div className="p-5 lg:p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Media Kit
            </h3>
            <p className="text-slate-400 text-sm mt-0.5">Profile analytics.</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-bold border border-blue-100">
            Preview
          </span>
        </div>

        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-5">
          <div className="p-1 rounded-full bg-gradient-to-tr from-[#9810fa] to-[#ff8ba7] mb-3 shadow-md">
            <div className="w-16 h-16 rounded-full bg-white overflow-hidden">
              <Image
                src="https://i.pravatar.cc/150?u=alexcreates"
                alt="Alex Rivera"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <h4 className="text-base font-bold text-slate-800">Alex Rivera</h4>
          <p className="text-sm text-slate-400">@alexcreates</p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 min-w-[90px]"
            >
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                {stat.icon}
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
              <span className="text-lg font-bold text-slate-800">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button className="group relative w-full py-4 px-6 rounded-2xl font-bold text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 transition-opacity group-hover:opacity-90" />
          <span className="relative flex items-center justify-center gap-2">
            Generate Media Kit
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </button>
      </div>
    </Card>
  );
}
