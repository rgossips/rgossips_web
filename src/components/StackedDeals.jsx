"use client";

import React, { useState, useEffect, memo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";

// --- 1. Separated Timer Component ---
// This prevents the whole card from re-rendering every second
const RollingTimer = memo(() => {
  const [secondsLeft, setSecondsLeft] = useState(23654);

  useEffect(() => {
    const interval = setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(interval);
  }, []);

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
          <motion.span
            key={sec}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-pink-500"
          >
            {sec}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
});

RollingTimer.displayName = "RollingTimer";

// --- 2. CardRotate Component ---
function CardRotate({
  children,
  onSendToBack,
  sensitivity,
  disableDrag = false,
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleDragEnd(_, info) {
    if (
      Math.abs(info.offset.x) > sensitivity ||
      Math.abs(info.offset.y) > sensitivity
    ) {
      onSendToBack();
    } else {
      x.set(0);
      y.set(0);
    }
  }

  return (
    <motion.div
      className="absolute w-full flex justify-center"
      style={{ x, y, rotateX, rotateY, zIndex: disableDrag ? 0 : 50 }}
      drag={!disableDrag}
      dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

// --- 3. Main Component ---
export default function StackedDeals({ sensitivity = 120 }) {
  const [stack, setStack] = useState([
    {
      id: 1,
      img: "https://images.unsplash.com/photo-1544333346-64e4fe1fdeb5?q=80&w=800",
    },
    {
      id: 2,
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
    },
    {
      id: 3,
      img: "https://images.unsplash.com/photo-1506929199175-609ec3ee9943?q=80&w=800",
    },
    {
      id: 4,
      img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=800",
    },
  ]);

  const sendToBack = (id) => {
    setStack((prev) => {
      const newStack = [...prev];
      const index = newStack.findIndex((card) => card.id === id);
      const [card] = newStack.splice(index, 1);
      return [card, ...newStack];
    });
  };

  return (
    <div className="relative w-full h-[550px] lg:h-[600px] flex items-start justify-center perspective-[1200px] overflow-hidden">
      <AnimatePresence initial={false}>
        {stack.map((card, index) => {
          const isTop = index === stack.length - 1;
          const positionFromTop = stack.length - index - 1;

          return (
            <CardRotate
              key={card.id}
              onSendToBack={() => sendToBack(card.id)}
              sensitivity={sensitivity}
              disableDrag={!isTop}
            >
              <motion.div
                className="bg-white rounded-[45px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden w-[350px] lg:w-[500px] aspect-[4/5] lg:aspect-square will-change-transform"
                animate={{
                  y: positionFromTop * 35, // More bottom visibility
                  scale: 1 - positionFromTop * 0.07,
                  // We apply the blur filter ONLY to the background cards
                  // and keep the top card perfectly sharp
                  filter:
                    positionFromTop > 0
                      ? `blur(${positionFromTop * 1}px)`
                      : "blur(0px)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <div className="relative h-[60%] lg:h-[80%] w-full">
                  <img
                    src={card.img}
                    className="w-full h-full object-cover"
                    alt="deal"
                    loading={index === stack.length - 1 ? "eager" : "lazy"}
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-6 h-2 rounded-full bg-pink-500 shadow-lg" />
                    <div className="w-2 h-2 rounded-full bg-white/60" />
                    <div className="w-2 h-2 rounded-full bg-white/60" />
                  </div>
                </div>

                <div className="px-4 py-4 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between h-[40%] lg:h-[80px] gap-3 lg:gap-0">
                  <div className="flex flex-row items-center justify-between w-full gap-2 lg:flex-row lg:gap-6">
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight lg:text-xl lg:w-auto">
                      Deal Of The Day
                    </h3>
                    {/* Only this component updates every second */}
                    <RollingTimer />
                  </div>
                  <button className="w-full lg:w-auto bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white py-3 lg:py-2 lg:px-6 rounded-full lg:rounded-2xl font-black text-xs lg:text-sm uppercase shadow-xl shadow-pink-200 tracking-widest active:scale-95 transition-transform lg:max-h-12 lg:mt-0">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            </CardRotate>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
