"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import one from "@/assets/login/BrandMessageCard.png";
import two from "@/assets/login/DiscoverCampaignsCard.png";
import three from "@/assets/login/CreatorWalletCard.png";
import four from "@/assets/login/TodayCollaborationCard.png";

const slides = [
  {
    title: "Chat, Negotiate, Close Deals",
    description:
      "Directly connect with brands, negotiate deliverables, and finalize collaborations in minutes.",
    image: one,
  },
  {
    title: "Find Campaigns That Fit You",
    description:
      "Explore brand deals tailored to your niche, audience, and engagement style.",
    image: two,
  },
  {
    title: "Get Paid Securely & On Time",
    description:
      "Track invoices, receive payments, and manage your earnings with transparency.",
    image: three,
  },
  {
    title: "Ready to Start?",
    description:
      "Join thousands of creators managing their business efficiently.",
    image: four,
  },
];

const OnboardingCarousel = ({ onLoginClick, onSignUpClick }) => {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
  };

  const skipToLast = () => {
    setCurrent(slides.length - 1);
  };

  return (
    <div className="relative flex flex-col items-center justify-between h-full w-full bg-white overflow-hidden">
      {/* 1. The Exact Gradient from Image */}
      <div className="absolute top-0 left-0 w-full h-[60%] pointer-events-none bg-linear-to-b from-[#FA288A] to-[#FFFFFF]" />

      {/* 2. Top Content (Image/Cards) */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full pt-20">
        <div className="relative h-[320px] w-full px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full">
                <Image
                  src={slides[current].image}
                  alt={slides[current].title}
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Bottom Content (Text & UI) */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 pb-12 w-full max-w-md">
        {/* Text Section */}
        <div className="mb-6 space-y-3">
          <h2 className="text-[26px] font-bold text-[#0F172A] leading-tight">
            {slides[current].title}
          </h2>
          <p className="text-slate-500 text-[15px] leading-relaxed px-4">
            {slides[current].description}
          </p>
        </div>

        {/* Progress Indicators (Pill shape) */}
        <div className="flex gap-1.5 mb-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                current === i ? "w-8 bg-[#FA288A]" : "w-4 bg-[#E2E8F0]"
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {current < slides.length - 1 ? (
            <>
              <Button
                onClick={nextSlide}
                className="w-full cursor-pointer btn-purple h-[58px] text-lg font-semibold rounded-[20px] shadow-lg shadow-purple-100 transition-all active:scale-[0.98]"
              >
                Next
              </Button>
              <Button
                variant="outline"
                onClick={skipToLast}
                className="w-full cursor-pointer border-[#FA288A] text-[#FA288A] hover:bg-purple-50 h-[58px] text-lg font-semibold rounded-[20px] border-[1.5px]"
              >
                Skip
              </Button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-3"
            >
              {/* Note: md:hidden ensures these only show on mobile per your requirement */}
              <div className="md:hidden flex flex-col gap-3">
                <Button
                  onClick={onLoginClick}
                  className="w-full btn-purple h-[58px] rounded-[20px] text-lg font-semibold shadow-lg shadow-purple-100"
                >
                  Sign In
                </Button>
                <Button
                  onClick={onSignUpClick}
                  variant="outline"
                  className="w-full border-[#FA288A] h-[58px] rounded-[20px] text-lg font-semibold border-[1.5px] text-[#FA288A]"
                >
                  Sign Up
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
