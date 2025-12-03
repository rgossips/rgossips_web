"use client";

import { useState, useEffect, useMemo } from "react";
import InfluencerCard from "./InfluencersCard";

// Hook to detect mobile (<640px)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

const influencers = [
  {
    name: "Chastity Garner",
    country: "USA",
    username: "garnergab",
    followers: "349K",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
  },
  {
    name: "Farhin Hossain",
    country: "Dubai",
    username: "farhiin",
    followers: "103K",
    image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
  },
  {
    name: "Lucky Harmon",
    country: "USA",
    username: "therealluckyharmon",
    followers: "1M",
    image: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
  },
  {
    name: "Nitesh Yadav",
    country: "India",
    username: "nitesh",
    followers: "5.5 M",
    image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
  },
  {
    name: "TM Twins",
    country: "USA",
    username: "tm.twins",
    followers: "1.3M",
    image: "https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg",
  },
  {
    name: "Archana",
    country: "Dubai",
    username: "archana",
    followers: "527K",
    image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg",
  },
  {
    name: "Realtansss",
    country: "Spain",
    username: "realtansss",
    followers: "239K",
    image: "https://images.pexels.com/photos/838875/pexels-photo-838875.jpeg",
  },
  {
    name: "Allen Choudhary",
    country: "India",
    username: "allen",
    followers: "1.3M",
    image: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg",
  },
];

export default function InfluencerGrid() {
  const [showMore, setShowMore] = useState(false);
  const isMobile = useIsMobile();

  // Show all on desktop, slice only on mobile
  const visibleInfluencers = useMemo(() => {
    return isMobile && !showMore ? influencers.slice(0, 3) : influencers;
  }, [isMobile, showMore]);

  return (
    <section className="w-full bg-[#060606] py-16 px-6 flex flex-col items-center">
      {/* Heading */}
      <div className="text-center mb-12">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white">
          Meet Our{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Top Influencers
          </span>
        </h2>
        <p className="text-gray-400 mt-3 max-w-xl mx-auto">
          Discover the most popular creators working with our community.
        </p>
      </div>

      {/* FIXED WIDTH WRAPPER */}
      <div className="w-full md:max-w-[90%] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 place-items-center">
          {visibleInfluencers.map((influencer, index) => (
            <InfluencerCard influencer={influencer} key={index} index={index} />
          ))}
        </div>
      </div>

      {isMobile && !showMore && (
        <button
          className="mt-8 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl backdrop-blur-md hover:bg-white/20 transition"
          onClick={() => setShowMore(true)}
        >
          Show More
        </button>
      )}
    </section>
  );
}
