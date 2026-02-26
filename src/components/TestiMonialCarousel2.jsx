"use client";
import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Marketing Head, GlowBeauty",
    content:
      "RGossips helped us find 50+ perfect influencers for our skincare launch in just 2 days. The ROI was 3x better than our agency route.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
  },
  {
    name: "Rahul Mehra",
    role: "Tech Influencer",
    subRole: "250K followers",
    content:
      "Finally, a platform that pays on time! I got my payment within 48 hours of content approval. Game changer for creators.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
  },
  {
    name: "Sneha Patel",
    role: "Founder, EcoStyle",
    content:
      "The AI matching is incredible. We launched 3 campaigns last month and all exceeded our engagement targets. Highly recommend!",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
  },
  {
    name: "Arjun Singh",
    role: "Lifestyle Creator",
    subRole: "180K followers",
    content:
      "I've tried 4 other platforms before RGossips. This is the only one that actually works as promised. Simple, fast, and reliable.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
  },
];

export default function TestimonialCarousel() {
  // We duplicate the array to ensure a seamless infinite loop
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-20 bg-[#F3F0FF] max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900">
          Creators & Brands That Already Love RGossips.
        </h2>
      </div>

      <div className="relative flex w-full">
        {/* The Motion Container */}
        <motion.div
          className="flex gap-6 pr-6"
          animate={{
            x: ["0%", "-50%"], // Moves halfway because the list is duplicated
          }}
          transition={{
            ease: "linear",
            duration: 25, // Adjust speed here (higher = slower)
            repeat: Infinity,
          }}
        >
          {duplicatedTestimonials.map((item, idx) => (
            <TestimonialCard key={idx} item={item} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }) {
  return (
    <div className="w-[350px] md:w-[400px] shrink-0 bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between">
      <div>
        {/* Star Rating */}
        <div className="flex gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={18} fill="#FFC107" color="#FFC107" />
          ))}
        </div>

        {/* Content */}
        <p className="text-slate-700 font-medium leading-relaxed mb-8">
          "{item.content}"
        </p>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <img
            src={item.avatar}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">{item.name}</h4>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">
            {item.role}
          </p>
          {item.subRole && (
            <p className="text-[10px] text-indigo-600 font-bold uppercase">
              {item.subRole}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
