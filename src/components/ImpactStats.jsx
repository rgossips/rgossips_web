import React from "react";
import { motion } from "framer-motion";

const ImpactStats = () => {
  const stats = [
    { label: "Verified Influencers", value: "50K+" },
    { label: "Active Brands", value: "500+" },
    { label: "States Covered", value: "20+" },
    { label: "Paid to Creators", value: "₹10Cr+" },
    { label: "Avg Campaign Launch", value: "10 Min" },
    { label: "On-Time Payment Rate", value: "98%" },
    { label: "Platform Rating", value: "4.8★" },
    { label: "Avg ROI vs Agency Route", value: "2.4x" },
  ];

  return (
    <section className="bg-[#F3F0FF] py-20 w-full">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 max-w-6xl mx-auto">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-black text-[#6366F1] mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-slate-600 font-medium text-sm md:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactStats;
