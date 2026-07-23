"use client";
import { useState } from "react";
import { ShieldCheck, Zap, Sparkles, X, Copy, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { explainBrandMatch } from "@/utils/matchScore";
import { useAiTool } from "@/hooks/useAiTool";
import { AiMarkdown } from "@/components/AiMarkdown";

// "Why this match?" — same pattern as the campaign coach: transparent
// breakdown bars + an optional AI-narrated to-do list (tool: match_coach,
// no campaignId — the breakdown itself is the context).
const BrandMatchModal = ({ brand, score, breakdown, onClose }) => {
  const router = useRouter();
  const { generate, loading, result, error, remaining, limitReached, setResult } = useAiTool();
  const [copied, setCopied] = useState(false);
  const barColor = (s) => (s === "strong" ? "bg-emerald-500" : s === "ok" ? "bg-amber-500" : "bg-rose-400");
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-slate-500";

  const coachMe = () => {
    const summary = breakdown.map((b) => `- ${b.label}: ${b.points}/${b.max} (${b.status}) — ${b.reason}`).join("\n");
    generate({ tool: "match_coach", inputs: { brand: brand.name, matchScore: score, breakdown: summary } });
  };
  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        // The modal renders inside the clickable brand card — without this,
        // closing it would bubble up and navigate to the campaigns list.
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-4 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Zap size={16} className={scoreColor} />
            <h3 className="font-bold text-slate-800 text-sm">Why this match?</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-black ${scoreColor}`}>{score}%</div>
            <p className="text-xs text-slate-500 leading-snug">
              match with <span className="font-semibold text-slate-700">{brand.name}</span>
            </p>
          </div>

          <div className="space-y-2.5">
            {breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-600">{b.label}</span>
                  <span className="font-bold text-slate-400">{b.points}/{b.max}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(b.status)}`} style={{ width: `${Math.round((b.points / b.max) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{b.reason}</p>
              </div>
            ))}
          </div>

          {!result && !limitReached && (
            <button
              onClick={coachMe}
              disabled={loading}
              className="w-full h-11 rounded-2xl text-white font-bold text-sm shadow-lg shadow-pink-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
            >
              <Sparkles size={15} />
              {loading ? "Coaching…" : "How do I improve this? (AI)"}
            </button>
          )}

          {limitReached && (
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-600 mb-2">You've used your AI generations this month.</p>
              <button onClick={() => router.push("/influencer/pricing")} className="h-9 px-4 rounded-xl bg-[#9810FA] text-white text-xs font-bold cursor-pointer">
                Upgrade
              </button>
            </div>
          )}

          {error && !limitReached && <p className="text-xs text-rose-500">{error}</p>}

          {result && (
            <div className="bg-gradient-to-br from-[#9810FA]/5 to-[#E60076]/5 rounded-2xl p-4 border border-purple-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-[#9810FA] uppercase tracking-wider">Your coach</span>
                <button onClick={copy} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-bold cursor-pointer">
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <AiMarkdown text={result} className="text-[12px]" />
              <button onClick={() => setResult("")} className="mt-3 text-[11px] font-bold text-[#9810FA] cursor-pointer">Regenerate</button>
              {typeof remaining === "number" && Number.isFinite(remaining) && (
                <p className="text-[10px] text-slate-400 mt-2">{remaining} AI generations left this month</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const { profile } = useAuth();
  const [matchOpen, setMatchOpen] = useState(false);
  const match = profile ? explainBrandMatch(profile, brand) : { score: matchScore || 0, breakdown: [] };
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
        <button
          type="button"
          title="Why this match?"
          onClick={(e) => {
            e.stopPropagation();
            setMatchOpen(true);
          }}
          className={`absolute top-6 right-6 z-10 flex items-center gap-1 px-2.5 py-1 rounded-lg cursor-pointer transition-transform hover:scale-105 ${scoreColor}`}
        >
          <Zap size={12} />
          <span className="text-[11px] font-black">{matchScore}%</span>
          <Sparkles size={10} className="opacity-70" />
        </button>
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

      {matchOpen && (
        <BrandMatchModal
          brand={brand}
          score={match.score}
          breakdown={match.breakdown}
          onClose={() => setMatchOpen(false)}
        />
      )}
    </div>
  );
};

export default BrandCard;
