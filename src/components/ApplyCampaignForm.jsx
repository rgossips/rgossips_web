"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Instagram,
  Upload,
} from "lucide-react";

export function ApplyCampaignForm({ onClose, campaignData, onSubmitSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    instagramHandle: "",
    followersCount: "",
    engagementRate: "",
    collaborationLinks: "",
    whyChooseYou: "",
    mediaKit: null,
  });

  const update = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    console.log("Applying for campaign with:", formData);
    if (onSubmitSuccess) onSubmitSuccess();
    else onClose();
  };

  const isFormValid =
    formData.fullName.trim() &&
    formData.email.trim() &&
    formData.instagramHandle.trim();

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-2xl lg:max-h-[90vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-900">
              Apply for Campaign
            </h2>
            <p className="text-[11px] text-slate-400">
              {campaignData?.title || "Campaign"} &middot;{" "}
              {campaignData?.brandName || "Brand"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable Form ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Personal Information */}
          <FormSection title="Personal Information">
            <FormField
              label="Full Name *"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(v) => update("fullName", v)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Email Address *"
                placeholder="you@email.com"
                type="email"
                value={formData.email}
                onChange={(v) => update("email", v)}
              />
              <FormField
                label="Phone Number *"
                placeholder="+91 98765 43210"
                type="tel"
                value={formData.phone}
                onChange={(v) => update("phone", v)}
              />
            </div>
          </FormSection>

          {/* Social Media Profile */}
          <FormSection title="Social Media Profile">
            <FormField
              label="Instagram Handle *"
              placeholder="@username"
              icon={<Instagram size={16} className="text-pink-500" />}
              value={formData.instagramHandle}
              onChange={(v) => update("instagramHandle", v)}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Followers Count *"
                placeholder="50000"
                type="number"
                value={formData.followersCount}
                onChange={(v) => update("followersCount", v)}
              />
              <FormField
                label="Engagement Rate *"
                placeholder="5.2%"
                value={formData.engagementRate}
                onChange={(v) => update("engagementRate", v)}
              />
            </div>
          </FormSection>

          {/* Portfolio & Experience */}
          <FormSection title="Portfolio & Experience">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Previous Collaboration Links
              </label>
              <textarea
                placeholder="Paste links to your best previous brand collaborations..."
                value={formData.collaborationLinks}
                onChange={(e) => update("collaborationLinks", e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 min-h-[80px] outline-none transition-all resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Why should we choose you? *
              </label>
              <textarea
                placeholder="What makes you unique and why is your portfolio fit for this campaign..."
                value={formData.whyChooseYou}
                onChange={(e) => update("whyChooseYou", e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 min-h-[80px] outline-none transition-all resize-none"
              />
            </div>
          </FormSection>

          {/* Media Kit */}
          <FormSection title="Media Kit (Optional)">
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-pink-300 hover:bg-pink-50/30 transition-all">
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                <Upload size={22} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700">
                  Upload your media kit or portfolio
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PDF, PNG, JPG up to 10MB
                </p>
              </div>
              <span className="text-[11px] font-bold text-pink-500 underline">
                Choose File
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) =>
                  update("mediaKit", e.target.files?.[0] || null)
                }
              />
            </label>
            {formData.mediaKit && (
              <p className="text-xs text-emerald-600 font-bold mt-1">
                Selected: {formData.mediaKit.name}
              </p>
            )}
          </FormSection>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="flex-1 h-12 rounded-xl btn-purple text-sm font-bold shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all"
          >
            Submit Application
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ── Reusable sub-components ── */

function FormSection({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}

function FormField({ label, placeholder, icon, type = "text", value, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full py-3 ${icon ? "pl-11" : "pl-4"} pr-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all`}
        />
      </div>
    </div>
  );
}
