"use client";

import { useMemo, useState } from "react";
import { Loader2, Check, Users, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useBrandTrustScore } from "@/hooks/useBrandTrustScore";
import CampaignPickerModal from "@/components/brands/CampaignPickerModal";

/**
 * Explore hero — the navy panel from "RGossips Explore.dc.html".
 *
 * The reference merges what used to be three separate blocks (BrandHero,
 * BrandMatchPrompt and the mobile TrustSection) into one panel: badge row,
 * headline, AI brief box, prompt chips, trust card, social proof, and a strip
 * of live matches along the bottom. Splitting them again would lose the
 * design's whole point, so they are one component here.
 *
 * All the matching behaviour is BrandMatchPrompt's, carried over intact —
 * landing-match, shortlisting, and the invite-to-campaign flow through
 * CampaignPickerModal. Only the presentation changed.
 */

/**
 * Social-proof figures from the reference.
 *
 * THESE ARE UNVERIFIED MARKETING CLAIMS and they are rendered to customers.
 * The reference states 250,000+ verified creators and 2,800+ agencies; the
 * production database currently holds on the order of 1,700 influencer
 * profiles. They may be projections or come from a source outside the app —
 * but under ASCI an advertiser has to be able to substantiate a claim, and
 * this is the brand-facing surface where those claims are being made.
 *
 * Kept here, in one place, at the reference's values because the design was
 * asked for exactly. Change or remove them the moment someone cannot produce
 * the basis in writing.
 */
const HERO_STATS = {
  creators: "250K+",
  matchTime: "4.2 min",
  agencies: "2,800+",
};

const CHIPS = [
  "Beauty creators in Mumbai, 50K+",
  "Tech reviewers for an unboxing",
  "Fitness micro-creators for barter",
];

function fmt(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return Math.round(num / 1_000) + "K";
  return String(num);
}

