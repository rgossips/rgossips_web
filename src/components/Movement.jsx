"use client";
import React from "react";
import { motion } from "framer-motion";
import { Flame, Handshake, GraduationCap, MessageSquare } from "lucide-react";
import img from "@/assets/bg2.png";

const movementFeatures = [
  {
    title: "Trending Content Insights",
    description:
      "Stay ahead with real-time trends and viral content analysis across all platforms.",
    icon: <Flame className="w-6 h-6 text-[#6C4DFF]" />,
  },
  {
    title: "Creator Collaborations",
    description:
      "Connect and collaborate with other creators to amplify your reach and create magic.",
    icon: <Handshake className="w-6 h-6 text-[#6C4DFF]" />,
  },
  {
    title: "Creator Academy",
    description:
      "Free courses, webinars, and resources to level up your content game and grow faster.",
    icon: <GraduationCap className="w-6 h-6 text-[#6C4DFF]" />,
  },
  {
    title: "Community Forum",
    description:
      "Join thousands of creators sharing tips, success stories, and supporting each other.",
    icon: <MessageSquare className="w-6 h-6 text-[#6C4DFF]" />,
  },
];

export default function MovementSection() {
  return (
    <section
      style={{
        backgroundImage: `url(${img.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      className="relative py-20 overflow-hidden w-full"
    >
      {/* Subtle Glow Radial */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            More Than a Platform. It's a Movement.
          </h2>
          <p className="text-slate-400 text-lg">
            Join India's fastest-growing creator community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {movementFeatures.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-[24px] bg-[#1A1D26] border border-white/5 hover:border-[#6C4DFF]/50 transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {item.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
