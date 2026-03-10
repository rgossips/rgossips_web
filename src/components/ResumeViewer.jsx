"use client";

import { motion } from "framer-motion";
import { PDFViewer } from "@react-pdf/renderer";
import ResumeTemplate from "./ResumeTemplate";

export default function ResumeViewer() {
  // dummy data for now
  const data = {
    name: "Rohan Sharma",
    handle: "rohanbuilds",
    niche: "Tech Creator",

    followers: "145K",
    engagement: "6.2%",

    avgReelViews: "180K",
    bestReelViews: "620K",
    watchCompletion: 48,

    avgLikes: "8.4K",
    avgComments: "320",
    avgSaves: "1.1K",

    primaryCountry: "India",

    audience: [
      { country: "India", percent: 45 },
      { country: "USA", percent: 25 },
      { country: "UK", percent: 10 },
    ],

    gender: {
      male: 60,
      female: 38,
    },

    topics: [
      "AI tools",
      "Startup building",
      "Productivity apps",
      "Developer tools",
    ],

    brandFit: ["SaaS Tools", "AI Platforms", "Developer Products"],

    collabs: ["Notion", "Figma", "NordVPN"],

    topPosts: [
      { title: "Best AI tools for creators", views: "620K" },
      { title: "Building a startup in 2025", views: "410K" },
    ],

    estimatedReach: "120K",
    estimatedEngagement: "7K - 10K",

    summary:
      "Rohan is a technology creator focused on AI tools, startups and productivity software. His audience consists of founders, developers and tech enthusiasts.",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-[1300px] rounded-xl overflow-hidden border border-white/10 shadow-xl"
    >
      <PDFViewer width="100%" height="100%">
        <ResumeTemplate data={data} />
      </PDFViewer>
    </motion.div>
  );
}
