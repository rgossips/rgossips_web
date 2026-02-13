"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Instagram,
  Youtube,
  Smartphone,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export function ApplyCampaignForm({ onClose, campaignData }) {
  const [formData, setFormData] = useState({
    selectedPlatforms: [],
    selectedReels: [],
    message: "",
    selectedDeliverables: [],
    agreeToTerms: false,
  });

  const handlePlatformToggle = (platform) => {
    setFormData((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }));
  };

  const handleReelToggle = (reelId) => {
    setFormData((prev) => ({
      ...prev,
      selectedReels: prev.selectedReels.includes(reelId)
        ? prev.selectedReels.filter((r) => r !== reelId)
        : [...prev.selectedReels, reelId],
    }));
  };

  const handleDeliverableToggle = (deliverable) => {
    setFormData((prev) => ({
      ...prev,
      selectedDeliverables: prev.selectedDeliverables.includes(deliverable)
        ? prev.selectedDeliverables.filter((d) => d !== deliverable)
        : [...prev.selectedDeliverables, deliverable],
    }));
  };

  const handleSubmit = () => {
    console.log("Applying for campaign with:", formData);
    // TODO: Send form data to backend
    onClose();
  };

  const isFormValid =
    formData.selectedPlatforms.length > 0 &&
    formData.selectedReels.length > 0 &&
    formData.message.trim() &&
    formData.selectedDeliverables.length > 0 &&
    formData.agreeToTerms;

  return (
    <>
      {/* Dark Overlay - Desktop Only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="hidden lg:block fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />

      {/* Form Modal */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[90%] lg:max-w-2xl lg:max-h-[90vh] lg:rounded-xl bg-white flex flex-col overflow-y-auto scrollbar-hide mb-16 lg:mb-0 lg:shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 flex items-center gap-4 border-b border-slate-50 sticky top-0 bg-white z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#FFEBF5] flex items-center justify-center text-[#E60076]"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-bold text-slate-800">
            Apply for Campaign
          </h2>
        </div>

        {/* Form Content */}
        <div className="flex-1 p-6 space-y-8">
          {/* Campaign Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#B38B59] rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              {campaignData?.initials || "SB"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {campaignData?.title || "Summer Collection Launch"}
              </h3>
              <p className="text-xs text-slate-400">
                {campaignData?.brandName || "StyleBrand Co."}
              </p>
            </div>
          </div>

          {/* Select Platform */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Select Platform *
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Instagram", icon: <Instagram size={20} /> },
                { label: "YouTube", icon: <Youtube size={20} /> },
                { label: "TikTok", icon: <Smartphone size={20} /> },
              ].map((platform) => (
                <button
                  key={platform.label}
                  onClick={() => handlePlatformToggle(platform.label)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    formData.selectedPlatforms.includes(platform.label)
                      ? "border-[#E60076] bg-pink-50"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      formData.selectedPlatforms.includes(platform.label)
                        ? "bg-[#E60076] text-white"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {platform.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">
                    {platform.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Portfolio Reels */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Portfolio Reels *
              </h3>
              <button className="text-xs font-bold text-[#E60076] hover:underline">
                + Add New
              </button>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: 1,
                  title: "Summer Fashion Haul",
                  image:
                    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
                },
                {
                  id: 2,
                  title: "Summer Fashion Haul",
                  image:
                    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80",
                },
                {
                  id: 3,
                  title: "Website Essentials",
                  image:
                    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80",
                },
              ].map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => handleReelToggle(reel.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.selectedReels.includes(reel.id)
                      ? "border-[#E60076] bg-pink-50"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={reel.image}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {reel.title}
                    </p>
                    <p className="text-xs text-slate-400">1 min 30 sec</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.selectedReels.includes(reel.id)
                        ? "bg-[#E60076] border-[#E60076]"
                        : "border-slate-200"
                    }`}
                  >
                    {formData.selectedReels.includes(reel.id) && (
                      <Check size={14} className="text-white" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Message to Brand */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">
              Message to Brand *
            </h3>
            <textarea
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Tell the brand why you're a good fit for this campaign"
              className="w-full h-24 p-4 border border-slate-100 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E60076]/20 resize-none"
            />
            <p className="text-[10px] text-slate-400">Min 50 characters</p>
          </section>

          {/* Deliverables */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Deliverables *</h3>
            <div className="space-y-3">
              {[
                "Product Mission Post",
                "Unboxing Reel",
                "How-to Tutorial",
                "Story Highlights",
              ].map((deliverable) => (
                <label
                  key={deliverable}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={formData.selectedDeliverables.includes(
                      deliverable,
                    )}
                    onCheckedChange={() => handleDeliverableToggle(deliverable)}
                    className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-[#E60076] data-[state=checked]:border-[#E60076]"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {deliverable}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Agreement */}
          <section className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, agreeToTerms: checked }))
                }
                className="w-5 h-5 rounded-lg border-slate-300 data-[state=checked]:bg-[#E60076] data-[state=checked]:border-[#E60076] mt-0.5 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-bold text-slate-800">
                  I accept the Terms & Conditions
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  I understand all of guidelines comply to original and maintain
                  quality of promotion
                </p>
              </div>
            </label>
          </section>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-14 rounded-xl border-slate-100 font-bold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="flex-1 h-14 rounded-xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Application
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
