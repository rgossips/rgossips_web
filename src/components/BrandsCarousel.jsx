"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

import gucci from "@/assets/brands/gucci.png";
import burberry from "@/assets/brands/burberry.png";
import channel from "@/assets/brands/channel.png";
import louisVitton from "@/assets/brands/louisVitton.png";
import puma from "@/assets/brands/puma.png";
import rolex from "@/assets/brands/rolex.png";
import tommyHilfiger from "@/assets/brands/tommyHilfiger.png";
import versace from "@/assets/brands/versace.png";

// base array
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

// duplicated *once* outside render
const duplicated = [...baseBrands, ...baseBrands];

const BrandsCarousel = () => {
  // Memoize children so Framer Motion never detects "changes"
  const items = useMemo(() => duplicated, []);

  return (
    <section className="w-full py-10 bg-[#060606] overflow-hidden">
      <div className="text-center mb-6">
        <h2 className="text-5xl font-semibold text-white">
          Our Trusted Brands
        </h2>
      </div>

      <div className="flex flex-col gap-14">
        {/* TOP ROW – left to right */}
        <motion.div
          className="flex gap-10 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {items.map((src, i) => (
            <BrandCard key={`top-${i}`} src={src} i={i} />
          ))}
        </motion.div>

        {/* BOTTOM ROW – right to left */}
        <motion.div
          className="flex gap-10 w-max"
          animate={{ x: ["-50%", "0%"] }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {items.map((src, i) => (
            <BrandCard key={`bottom-${i}`} src={src} i={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const BrandCard = ({ src, i }) => (
  <Card className="w-48 h-48 flex items-center justify-center bg-white dark:bg-gray-800 shadow-sm">
    <CardContent className="p-4">
      <Image
        src={src}
        alt={`brand-${i}`}
        width={100}
        height={100}
        className="object-contain w-full h-full grayscale transition-all"
      />
    </CardContent>
  </Card>
);

export default BrandsCarousel;
