"use client";

import Image from "next/image";
import React, { useEffect, useState, useCallback } from "react";
import { Carousel, CarouselContent, CarouselItem } from "./ui/carousel";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

// Fallback shown until admin publishes rows to featured_campaigns.
const FALLBACK_DEALS = [
  { id: "stay-1", imageUrl: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=800", brandName: "Featured Campaign", deadline: null },
  { id: "stay-2", imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800", brandName: "Featured Campaign", deadline: null },
  { id: "stay-3", imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800", brandName: "Featured Campaign", deadline: null },
  { id: "stay-4", imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800", brandName: "Featured Campaign", deadline: null },
  { id: "stay-5", imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800", brandName: "Featured Campaign", deadline: null },
  { id: "stay-6", imageUrl: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=800", brandName: "Featured Campaign", deadline: null },
];

// Live countdown to a campaign's application deadline. Formatted to fit
// the white pill on the card — N days when >24h out, then H:M:S in the
// final day, "Closed" at zero, "Open" if no deadline set.
function DeadlineBadge({ deadline }) {
  const target = deadline ? new Date(deadline).getTime() : null;
  const [secondsLeft, setSecondsLeft] = useState(() =>
    target ? Math.max(0, Math.floor((target - Date.now()) / 1000)) : 0
  );
  useEffect(() => {
    if (!target) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) {
    return (
      <div className="bg-white px-4 py-2 rounded-full font-black text-slate-900 shadow-lg text-xs uppercase tracking-wider">
        Open
      </div>
    );
  }
  if (secondsLeft === 0) {
    return (
      <div className="bg-white px-4 py-2 rounded-full font-black text-rose-600 shadow-lg text-xs uppercase tracking-wider">
        Closed
      </div>
    );
  }
  const days = Math.floor(secondsLeft / 86400);
  if (days >= 1) {
    return (
      <div className="bg-white px-4 py-2 rounded-full font-black text-slate-900 shadow-lg text-xs uppercase tracking-wider">
        {days} {days === 1 ? "day left" : "days left"}
      </div>
    );
  }
  const h = Math.floor(secondsLeft / 3600).toString().padStart(2, "0");
  const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, "0");
  const s = (secondsLeft % 60).toString().padStart(2, "0");
  return (
    <div className="bg-white px-4 py-2 rounded-full font-black text-slate-900 shadow-lg text-xs tabular-nums">
      {h}:{m}: <span className="text-[#E60076]">{s}</span>
    </div>
  );
}

export default function DealsLaptop() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  // Start empty + loading=true so the carousel area shows a spinner until
  // featured-campaigns responds. Fallback only kicks in on error / empty
  // response, never as the initial render.
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-featured-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: "{}",
        });
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data?.campaigns) && data.campaigns.length > 0) {
          setDeals(
            data.campaigns.map((c) => ({
              id: c.id,
              imageUrl: c.bannerImage || c.brandLogo || "",
              brandName: c.brandName || c.title || "Featured Campaign",
              deadline: c.applicationDeadline || null,
            }))
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
    return () => { cancelled = true; };
  }, []);

  // Update current index when Embla scrolls
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;

    onSelect(); // Set initial index
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  // Auto-play Logic
  useEffect(() => {
    if (!api || isHovered) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3500);

    return () => clearInterval(interval);
  }, [api, isHovered]);

  const getCardStyles = (index) => {
    const total = deals.length;
    let diff = index - current;

    // Handle loop math for 3D stack
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const absDiff = Math.abs(diff);

    // Hide cards far from center
    if (absDiff > 2) return { opacity: 0, scale: 0.8, x: 0, zIndex: 0 };

    return {
      opacity: 1 - absDiff * 0.2,
      scale: 1 - absDiff * 0.15,
      x: diff * 150, // Adjust this for horizontal spread
      zIndex: 50 - absDiff,
    };
  };

  return (
    <section
      className="w-full py-20 overflow-hidden flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-[1400px] w-full px-10 relative">
        {/* HIDDEN CONTROLLER 
          We use CarouselItem so Embla has 'slides' to calculate 
        */}
        <div className="absolute opacity-0 pointer-events-none h-0 w-0 overflow-hidden">
          <Carousel setApi={setApi} opts={{ loop: true, align: "center" }}>
            <CarouselContent>
              {deals.map((stay) => (
                <CarouselItem key={stay.id} className="basis-full">
                  <div className="h-1 w-1" />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* VISUAL STACK */}
        <div className="relative h-[450px] flex items-center justify-center">
          {deals.map((stay, i) => {
            const styles = getCardStyles(i);
            const isActive = current === i;

            return (
              <div
                key={stay.id}
                onClick={() => router.push(`/influencer/offers/${stay.id}`)}
                className="absolute w-[650px] aspect-[16/10] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer"
                style={{
                  transform: `translateX(${styles.x}px) scale(${styles.scale})`,
                  zIndex: styles.zIndex,
                  opacity: styles.opacity,
                }}
              >
                <div
                  className={`relative w-full h-full rounded-[40px] overflow-hidden transition-all duration-500
                    ${isActive ? "shadow-2xl brightness-100" : "shadow-md brightness-[0.8]"}
                  `}
                >
                  <Image
                    src={stay.imageUrl}
                    alt="deal"
                    fill
                    className="object-cover"
                    priority={isActive}
                  />

                  {/* UI Overlay */}
                  <div
                    className={`absolute inset-0 px-10 py-5 flex flex-col justify-between transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-0"}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <span className="bg-white/20 backdrop-blur-md border border-white/30 px-5 py-2 rounded-full text-white font-black text-[14px] uppercase tracking-widest line-clamp-1 max-w-[60%]">
                        {stay.brandName || "Featured Campaign"}
                      </span>
                      <DeadlineBadge deadline={stay.deadline} />
                    </div>

                    <button className="w-fit bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white font-black px-10 py-4 rounded-2xl shadow-xl uppercase tracking-widest text-[11px]">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-center mt-12 gap-8">
          <button
            onClick={() => api?.scrollPrev()}
            className="p-3 rounded-full border border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-500 transition-all bg-white shadow-sm active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex gap-3">
            {deals.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                className={`h-2.5 transition-all duration-500 rounded-full ${
                  current === i ? "bg-[#F6339A] w-14" : "bg-gray-200 w-2.5"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => api?.scrollNext()}
            className="p-3 rounded-full border border-gray-200 text-gray-400 hover:text-pink-500 hover:border-pink-500 transition-all bg-white shadow-sm active:scale-90"
          >
            <ChevronLeft size={24} className="rotate-180" />
          </button>
        </div>
      </div>
    </section>
  );
}
