"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";

/**
 * 1. Independent Countdown Hook
 */
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
      } else {
        setTimeLeft({
          h: Math.floor(distance / (1000 * 60 * 60))
            .toString()
            .padStart(2, "0"),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
            .toString()
            .padStart(2, "0"),
          s: Math.floor((distance % (1000 * 60)) / 1000)
            .toString()
            .padStart(2, "0"),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
};

/**
 * 2. Dummy Data with 5 Elements
 */
const dealsData = [
  {
    id: 1,
    title: "Get approve soon",
    desc: "Link your social media and start your journey with top brands today.",
    endTime: "2026-02-15T23:59:59",
    image:
      "https://ouch-cdn2.icons8.com/6_T0i_yKk4V5zW_1g7k5z-z1G6_4_6_z_4_6_z_4_6_z.png",
    bgColor: "bg-[#FFF0F7]",
  },
  {
    id: 2,
    title: "Travel the world",
    desc: "Exclusive airline partnerships for content creators. Apply now.",
    endTime: "2026-03-01T12:00:00",
    image:
      "https://ouch-cdn2.icons8.com/mOa8m8yT_B3PzWpL-f0y1_3-O_X_V_S_Y_S_T.png",
    bgColor: "bg-[#F0F7FF]",
  },
  {
    id: 3,
    title: "Beauty collab",
    desc: "Get free skincare products in exchange for a 30-second reel.",
    endTime: "2026-02-20T18:30:00",
    image: "https://ouch-cdn2.icons8.com/qE-7H-H0X0-Q_P_S_Y_S_T_Y_L_E.png",
    bgColor: "bg-[#F7F0FF]",
  },
  {
    id: 4,
    title: "Gaming Setup",
    desc: "Upgrade your stream with the latest peripherals from top tech brands.",
    endTime: "2026-02-28T00:00:00",
    image: "https://ouch-cdn2.icons8.com/Z4-L_U_V_Y_S_T_Y_L_E_G_A_M.png",
    bgColor: "bg-[#F0FFF4]",
  },
  {
    id: 5,
    title: "Foodie Tours",
    desc: "Review the best bistros in town and get paid for your content.",
    endTime: "2026-02-12T15:00:00",
    image: "https://ouch-cdn2.icons8.com/v8-T_U_V_Y_S_T_Y_L_E_F_O_O.png",
    bgColor: "bg-[#FFF9F0]",
  },
];

/**
 * 3. Individual Slide Component
 */
const DealSlide = ({ deal }) => {
  const { h, m, s } = useCountdown(deal.endTime);

  return (
    <div
      className={`relative w-full ${deal.bgColor} rounded-[40px] p-8 overflow-hidden min-h-[220px]`}
    >
      <div className="relative z-10 max-w-[65%]">
        <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-wider">
          Deal Of The Day
        </p>
        <h2 className="text-2xl font-black text-slate-900 mt-1 leading-tight">
          {deal.title}
        </h2>
        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed line-clamp-2 font-medium">
          {deal.desc}
        </p>

        {/* Timer UI */}
        <div className="flex items-center gap-2 mt-4 font-black text-slate-900 text-xl">
          <span className="w-8">{h}</span>
          <span>:</span>
          <span className="w-8">{m}</span>
          <span>:</span>
          {/* Rolling Number Container */}
          <div className="relative h-7 w-8 overflow-hidden bg-white px-1 rounded flex justify-center text-[#F6339A] shadow-sm">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={s}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -24, opacity: 0 }}
                transition={{ duration: 0.3, ease: "circOut" }}
                className="absolute"
              >
                {s}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <button className="mt-5 bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-[10px] font-black px-6 py-3 rounded-full shadow-lg shadow-pink-200 active:scale-95 transition-transform uppercase tracking-tighter">
          Apply for campaign
        </button>
      </div>

      {/* Character Image */}
      <img
        src={deal.image}
        className="absolute right-[-10px] bottom-0 w-[50%] h-auto object-contain z-0 pointer-events-none drop-shadow-xl"
        alt="Promotion"
      />
    </div>
  );
};

/**
 * 4. Main Exported Component
 */
export default function CounterBanner() {
  const [api, setApi] = useState();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full px-6 py-4">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
        <CarouselContent>
          {dealsData.map((deal) => (
            <CarouselItem key={deal.id}>
              <DealSlide deal={deal} />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom Pagination Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {dealsData.map((_, index) => (
            <div
              key={index}
              className={`transition-all duration-300 rounded-full h-1.5 ${
                current === index ? "w-6 bg-[#F6339A]" : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
