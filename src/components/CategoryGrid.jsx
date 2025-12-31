"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shirt,
  Smartphone,
  Plane,
  Coffee,
  Dumbbell,
  Clapperboard,
  ChevronRight,
} from "lucide-react";

const categories = [
  {
    name: "Fashion & Beauty",
    count: "12,500+",
    icon: <Shirt className="w-6 h-6" />,
    color: "bg-[#FF2D78]", // Vibrant Pink
  },
  {
    name: "Technology",
    count: "8,300+",
    icon: <Smartphone className="w-6 h-6" />,
    color: "bg-[#00A3FF]", // Bright Blue
  },
  {
    name: "Travel & Lifestyle",
    count: "15,200+",
    icon: <Plane className="w-6 h-6" />,
    color: "bg-[#9810FA]", // Brand Purple
  },
  {
    name: "Food & Beverage",
    count: "9,800+",
    icon: <Coffee className="w-6 h-6" />,
    color: "bg-[#FF8A00]", // Warm Orange
  },
  {
    name: "Fitness & Health",
    count: "11,400+",
    icon: <Dumbbell className="w-6 h-6" />,
    color: "bg-[#00D1FF]", // Cyan
  },
  {
    name: "Entertainment",
    count: "13,600+",
    icon: <Clapperboard className="w-6 h-6" />,
    color: "bg-[#F53D3D]", // Red
  },
];

const CategoryGrid = () => {
  return (
    <section className="w-full py-24 bg-[#fcfdff]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Header Section */}
        <div className="space-y-4 mb-16">
          <Badge className="bg-purple-50 text-purple-600 border-purple-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Categories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            Influencers Across{" "}
            <span className="bg-gradient-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Find creators in your niche with verified audiences and proven track
            records
          </p>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((cat, idx) => (
            <motion.div
              key={idx}
              whileHover={{
                y: -8,
                shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
              }}
              className="group p-10 bg-white border border-slate-100 rounded-[2.5rem] flex flex-col items-center transition-all cursor-pointer shadow-sm"
            >
              {/* Icon Container */}
              <div
                className={`${cat.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-inherit/20`}
              >
                {cat.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {cat.name}
              </h3>
              <p className="text-slate-400 font-bold text-sm mb-4">
                {cat.count} Influencers
              </p>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 font-bold text-sm transition-colors">
                Explore <ChevronRight size={16} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Text & Action */}
        <div className="space-y-8">
          <p className="text-slate-500 font-medium">
            Can&apos;t find your niche? We have influencers in 50+ categories
          </p>
          <Button className="h-14 cursor-pointer px-10 bg-linear-to-r from-[#155DFC] to-[#9810FA] text-white rounded-2xl text-lg font-bold shadow-xl shadow-blue-200 hover:opacity-90 transition-all">
            Browse All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
