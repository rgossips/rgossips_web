"use client";
import React, { useState, useRef } from "react";
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
  Calendar,
  Truck,
  MapPin,
  Tag,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAiTool } from "@/hooks/useAiTool";

export function ApplyCampaignForm({ onClose, campaignData, onSubmitSuccess }) {
  const t = useTranslations("ApplyCampaignForm");
  const { profile, user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [whyChooseYou, setWhyChooseYou] = useState("");
  const { generate: draftPitch, loading: drafting, error: draftError, limitReached: draftLimit } = useAiTool();

  // AI Pitch Assistant — drafts a short, campaign-aware "why choose you" note in
  // the creator's voice, referencing their real past work. Clicking again is a
  // regenerate: we pass the previous draft + a regenerate flag so the model
  // returns a distinctly different version instead of lightly rephrasing.
  const pitchNonceRef = useRef(0);
  const handleDraftPitch = async () => {
    const prev = whyChooseYou.trim();
    const inputs = prev
      ? { regenerate: true, previousDraft: prev, variation: ++pitchNonceRef.current }
      : {};
    const text = await draftPitch({ tool: "pitch", campaignId: campaignData?.id, inputs });
    if (text) setWhyChooseYou(text);
  };

  // Auto-populated from profile
  const fullName = profile?.full_name || "";
  const email = profile?.email || user?.email || "";
  const phone = user?.phone || profile?.phone || "";
  const instagramHandle = profile?.instagram_handle || profile?.username || "";
  const followersCount = profile?.followers_count || 0;
  const engagementRate = profile?.engagement_rate || 0;
  const mediaKitPublished = profile?.media_kit_published;
  // Slug fallback chain matches /influencer/media-kit so the share URL
  // here lines up with the one the creator sees on their kit page.
  // Phone-OTP signups land here with username + instagram_handle both
  // blank — falling through to user.id keeps the URL valid AND stops
  // the "not published" misread when the kit *is* published.
  const mediaKitSlug = profile?.username || profile?.instagram_handle || user?.id || "";
  const mediaKitUrl =
    typeof window !== "undefined" && mediaKitSlug
      ? `${window.location.origin}/kit/${mediaKitSlug}`
      : "";

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    // Guardrail: a personalised pitch is mandatory — keeps brands from drowning
    // in one-click AI-spam applications, so they see better applications.
    if (!whyChooseYou.trim()) {
      setError(t("why.required"));
      return;
    }
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
          pitch: whyChooseYou.trim(),
        }),
      });

      const data = await res.json();

      if (data?.error === "already_applied") {
        setError(t("errors.alreadyApplied"));
        return;
      }

      if (data?.error === "plan_limit_reached") {
        // Surface a structured marker so the renderer can show an inline
        // Upgrade button next to the message instead of asking the user
        // to copy a path.
        setError({
          kind: "plan_limit_reached",
          message: data.message || t("errors.planLimitDefault"),
        });
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
      setError(err.message || t("errors.submitFailed"));
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
            <h3 className="text-xl font-black text-slate-900">{t("success.title")}</h3>
            <p className="text-sm text-slate-500">{t("success.body")}</p>
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
            <h2 className="text-base lg:text-lg font-bold text-slate-900">{t("header.title")}</h2>
            <p className="text-[11px] text-slate-400">{campaignData?.title || t("header.campaignFallback")} &middot; {campaignData?.brandName || t("header.brandFallback")}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && typeof error === "object" && error.kind === "plan_limit_reached" ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-800">{error.message}</p>
                <p className="text-[11px] text-amber-700/80 mt-1">
                  {t("planLimit.hint")}
                </p>
                <Link
                  href="/influencer/pricing"
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-gradient-to-r from-[#9810fa] to-[#e60076] text-white text-xs font-bold shadow-md hover:opacity-90 cursor-pointer"
                >
                  {t("planLimit.cta")}
                </Link>
              </div>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {typeof error === "string" ? error : error.message}
            </div>
          ) : null}

          {/* Campaign briefing — what you're committing to */}
          <CampaignBriefing campaign={campaignData} />

          {/* Your Profile (Auto-populated, Non-editable) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {t("profile.heading")}
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{t("profile.autoFilled")}</span>
            </h3>

            <div className="space-y-2.5">
              <ReadOnlyField icon={<User size={14} className="text-purple-500" />} label={t("profile.fullName")} value={fullName || t("profile.notSet")} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <ReadOnlyField icon={<Mail size={14} className="text-pink-500" />} label={t("profile.email")} value={email || t("profile.notSet")} />
                <ReadOnlyField icon={<Phone size={14} className="text-blue-500" />} label={t("profile.phone")} value={phone || t("profile.notSet")} />
              </div>
              <ReadOnlyField icon={<Instagram size={14} className="text-pink-500" />} label={t("profile.instagram")} value={instagramHandle ? `@${instagramHandle}` : t("profile.notConnected")} />
              <div className="grid grid-cols-2 gap-2.5">
                <ReadOnlyField icon={<Users size={14} className="text-purple-500" />} label={t("profile.followers")} value={formatCount(followersCount)} />
                <ReadOnlyField icon={<Activity size={14} className="text-emerald-500" />} label={t("profile.engagement")} value={engagementRate ? `${engagementRate}%` : "—"} />
              </div>
            </div>
          </section>

          {/* Media Kit */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">{t("mediaKit.heading")}</h3>
            {mediaKitPublished && mediaKitSlug ? (
              <Link
                href={mediaKitUrl}
                target="_blank"
                className="flex items-center gap-3 p-4 border border-purple-100 bg-purple-50/30 rounded-xl hover:bg-purple-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                  <ExternalLink size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{t("mediaKit.view")}</p>
                  <p className="text-[10px] text-slate-400 truncate">{mediaKitUrl}</p>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{t("mediaKit.published")}</span>
              </Link>
            ) : (
              <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center">
                <p className="text-xs text-slate-400">{t("mediaKit.notPublished")}</p>
                <Link href="/influencer/media-kit" className="text-xs font-bold text-purple-500 hover:underline mt-1 inline-block">
                  {t("mediaKit.generate")}
                </Link>
              </div>
            )}
          </section>

          {/* Proposed Rate — hidden for pure barter campaigns */}
          {campaignData?.campaignType !== "barter" && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{t("rate.heading")}</h3>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder={t("rate.placeholder")}
                  value={proposedRate}
                  onChange={(e) => setProposedRate(e.target.value)}
                  className="w-full py-3 pl-8 pr-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>
              {campaignData?.budget && (
                <p className="text-[10px] text-slate-400">{t("rate.budget", { budget: campaignData.budget })}</p>
              )}
            </section>
          )}

          {/* Why Choose You (Editable) + AI Pitch Assistant */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">{t("why.heading")}</h3>
              <button
                type="button"
                onClick={handleDraftPitch}
                disabled={drafting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black text-purple-700 bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {drafting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {drafting ? t("why.drafting") : t("why.draftAi")}
              </button>
            </div>
            <textarea
              placeholder={t("why.placeholder")}
              value={whyChooseYou}
              onChange={(e) => setWhyChooseYou(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-100 focus:border-pink-200 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 min-h-[100px] outline-none transition-all resize-none"
            />
            {(draftLimit || draftError) && (
              <p className="text-xs font-semibold text-amber-600">{draftLimit ? t("why.aiLimit") : draftError}</p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 h-12 rounded-xl text-sm font-bold shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? t("actions.submitting") : t("actions.submit")}
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

function CampaignBriefing({ campaign }) {
  const t = useTranslations("ApplyCampaignForm");
  if (!campaign) return null;

  const isBarter = campaign.campaignType === "barter";
  const isService = campaign.offeringType === "service" || (!campaign.offeringType && campaign.serviceLocation);

  const formatDate = (d) => {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch { return d; }
  };

  const usageLabels = {
    creator_only: t("usageRights.creator_only"),
    brand_repost: t("usageRights.brand_repost"),
    paid_ads: t("usageRights.paid_ads"),
    full_rights: t("usageRights.full_rights"),
  };
  const paymentLabels = {
    advance: t("paymentTimeline.advance"),
    on_approval: t("paymentTimeline.on_approval"),
    "7_days": t("paymentTimeline.7_days"),
    "30_days": t("paymentTimeline.30_days"),
  };

  const appDeadline = formatDate(campaign.applicationDeadline);
  const endDate = formatDate(campaign.endDate);

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        {t("briefing.heading")}
        <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
          {t("briefing.committing")}
        </span>
      </h3>

      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4 space-y-3">
        {/* Headline */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">{t("briefing.campaignType")}</p>
            <p className="text-sm font-extrabold text-slate-900 capitalize">
              {campaign.campaignType || "—"}
              {campaign.productName && (
                <span className="font-medium text-slate-500"> · {campaign.productName}</span>
              )}
            </p>
          </div>
          {!isBarter && campaign.budget && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">{t("briefing.pay")}</p>
              <p className="text-sm font-extrabold text-emerald-700">{campaign.budget}</p>
            </div>
          )}
          {isBarter && campaign.productValue > 0 && (
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">{t("briefing.worth")}</p>
              <p className="text-sm font-extrabold text-emerald-700">₹{Number(campaign.productValue).toLocaleString("en-IN")}</p>
            </div>
          )}
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {campaign.deliverables && campaign.deliverables !== "Not specified" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              <Tag size={10} /> {campaign.deliverables}
            </span>
          )}
          {appDeadline && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              <Calendar size={10} /> {t("chips.applyBy", { date: appDeadline })}
            </span>
          )}
          {endDate && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-white px-2.5 py-1 rounded-full border border-slate-200">
              <Calendar size={10} /> {t("chips.deliverBy", { date: endDate })}
            </span>
          )}
          {!isService && campaign.shippingRequired === "yes" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Truck size={10} /> {campaign.shippingTimelineDays ? t("chips.productShippedDays", { days: campaign.shippingTimelineDays }) : t("chips.productShipped")}
            </span>
          )}
          {!isService && campaign.shippingRequired === "pickup" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              <Truck size={10} /> {t("chips.pickupRequired")}
            </span>
          )}
          {isService && campaign.serviceLocation && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              <MapPin size={10} /> {campaign.serviceLocation}
            </span>
          )}
        </div>

        {/* Compensation summary */}
        {campaign.barterCompensation && (
          <div className="bg-white/60 rounded-xl p-3 border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">{t("briefing.youGet")}</p>
            <p className="text-xs text-slate-700 leading-relaxed">{campaign.barterCompensation}</p>
          </div>
        )}

        {/* Critical guidelines flagged */}
        {(campaign.contentDos || campaign.contentDonts) && (
          <div className="bg-white/60 rounded-xl p-3 border border-purple-100 space-y-1.5">
            {campaign.contentDos && (
              <p className="text-[11px] text-slate-700 leading-snug">
                <span className="font-extrabold text-emerald-600">✓ </span>
                <span className="font-semibold">{campaign.contentDos}</span>
              </p>
            )}
            {campaign.contentDonts && (
              <p className="text-[11px] text-slate-700 leading-snug">
                <span className="font-extrabold text-red-600">✗ </span>
                <span className="font-semibold">{campaign.contentDonts}</span>
              </p>
            )}
          </div>
        )}

        {/* Hashtags & handles */}
        {(campaign.requiredHashtags || campaign.brandHandlesToTag) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {campaign.requiredHashtags && (
              <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("briefing.hashtags")}</p>
                <p className="text-[11px] font-semibold text-slate-700 break-words">{campaign.requiredHashtags}</p>
              </div>
            )}
            {campaign.brandHandlesToTag && (
              <div className="bg-white rounded-xl p-2.5 border border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("briefing.tag")}</p>
                <p className="text-[11px] font-semibold text-slate-700 break-words">{campaign.brandHandlesToTag}</p>
              </div>
            )}
          </div>
        )}

        {/* Terms summary */}
        {(campaign.usageRights || campaign.paymentTimeline || (campaign.exclusivityDays && campaign.exclusivityDays !== "0")) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {campaign.usageRights && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {t("terms.usage", { value: usageLabels[campaign.usageRights] || campaign.usageRights })}
              </span>
            )}
            {campaign.paymentTimeline && !isBarter && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                {t("terms.payment", { value: paymentLabels[campaign.paymentTimeline] || campaign.paymentTimeline })}
              </span>
            )}
            {campaign.exclusivityDays && campaign.exclusivityDays !== "0" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                <AlertCircle size={10} /> {t("terms.exclusivity", { days: campaign.exclusivityDays })}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
