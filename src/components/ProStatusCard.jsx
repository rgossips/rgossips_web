import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import Image from "next/image";

export function ProStatusCard() {
  const benefits = [
    "Unlimited applies",
    "50 AI tools/mo",
    "Priority search",
    "48hr payouts",
  ];

  return (
    // Adjusted padding for mobile (px-4) vs desktop (px-10)
    <div className="lg:px-10 pb-6 w-full flex items-center justify-center">
      <Card className="w-full p-5 md:p-8 bg-white border border-slate-200 shadow-sm rounded-3xl">
        {/* Changed to flex-col for mobile, lg:flex-row for desktop */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          {/* LEFT SIDE */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                <Image
                  width={64}
                  height={64}
                  src="https://i.pravatar.cc/150?u=jones"
                  alt="User"
                  className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                  Hi, Jones
                </h1>
                <p className="text-sm font-bold text-emerald-600">
                  Total Earnings:{" "}
                  <span className="text-slate-900">₹2,00,000</span>
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug mb-5 max-w-lg">
              <span className="bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent">
                142 brands
              </span>{" "}
              are actively looking for creators in your niche
            </h2>

            {/* Grid for benefits works better on mobile than flex-wrap for alignment */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] md:text-[11px] font-bold border border-emerald-100"
                >
                  <Check className="w-3 h-3 shrink-0" strokeWidth={3} />
                  <span className="truncate">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE (The Counter) */}
          {/* On mobile, we align this to the start or center; added a border-t for mobile separation */}
          <div className="w-full lg:w-auto pt-6 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex flex-col items-center justify-center text-center min-w-[130px]">
            <Badge className="mb-2 lg:mb-5 bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent border border-purple-100 lg:border-none px-3 py-1 text-[10px] font-bold tracking-wider">
              ✦ PRO TRIAL ACTIVE
            </Badge>

            <div className="flex flex-row lg:flex-col items-baseline lg:items-center gap-2 lg:gap-0">
              <span className="text-5xl lg:text-6xl font-extrabold leading-none bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent">
                27
              </span>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                days left
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
