"use client";
import React, { useState } from "react";
import { Calendar, MapPin, FileText, DollarSign, ChevronRight, Instagram, Youtube, CheckCircle2, Award, BarChart3, Eye, Zap, Sparkles, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { explainCampaignMatch } from "@/utils/matchScore";
import { useAiTool } from "@/hooks/useAiTool";
import { AiMarkdown } from "@/components/AiMarkdown";

// "Why this match?" coach — shows the transparent score breakdown and, on
// demand, an AI-narrated prioritised to-do list to raise it (tool: match_coach).
function MatchCoachModal({ campaign, profile, score, breakdown, onClose }) {
  const router = useRouter();
  const { generate, loading, result, error, remaining, limitReached, setResult } = useAiTool();
  const [copied, setCopied] = useState(false);

  const barColor = (s) => (s === "strong" ? "bg-emerald-500" : s === "ok" ? "bg-amber-500" : "bg-rose-400");
  const scoreColor = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-slate-500";

  const coachMe = () => {
    const summary = breakdown.map((b) => `- ${b.label}: ${b.points}/${b.max} (${b.status}) — ${b.reason}`).join("\n");
    generate({
      tool: "match_coach",
      campaignId: campaign.id,
      inputs: { matchScore: score, breakdown: summary },
    });
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
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
              match with <span className="font-semibold text-slate-700">{campaign.title}</span>
            </p>
          </div>

          <div className="space-y-2.5">
            {breakdown.map((b) => (
              <div key={b.key}>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-slate-600">{b.label}</span>
                  <span className="font-bold text-slate-400">
                    {b.points}/{b.max}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(b.status)}`} style={{ width: `${Math.round((b.points / b.max) * 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{b.reason}</p>
              </div>
            ))}
          </div>

          {!result && !limitReached && (
            <Button onClick={coachMe} disabled={loading} className="w-full h-11 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100">
              <Sparkles size={15} className="mr-2" />
              {loading ? "Coaching…" : "How do I improve this? (AI)"}
            </Button>
          )}

          {limitReached && (
            <div className="text-center bg-slate-50 rounded-2xl p-4">
              <p className="text-xs text-slate-600 mb-2">You've used your AI generations this month.</p>
              <Button onClick={() => router?.push?.("/influencer/pricing")} className="h-9 px-4 rounded-xl bg-[#9810FA] text-white text-xs font-bold">
                Upgrade
              </Button>
            </div>
          )}

          {error && !limitReached && <p className="text-xs text-rose-500">{error}</p>}

          {result && (
            <div className="bg-gradient-to-br from-[#9810FA]/5 to-[#E60076]/5 rounded-2xl p-4 border border-purple-50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-[#9810FA] uppercase tracking-wider">Your coach</span>
                <button onClick={copy} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-bold">
                  {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <AiMarkdown text={result} className="text-[12px]" />
              <button onClick={() => setResult("")} className="mt-3 text-[11px] font-bold text-[#9810FA]">
                Regenerate
              </button>
              {typeof remaining === "number" && Number.isFinite(remaining) && <p className="text-[10px] text-slate-400 mt-2">{remaining} AI generations left this month</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CampaignCard({ campaign, onApply, matchScore }) {
  const isApplied = campaign.status === "Applied";
  const isCompleted = campaign.status === "Completed";
  const isActive = campaign.status === "Active";
  const router = useRouter();
  const { profile } = useAuth();
  const [coachOpen, setCoachOpen] = useState(false);
  const match = profile ? explainCampaignMatch(profile, campaign) : { score: matchScore || 0, breakdown: [] };

  // Status Badge Colors
  const statusStyles = {
    Active: "bg-[#00BA88] text-white",
    Applied: "bg-[#4E82EE] text-white",
    Completed: "bg-[#E2E8F0] text-slate-600",
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden">
      {/* Banner */}
      <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200">
        {campaign.bannerImage ? (
          <img src={campaign.bannerImage} alt={campaign.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E60076]/10 via-[#9810FA]/10 to-[#4E82EE]/10" />
        )}
        {/* Dark gradient overlay for badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Status over banner — the match % moved to a full button in the
            action row (it was too tiny to discover up here). */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-sm ${statusStyles[campaign.status]}`}>{campaign.status}</span>
        </div>
      </div>

      <div className="p-5 pt-0 space-y-5">
        {/* Header — brand logo overlaps the banner */}
        <div className="flex items-start gap-3 -mt-7">
          <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden shrink-0 z-2">
            {campaign.brandLogo ? (
              <img src={campaign.brandLogo} alt={campaign.brandName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">{campaign.initials}</div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-7">
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-slate-800 truncate">{campaign.title}</h4>
              <Award size={14} className="text-amber-500 fill-amber-100 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">{campaign.brandName}</p>
          </div>
        </div>

        {/* Info Rows */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {campaign.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            {campaign.platforms.includes("instagram") && <Instagram size={18} className="text-[#E60076]" />}
            {campaign.platforms.includes("youtube") && <Youtube size={18} className="text-red-500" />}
          </div>
        </div>

        {/* Data Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
            <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <DollarSign size={10} className="text-[#00BA88]" /> Budget
            </p>
            <p className="text-xs font-bold text-[#00BA88]">{campaign.budget}</p>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
            <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <Calendar size={10} className="text-blue-500" /> Deadline
            </p>
            <p className="text-xs font-bold text-slate-800">
              {campaign.deadline}
              {campaign.daysLeft && (
                <span className="text-[9px] text-red-500 ml-1">
                  {/* daysLeft is either a day count ("3d") or a status word
                      ("Expired" / "Today"). Only append " left" to counts,
                      so an expired campaign reads "Expired", not "Expired left". */}
                  {campaign.daysLeft === "Expired" || campaign.daysLeft === "Today" ? campaign.daysLeft : `${campaign.daysLeft} left`}
                </span>
              )}
            </p>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
            <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <FileText size={10} className="text-purple-500" /> Deliverables
            </p>
            <p className="text-xs font-bold text-slate-800 truncate">{campaign.deliverables}</p>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
            <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
              <MapPin size={10} className="text-orange-500" /> Location
            </p>
            <p className="text-xs font-bold text-slate-800">{campaign.location}</p>
          </div>
        </div>

        {/* Conditional Action Button */}
        <div className="flex gap-3">
          {match.score > 0 && (
            <Button
              onClick={() => setCoachOpen(true)}
              className={`h-12 px-4 rounded-2xl cursor-pointer font-black text-sm border shadow-sm bg-white hover:bg-slate-50 ${
                match.score >= 80 ? "text-emerald-600 border-emerald-200" : match.score >= 60 ? "text-amber-600 border-amber-200" : "text-slate-500 border-slate-200"
              }`}
            >
              <Zap size={15} className="mr-1" /> {match.score}% <Sparkles size={12} className="ml-1 opacity-70" />
            </Button>
          )}
          {isActive && (
            <Button
              onClick={() => {
                if (onApply) {
                  onApply();
                } else {
                  router.push("/influencer/offers/" + campaign.id);
                }
              }}
              className="flex-1 cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100"
            >
              Apply Now <ChevronRight size={16} className="ml-1" />
            </Button>
          )}

          {isApplied && (
            <Button
              onClick={() => router.push("/influencer/offers/" + campaign.id)}
              className="flex-1 cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100"
            >
              <Eye size={16} className="mr-2" /> View Status <ChevronRight size={16} className="ml-1" />
            </Button>
          )}

          {isCompleted && (
            <Button
              onClick={() => router.push("/influencer/offers/" + campaign.id)}
              className="flex-1 cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100"
            >
              <BarChart3 size={16} className="mr-2" /> View Status <ChevronRight size={16} className="ml-1" />
            </Button>
          )}
        </div>
      </div>

      {coachOpen && <MatchCoachModal campaign={campaign} profile={profile} score={match.score} breakdown={match.breakdown} onClose={() => setCoachOpen(false)} />}
    </div>
  );
}
