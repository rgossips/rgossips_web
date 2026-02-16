"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import Image from "next/image";

// --- RollingTimer (Unchanged) ---
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

// --- Updated CardRotate Component ---
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
  const [stack, setStack] = useState([
    {
      id: 1,
      img: "https://images.pexels.com/photos/27127418/pexels-photo-27127418.jpeg",
    },
    {
      id: 2,
      img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800",
    },
    {
      id: 3,
      img: "https://images.pexels.com/photos/22922098/pexels-photo-22922098.jpeg",
    },
    {
      id: 4,
      img: "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=800",
    },
  ]);

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

  return (
    <div className="relative w-full h-[350px] lg:h-[500px] flex items-start justify-center perspective-[1200px] lg:overflow-hidden mb-20 lg:mb-0">
      <AnimatePresence initial={false}>
        {stack.map((card, index) => {
          const isTop = index === stack.length - 1;
          const positionFromTop = stack.length - index - 1;

          const xOffset =
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? positionFromTop * 40
              : 0;
          const yOffset =
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? positionFromTop * 10
              : positionFromTop * 35;
          const rotation =
            typeof window !== "undefined" && window.innerWidth >= 1024
              ? positionFromTop * 5
              : 0;

          return (
            <CardRotate
              key={card.id}
              onSendToBack={() => sendToBack(card.id)}
              sensitivity={sensitivity}
              disableDrag={!isTop}
            >
              <motion.div
                // pointer-events-none on the inner div ensures the drag surface gets the hits
                className="bg-white rounded-[45px] shadow-lg border border-slate-100 overflow-hidden w-[350px] lg:w-[500px] aspect-[4/5] lg:aspect-square will-change-transform select-none"
                animate={{
                  x: xOffset,
                  y: yOffset,
                  rotate: rotation,
                  scale: 1 - positionFromTop * 0.05,
                  zIndex: index,
                  filter:
                    positionFromTop > 0
                      ? `blur(${positionFromTop * 1}px)`
                      : "blur(0px)",
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <div className="relative h-[60%] lg:h-[75%] w-full pointer-events-none">
                  <Image
                    fill
                    src={card.img}
                    className="object-cover"
                    alt="deal"
                    draggable={false}
                  />
                </div>

                <div className="px-4 py-4 lg:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between h-[40%] lg:h-[25%] gap-3">
                  <div className="flex flex-row items-center justify-between w-full">
                    <h3 className="text-base font-extrabold text-slate-800 leading-tight lg:text-xl">
                      Deal Of The Day
                    </h3>
                    <RollingTimer />
                  </div>
                  {/* pointer-events-auto allows the button to be clickable while the rest of the card is draggable */}
                  <button className="relative z-10 w-full cursor-pointer lg:w-auto bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white py-3 lg:py-2 lg:px-6 rounded-xl font-black text-xs uppercase shadow-xl active:scale-95 transition-transform pointer-events-auto">
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
