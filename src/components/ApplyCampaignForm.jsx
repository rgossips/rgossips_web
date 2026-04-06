"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Instagram,
  Loader2,
  CheckCircle2,
  ExternalLink,
  User,
  Mail,
  Phone,
  Users,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export function ApplyCampaignForm({ onClose, campaignData, onSubmitSuccess }) {
  const { profile, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [whyChooseYou, setWhyChooseYou] = useState("");

  // Auto-populated from profile
  const fullName = profile?.full_name || "";
  const email = profile?.email || user?.email || "";
  const phone = user?.phone || profile?.phone || "";
  const instagramHandle = profile?.instagram_handle || profile?.username || "";
  const followersCount = profile?.followers_count || 0;
  const engagementRate = profile?.engagement_rate || 0;
  const mediaKitPublished = profile?.media_kit_published;
  const mediaKitUrl = typeof window !== "undefined" ? `${window.location.origin}/kit/${instagramHandle}` : "";

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/apply-campaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          campaignId: campaignData?.id,
          influencerId: user?.id,
          proposedRate: proposedRate ? Number(proposedRate) : null,
        }),
      });

      const data = await res.json();

      if (data?.error === "already_applied") {
        setError("You have already applied to this campaign.");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.success) {
        setSubmitted(true);
        setTimeout(() => {
          if (onSubmitSuccess) onSubmitSuccess();
          else onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-6"
        >
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Application Submitted!</h3>
            <p className="text-sm text-slate-500">Your application is now under review. You'll be notified when the brand responds.</p>
          </div>
        </motion.div>
      </>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-2xl lg:max-h-[90vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base lg:text-lg font-bold text-slate-900">Apply for Campaign</h2>
            <p className="text-[11px] text-slate-400">{campaignData?.title || "Campaign"} &middot; {campaignData?.brandName || "Brand"}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          {/* Your Profile (Auto-populated, Non-editable) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Your Profile
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Auto-filled</span>
            </h3>

            <div className="space-y-2.5">
              <ReadOnlyField icon={<User size={14} className="text-purple-500" />} label="Full Name" value={fullName || "Not set"} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ReadOnlyField icon={<Mail size={14} className="text-pink-500" />} label="Email" value={email || "Not set"} />
                <ReadOnlyField icon={<Phone size={14} className="text-blue-500" />} label="Phone" value={phone || "Not set"} />
              </div>
              <ReadOnlyField icon={<Instagram size={14} className="text-pink-500" />} label="Instagram" value={instagramHandle ? `@${instagramHandle}` : "Not connected"} />
              <div className="grid grid-cols-2 gap-2.5">
                <ReadOnlyField icon={<Users size={14} className="text-purple-500" />} label="Followers" value={formatCount(followersCount)} />
                <ReadOnlyField icon={<Activity size={14} className="text-emerald-500" />} label="Engagement" value={engagementRate ? `${engagementRate}%` : "—"} />
              </div>
            </div>
          </section>

          {/* Media Kit */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Media Kit</h3>
            {mediaKitPublished && instagramHandle ? (
              <Link
                href={mediaKitUrl}
                target="_blank"
                className="flex items-center gap-3 p-4 border border-purple-100 bg-purple-50/30 rounded-xl hover:bg-purple-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">View Media Kit</p>
                  <p className="text-[10px] text-slate-400 truncate">{mediaKitUrl}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Published</span>
              </Link>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-xs text-slate-400">Media kit not published yet</p>
                <Link href="/influencer/media-kit" className="text-xs font-bold text-purple-500 hover:underline mt-1 inline-block">
                  Generate Media Kit
                </Link>
              </div>
            )}
          </section>

          {/* Proposed Rate (Editable) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Your Proposed Rate</h3>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                placeholder="Enter your rate for this campaign"
                value={proposedRate}
                onChange={(e) => setProposedRate(e.target.value)}
                className="w-full py-3 pl-8 pr-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all"
              />
            </div>
            {campaignData?.budget && (
              <p className="text-[10px] text-slate-400">Campaign budget: {campaignData.budget}</p>
            )}
          </section>

          {/* Why Choose You (Editable) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Why should we choose you?</h3>
            <textarea
              placeholder="Tell the brand why you're the perfect fit for this campaign..."
              value={whyChooseYou}
              onChange={(e) => setWhyChooseYou(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 min-h-[100px] outline-none transition-all resize-none"
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-12 rounded-xl text-sm font-bold shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

function ReadOnlyField({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-sm font-bold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