export default function BrandExploreHero() {
  const supabase = useMemo(() => createClient(), []);
  const { user, profile } = useAuth();
  const { trust, loading: trustLoading } = useBrandTrustScore();

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
  const invitableIds = Object.keys(shortlist).filter(
    (id) => shortlist[id] && !String(id).startsWith("inv_"),
  );
  const shortlistCount = Object.values(shortlist).filter(Boolean).length;

  const firstName = (profile?.contact_name || profile?.brand_name || "").split(" ")[0];
  const score = trustLoading ? null : trust?.score ?? null;
  const band = trust?.band || "";
  // 300 is the floor of the scale, not zero — a 300 must read as an empty bar.
  const scorePct = score ? Math.max(0, Math.min(100, ((score - 300) / 600) * 100)) : 0;

  return (
    <section className="relative overflow-hidden rounded-[30px] px-6 py-9 text-white shadow-[0_30px_70px_rgba(14,24,58,.4)] lg:px-[46px] lg:py-11 bx-navy">
      {/* Ambient wash + drift, straight from the reference. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[20%] bx-hero-drift"
        style={{
          background:
            "radial-gradient(40% 54% at 14% 6%, rgba(70,103,174,.62), transparent 68%), radial-gradient(42% 56% at 86% 10%, rgba(49,80,143,.7), transparent 70%), radial-gradient(46% 60% at 26% 104%, rgba(16,26,62,.9), transparent 68%), radial-gradient(38% 50% at 94% 94%, rgba(88,86,164,.5), transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(22,34,78,.12), rgba(11,19,46,.55))" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "var(--bx-grad)" }}
      />

      <div className="relative grid items-start gap-7 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,.8fr)] lg:gap-12">
        {/* ── Left column ── */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/[.14] px-3.5 py-[7px] text-[10.5px] font-bold tracking-[.14em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6EE7B7] bx-pulse-dot" />
              AI MATCHING ENGINE
            </span>
            <span
              className="h-px min-w-6 flex-1"
              style={{ background: "linear-gradient(90deg, rgba(255,255,255,.4), transparent)" }}
            />
            {firstName && (
              <span className="hidden text-xs text-white/60 sm:block">Welcome back, {firstName}</span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="m-0 text-[clamp(30px,3.4vw,52px)] font-bold leading-[1.05] tracking-[-1.6px] text-pretty">
              Describe your ideal creator.
              <br />
              <span
                style={{
                  background: "linear-gradient(95deg,#CFE0FF,#A8C4FF 40%,#7E9FE8 75%,#5B7EC6)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                We&apos;ll find the match.
              </span>
            </h1>
            <p className="m-0 max-w-[52ch] text-[15px] leading-relaxed text-white/[.78]">
              One line about your campaign — niche, city, budget, vibe. The engine ranks{" "}
              {HERO_STATS.creators} verified creators and returns the ones you can invite today.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="flex items-center gap-2 rounded-2xl border border-white/[.26] bg-white/[.13] p-1.5 pl-1 shadow-[0_14px_32px_rgba(20,7,60,.26)] backdrop-blur-[10px]"
          >
            <span className="pl-3 text-sm text-white/70" aria-hidden="true">
              ✦
            </span>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Launch our serum with beauty creators in Mumbai under ₹15k"
              aria-label="Describe your ideal creator"
              className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-sm font-medium text-white outline-none placeholder:text-white/50"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border border-white/[.24] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(79,121,198,.4)] transition disabled:opacity-60 lg:px-[22px]"
              style={{ background: "var(--bx-grad)" }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              <span className="whitespace-nowrap">Find creators</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-0.5 text-[11.5px] text-white/[.55]">Try</span>
            {CHIPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPrompt(c)}
                className="cursor-pointer whitespace-nowrap rounded-full border border-white/20 bg-white/[.09] px-3.5 py-2 text-xs font-medium text-white/90 transition hover:bg-white/20"
              >
                {c}
              </button>
            ))}
          </div>

          {error && <p className="text-[12px] font-semibold text-[#FFB4C4]">{error}</p>}
          {toast && <p className="text-[12px] font-semibold text-[#6EE7B7]">{toast}</p>}
        </div>

        {/* ── Right column ── */}
        <div className="flex min-w-0 flex-col gap-3.5">
          {/* Trust score — real, from the same hook the profile page uses. */}
          <div className="rounded-[20px] border border-white/[.16] bg-[rgba(9,17,42,.55)] p-[18px]">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-[.12em] text-white/60">
              <span>YOUR TRUST SCORE</span>
              {band && (
                <span
                  className="text-[11px] font-bold tracking-normal"
                  style={{
                    background: "linear-gradient(95deg,#CFE0FF,#8FB0EE)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {band}
                </span>
              )}
            </div>
            <div className="my-2.5 mb-3 flex items-baseline gap-1.5">
              <span className="text-[40px] font-bold leading-none tracking-[-1.5px] tabular-nums">
                {score ?? "—"}
              </span>
              <span className="text-[13px] text-white/50">/900</span>
            </div>
            <div className="h-[5px] overflow-hidden rounded-full bg-white/[.16]">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${scorePct}%`, background: "var(--bx-grad)" }}
              />
            </div>
            {trust?.coldStart && (
              <div className="mt-2.5 text-[11px] text-white/60">
                Capped at {trust.coldStartCap} · {trust.coldStartThreshold} campaigns to lift
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-[20px] border border-white/[.16] bg-white/10 p-[18px]">
            <span className="text-xs text-white/[.72]">Trusted by {HERO_STATS.agencies} agencies</span>
            <div className="flex items-center" aria-hidden="true">
              {[
                "linear-gradient(135deg,#5B7EC6,#22376F)",
                "linear-gradient(135deg,#7E9FE8,#31508F)",
                "linear-gradient(135deg,#6E82C8,#2A3C78)",
              ].map((bg, i) => (
                <div
                  key={bg}
                  className={`h-[34px] w-[34px] rounded-full border-2 border-[#22376F] ${i ? "-ml-2.5" : ""}`}
                  style={{ background: bg }}
                />
              ))}
              <div
                className="-ml-2.5 grid h-[34px] w-[34px] place-items-center rounded-full border-2 border-[#22376F] text-[11px] font-bold"
                style={{ background: "linear-gradient(135deg,#8FB0EE,#4667AE)" }}
              >
                +2k
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 border-t border-white/[.14] pt-1">
              <div>
                <div className="text-[17px] font-bold">{HERO_STATS.creators}</div>
                <div className="text-[10.5px] text-white/60">Verified creators</div>
              </div>
              <div>
                <div className="text-[17px] font-bold">{HERO_STATS.matchTime}</div>
                <div className="text-[10.5px] text-white/60">Avg. match time</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Matches strip ── only once the engine has returned something. */}
      {results.length > 0 && (
        <div className="relative mt-8 border-t border-white/[.16] pt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="truncate text-[13.5px] font-semibold">
                {summary || "Matched creators"}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-full border border-white/[.24] bg-white/[.14] px-2.5 py-[5px] text-[11.5px] font-semibold">
                {results.length} matches
              </span>
            </div>
          </div>

          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(210px,1fr))]">
            {results.map((r) => {
              const picked = !!shortlist[r.id];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-pressed={picked}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-[13px] text-left transition ${
                    picked
                      ? "border-[#6EE7B7]/60 bg-[#6EE7B7]/15"
                      : "border-white/[.16] bg-white/10 hover:bg-white/[.18]"
                  }`}
                >
                  <span
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center overflow-hidden rounded-xl text-base font-bold text-white"
                    style={{ background: "var(--bx-grad)" }}
                  >
                    {r.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photo} alt={r.name} className="h-full w-full object-cover" />
                    ) : (
                      (r.name || "?").charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span className="truncate text-[13px] font-semibold">{r.name}</span>
                    <span className="truncate text-[11px] text-white/[.62]">
                      {[r.category, `${fmt(r.followers)} followers`].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                      picked
                        ? "border-[#6EE7B7] bg-[#6EE7B7] text-[#0B132E]"
                        : "border-white/30 text-white/70"
                    }`}
                  >
                    {picked ? <Check size={13} /> : "+"}
                  </span>
                </button>
              );
            })}
          </div>

          {shortlistCount > 0 && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/[.14] px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] font-bold">
                <Users size={15} /> {shortlistCount} shortlisted
                {invitableIds.length < shortlistCount && (
                  <span className="font-semibold text-white/60">
                    {" "}
                    · {invitableIds.length} invitable
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                disabled={invitableIds.length === 0}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[12px] font-extrabold text-[var(--bx-ink)] disabled:opacity-60"
              >
                <Send size={13} /> Invite to campaign
              </button>
            </div>
          )}
        </div>
      )}

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
