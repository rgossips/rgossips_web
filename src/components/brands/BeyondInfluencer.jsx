"use client";

import { Film, Newspaper, Handshake } from "lucide-react";
import { FaFrog } from "react-icons/fa";
import { useRouter } from "next/navigation";

// Mobile counterpart of CategorySection's "Who Are You Looking For?"
// cards (which are desktop-only). B8 — the cards used to be inert
// decoration (cursor-pointer, no handler); each now routes into the
// creator directory, pre-filtered where a matching classification
// exists (creator_type: celebrity / meme_page).
export const BeyondInfluencers = () => {
  const router = useRouter();
  const categories = [
    {
      label: "Celebs & Actors",
      icon: <Film className="text-[#16224E]" size={24} />,
      bgColor: "bg-[#FFF9F1]", // Light orange
      textColor: "text-[#D97706]",
      href: "/brands/search?profileType=celebrity",
    },
    {
      label: "Publishers & Media",
      icon: <Newspaper className="text-[#16224E]" size={24} />,
      bgColor: "bg-[#F1F7FF]", // Light blue
      textColor: "text-[#2563EB]",
      href: "/brands/search",
    },
    {
      label: "Talent Agencies",
      icon: <Handshake className="text-[#16224E]" size={24} />,
      bgColor: "bg-[#F9F5FF]", // Light purple
      textColor: "text-[#9333EA]",
      href: "/brands/search",
    },
    {
      label: "Meme Pages & More",
      icon: <FaFrog className="text-[#16224E]" size={24} />,
      bgColor: "bg-[#F0FDF4]", // Light green
      textColor: "text-[#16A34A]",
      href: "/brands/search?profileType=meme_page",
    },
  ];

  return (
    <section className="w-full lg:hidden px-4 lg:px-6 space-y-6">
      <h2 className="px-6 bx-h2">
        Beyond Influencers
      </h2>

      <div className="grid grid-cols-2 grid-rows-2 gap-3 w-full px-4 lg:px-6">
        {categories.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={() => router.push(item.href)}
            className={`rounded-4xl ${item.bgColor} flex flex-col justify-center gap-4 py-8 px-5 border border-transparent hover:border-[#E4E9F4] transition-all cursor-pointer shadow-sm text-left`}
          >
            {/* Icon Wrapper */}
            <div className="w-10 h-10 flex items-center justify-start">
              {item.icon}
            </div>

            {/* Label */}
            <h3
              className={`font-black text-[15px] leading-tight ${item.textColor}`}
            >
              {item.label}
            </h3>
          </button>
        ))}
      </div>
    </section>
  );
};
