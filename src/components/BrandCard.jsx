import { CheckCircle2, Star, Users } from "lucide-react";
import Image from "next/image";

const BrandCard = ({ brand }) => {
  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 hover:shadow-lg hover:border-[#E60076]/10 transition-all relative group cursor-pointer">
      <div className="absolute top-6 right-6 z-10">
        <CheckCircle2 className="text-blue-500 fill-blue-50" size={22} />
      </div>

      <div className="flex flex-col items-center text-center">
        {/* Logo */}
        <div className="w-20 h-20 rounded-2xl bg-[#F8F9FD] overflow-hidden flex items-center justify-center p-4 mb-4 group-hover:scale-105 transition-transform">
          {brand.logo && (
            <Image
              width={200}
              height={200}
              src={brand.logo}
              alt={brand.name}
              className="w-full h-full object-contain mix-blend-multiply"
            />
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <h4 className="font-bold text-slate-800 text-lg">{brand.name}</h4>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {brand.category}
          </p>
        </div>

        {/* Stats List (Stacked Rows) */}
        <div className="w-full space-y-3 mb-6">
          <div className="flex justify-between items-center w-full">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
              Active Campaigns
            </span>
            <span className="text-sm font-bold text-slate-800">
              {brand.activeCampaigns}
            </span>
          </div>
          <div className="flex justify-between w-full">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
              Avg Payout
            </span>
            <span className="text-sm font-bold text-[#00BA88]">
              {brand.payout}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <Star className="text-amber-400 fill-amber-400" size={16} />
            <span className="text-xs font-bold text-slate-700">
              {brand.rating}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="text-slate-300" size={16} />
            <span className="text-xs font-bold text-slate-400">
              {brand.followers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandCard;
