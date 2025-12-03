"use client";

import React from "react";
import { motion } from "framer-motion";

const showcaseData = [
  {
    src: "https://www.pexels.com/download/video/9401757/",
    title: "Innovative Designs",
    desc: "Crafting visuals that speak louder than words.",
    layout: "large",
  },
  {
    src: "https://www.pexels.com/download/video/8941267/",
    title: "Creative Minds",
    desc: "Collaboration meets imagination.",
  },
  {
    src: "https://www.pexels.com/download/video/7482037/",
    title: "Modern Approach",
    desc: "Blending art with technology.",
  },
  {
    src: "https://www.pexels.com/download/video/6617464/",
    title: "Global Reach",
    desc: "Delivering impact worldwide.",
  },
];

export default function ShowcaseSection() {
  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
      {/* Left Large Video */}
      <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[90vh] overflow-hidden">
        <HoverVideo
          item={showcaseData[0]}
          titleClass="text-2xl sm:text-3xl lg:text-4xl"
          descClass="text-sm sm:text-base"
        />
      </div>

      {/* Right Grid */}
      <div className="grid grid-rows-2 h-auto lg:h-[90vh]">
        {/* Top two videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {showcaseData.slice(1, 3).map((item, i) => (
            <div
              key={i}
              className="relative w-full h-[40vh] sm:h-[35vh] lg:h-[45vh] overflow-hidden"
            >
              <HoverVideo
                item={item}
                titleClass="text-lg sm:text-xl"
                descClass="text-xs sm:text-sm"
              />
            </div>
          ))}
        </div>

        {/* Bottom full-width video */}
        <div className="relative w-full h-[40vh] sm:h-[35vh] lg:h-[45vh] overflow-hidden">
          <HoverVideo
            item={showcaseData[3]}
            titleClass="text-lg sm:text-xl"
            descClass="text-xs sm:text-sm"
          />
        </div>
      </div>
    </section>
  );
}

/* 🧩 Reusable hoverable video block */
function HoverVideo({ item, titleClass = "", descClass = "" }) {
  return (
    <motion.div
      className="relative w-full h-full"
      whileHover="hover"
      initial="rest"
      animate="rest"
    >
      {/* 🎥 Background Video */}
      <motion.video
        key={item.src}
        src={item.src}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.05 },
        }}
        transition={{ duration: 0.6 }}
        onMouseEnter={(e) => e.currentTarget.pause()}
        onMouseLeave={(e) => e.currentTarget.play()}
      />

      {/* Overlay with Text */}
      <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-5 sm:p-8 text-white">
        <h3 className={`font-semibold ${titleClass}`}>{item.title}</h3>
        <motion.p
          variants={{
            rest: { opacity: 0, y: 10 },
            hover: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
          className={`text-gray-200 mt-2 ${descClass}`}
        >
          {item.desc}
        </motion.p>
      </div>
    </motion.div>
  );
}
