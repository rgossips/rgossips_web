"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import img from "@/assets/bg1.png";

export default function BottomHero() {
  return (
    <section
      style={{
        backgroundImage: `url(${img.src})`,
        objectFit: "cover",
        backgroundPosition: "center",
      }}
      className="relative min-h-[600px] w-full flex flex-col items-center justify-center overflow-hidden px-4 py-24 text-center"
    >
      {/* Background Gradient / Glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#3a1c71_0%,transparent_50%)] opacity-40" />

      {/* Subtle Star/Particle Effect Simulation */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 3}px`,
              height: `${Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6"
        >
          Ready to Make Influencer <br /> Marketing Work For You?
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
        >
          Join 200,000+ creators and 5,000+ brands already growing on RGossips.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button className="h-14 px-8 text-lg font-medium bg-[#ff4d5a] hover:bg-[#e64551] text-white rounded-xl transition-all hover:scale-105">
            Start for Free — No Credit Card Needed
          </Button>

          <Button
            variant="outline"
            className="h-14 px-8 text-lg font-medium bg-white text-[#3a1c71] hover:bg-gray-100 rounded-xl transition-all hover:scale-105"
          >
            Join as a Creator
          </Button>
        </motion.div>

        {/* Secondary CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-8"
        >
          <button className="px-6 py-3 text-sm font-medium text-gray-400 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
            Book a Live Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}
