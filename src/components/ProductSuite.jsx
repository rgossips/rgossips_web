"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const platformFeatures = [
  {
    title: "Influencer Discovery",
    description:
      "Find the perfect influencers for your brand with our AI-powered search and advanced filtering system.",
    points: [
      "AI-powered matching algorithm",
      "Advanced filters by niche",
      "Real-time audience analytics",
      "Verified influencer profiles",
    ],
  },
  {
    title: "Campaign Management",
    description:
      "Launch, manage, and optimize your influencer campaigns from a single, intuitive dashboard.",
    points: [
      "End-to-end campaign workflow",
      "Automated content approval",
      "Budget tracking",
      "Multi-platform support",
    ],
  },
  {
    title: "Performance Analytics",
    description:
      "Track ROI, engagement, and campaign performance with comprehensive real-time analytics.",
    points: [
      "Real-time performance metrics",
      "ROI tracking",
      "Custom reporting",
      "Competitor benchmarking",
    ],
  },
  {
    title: "Content Collaboration",
    description:
      "Streamline creation with built-in collaboration tools and approval workflows.",
    points: [
      "Integrated messaging",
      "Content review",
      "Brand guidelines",
      "Revision management",
    ],
  },
  {
    title: "Payment Processing",
    description:
      "Secure and automated payment system with support for multiple currencies.",
    points: [
      "Automated scheduling",
      "Multi-currency support",
      "Secure escrow",
      "Invoice generation",
    ],
  },
  {
    title: "Relationship Management",
    description:
      "Build and maintain long-term relationships with your influencer network.",
    points: [
      "Influencer database",
      "Communication history",
      "Performance history",
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
                {/* Visual Placeholder (Grey Top) */}
                <div className="h-64 bg-slate-50/80 rounded-t-[3rem] flex items-center justify-center p-8">
                  <div className="w-full h-full rounded-2xl bg-white/50 border border-white shadow-sm" />
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
