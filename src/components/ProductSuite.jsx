"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Brain,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe,
  LayoutDashboard,
  LineChart,
  Sparkles,
  UserCheck,
} from "lucide-react";
import one from "@/assets/home2.png";
import two from "@/assets/home3.png";
import three from "@/assets/home4.png";
import four from "@/assets/home5.png";
import five from "@/assets/home6.png";
import six from "@/assets/home7.png";
import Image from "next/image";

const platformFeatures = [
  {
    title: "AI-Powered Creator Discovery",
    img: one, // Influencer Discovery
    icon: <Brain className="w-6 h-6 text-indigo-600" />,
    description:
      "Smart algorithms match you with the perfect influencers based on your campaign goals using AI-powered search.",
    points: [
      "AI-powered matching algorithm",
      "Advanced filters by niche",
      "Real-time audience analytics",
      "Verified influencer profiles",
    ],
  },
  {
    title: "Campaign Management Dashboard",
    img: three, // Campaign Management
    icon: <LayoutDashboard className="w-6 h-6 text-indigo-600" />,
    description:
      "Manage all your campaigns from one intuitive dashboard with real-time updates and automated workflows.",
    points: [
      "End-to-end campaign workflow",
      "Automated content approval",
      "Budget tracking",
      "Multi-platform support",
    ],
  },
  {
    title: "Multi-Platform Support",
    img: two, // New or extra image if available
    icon: <Globe className="w-6 h-6 text-indigo-600" />,
    description:
      "Manage integrated campaigns across Instagram, YouTube, Twitter, and TikTok from one central place.",
    points: [
      "Cross-platform analytics",
      "Unified messaging inbox",
      "Platform-specific briefs",
      "Global audience reach",
    ],
  },
  {
    title: "AI Content Creation Suite",
    img: four, // Content Collaboration
    icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
    description:
      "Generate captions, hashtags, and content ideas while streamlining review with built-in collaboration tools.",
    points: [
      "Integrated messaging",
      "Content review & approval",
      "AI-assisted brand guidelines",
      "Revision management",
    ],
  },
  {
    title: "Digital Contracts & Payments",
    img: five, // Payment Processing
    icon: <FileText className="w-6 h-6 text-indigo-600" />,
    description:
      "Secure escrow-protected payments and legally binding contracts with e-signatures for safe collaborations.",
    points: [
      "Secure escrow system",
      "Multi-currency support",
      "Automated invoice generation",
      "E-signature integration",
    ],
  },
  {
    title: "Verified Profiles & Fraud Detection",
    img: six, // Relationship Management
    icon: <UserCheck className="w-6 h-6 text-indigo-600" />,
    description:
      "Protect your brand from fake followers. All influencers are verified to ensure authentic relationship building.",
    points: [
      "Influencer database",
      "Communication history",
      "Fake follower detection",
      "Relationship scoring",
    ],
  },
];

const ProductSuite = () => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const lastUpdateRef = useRef(0); // Track last index to prevent jitter

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollInterval = setInterval(() => {
      // 1. Exit conditions
      if (window.innerWidth >= 1024 || isPaused) return;

      const maxScrollLeft =
        scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const currentScroll = scrollContainer.scrollLeft;

      // 2. Calculate Index without triggering re-render every frame
      const cardWidth = scrollContainer.scrollWidth / platformFeatures.length;
      const newIndex = Math.round(currentScroll / cardWidth);

      // 3. ONLY update state if the index actually shifted
      if (newIndex !== lastUpdateRef.current) {
        lastUpdateRef.current = newIndex;
        setActiveIndex(newIndex);
      }

      // 4. Smooth movement
      if (currentScroll >= maxScrollLeft - 2) {
        scrollContainer.scrollTo({ left: 0, behavior: "auto" });
      } else {
        scrollContainer.scrollBy({ left: 1, behavior: "auto" });
      }
    }, 30); // Slightly slower interval for better performance

    return () => clearInterval(scrollInterval);
  }, [isPaused]); // Removed activeIndex from deps - IMPORTANT

  const handleScroll = () => {
    if (scrollRef.current && isPaused) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const cardWidth = scrollRef.current.scrollWidth / platformFeatures.length;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveIndex(index);
      lastUpdateRef.current = index;
    }
  };

  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      const targetIndex =
        index < 0
          ? platformFeatures.length - 1
          : index >= platformFeatures.length
            ? 0
            : index;
      const cardWidth = scrollRef.current.scrollWidth / platformFeatures.length;

      scrollRef.current.scrollTo({
        left: targetIndex * cardWidth,
        behavior: "smooth",
      });
      setActiveIndex(targetIndex);
      lastUpdateRef.current = targetIndex;
    }
  };

  return (
    <section className="w-full py-24 bg-white overflow-hidden" id="features">
      <div className="lg:max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Complete Product Suite
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Our Complete{" "}
            <span className="bg-gradient-to-r from-[#155DFC] via-[#9810FA] to-[#FA1085] bg-clip-text text-transparent">
              Influencer Marketing Platform
            </span>
          </h2>
        </div>

        {/* Feature Grid / Carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 2000)}
            className={`flex lg:grid lg:grid-cols-3 gap-6 overflow-x-auto lg:overflow-visible scrollbar-hide pb-12 -mx-6 px-6 lg:mx-0 lg:px-0 ${
              isPaused ? "snap-x snap-mandatory" : "snap-none"
            }`}
          >
            {platformFeatures.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="group bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col snap-center min-w-[85vw] md:min-w-[400px] lg:min-w-0"
              >
                <div className="h-64 rounded-t-[3rem] flex items-center justify-center">
                  <Image
                    src={feature.img}
                    alt={feature.title}
                    width={300}
                    height={200}
                    className="object-cover h-full w-full rounded-t-[3rem]"
                  />
                </div>

                {/* Content */}
                <div className="p-8 pt-10 flex flex-col flex-grow text-left">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-base leading-relaxed mb-6 font-medium">
                    {feature.description}
                  </p>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {feature.points.map((point, pIdx) => (
                      <li
                        key={pIdx}
                        className="flex items-center gap-3 text-slate-700 font-semibold text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full btn-purple shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full h-14 btn-purple hover:opacity-90 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20">
                    Learn More
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile Navigation Controls */}
          <div className="flex lg:hidden items-center justify-center gap-6 mt-4">
            <button
              onClick={() => scrollToIndex(activeIndex - 1)}
              className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Dots Pagination */}
            <div className="flex gap-2">
              {platformFeatures.map((_, dotIdx) => (
                <div
                  key={dotIdx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === dotIdx
                      ? "w-8 btn-purple"
                      : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => scrollToIndex(activeIndex + 1)}
              className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 active:scale-90 transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductSuite;
