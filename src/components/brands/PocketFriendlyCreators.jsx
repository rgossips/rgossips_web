"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronDown, Loader2, IndianRupee, Check } from "lucide-react";

// Reel rate buckets. The brand picks one; we filter influencers whose
// service_rates.reels (rupees per reel) falls in [min, max). Open-ended
// top bucket uses Infinity so "₹25K+" doesn't need a special branch.
const PRICE_RANGES = [
  { id: "under_1k", label: "Under ₹1,000", short: "< ₹1K", min: 0, max: 1_000 },
  { id: "1k_5k", label: "₹1,000 – ₹5,000", short: "₹1K – 5K", min: 1_000, max: 5_000 },
  { id: "5k_10k", label: "₹5,000 – ₹10,000", short: "₹5K – 10K", min: 5_000, max: 10_000 },
  { id: "10k_25k", label: "₹10,000 – ₹25,000", short: "₹10K – 25K", min: 10_000, max: 25_000 },
  { id: "25k_plus", label: "₹25,000 and up", short: "₹25K+", min: 25_000, max: Infinity },
];

const DEFAULT_RANGE = PRICE_RANGES[1]; // ₹1K–5K is the most populated bucket.

const formatRate = (n) => {
  if (!Number.isFinite(n) || n <= 0) return "On request";
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatFollowers = (n) => {
  if (!n) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export default function PocketFriendlyCreators() {
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(DEFAULT_RANGE);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-influencers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          // Pocket Friendly filters + sorts the full directory locally, so
          // ask for a large slice up-front. `list-influencers` capped its
          // default to 50 in the 2026-07 pagination refactor.
          body: JSON.stringify({ limit: 2000 }),
        });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.influencers)) {
          setInfluencers(data.influencers);
        }
      } catch (e) {
        console.error("Failed to fetch influencers:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(() => {
    const out = [];
    for (const inf of influencers) {
      // Only registered influencers have a service_rates object; the
      // invitation rows surface an empty {} from list-influencers and get
      // skipped automatically by the rate parse below.
      const rawRate = inf?.service_rates?.reels;
      if (rawRate == null || rawRate === "") continue;
      const rate = Number(rawRate);
      if (!Number.isFinite(rate) || rate <= 0) continue;
      if (rate < range.min || rate >= range.max) continue;
      out.push({ ...inf, _reelRate: rate });
    }
    // Cheapest first inside the bucket — feels natural for "pocket friendly".
    out.sort((a, b) => a._reelRate - b._reelRate);
    return out;
  }, [influencers, range]);

  return (
    <section className="w-full px-4 lg:px-10 py-10 bg-white">
      <div className="flex flex-col mb-6">
        <h2 className="bx-h2">
          Pocket Friendly Creators
        </h2>
        <p className="text-sm text-[#6B6785]">
          High engagement creators within your budget
        </p>
      </div>

      {/* Range selector — sticks to the left on desktop, full-width on mobile. */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-6">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 border-[#6A66C9]/20 bg-white shadow-sm text-sm font-bold text-[#16224E] hover:border-[#6A66C9]/40 transition-all cursor-pointer min-w-[220px] justify-between"
          >
            <span className="flex items-center gap-2">
              <IndianRupee size={14} className="text-[#6A66C9]" />
              <span>Reel rate · {range.label}</span>
            </span>
            <ChevronDown
              size={16}
              className={`text-[#6A66C9] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full mt-2 left-0 z-30 w-[280px] bg-white border border-[#E4E9F4] rounded-2xl shadow-xl overflow-hidden">
              {PRICE_RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onMouseDown={() => {
                    setRange(r);
                    setDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors cursor-pointer ${
                    r.id === range.id
                      ? "bg-[#6A66C9]/10 text-[#6A66C9]"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {r.label}
                  {r.id === range.id && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-[12px] text-[#9C97B8] font-medium">
          {loading
            ? "Loading creators…"
            : matches.length === 0
              ? "No creators in this range yet."
              : `${matches.length} creator${matches.length === 1 ? "" : "s"} match this range`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#6A66C9]" />
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E4E9F4] rounded-3xl py-12 px-6 text-center">
          <p className="text-sm font-bold text-[#6B6785]">
            No creators have set a reel rate in this bucket yet.
          </p>
          <p className="text-[12px] text-[#9C97B8] mt-1">
            Try a wider range, or browse the full directory.
          </p>
          <Link
            href="/brands/search"
            className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-[#6A66C9] text-white text-sm font-bold hover:bg-[#4d31d8] cursor-pointer"
          >
            Open Find Creators
          </Link>
        </div>
      ) : (
        <Carousel opts={{ align: "start", loop: false }} className="w-full relative">
          <CarouselContent className="-ml-4">
            {matches.map((inf) => {
              const handle = inf.instagram_handle || inf.username || "";
              const display = inf.full_name || handle || "Creator";
              const category = inf.categories?.[0] || "Creator";
              return (
                <CarouselItem
                  key={inf.influencer_id}
                  className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/4"
                >
                  <div className="group bg-white rounded-[32px] border border-[#E4E9F4] shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center text-center h-full">
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-400 p-[3px]">
                        <div className="bg-white rounded-full p-1 h-full w-full">
                          {inf.profile_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={inf.profile_photo_url}
                              alt={display}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-2xl flex items-center justify-center">
                              {display.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <h3 className="font-bold text-[#16224E] text-lg leading-tight truncate w-full">
                      {display}
                    </h3>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-3 truncate max-w-full">
                      {category}
                    </span>

                    <p className="text-xs text-[#9C97B8] mt-2 font-medium">
                      {formatFollowers(inf.followers_count)} followers
                    </p>

                    <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black">
                      <IndianRupee size={11} /> {formatRate(inf._reelRate)} / reel
                    </div>

                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <div className="hidden md:block">
            <CarouselPrevious className="-left-4 bg-white shadow-lg border-none hover:bg-slate-50" />
            <CarouselNext className="-right-4 bg-white shadow-lg border-none hover:bg-slate-50" />
          </div>
        </Carousel>
      )}
    </section>
  );
}
