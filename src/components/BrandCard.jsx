import { ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Mirrors src/lib/brandProfile.js BANDS so the card and the brand-side
// dashboard speak the same colour language.
const TRUST_BAND_COLORS = {
  Elite: "text-emerald-600 bg-emerald-50",
  Trusted: "text-blue-600 bg-blue-50",
  Established: "text-indigo-600 bg-indigo-50",
  Emerging: "text-amber-600 bg-amber-50",
  "Building Trust": "text-slate-500 bg-slate-50",
};

const BrandCard = ({ brand, matchScore }) => {
  const router = useRouter();
  const scoreColor =
    matchScore >= 80 ? "text-emerald-500 bg-emerald-50" :
    matchScore >= 60 ? "text-amber-500 bg-amber-50" :
    "text-slate-400 bg-slate-50";

  const trustScore = Number(brand.trustScore) || 0;
  const trustBand = brand.trustBand || "";
  const trustColor = TRUST_BAND_COLORS[trustBand] || "text-slate-500 bg-slate-50";

  const handleOpen = () => {
    // Open the campaigns list filtered by this brand
    router.push(`/influencer/campaigns?brand=${encodeURIComponent(brand.name || "")}`);
  };

  return (
    <div
      onClick={handleOpen}
      className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50 hover:shadow-lg hover:border-[#E60076]/10 transition-all relative group cursor-pointer"
    >
      {matchScore > 0 && (
        <div className={`absolute top-6 right-6 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg ${scoreColor}`}>
          <Zap size={12} />
          <span className="text-[11px] font-black">{matchScore}%</span>
        </div>
      )}

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
          <h4 className="font-bold text-slate-800 text-lg flex items-center justify-center gap-1">
            {brand.name}
            {brand.isVerified && (
              <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67.63 13.43-.25 12-.25S9.33.63 8.66 1.94c-1.39-.46-2.9-.2-3.91.81s-1.27 2.52-.81 3.91C2.63 7.33 1.75 8.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z" fill="#1DA1F2"/>
                <path d="M9.71 11.29a1.008 1.008 0 00-1.42 0 1.008 1.008 0 000 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5a1.008 1.008 0 000-1.42 1.008 1.008 0 00-1.42 0L12 13.59l-2.29-2.3z" fill="white"/>
              </svg>
            )}
          </h4>
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
        </div>

        {/* Footer — trust score on the left */}
        <div className="w-full flex items-center pt-4 border-t border-slate-50">
          {trustScore > 0 && (
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${trustColor}`}
              title={trustBand ? `Trust score · ${trustBand}` : "Trust score"}
            >
              <ShieldCheck size={14} />
              <span className="text-xs font-black">{trustScore}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrandCard;
