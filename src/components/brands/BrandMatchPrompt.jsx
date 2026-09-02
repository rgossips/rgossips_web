"use client";

import { useMemo, useState } from "react";
import { Sparkles, Search, Loader2, Check, Users, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import CampaignPickerModal from "@/components/brands/CampaignPickerModal";

// Brand-home AI matcher. Reuses the public `landing-match` edge fn (which
// relaxes its rate limit for authenticated callers) to turn a free-text brief
// into real creators, then lets the brand shortlist + invite them to a campaign.
function fmt(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return Math.round(num / 1_000) + "K";
  return String(num);
}

const CHIPS = ["Beauty creators in Mumbai, 50K+", "Tech reviewers for an unboxing", "Fitness micro-creators for barter"];

export default function BrandMatchPrompt() {
  const supabase = useMemo(() => createClient(), []);
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState("");
  const [shortlist, setShortlist] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const run = async () => {
    const text = prompt.trim();
    if (!text || loading) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await supabase.functions.invoke("landing-match", { body: { prompt: text } });
      if (data?.error && data.error !== "rate_limited") {
        setError("Couldn't run the match right now. Please try again.");
      } else if (data?.error === "rate_limited") {
        setError("You've hit the search limit for now. Try again later.");
      } else {
        setResults(Array.isArray(data?.influencers) ? data.influencers : []);
        setSummary(data?.summary || "");
        setShortlist({});
      }
    } catch {
      setError("Couldn't reach the matching engine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => setShortlist((prev) => ({ ...prev, [id]: !prev[id] }));
  const invitableIds = Object.keys(shortlist).filter((id) => shortlist[id] && !String(id).startsWith("inv_"));
  const shortlistCount = Object.values(shortlist).filter(Boolean).length;

  return (
    <section className="w-full max-w-6xl mx-auto px-4 lg:px-8">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-5 lg:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest text-[#6A66C9]">
            <Sparkles size={15} /> AI MATCHING ENGINE
          </span>
        </div>
        <h2 className="text-lg lg:text-xl font-extrabold text-[#16224E]">Describe your ideal creator</h2>
        <p className="text-[12px] text-[#6B6785] mt-1">Tell us what you&apos;re looking for and we&apos;ll surface real creators you can invite.</p>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C97B8]" />
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="e.g. Launch our serum with beauty creators in Mumbai…"
              className="w-full pl-9 pr-3 py-3 rounded-xl border border-[#E4E9F4] bg-white text-sm outline-none focus:border-[#6A66C9]"
            />
          </div>
          <button
            onClick={run}
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6A66C9] text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Find creators
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setPrompt(c)}
              className="text-[11px] font-semibold text-gray-600 border border-[#E4E9F4] rounded-full px-3 py-1.5 hover:border-[#6A66C9] hover:text-[#6A66C9] cursor-pointer"
            >
              {c}
            </button>
          ))}
        </div>

        {error && <p className="mt-3 text-[12px] font-semibold text-red-600">{error}</p>}
        {toast && <p className="mt-3 text-[12px] font-semibold text-emerald-600">{toast}</p>}

        {results.length > 0 && (
          <div className="mt-5">
            {summary && <p className="text-[12.5px] text-gray-600 font-medium mb-3">{summary}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((r) => {
                const picked = !!shortlist[r.id];
                return (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-colors cursor-pointer ${
                      picked ? "border-emerald-300 bg-emerald-50/50" : "border-[#E4E9F4] bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 grid place-items-center text-white font-bold shrink-0">
                      {r.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.photo} alt={r.name} className="w-full h-full object-cover" />
                      ) : (
                        (r.name || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#16224E] truncate">{r.name}</p>
                      <p className="text-[11px] text-[#6B6785] truncate">
                        {[r.category, `${fmt(r.followers)} followers`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full grid place-items-center shrink-0 border ${
                        picked ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 text-[#9C97B8]"
                      }`}
                    >
                      {picked ? <Check size={13} /> : "+"}
                    </div>
                  </button>
                );
              })}
            </div>

            {shortlistCount > 0 && (
              <div className="mt-4 flex items-center justify-between gap-3 bg-[#6A66C9] text-white rounded-2xl px-4 py-3">
                <span className="text-[13px] font-bold flex items-center gap-2">
                  <Users size={15} /> {shortlistCount} shortlisted
                  {invitableIds.length < shortlistCount && (
                    <span className="text-white/60 font-semibold"> · {invitableIds.length} invitable</span>
                  )}
                </span>
                <button
                  onClick={() => setPickerOpen(true)}
                  disabled={invitableIds.length === 0}
                  className="inline-flex items-center gap-1.5 bg-white text-[#6A66C9] rounded-full px-4 py-2 text-[12px] font-extrabold disabled:opacity-60 cursor-pointer"
                >
                  <Send size={13} /> Invite to campaign
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <CampaignPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        brandId={user?.id}
        influencerIds={invitableIds}
        onDone={(result) => {
          const invited = result?.invited || 0;
          setToast(`Invited ${invited} creator${invited === 1 ? "" : "s"} to your campaign.`);
          setShortlist({});
          setTimeout(() => setToast(""), 4000);
        }}
      />
    </section>
  );
}
