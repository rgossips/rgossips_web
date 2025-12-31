"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import gucci from "@/assets/brands/gucci.png";
import burberry from "@/assets/brands/burberry.png";
import channel from "@/assets/brands/channel.png";
import louisVitton from "@/assets/brands/louisVitton.png";
import puma from "@/assets/brands/puma.png";
import rolex from "@/assets/brands/rolex.png";
import tommyHilfiger from "@/assets/brands/tommyHilfiger.png";
import versace from "@/assets/brands/versace.png";

const baseBrands = [
  gucci,
  burberry,
  channel,
  louisVitton,
  puma,
  rolex,
  tommyHilfiger,
  versace,
];

const duplicated = [...baseBrands, ...baseBrands, ...baseBrands];

const BrandsCarousel = () => {
  const items = useMemo(() => duplicated, []);

  const stats = [
    { label: "Brand Partners", value: "500+" },
    { label: "Campaign Value", value: "$50M+" },
    { label: "Satisfaction Rate", value: "98%" },
    { label: "Total Reach", value: "2B+" },
  ];

  return (
    <section className="w-full py-20 bg-[#0a0f1d] overflow-hidden flex flex-col items-center">
      {/* Header Section */}
      <div className="text-center mb-16 px-4">
        <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-900/30 border border-blue-500/30 rounded-full">
          Trusted Partners
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Our Trusted Brands
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Leading global brands trust us for influencer collaborations
        </p>
      </div>

      {/* Carousel Rows */}
      <div className="flex flex-col gap-8 w-full">
        {/* TOP ROW – Left to Right */}
        <motion.div
          className="flex gap-8 w-max"
          animate={{ x: ["0%", "-33.33%"] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {items.map((src, i) => (
            <BrandCard key={`top-${i}`} src={src} />
          ))}
        </motion.div>

        {/* BOTTOM ROW – Right to Left */}
        <motion.div
          className="flex gap-8 w-max ml-[-200px]" // Offset for staggered look
          animate={{ x: ["-33.33%", "0%"] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {items.map((src, i) => (
            <BrandCard key={`bottom-${i}`} src={src} />
          ))}
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mt-24 px-4 w-full max-w-6xl">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center space-y-2">
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              {stat.value}
            </h3>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const BrandCard = ({ src }) => (
  <div className="w-40 h-40 md:w-48 md:h-48 flex items-center justify-center bg-white rounded-2xl shadow-lg transform transition-transform hover:scale-105 duration-300">
    <div className="relative w-3/4 h-3/4">
      <Image
        src={src}
        alt="Brand Logo"
        fill
        className="object-contain grayscale hover:grayscale-0 transition-all duration-500"
      />
    </div>
  </div>
);

export default BrandsCarousel;
