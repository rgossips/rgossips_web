"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import Image from "next/image";
import { FaChevronDown } from "react-icons/fa";
import { useRouter } from "next/navigation";

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
    return <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Open</span>;
  }

  if (secondsLeft === 0) {
    return <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Closed</span>;
  }

  const days = Math.floor(secondsLeft / 86400);
  if (days >= 1) {
    return (
      <div className="flex items-center gap-1 font-bold text-slate-800 tabular-nums">
        <span className="text-lg font-black">{days}</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{days === 1 ? "day left" : "days left"}</span>
      </div>
    );
  }

  const h = Math.floor(secondsLeft / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((secondsLeft % 3600) / 60)
    .toString()
    .padStart(2, "0");
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

// --- Updated CardRotate Component ---
function CardRotate({ children, onSendToBack, sensitivity, disableDrag = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleDragEnd(_, info) {
    if (Math.abs(info.offset.x) > sensitivity || Math.abs(info.offset.y) > sensitivity) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      className="absolute flex justify-center cursor-grab active:cursor-grabbing"
      // Crucial: ensure this wrapper matches the card dimensions
      style={{
        x,
        y,
        rotateX,
        rotateY,
        zIndex: disableDrag ? 0 : 50,
        width: "100%",
        height: "100%",
      }}
      drag={!disableDrag}
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

// --- Main Component ---
export default function StackedDeals({ sensitivity = 120 }) {
  const router = useRouter();
  // Start with no cards + loading=true so we render a spinner until the
  // featured-campaigns response arrives. If the API fails or returns
  // empty we fall back to the hardcoded list (set inside the catch /
  // empty branch) instead of showing nothing.
  const [stack, setStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCompact, setIsCompact] = useState(false);

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
          setStack(
            data.campaigns.slice(0, 6).map((c) => ({
              id: c.id,
              img: c.bannerImage || c.brandLogo || "",
              brandName: c.brandName || c.title || "",
              deadline: c.applicationDeadline || null,
            })),
          );
        } else {
          setStack(FALLBACK_DEALS);
        }
      } catch {
        if (!cancelled) setStack(FALLBACK_DEALS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendToBack = useCallback((id) => {
    setStack((prev) => {
      const newStack = [...prev];
      const index = newStack.findIndex((card) => card.id === id);
      if (index === -1) return prev;
      const [card] = newStack.splice(index, 1);
      return [card, ...newStack];
    });
  }, []);

  // --- AUTO SCROLL LOGIC ---
  useEffect(() => {
    const autoScroll = setInterval(() => {
      // Always move the top card (last item in our array) to the back
      const topCard = stack[stack.length - 1];
      if (topCard) sendToBack(topCard.id);
    }, 5000); // Swaps every 5 seconds

    return () => clearInterval(autoScroll);
  }, [stack, sendToBack]);

  if (loading) {
    return (
      <div className="relative w-full h-[350px] lg:h-[500px] flex flex-col items-center justify-center gap-4 mb-12 lg:mb-0">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500" />
        <p className="text-slate-400 font-medium animate-pulse">Loading featured campaigns…</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[350px] lg:h-[500px] flex items-start justify-center perspective-[1200px] overflow-hidden mb-12 lg:mb-0">
      <AnimatePresence initial={false}>
        {stack.map((card, index) => {
          const isTop = index === stack.length - 1;
          const positionFromTop = stack.length - index - 1;

          const xOffset = typeof window !== "undefined" && window.innerWidth >= 1024 ? positionFromTop * 40 : 0;
          const yOffset =
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? positionFromTop * 10
              : isCompact
                ? positionFromTop * 5 // Minimal spread
                : positionFromTop * 35; // Full spread
          const rotation = typeof window !== "undefined" && window.innerWidth >= 1024 ? positionFromTop * 5 : 0;

          return (
            <CardRotate key={card.id} onSendToBack={() => sendToBack(card.id)} sensitivity={sensitivity} disableDrag={!isTop}>
              <motion.div
                // pointer-events-none on the inner div ensures the drag surface gets the hits
                className={`bg-white ${isCompact ? " rounded-t-[45px]" : " rounded-[45px]"} shadow-lg border border-slate-100 overflow-hidden w-[calc(100vw-48px)] max-w-[350px] lg:w-[500px] lg:max-w-[500px] aspect-[4/5] lg:aspect-square will-change-transform select-none`}
                animate={{
                  x: xOffset,
                  y: yOffset,
                  rotate: rotation,
                  scale: 1 - positionFromTop * 0.05,
                  zIndex: index,
                  filter: positionFromTop > 0 ? `blur(${positionFromTop * 1}px)` : "blur(0px)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="relative h-[60%] lg:h-[75%] w-full pointer-events-none">
                  <Image fill src={card.img} className="object-cover" alt="deal" draggable={false} />
                </div>

                <div className="px-4 py-4 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between h-[40%] lg:h-[25%] gap-3">
                  <div className="flex flex-row items-center justify-between w-full gap-3">
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight lg:text-xl line-clamp-1 flex-1 min-w-0">{card.brandName || "Featured Campaign"}</h3>
                    <RollingTimer deadline={card.deadline} />
                  </div>
                  {/* pointer-events-auto allows the button to be clickable while the rest of the card is draggable */}
                  <button
                    onClick={() => {
                      // Numeric ids on the fallback list have nowhere to go;
                      // real campaign UUIDs deep-link to the offer detail.
                      if (typeof card.id === "string") router.push(`/influencer/offers/${card.id}`);
                    }}
                    className="relative z-10 w-full cursor-pointer lg:w-auto bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white py-3 lg:py-2 lg:px-6 rounded-xl font-black text-xs uppercase shadow-xl active:scale-95 transition-transform pointer-events-auto"
                  >
                    Apply Now
                  </button>
                </div>
              </motion.div>
            </CardRotate>
          );
        })}

        {/* <motion.div
          className="w-[350px] z-50 lg:hidden mt-4"
          animate={{ y: isCompact ? 335 : 400 }} // Fine-tune position when collapsed
        >
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="btn-purple w-full py-3 rounded-b-2xl flex items-center justify-center gap-2 text-white font-bold"
          >
            {isCompact ? "Show Full Stack" : "Compact View"}
            <motion.span animate={{ rotate: isCompact ? 0 : 180 }}>
              <FaChevronDown size={14} />
            </motion.span>
          </button>
        </motion.div> */}
      </AnimatePresence>
    </div>
  );
}
