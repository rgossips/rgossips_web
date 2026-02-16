"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Image from "next/image";

/**
 * 1. Updated Dummy Data with STABLE Images
 */
const dealsData = [
  {
    id: 1,
    title: "Beauty & Wellness",
    desc: "Partner with premium skincare brands. 50+ campaigns active now.",
    endTime: "2026-02-28T23:59:59",
    // New high-stability beauty link
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800",
    bgColor: "bg-[#FFF0F7]",
  },
  {
    id: 2,
    title: "Luxury Travel",
    desc: "Global hotel chains seeking lifestyle creators for summer stays.",
    endTime: "2026-03-05T12:00:00",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
    bgColor: "bg-[#F0F7FF]",
  },
  {
    id: 3,
    title: "Tech & Gadgets",
    desc: "Review the latest noise-canceling headphones and smartwatches.",
    endTime: "2026-02-28T18:30:00",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800",
    bgColor: "bg-[#F7F0FF]",
  },
];

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

const DealSlide = ({ deal }) => {
  const { h, m, s } = useCountdown(deal.endTime);

  return (
    <div
      className={`relative w-full ${deal.bgColor} rounded-[40px] p-8 md:p-12 overflow-hidden min-h-[300px]`}
    >
      <div className="relative z-10 max-w-[60%]">
        <p className="text-[10px] font-black text-slate-400 uppercase italic tracking-wider">
          Deal Of The Day
        </p>
        <h2 className="text-3xl font-black text-slate-900 mt-1 leading-tight tracking-tight">
          {deal.title}
        </h2>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed font-medium line-clamp-2">
          {deal.desc}
        </p>

        <div className="flex items-center gap-2 mt-6 font-black text-slate-900 text-2xl tabular-nums">
          <span className="w-10">{h}</span>
          <span>:</span>
          <span className="w-10">{m}</span>
          <span>:</span>
          <div className="relative h-10 w-12 overflow-hidden bg-white rounded-xl flex justify-center items-center text-[#F6339A] shadow-inner border border-slate-100">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={s}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute"
              >
                {s}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <button className="mt-8 bg-gradient-to-r from-[#8E2DE2] to-[#F6339A] text-white text-xs font-black px-10 py-4 rounded-full shadow-lg shadow-pink-100 hover:brightness-110 active:scale-95 transition-all uppercase tracking-tight">
          Apply Now
        </button>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-[45%] h-full">
        <Image
          src={deal.image}
          fill
          className="object-cover rounded-r-[40px]"
          alt={deal.title}
          priority
          sizes="50vw"
        />
        {/* Gradient Mask to blend image into background */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-${deal.bgColor.replace("bg-", "")} via-transparent to-transparent w-32`}
        />
      </div>
    </div>
  );
};

export default function CounterBanner() {
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className="w-full px-4 py-8 max-w-6xl mx-auto">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start" }}
        className="w-full"
      >
        <CarouselContent>
          {dealsData.map((deal) => (
            // FIX: Added basis-full to make slide take up more room
            // Using basis-[100%] to ensure one slide per view for impact
            <CarouselItem key={deal.id} className="basis-full">
              <div className="p-1">
                {" "}
                {/* Tiny padding for focus ring/shadow visibility */}
                <DealSlide deal={deal} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* DOTS */}
        <div className="flex justify-center gap-3 mt-6">
          {dealsData.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full h-2 ${
                current === index ? "w-10 bg-[#F6339A]" : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </Carousel>
    </div>
  );
}
