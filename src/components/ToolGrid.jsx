"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Brain,
  LayoutDashboard,
  ShieldCheck,
  LineChart,
  Sparkles,
  UserCheck,
  FileText,
  Globe,
} from "lucide-react";

const tools = [
  {
    title: "AI-Powered Creator Discovery",
    description:
      "Smart algorithms match you with the perfect influencers based on your campaign goals.",
    icon: <Brain className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Campaign Management Dashboard",
    description:
      "Manage all your campaigns from one intuitive dashboard with real-time updates.",
    icon: <LayoutDashboard className="w-6 h-6 text-indigo-600" />,
  },

  {
    title: "Live Performance Analytics",
    description:
      "Track engagement, reach, clicks, and conversions in real-time dashboards.",
    icon: <LineChart className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "AI Content Creation Suite",
    description:
      "Generate captions, hashtags, and content ideas with AI assistance.",
    icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Verified Profiles & Fraud Detection",
    description:
      "All influencers are verified to protect you from fake followers and fraud.",
    icon: <UserCheck className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Digital Contracts & Agreements",
    description:
      "Legally binding contracts with e-signatures for secure collaborations.",
    icon: <FileText className="w-6 h-6 text-indigo-600" />,
  },
  {
    title: "Multi-Platform Support",
    description:
      "Manage campaigns across Instagram, YouTube, Twitter, and more from one place.",
    icon: <Globe className="w-6 h-6 text-indigo-600" />,
  },
];

// Animation variants for the container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Time between each card animation
    },
  },
};

// Animation variants for individual cards
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function ToolGrid() {
  return (
    <section className="py-20 bg-white w-full">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4"
          >
            Every Tool You Need. Nothing You Don't.
          </motion.h2>
        </div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {tools.map((tool, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="p-8 rounded-[24px] border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group cursor-default"
            >
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:bg-indigo-100 transition-colors">
                {tool.icon}
              </div>

              {/* Text Content */}
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {tool.title}
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm md:text-base">
                {tool.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
