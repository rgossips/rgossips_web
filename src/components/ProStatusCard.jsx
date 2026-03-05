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
    <div className="px-10 py-6 w-full flex items-center justify-center">
      <Card className="w-full p-6 bg-white border border-slate-200 shadow-sm rounded-3xl">
        <div className="flex justify-between items-center gap-8">
          {/* LEFT SIDE */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <Image
                  width={60}
                  height={60}
                  src="https://i.pravatar.cc/150?u=jones"
                  alt="User"
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-full border-2 border-white shadow-sm object-cover"
                />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-800 leading-tight">
                  Hi, Jones
                </h1>
                <p className="text-sm font-bold text-emerald-600">
                  Total Earnings:{" "}
                  <span className="text-slate-900">₹2,00,000</span>
                </p>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-snug mb-4 max-w-md">
              <span className="bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent">
                142 brands
              </span>{" "}
              are actively looking for creators in your niche
            </h2>

            <div className="flex flex-wrap gap-2">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-semibold border border-emerald-100"
                >
                  <Check className="w-3 h-3" strokeWidth={3} />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col items-center justify-center text-center min-w-[110px]">
            <Badge className="mb-5 bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent border-none px-3 py-1 text-xs font-bold tracking-wider">
              ✦ PRO TRIAL ACTIVE
            </Badge>
            <span className="text-6xl font-extrabold leading-none bg-gradient-to-br from-[#9810fa] to-[#e60076] bg-clip-text text-transparent">
              27
            </span>

            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mt-1">
              days left
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
