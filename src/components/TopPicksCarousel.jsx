"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MapPin, DollarSign, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const CATEGORIES = ["All", "Beauty", "Travel", "Tech", "Fashion", "Food"];

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=600",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600",
];

export default function RecommendedCampaigns() {
  const [activeTab, setActiveTab] = useState("All");
  const [offers, setOffers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: "{}",
        });
        const data = await res.json();
        if (data?.campaigns) {
          const active = data.campaigns.filter((c) => c.status === "Active").slice(0, 6);
          setOffers(active.map((c, i) => ({
            id: c.id,
            imageUrl: PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
            category: c.tags?.[0]?.split(" ")?.[0] || "General",
            badge: c.daysLeft && parseInt(c.daysLeft) <= 7 ? "Ending Soon" : "Active",
            match: "",
            brand: c.brandName,
            title: c.title,
            location: c.location || "Pan India",
            desc: c.description?.slice(0, 80) || "Apply to collaborate with this brand.",
            pay: c.budget,
            req: c.deliverables || "Not specified",
          })));
        }
      } catch (err) {
        console.error("Failed to fetch campaigns:", err);
      }
    };
    fetchCampaigns();
  }, []);

  const filteredOffers = activeTab === "All"
    ? offers
    : offers.filter((o) => o.category.toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <section className="w-full py-10 px-6 lg:px-12 bg-white">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Recommended Campaigns
          </h2>
          <p className="text-sm text-slate-400 font-medium">
            Opportunities matched to your creator profile
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          {CATEGORIES.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 cursor-pointer rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={() => router.push("/influencer/campaigns")}
            className="text-[#D61F69] cursor-pointer text-xs font-bold px-4 hover:underline"
          >
            View All ›
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOffers.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Image Section */}
            <div className="relative h-60 w-full p-4">
              <div className="relative h-full w-full rounded-4xl overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Overlay Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-white/90 backdrop-blur-md text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                    {item.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="bg-slate-900/80 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />{" "}
                    {item.badge}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-[#22C55E] text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg">
                    {item.match}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-8 flex flex-col flex-1">
              <div className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center text-[10px] font-bold text-pink-600">
                      {item.brand[0]}
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {item.brand} •
                    </span>
                    <div className="flex items-center text-slate-400 gap-0.5">
                      <MapPin size={10} />
                      <span className="text-[10px] font-bold">
                        {item.location}
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-[#D61F69] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Pay & Req Boxes */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <DollarSign size={10} className="text-green-500" /> Pay
                  </p>
                  <p className="text-xs font-black text-slate-800">
                    {item.pay}
                  </p>
                </div>
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                    <Users size={10} className="text-blue-500" /> Req
                  </p>
                  <p className="text-xs font-black text-slate-800">
                    {item.req}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => router.push(`/influencer/offers/${item.id}`)}
                  className="flex-1 cursor-pointer text-white text-xs font-black py-4 rounded-2xl shadow-lg shadow-pink-100 hover:shadow-pink-200 hover:scale-[1.02] transition-all"
                  style={{ background: "linear-gradient(to right, #8E2DE2, #F6339A)" }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
