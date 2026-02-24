"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge"; // Ensure this path is correct
import { FaArrowRight, FaVenus, FaRocket, FaClock } from "react-icons/fa";
import { AnimatePresence } from "framer-motion";
import { ApplyCampaignForm } from "./ApplyCampaignForm";

const BrandForms = () => {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const collaborationOffers = [
    {
      id: 1,
      title: "D Wellness Barter Collab",
      tag: "Health & Wellness",
      description:
        "Exclusive health & wellness product campaign for female creators. Get approx. ₹2,500 worth of premium products.",
      requirements: [
        "Female Only",
        "1k+ Followers",
        "Face Required (No UGC/Faceless)",
      ],
      timeline: "Immediate",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      id: 2,
      title: "Recent Gossips Creator Roster",
      tag: "Community Join",
      description:
        "Join our core network. Get access to paid deals from brands like Garnier, Lakmé, Nykaa, and Mentos.",
      requirements: ["All Niches", "Growth Focused", "Portfolio Ready"],
      timeline: "Ongoing",
      gradient: "from-blue-600 to-purple-600",
    },
  ];

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* Header Section */}
        <div className="space-y-4 mb-16">
          <Badge className="bg-purple-50 text-purple-600 border-purple-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            Collab Alerts
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight text-center">
            Brands Across{" "}
            <span className="bg-gradient-to-r from-[#155DFC] to-[#9810FA] bg-clip-text text-transparent">
              Every Industry
            </span>
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Apply for current campaigns or join our elite creator roster to
            start working with top-tier global brands.
          </p>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {collaborationOffers.map((collab) => (
            <div
              key={collab.id}
              className="group relative bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-br ${collab.gradient} text-white shadow-lg`}
                  >
                    {collab.id === 1 ? (
                      <FaVenus size={24} />
                    ) : (
                      <FaRocket size={24} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                    <FaClock className="text-purple-500" />
                    {collab.timeline}
                  </div>
                </div>

                <Badge className="mb-4 bg-slate-100 text-slate-600 border-none font-bold">
                  {collab.tag}
                </Badge>

                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-purple-600 transition-colors">
                  {collab.title}
                </h3>

                <p className="text-slate-500 leading-relaxed mb-6">
                  {collab.description}
                </p>

                <div className="space-y-3 mb-8">
                  {collab.requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      {req}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedCampaign(collab)}
                className="w-full cursor-pointer flex items-center justify-center gap-2 btn-purple py-4 rounded-2xl font-bold hover:scale-105 transition-all active:scale-95 shadow-lg shadow-slate-200 hover:shadow-purple-200"
              >
                Apply Now <FaArrowRight size={14} />
              </button>
              {/* Bottom Note */}
              <p className="mt-12 text-center text-slate-400 text-sm italic">
                Note: No backouts will be accepted after profile approval. Terms
                apply.
              </p>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedCampaign && (
          <ApplyCampaignForm
            campaignData={selectedCampaign}
            onClose={() => setSelectedCampaign(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default BrandForms;
