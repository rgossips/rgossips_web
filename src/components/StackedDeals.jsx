"use client";

import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import { useTranslations } from "next-intl";

// Built-in fallback for when the admin hasn't picked any featured campaigns
// yet. Same shape as the rows from list-featured-campaigns so the rest of
// the component doesn't need to branch.
const FALLBACK_DEALS = [
  { id: 1, img: "https://images.pexels.com/photos/27127418/pexels-photo-27127418.jpeg" },
  { id: 2, img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800" },
  { id: 3, img: "https://images.pexels.com/photos/22922098/pexels-photo-22922098.jpeg" },
  { id: 4, img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=800" },
];

// --- RollingTimer ---
// Live countdown to a campaign's application deadline. We render days
// when the deadline is more than 24h away (the H:M:S display is misleading
// at that scale) and roll to H:M:S once we cross under a day. Pass null
// to hide the timer entirely (no deadline set).
const RollingTimer = memo(({ deadline }) => {
  const t = useTranslations("StackedDeals");
  const target = deadline ? new Date(deadline).getTime() : null;
  const [secondsLeft, setSecondsLeft] = useState(() => (target ? Math.max(0, Math.floor((target - Date.now()) / 1000)) : 0));

  useEffect(() => {
    if (!target) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!target) {
    return <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("timer.open")}</span>;
  }

  if (secondsLeft === 0) {
    return <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">{t("timer.closed")}</span>;
  }

  const days = Math.floor(secondsLeft / 86400);
  if (days >= 1) {
    return (
      <div className="flex items-center gap-1 font-bold text-slate-800 tabular-nums">
        <span className="text-lg font-black">{days}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{t("timer.daysLeft", { count: days })}</span>
      </div>
    );
  }

  const h = Math.floor(secondsLeft / 3600).toString().padStart(2, "0");
  const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, "0");
  const sec = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1 font-mono text-xl font-black text-slate-800 tabular-nums">
      <span>
        {h}:{m}:
      </span>
      <div className="relative h-8 w-7 overflow-hidden bg-slate-50 rounded-lg flex flex-col items-center shadow-inner">
        <AnimatePresence mode="popLayout">
          <motion.span key={sec} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }} className="text-pink-500">
            {sec}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
});
RollingTimer.displayName = "RollingTimer";

// Used to be a draggable stacked-card view. Now renders a horizontal
// Embla carousel (one campaign per slide, with a slim peek so the next
// card hints from the right). Mobile-only — DealsLaptop covers desktop.
export default function StackedDeals() {
  const t = useTranslations("StackedDeals");
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-featured-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ section: "campaign" }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data?.campaigns) && data.campaigns.length > 0) {
          setDeals(
            data.campaigns.slice(0, 6).map((c) => ({
              id: c.id,
              img: c.bannerImage || c.brandLogo || "",
              brandName: c.brandName || c.title || "",
              deadline: c.applicationDeadline || null,
            })),
          );
        } else {
          setDeals(FALLBACK_DEALS);
        }
      } catch {
        if (!cancelled) setDeals(FALLBACK_DEALS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Track which slide is active for the dot indicator.
  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto-advance every 4s. Embla's loop:true means we never need to wrap
  // manually; scrollNext just keeps going.
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => api.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [api]);

  if (loading) {
    return (
      <div className="relative w-full h-[350px] flex flex-col items-center justify-center gap-4 mb-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        <p className="text-slate-400 font-medium animate-pulse">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full mb-12">
      <Carousel opts={{ align: "center", loop: true }} setApi={setApi} className="w-full">
        <CarouselContent className="-ml-3">
          {deals.map((card) => (
            <CarouselItem key={card.id} className="pl-3 basis-[88%] sm:basis-[70%]">
              <div className="bg-white rounded-[40px] shadow-lg border border-slate-100 overflow-hidden aspect-[4/5]">
                <div
                  className="relative h-[60%] w-full cursor-pointer"
                  onClick={() => {
                    if (typeof card.id === "string") router.push(`/influencer/offers/${card.id}`);
                  }}
                >
                  {card.img && <Image fill src={card.img} className="object-cover" alt={card.brandName || t("dealImageAlt")} draggable={false} />}
                </div>

                <div className="px-4 py-4 flex flex-col h-[40%] gap-3">
                  <div className="flex flex-row items-center justify-between w-full gap-3">
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight line-clamp-1 flex-1 min-w-0">{card.brandName || t("featuredCampaign")}</h3>
                    <RollingTimer deadline={card.deadline} />
                  </div>
                  <button
                    onClick={() => {
                      if (typeof card.id === "string") router.push(`/influencer/offers/${card.id}`);
                    }}
                    className="relative z-10 w-full cursor-pointer bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white py-3 rounded-xl font-black text-xs uppercase shadow-xl active:scale-95 transition-transform"
                  >
                    {t("applyNow")}
                  </button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicator */}
      <div className="flex justify-center mt-4 gap-2">
        {deals.map((_, i) => (
          <button
            key={i}
            onClick={() => api?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${current === i ? "bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] w-8" : "bg-slate-200 w-2"}`}
            aria-label={t("goToDeal", { number: i + 1 })}
          />
        ))}
      </div>
    </div>
  );
}
