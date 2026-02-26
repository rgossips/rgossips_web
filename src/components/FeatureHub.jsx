import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Zap, MessageCircle, BarChart, CreditCard } from "lucide-react";

const FeatureHub = () => {
  const [activeTab, setActiveTab] = useState("brands");

  const content = {
    brands: [
      {
        icon: <Search />,
        title: "Discover Verified Creators Instantly",
        desc: "Search 200,000+ influencers by niche, platform, engagement rate, and more.",
      },
      {
        icon: <Zap />,
        title: "Launch Campaigns in 5 Steps",
        desc: "Set your brief, budget, and timeline. Go live in under 10 minutes.",
      },
      {
        icon: <MessageCircle />,
        title: "Negotiate & Contract Directly",
        desc: "Chat, negotiate rates, and sign digital contracts all in one place.",
      },
      {
        icon: <BarChart />,
        title: "Track Every Post in Real Time",
        desc: "Live dashboards for views, engagement, clicks, and conversions.",
      },
      {
        icon: <CreditCard />,
        title: "Pay Creators Seamlessly",
        desc: "Escrow-protected payments. 50+ countries supported.",
      },
    ],
    influencers: [
      {
        icon: <Search />,
        title: "Get Discovered by Top Brands",
        desc: "Showcase your portfolio to global brands looking for your specific style.",
      },
      {
        icon: <Zap />,
        title: "Apply to Premium Campaigns",
        desc: "Browse high-paying opportunities and apply with one click.",
      },
      // ... add more for influencers as needed
    ],
  };

  return (
    <section className="py-20 bg-white w-full">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8">
            One Platform. Two Sides. <br /> Infinite Collaborations.
          </h2>

          {/* Toggle Switch */}
          <div className="inline-flex bg-slate-100 p-1.5 rounded-full relative">
            {["brands", "influencers"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative cursor-pointer z-10 px-8 py-2 text-sm font-semibold capitalize transition-colors duration-300 ${
                  activeTab === tab ? "text-indigo-600" : "text-slate-500"
                }`}
              >
                For {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        <motion.div
          layout
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          <AnimatePresence mode="wait">
            {content[activeTab].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="p-8 rounded-[2rem] border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {React.cloneElement(item.icon, { size: 24 })}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureHub;
