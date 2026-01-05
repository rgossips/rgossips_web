"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const platformFeatures = [
  {
    title: "Influencer Discovery",
    description:
      "Find the perfect influencers for your brand with our AI-powered search and advanced filtering system.",
    points: [
      "AI-powered matching algorithm",
      "Advanced filters by niche, audience, location",
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
      "Budget tracking and optimization",
      "Multi-platform campaign support",
    ],
  },
  {
    title: "Performance Analytics",
    description:
      "Track ROI, engagement, and campaign performance with comprehensive real-time analytics.",
    points: [
      "Real-time performance metrics",
      "ROI and conversion tracking",
      "Custom reporting dashboards",
      "Competitor benchmarking",
    ],
  },
  {
    title: "Content Collaboration",
    description:
      "Streamline content creation with built-in collaboration tools and approval workflows.",
    points: [
      "Integrated messaging system",
      "Content review and approval",
      "Brand guidelines sharing",
      "Revision management",
    ],
  },
  {
    title: "Payment Processing",
    description:
      "Secure and automated payment system with support for multiple currencies and methods.",
    points: [
      "Automated payment scheduling",
      "Multi-currency support",
      "Secure escrow system",
      "Invoice generation",
    ],
  },
  {
    title: "Relationship Management",
    description:
      "Build and maintain long-term relationships with your influencer network.",
    points: [
      "Influencer database management",
      "Communication history tracking",
      "Performance history",
      "Relationship scoring",
    ],
  },
];

const ProductSuite = () => {
  return (
    <section className="w-full py-24 bg-white" id="features">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Section */}
        <div className="text-center mb-20 space-y-4">
          <Badge className="bg-blue-50 text-blue-600 border-blue-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Complete Product Suite
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
            Our Complete{" "}
            <span className="bg-gradient-to-r from-[#155DFC] via-[#9810FA] to-[#FA1085] bg-clip-text text-transparent">
              Influencer Marketing Platform
            </span>
          </h2>
          <p className="text-slate-500 text-lg max-w-3xl mx-auto font-medium">
            Everything you need to discover, collaborate, and grow with
            influencers. Our platform brings together powerful tools to make
            influencer marketing simple, transparent, and effective for both
            brands and creators.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {platformFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="group bg-slate-50/50 border border-slate-100 rounded-[2.5rem] overflow-hidden flex flex-col hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
            >
              {/* Visual Placeholder (Top) */}
              <div className="h-48 bg-gradient-to-br from-slate-100 to-white border-b border-slate-100 flex items-center justify-center overflow-hidden">
                <div className="w-2/3 h-2/3 rounded-2xl bg-white shadow-inner border border-slate-50 relative flex items-center justify-center">
                  {/* Interior visual decorations */}
                  <div className="absolute top-4 left-4 w-8 h-1 bg-slate-100 rounded-full" />
                  <div className="absolute top-8 left-4 w-12 h-1 bg-slate-100 rounded-full" />
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
              </div>

              {/* Content (Bottom) */}
              <div className="p-8 flex flex-col flex-grow space-y-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {feature.description}
                </p>

                {/* Bullet Points */}
                <ul className="space-y-3 pt-2 flex-grow">
                  {feature.points.map((point, pIdx) => (
                    <li
                      key={pIdx}
                      className="flex items-center gap-3 text-slate-600 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>

                {/* Learn More Button */}
                <Button
                  variant="ghost"
                  className="cursor-pointer w-full mt-6 h-12 bg-linear-to-r from-[#155DFC] to-[#9810FA] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/10"
                >
                  Learn More
                  <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSuite;
