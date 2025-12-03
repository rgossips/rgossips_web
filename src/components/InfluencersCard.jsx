"use client";
import React from "react";
import { motion } from "framer-motion";

const InfluencersCard = ({ influencer, index }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.07 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className={`h-64 aspect-square rounded-3xl overflow-hidden relative
        ${index % 2 === 0 ? "lg:mb-12" : "lg:mt-12"}
      `}
      style={{
        backgroundImage: `url(${influencer.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      {/* Content */}
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <h3 className="text-xl font-semibold">{influencer.name}</h3>
        <p className="text-sm text-gray-300">@{influencer.username}</p>

        <div className="flex items-center justify-between mt-2">
          <p className="text-sm">{influencer.followers} Followers</p>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {influencer.country}
          </span>
        </div>

        {/* View Details Button */}
        <button className="mt-4 cursor-pointer w-full py-2 bg-white/20 backdrop-blur-md text-white font-medium rounded-xl hover:bg-white/30 transition">
          View Details
        </button>
      </div>
    </motion.div>
  );
};

export default InfluencersCard;
