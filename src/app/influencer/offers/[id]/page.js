"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  detectInstagramLinkType,
  labelForLinkType,
  expectedLinkType,
  normaliseInstagramUrl,
} from "@/utils/instagram-url";
import {
  ChevronLeft,
  Share2,
  Heart,
  Instagram,
  Youtube,
  Smartphone,
  CheckCircle,
  Clock,
  Star,
  Users,
  TrendingUp,
  History,
  Wallet,
  Gift,
  ShieldCheck,
  BarChart3,
  Eye,
  Bookmark,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  MapPin,
  FileText,
  Loader2,
  Upload,
  X,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { ApplyCampaignForm } from "@/components/ApplyCampaignForm";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { useAiTool } from "@/hooks/useAiTool";
import { AiMarkdown } from "@/components/AiMarkdown";
import RatingModal from "@/components/RatingModal";
import AlertPopup from "@/components/AlertPopup";

/* ─── Fetch campaign from DB ─── */
function useCampaign(id, userId) {
  const t = useTranslations("InfluencerOffersId");
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refetchFlag, setRefetchFlag] = useState(0);
  const refetch = () => setRefetchFlag((f) => f + 1);

  useEffect(() => {
    if (!id) return;
    const fetchCampaign = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ influencerId: userId }),
        });

        const data = await res.json();
        const found = data?.campaigns?.find((c) => c.id === id);
        if (found) {
          // Count campaigns by this brand
          const brandCampaigns = data.campaigns.filter(
            (c) => c.brandName === found.brandName
          );
          const activeBrandCampaigns = brandCampaigns.filter((c) => c.status === "Active").length;

          // Build follower-range label from real numbers when present
          const fmtFollowers = (n) => {
            if (!n) return t("anyValue");
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
            return String(n);
          };
          const followerLabel = found.targetFollowerMin || found.targetFollowerMax
            ? `${fmtFollowers(found.targetFollowerMin)} – ${fmtFollowers(found.targetFollowerMax)}`
            : t("anyValue");

          const requirements = [
            { icon: "users", label: t("requirements.followers", { value: followerLabel }), sub: t("requirements.audienceSize") },
            { icon: "trending", label: t("requirements.tier", { value: (found.targetInfluencerTier || "all").replace(/^./, (c) => c.toUpperCase()) }), sub: t("requirements.creatorTier") },
            { icon: "star", label: t("requirements.location", { value: found.location }), sub: t("requirements.targetRegion") },
          ];
          if (found.minEngagementRate > 0) {
            requirements.push({ icon: "trending", label: t("requirements.minEngagement", { value: found.minEngagementRate }), sub: t("requirements.activityThreshold") });
          }
          if (Array.isArray(found.targetGender) && found.targetGender.length > 0) {
            requirements.push({ icon: "users", label: t("requirements.gender", { value: found.targetGender.join(", ") }), sub: t("requirements.preferred") });
          }
          if (Array.isArray(found.targetLanguages) && found.targetLanguages.length > 0) {
            requirements.push({ icon: "star", label: t("requirements.language", { value: found.targetLanguages.join(", ") }), sub: t("requirements.contentLanguage") });
          }

          setCampaign({
            ...found,
            heroImg:
              found.bannerImage ||
              "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
            slots: found.maxInfluencers || 0,
            about: found.description || t("noDescription"),
            requirements,
            payments: [{ type: "base", label: t("basePayment"), val: found.budget, sub: t("perInfluencer") }],
            brandStats: { campaigns: brandCampaigns.length, success: t("brandStats.activeCount", { count: activeBrandCampaigns }), response: "24h" },
            deliverableIcons: found.deliverables
              ? found.deliverables.split(" + ").map((d) => {
                  const parts = d.split(":");
                  return { platform: "instagram", count: parts[1] || "1", label: parts[0] || d };
                })
              : [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id, userId, refetchFlag]);

  return { campaign, loading, refetch };
}

const _REMOVED = [
  {
    deadline: "Apr 15, 2026",
    daysLeft: "20d",
    deliverables: "2 Reels + 2 Stories",
    location: "Mumbai",
    platforms: ["instagram", "tiktok"],
    heroImg: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
    brandStats: { campaigns: 196, success: "94%", response: "24h" },
    slots: 58,
    about:
      "We're launching our latest summer collection and looking for fashion-forward influencers to showcase our latest designs. This campaign features modern styles, trendy pieces, and authentic storytelling that resonates with your audience. Join us and bring our exciting collection to life with creative and compelling content.",
    requirements: [
      {
        label: "Minimum Followers",
        sub: "50k+ on Instagram or YouTube",
        icon: "users",
      },
      {
        label: "Engagement Rate",
        sub: "3%+ average engagement",
        icon: "trending",
      },
      {
        label: "Fashion/Lifestyle Niche",
        sub: "Content aligned with brand",
        icon: "star",
      },
      {
        label: "Active Profile",
        sub: "Regular posting schedule",
        icon: "history",
      },
    ],
    payments: [
      {
        label: "Base Payment",
        val: "₹30,000",
        sub: "Fixed for deliverables",
        type: "base",
      },
      {
        label: "Performance Bonus",
        val: "Up to ₹5,000",
        sub: "Based on engagement metrics and reach",
        type: "bonus",
      },
      {
        label: "Product Worth",
        val: "₹15,000",
        sub: "Keep all products + exclusive merchandise",
        type: "product",
      },
    ],
    deliverableIcons: [
      { platform: "instagram", count: 4, label: "Reels" },
      { platform: "tiktok", count: 3, label: "Posts" },
      { platform: "youtube", count: "2+", label: "Videos" },
    ],
    proTips: ["Tag the brand in all posts and stories", "Use natural lighting for best results", "Engage with comments within the first hour"],
  },
  {
    id: 2,
    initials: "NK",
    title: "Running Gear Drop",
    brandName: "Nike India",
    status: "Active",
    tags: ["Fitness", "Fashion"],
    budget: "₹50,000 - ₹75,000",
    deadline: "Apr 20, 2026",
    daysLeft: "25d",
    deliverables: "3 Reels + 1 YT Short",
    location: "Delhi",
    platforms: ["instagram", "youtube"],
    heroImg: "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80",
    brandStats: { campaigns: 312, success: "97%", response: "12h" },
    slots: 30,
    about: "Nike India is launching a new running gear collection. We need fitness influencers to create authentic content showcasing the products in action.",
    requirements: [
      {
        label: "Minimum Followers",
        sub: "100k+ on any platform",
        icon: "users",
      },
      { label: "Engagement Rate", sub: "4%+ average", icon: "trending" },
      { label: "Fitness Niche", sub: "Active lifestyle content", icon: "star" },
      {
        label: "Active Profile",
        sub: "Regular posting schedule",
        icon: "history",
      },
    ],
    payments: [
      {
        label: "Base Payment",
        val: "₹50,000",
        sub: "Fixed for deliverables",
        type: "base",
      },
      {
        label: "Performance Bonus",
        val: "Up to ₹25,000",
        sub: "Based on reach",
        type: "bonus",
      },
      {
        label: "Product Worth",
        val: "₹20,000",
        sub: "Full running gear set",
        type: "product",
      },
    ],
    deliverableIcons: [
      { platform: "instagram", count: 3, label: "Reels" },
      { platform: "youtube", count: 1, label: "Short" },
    ],
    proTips: ["Show the product in real workout scenarios", "Mention comfort and fit in your review"],
  },
  {
    id: 11,
    initials: "MW",
    title: "Music Festival Promotion",
    brandName: "MusicWave Events",
    status: "Applied",
    tags: ["Music", "Events"],
    budget: "₹30,000 - ₹40,000",
    deadline: "Feb 10, 2026",
    daysLeft: "50d",
    deliverables: "4 Reels + 2 Videos",
    location: "Pune",
    platforms: ["instagram", "youtube"],
    heroImg: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80",
    applicationDate: "Jan 18, 2026",
    applicationNote: "Your profile is a great fit and we're glad to see you apply! It may take 3-5 business days to process.",
    estimatedReach: "1.25K",
    estimatedEngagement: "4.8%",
    otherNotes: ["Do not delete/archive any Reel, Short or content during or a week after the campaign duration.", "Content schedule: Post 3 days before event and engage content."],
    matchScore: "85%",
    timeline: [
      { label: "Applied", date: "Jan 18, 2026", done: true },
      { label: "Under Review", date: "Jan 20, 2026", done: true },
      { label: "Shortlisted", date: "Jan 25, 2026", done: false },
      { label: "Approved", date: "Jan 28, 2026", done: false },
    ],
  },
  {
    id: 21,
    initials: "GB",
    title: "Eco-Friendly Products Launch",
    brandName: "GreenEarth Co.",
    status: "Completed",
    tags: ["Sustainability", "Lifestyle"],
    budget: "₹20,000 - ₹25,000",
    deadline: "Jan 15, 2026",
    deliverables: "2 Videos + 1 Reel",
    location: "Chennai",
    platforms: ["youtube"],
    heroImg: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80",
    paymentStatus: "Paid",
    paymentAmount: "₹22,500",
    performance: {
      totalViews: "287.5K",
      engagement: "5.8%",
      reach: "320K",
      saves: "12.4K",
      likes: "24.8K",
      comments: "3.1K",
      shares: "8.2K",
    },
    contentDelivered: [
      {
        type: "VIDEO",
        title: "Product Unboxing",
        date: "Jan 8, 2026",
        views: "125K",
        img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80",
      },
      {
        type: "REEL",
        title: "Eco-tips Showcase",
        date: "Jan 10, 2026",
        views: "85K",
        img: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80",
      },
      {
        type: "VIDEO",
        title: "Behind the Scenes",
        date: "Jan 12, 2026",
        views: "77.5K",
        img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80",
      },
    ],
    brandFeedback: {
      rating: 5,
      text: '"Outstanding collaboration! Professional content delivery and exceptional engagement rates. Highly recommend working with this creator."',
    },
    campaignSummary: {
      duration: "7 days",
      contentPieces: "3 pieces",
      avgEngagement: "5.8%",
    },
  },
];

const SIMILAR_CAMPAIGNS = [
  {
    id: 101,
    title: "Winter Fashion Campaign",
    brand: "Nordic Style",
    budget: "₹30,000",
    img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80",
  },
  {
    id: 102,
    title: "Luxury Accessories",
    brand: "GadgetPro",
    budget: "₹45,000",
    img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80",
  },
];

/* ─── Helper: get icon component ─── */
function ReqIcon({ type }) {
  const size = 18;
  switch (type) {
    case "users":
      return <Users size={size} />;
    case "trending":
      return <TrendingUp size={size} />;
    case "star":
      return <Star size={size} />;
    case "history":
      return <History size={size} />;
    default:
      return <CheckCircle size={size} />;
  }
}

function PlatformIcon({ platform, size = 20 }) {
  switch (platform) {
    case "instagram":
      return <Instagram size={size} className="text-pink-500" />;
    case "youtube":
      return <Youtube size={size} className="text-red-500" />;
    case "tiktok":
      return <Smartphone size={size} className="text-slate-700" />;
    default:
      return null;
  }
}

/* ─── Gallery with Lightbox ─── */
/* ─── Audit field sections ─── */

function ProductInfoSection({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  const isService = campaign.offeringType === "service" || (!campaign.offeringType && campaign.serviceLocation);
  const shipText = {
    yes: campaign.shippingTimelineDays
      ? t("product.willBeShippedInDays", { days: campaign.shippingTimelineDays })
      : t("product.willBeShipped"),
    no: t("product.noShipping"),
    pickup: t("product.pickupRequired"),
  }[campaign.shippingRequired] || "";

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-slate-800">
        {isService ? t("product.serviceExperience") : t("product.product")}
      </h3>
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-4 space-y-2">
        {campaign.productName && (
          <p className="text-sm font-bold text-slate-800 leading-snug">{campaign.productName}</p>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {isService && campaign.serviceLocation && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
              📍 {campaign.serviceLocation}
            </span>
          )}
          {!isService && shipText && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              🚚 {shipText}
            </span>
          )}
          {campaign.productValue > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {t("product.approxValue", { value: Number(campaign.productValue).toLocaleString("en-IN") })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CopyableField({ label, value }) {
  const t = useTranslations("InfluencerOffersId");
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        // Fallback for non-secure contexts
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <button
          type="button"
          onClick={onCopy}
          aria-label={t("copyable.copyAria", { label })}
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-colors cursor-pointer ${
            copied
              ? "text-emerald-700 bg-emerald-50"
              : "text-[#E60076] hover:bg-pink-50"
          }`}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? t("copyable.copied") : t("copyable.copy")}
        </button>
      </div>
      <p className="text-xs font-semibold text-slate-700 break-words">{value}</p>
    </div>
  );
}

function GuidelinesSection({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-slate-800">{t("guidelines.title")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {campaign.contentDos && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider mb-1.5">{t("guidelines.mustInclude")}</p>
            <p className="text-xs text-emerald-900 leading-relaxed whitespace-pre-wrap">{campaign.contentDos}</p>
          </div>
        )}
        {campaign.contentDonts && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <p className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider mb-1.5">{t("guidelines.mustAvoid")}</p>
            <p className="text-xs text-red-900 leading-relaxed whitespace-pre-wrap">{campaign.contentDonts}</p>
          </div>
        )}
      </div>
      {(campaign.requiredHashtags || campaign.brandHandlesToTag) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaign.requiredHashtags && (
            <CopyableField label={t("guidelines.hashtags")} value={campaign.requiredHashtags} />
          )}
          {campaign.brandHandlesToTag && (
            <CopyableField label={t("guidelines.tag")} value={campaign.brandHandlesToTag} />
          )}
        </div>
      )}
    </div>
  );
}

function TermsSection({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  const usageLabels = {
    creator_only: t("terms.usage.creatorOnly"),
    brand_repost: t("terms.usage.brandRepost"),
    paid_ads: t("terms.usage.paidAds"),
    full_rights: t("terms.usage.fullRights"),
  };
  const keepupLabels = {
    "24h": t("terms.keepup.24h"),
    "7d": t("terms.keepup.7d"),
    "30d": t("terms.keepup.30d"),
    permanent: t("terms.keepup.permanent"),
  };
  const paymentLabels = {
    advance: t("terms.payment.advance"),
    on_approval: t("terms.payment.onApproval"),
    "7_days": t("terms.payment.7days"),
    "30_days": t("terms.payment.30days"),
  };

  const rows = [];
  if (campaign.usageRights) rows.push(["usageRights", t("terms.rowLabel.usageRights"), usageLabels[campaign.usageRights] || campaign.usageRights]);
  if (campaign.keepupDuration) rows.push(["keepContentLive", t("terms.rowLabel.keepContentLive"), keepupLabels[campaign.keepupDuration] || campaign.keepupDuration]);
  if (campaign.exclusivityDays && campaign.exclusivityDays !== "0") rows.push(["exclusivity", t("terms.rowLabel.exclusivity"), t("terms.exclusivityValue", { days: campaign.exclusivityDays })]);
  if (campaign.paymentTimeline) rows.push(["payment", t("terms.rowLabel.payment"), paymentLabels[campaign.paymentTimeline] || campaign.paymentTimeline]);

  if (rows.length === 0) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-slate-800">{t("terms.title")}</h3>
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl divide-y divide-slate-50">
        {rows.map(([rowKey, k, v]) => (
          <div key={rowKey} className="flex items-center justify-between p-3.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{k}</span>
            <span className="text-xs font-semibold text-slate-700 text-right ml-3">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Gallery({ images }) {
  const t = useTranslations("InfluencerOffersId");
  const [index, setIndex] = useState(-1);
  const open = (i) => setIndex(i);
  const close = () => setIndex(-1);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    if (index < 0) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [index, images.length]);

  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-slate-800">{t("gallery.title")}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => open(i)}
            className="aspect-square rounded-2xl overflow-hidden bg-slate-100 block group cursor-pointer"
          >
            <img
              src={src}
              alt={t("gallery.imageAlt", { index: i + 1 })}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </button>
        ))}
      </div>

      {index >= 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            aria-label={t("gallery.close")}
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 md:left-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label={t("gallery.previous")}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 md:right-8 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                aria-label={t("gallery.next")}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <img
            src={images[index]}
            alt={t("gallery.imageAlt", { index: index + 1 })}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold">
              {index + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function CampaignDetailsPage() {
  const t = useTranslations("InfluencerOffersId");
  const { id } = useParams();
  const router = useRouter();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const { user } = useAuth();

  const { campaign, loading, refetch } = useCampaign(id, user?.id);

  // Auto-prompt for rating once per session when an influencer lands on a
  // completed campaign they haven't rated yet. RLS scopes the row to the
  // logged-in user, so a maybeSingle is enough.
  useEffect(() => {
    if (!user?.id || !campaign?.applicationId) return;
    if (campaign.applicationStatus !== "completed") return;

    const dismissKey = `rating_dismissed_${campaign.applicationId}`;
    const dismissed = typeof window !== "undefined" && sessionStorage.getItem(dismissKey);

    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("campaign_ratings")
          .select("target_rating, brief_clarity, fairness, feedback_quality")
          .eq("application_id", campaign.applicationId)
          .eq("rater_role", "influencer")
          .maybeSingle();
        if (cancelled) return;
        setMyRating(data || null);
        if (!data && !dismissed) {
          setShowRating(true);
        }
      } catch (e) {
        // Non-blocking — leave the manual CTA available.
        console.error("Rating lookup failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, campaign?.applicationId, campaign?.applicationStatus]);

  const dismissRating = () => {
    if (campaign?.applicationId && typeof window !== "undefined") {
      sessionStorage.setItem(`rating_dismissed_${campaign.applicationId}`, "1");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-purple-500" />
          <p className="text-sm font-bold text-slate-400">{t("loadingCampaign")}</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-slate-600">{t("campaignNotFound")}</p>
          <button onClick={() => router.back()} className="text-sm text-purple-500 font-bold hover:underline cursor-pointer">
            {t("goBack")}
          </button>
        </div>
      </div>
    );
  }

  const isActive = campaign.status === "Active";
  const isApplied = campaign.status === "Applied";
  const isCompleted = campaign.status === "Completed";
  // A withdrawn/rejected application sends the campaign back to Active and is
  // re-appliable, so it must NOT count as an "in-flight" application — else
  // the apply button stays hidden and the (dead) status timeline shows.
  // Treat only non-terminal statuses as a live application.
  const hasLiveApplication =
    !!campaign.applicationStatus &&
    campaign.applicationStatus !== "withdrawn" &&
    campaign.applicationStatus !== "rejected";

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-20 lg:pb-0 font-sans lg:mt-20">
      <AnimatePresence>
        {isApplyOpen && (
          <ApplyCampaignForm
            onClose={() => setIsApplyOpen(false)}
            campaignData={campaign}
            onSubmitSuccess={() => {
              setIsApplyOpen(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      {/* Back link + manual refresh — status updates (brand approval,
          revision requests, payment release) lag the polling, so a quick
          refresh button keeps the page honest. */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8 flex items-center justify-between mb-4 lg:mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
          <ChevronLeft size={16} /> {t("backToCampaigns")}
        </button>
        <button
          onClick={() => refetch?.()}
          title={t("refreshStatus")}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-pink-500 px-3 py-2 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> {t("refresh")}
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-32 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative h-[200px] lg:h-[280px] rounded-2xl lg:rounded-3xl overflow-hidden">
              <img src={campaign.heroImg} alt={campaign.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Status badge on image */}
              {isCompleted && (
                <div className="absolute top-4 right-4">
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg flex items-center gap-1.5">
                    <CheckCircle size={12} /> {t("completed")}
                  </span>
                </div>
              )}

              {/* Brand logo badge */}
              <div className="absolute bottom-4 left-4 w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/20">
                {campaign.brandLogo ? (
                  <img
                    src={campaign.brandLogo}
                    alt={campaign.brandName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl lg:text-2xl font-bold">
                    {campaign.initials}
                  </div>
                )}
              </div>
            </div>

            {/* Title & Brand */}
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 mb-1">{campaign.title}</h1>
              <p className="text-sm text-slate-400 font-medium">
                {campaign.brandName} <CheckCircle2 size={14} className="inline text-blue-500 fill-blue-50" />
              </p>
            </div>

            {/* Rating CTA / summary — only on completed campaigns */}
            {isCompleted && campaign.brandId && (
              myRating ? (
                <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-400 text-white rounded-xl flex items-center justify-center shrink-0">
                      <Star size={20} className="fill-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900">{t("rating.submitted")}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {campaign.brandName} <span className="font-bold">{myRating.target_rating}/5</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < myRating.target_rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {(myRating.brief_clarity != null || myRating.fairness != null || myRating.feedback_quality != null) && (
                    <div className="mt-3 pt-3 border-t border-amber-200/70 grid grid-cols-3 gap-3 text-[11px] text-slate-600">
                      {myRating.brief_clarity != null && (
                        <div>
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">{t("rating.briefClarity")}</p>
                          <p className="font-bold text-slate-800">{myRating.brief_clarity}/5</p>
                        </div>
                      )}
                      {myRating.fairness != null && (
                        <div>
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">{t("rating.fairness")}</p>
                          <p className="font-bold text-slate-800">{myRating.fairness}/5</p>
                        </div>
                      )}
                      {myRating.feedback_quality != null && (
                        <div>
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider">{t("rating.feedback")}</p>
                          <p className="font-bold text-slate-800">{myRating.feedback_quality}/5</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowRating(true)}
                  className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-left hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 bg-amber-400 text-white rounded-xl flex items-center justify-center shrink-0">
                    <Star size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900">{t("rating.rateThisCampaign")}</p>
                    <p className="text-[11px] text-slate-500">
                      {t("rating.shareExperience", { brand: campaign.brandName })}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-amber-500 shrink-0" />
                </button>
              )
            )}

            {/* Always show full campaign content */}
            <ActiveContent campaign={campaign} />
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">
            <div className="lg:sticky lg:top-8 space-y-5">
              <ActiveSidebar
                campaign={campaign}
                onApply={isActive && !hasLiveApplication ? () => setIsApplyOpen(true) : null}
                appliedStatus={hasLiveApplication ? campaign.applicationStatus : null}
                refetch={refetch}
              />

              {/* Similar Campaigns — shared */}
              <SimilarCampaigns campaign={campaign} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating bar */}
      {isActive && !hasLiveApplication && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm shadow-lg bg-gradient-to-r from-[#9810FA] to-[#E60076] flex items-center justify-center gap-2"
          >
            {t("applyForCampaign")} <ChevronRight size={16} />
          </button>
        </div>
      )}
      {hasLiveApplication && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <ApplicationStatusBar status={campaign.applicationStatus} campaign={campaign} refetch={refetch} compact />
        </div>
      )}

      {campaign.applicationStatus === "completed" && campaign.brandId && (
        <RatingModal
          open={showRating}
          onClose={() => {
            dismissRating();
            setShowRating(false);
          }}
          applicationId={campaign.applicationId}
          campaignId={campaign.id}
          brandId={campaign.brandId}
          influencerId={user?.id}
          raterRole="influencer"
          title={t("rating.rateThisCampaign")}
          subtitle={t("rating.modalSubtitle", { brand: campaign.brandName })}
          sections={[
            {
              key: "target_rating",
              label: t("rating.howWouldYouRate", { brand: campaign.brandName }),
            },
            {
              key: "brief_clarity",
              label: t("rating.briefClarity"),
              helper: t("rating.briefClarityHelper"),
            },
            {
              key: "fairness",
              label: t("rating.negotiationFairness"),
              helper: t("rating.fairnessHelper"),
            },
            {
              key: "feedback_quality",
              label: t("rating.feedbackQuality"),
              helper: t("rating.feedbackQualityHelper"),
            },
          ]}
          primaryCta={t("rating.submitRating")}
          secondaryCta={t("rating.skipForNow")}
          onSaved={(r) => setMyRating(r)}
          onSkip={dismissRating}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE — Left Content
   ═══════════════════════════════════════════════════ */
function ActiveContent({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <div className="space-y-6">
      {/* Budget / Deadline / Slots pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-2xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">₹</div>
          <div>
            <p className="text-xs font-black text-slate-800">{campaign.budget}</p>
            <p className="text-[9px] text-slate-400">{t("active.budget")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-2xl">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
            <Calendar size={14} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800">{campaign.deadline}</p>
            {campaign.daysLeft && (
              <p className="text-[9px] text-red-400">
                {/* "Expired"/"Today" are status words; only counts get " left". */}
                {campaign.daysLeft === "Expired" || campaign.daysLeft === "Today"
                  ? campaign.daysLeft
                  : t("active.daysLeft", { value: campaign.daysLeft })}
              </p>
            )}
          </div>
        </div>
        {campaign.slots && (
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2.5 rounded-2xl">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500">
              <Users size={14} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{t("active.slots", { count: campaign.slots })}</p>
              <p className="text-[9px] text-slate-400">{t("active.available")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Deliverables */}
      {campaign.deliverableIcons && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">{t("active.contentDeliverables")}</h3>
          <div className="grid grid-cols-3 gap-3">
            {campaign.deliverableIcons.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <PlatformIcon platform={d.platform} size={20} />
                </div>
                <p className="text-2xl font-black text-slate-800">{d.count}</p>
                <p className="text-[10px] font-bold text-slate-400">{d.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Campaign */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">{t("active.aboutCampaign")}</h3>
        <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{campaign.about}</p>
      </div>

      {/* Product / Service info */}
      {(campaign.productName || campaign.serviceLocation || campaign.shippingRequired) && (
        <ProductInfoSection campaign={campaign} />
      )}

      {/* Compensation / what the influencer gets */}
      {campaign.barterCompensation && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">{t("active.whatYouGet")}</h3>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <p className="text-sm text-emerald-900 whitespace-pre-wrap leading-relaxed">{campaign.barterCompensation}</p>
            {campaign.productValue > 0 && (
              <p className="text-[11px] font-bold text-emerald-700 mt-2">{t("active.approxValue", { value: Number(campaign.productValue).toLocaleString("en-IN") })}</p>
            )}
          </div>
        </div>
      )}

      {/* Content Guidelines */}
      {(campaign.contentDos || campaign.contentDonts || campaign.requiredHashtags || campaign.brandHandlesToTag) && (
        <GuidelinesSection campaign={campaign} />
      )}

      {/* Terms & Rights */}
      {(campaign.usageRights || campaign.keepupDuration || (campaign.exclusivityDays && campaign.exclusivityDays !== "0") || campaign.paymentTimeline) && (
        <TermsSection campaign={campaign} />
      )}

      {/* Gallery */}
      {campaign.galleryImages?.length > 0 && (
        <Gallery images={campaign.galleryImages} />
      )}

      {/* Requirements */}
      {campaign.requirements && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">{t("active.requirements")}</h3>
          <div className="space-y-2.5">
            {campaign.requirements.map((req, i) => (
              <div key={i} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-50 shadow-sm">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <ReqIcon type={req.icon} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{req.label}</p>
                  <p className="text-[11px] text-slate-400">{req.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment & Benefits */}
      {campaign.payments && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">{t("active.paymentBenefits")}</h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase">
              <ShieldCheck size={12} /> {t("active.verified")}
            </span>
          </div>
          <div className="space-y-2.5">
            {campaign.payments.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm ${
                  p.type === "product" ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100" : "bg-white border-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    p.type === "base" ? "bg-emerald-50 text-emerald-500" : p.type === "bonus" ? "bg-pink-50 text-pink-500" : "bg-purple-50 text-purple-500"
                  }`}
                >
                  {p.type === "base" ? <Wallet size={18} /> : p.type === "bonus" ? <TrendingUp size={18} /> : <Gift size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.label}</p>
                  <p className="text-sm font-black text-slate-800">{p.val}</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 max-w-[100px] text-right hidden sm:block">{p.sub}</p>
              </div>
            ))}
          </div>
          {/* Exclusive banner */}
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-2xl p-4 flex items-center gap-3">
            <Gift size={20} className="text-white shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">{t("active.exclusiveRights")}</p>
              <p className="text-[10px] text-emerald-100">{t("active.licensingNote")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE — Right Sidebar
   ═══════════════════════════════════════════════════ */
function ActiveSidebar({ campaign, onApply, appliedStatus, refetch }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <>
      {/* Apply button or Status tracker */}
      {onApply ? (
        <>
          <button
            onClick={onApply}
            className="hidden lg:flex w-full items-center justify-center gap-2 h-14 rounded-2xl text-white font-bold text-sm shadow-lg shadow-pink-100 bg-gradient-to-r from-[#9810FA] to-[#E60076] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            {t("applyForCampaign")} <ChevronRight size={16} />
          </button>
          <p className="hidden lg:block text-center text-[10px] text-slate-400">{t("sidebar.applyViaAgent")}</p>
        </>
      ) : appliedStatus ? (
        <div className="hidden lg:block">
          <ApplicationStatusBar status={appliedStatus} campaign={campaign} refetch={refetch} />
        </div>
      ) : null}

      {/* About Brand */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-800">{t("sidebar.aboutBrand")}</h4>
        <div className="flex items-center gap-3">
          {campaign.brandLogo ? (
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-1.5 border border-slate-100">
              <Image src={campaign.brandLogo} alt={campaign.brandName} width={44} height={44} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">{campaign.initials}</div>
          )}
          <div>
            <p className="text-sm font-bold text-slate-800">
              {campaign.brandName} <CheckCircle2 size={12} className="inline text-blue-500 fill-blue-50" />
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{campaign.tags?.join(", ") || t("sidebar.brand")}</p>
          </div>
        </div>
        {campaign.brandStats && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: campaign.brandStats.campaigns, label: t("sidebar.campaigns") },
              { val: campaign.brandStats.success, label: t("sidebar.success") },
              { val: campaign.brandStats.response, label: t("sidebar.response") },
            ].map((s, i) => (
              <div key={i} className="text-center p-2 bg-slate-50 rounded-xl">
                <p className="text-xs font-black text-slate-800">{s.val}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   APPLIED — Left Content
   ═══════════════════════════════════════════════════ */
function AppliedContent({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <div className="space-y-6">
      {/* Application Status Card */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t("applied.submitted")}</h3>
            <p className="text-[11px] text-slate-400">{t("applied.beingReviewed")}</p>
          </div>
        </div>
        <p className="text-xs font-bold text-blue-600 mb-2">{t("applied.pendingReview")}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">{t("applied.reviewNote")}</p>
      </div>

      {/* Budget & Deadline */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-emerald-50 px-4 py-3 rounded-2xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">₹</div>
          <div>
            <p className="text-xs font-black text-slate-800">{campaign.budget}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl">
          <Calendar size={14} className="text-slate-400" />
          <p className="text-xs font-bold text-slate-800">{campaign.deadline}</p>
        </div>
      </div>

      {/* Application Timeline */}
      {campaign.timeline && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800">{t("applied.timeline")}</h3>
          <div className="relative space-y-6 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {campaign.timeline.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center z-10 ${step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>
                  {step.done ? <CheckCircle size={14} /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${step.done ? "text-slate-800" : "text-slate-400"}`}>{step.label}</p>
                  <p className="text-[10px] text-slate-400">{step.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   APPLIED — Right Sidebar
   ═══════════════════════════════════════════════════ */
function AppliedSidebar({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <>
      {/* Application Status */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{t("applied.submitted")}</p>
            <p className="text-[10px] text-blue-600 font-bold">{t("applied.pendingReview")}</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="relative space-y-4 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-blue-100">
          {[
            { label: t("applied.steps.applied"), done: true },
            { label: t("applied.steps.underReview"), done: false },
            { label: t("applied.steps.shortlisted"), done: false },
            { label: t("applied.steps.approved"), done: false },
          ].map((step, i) => (
            <div key={i} className="relative flex items-center gap-3">
              <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center z-10 ${step.done ? "bg-blue-500 text-white" : "bg-white border-2 border-blue-200"}`}>
                {step.done && <CheckCircle size={12} />}
              </div>
              <p className={`text-xs font-bold ${step.done ? "text-blue-600" : "text-slate-400"}`}>{step.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-slate-800">{t("applied.campaignDetails")}</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-slate-800">{campaign.budget}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{t("active.budget")}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-slate-800">{campaign.deadline}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{t("applied.deadline")}</p>
          </div>
        </div>
      </div>

      {/* Placeholder for old otherNotes */}
      {campaign.otherNotes && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800">{t("applied.otherNotes")}</h4>
          <ul className="space-y-2">
            {campaign.otherNotes.map((note, i) => (
              <li key={i} className="text-[11px] text-slate-500 flex gap-2 leading-relaxed">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Match Score */}
      {campaign.matchScore && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{t("applied.matchScore")}</p>
            <p className="text-sm font-bold text-slate-800">{t("applied.profileFit")}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <span className="text-lg font-black text-emerald-600">{campaign.matchScore}</span>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   COMPLETED — Left Content
   ═══════════════════════════════════════════════════ */
function CompletedContent({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <div className="space-y-6">
      {/* Payment Status */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("completedContent.paymentStatus")}</p>
            <p className="text-sm font-black text-emerald-600">{campaign.paymentStatus}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("completedContent.earnings")}</p>
          <p className="text-xl font-black text-slate-900">{campaign.paymentAmount}</p>
        </div>
      </div>

      {/* Performance Highlights */}
      {campaign.performance && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center text-white">
              <BarChart3 size={14} />
            </div>
            <h3 className="font-bold text-slate-900">{t("completedContent.performanceHighlights")}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Eye size={12} className="text-orange-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("completedContent.totalViews")}</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.totalViews}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Heart size={12} className="text-emerald-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("completedContent.engagement")}</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.engagement}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Users size={12} className="text-blue-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("completedContent.reach")}</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.reach}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Bookmark size={12} className="text-amber-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">{t("completedContent.saves")}</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.saves}</p>
            </div>
          </div>

          {/* Bottom stats row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">{campaign.performance.likes}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">{t("completedContent.likes")}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">{campaign.performance.comments}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">{t("completedContent.comments")}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">{campaign.performance.shares}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">{t("completedContent.shares")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Delivered */}
      {campaign.contentDelivered && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">{t("completedContent.contentDelivered")}</h3>
          <div className="space-y-2.5">
            {campaign.contentDelivered.map((item, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">{item.type}</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{item.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-800">{item.views}</p>
                  <p className="text-[9px] text-slate-400">{t("completedContent.views")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   COMPLETED — Right Sidebar
   ═══════════════════════════════════════════════════ */
function CompletedSidebar({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  return (
    <>
      {/* Brand Feedback */}
      {campaign.brandFeedback && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-800">{t("completedSidebar.brandFeedback")}</h4>
            <div className="flex gap-0.5">
              {[...Array(campaign.brandFeedback.rating)].map((_, i) => (
                <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">{campaign.initials}</div>
            <div>
              <p className="text-xs font-bold text-slate-800">{campaign.brandName}</p>
              <p className="text-[10px] text-slate-400">{t("completedSidebar.brandPartner")}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic leading-relaxed">{campaign.brandFeedback.text}</p>
        </div>
      )}

      {/* Congratulations Card */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-100">
        <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
          <Star size={28} />
        </div>
        <h4 className="text-base font-black text-slate-900 mb-1">{t("completedSidebar.congratulations")}</h4>
        <p className="text-[11px] text-slate-400 mb-4">{t("completedSidebar.congratsNote")}</p>
        <button className="w-full h-11 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer">
          <Share2 size={16} /> {t("completedSidebar.shareResults")}
        </button>
      </div>

      {/* Campaign Summary */}
      {campaign.campaignSummary && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800">{t("completedSidebar.campaignSummary")}</h4>
          <div className="space-y-2">
            {[
              { label: t("completedSidebar.duration"), val: campaign.campaignSummary.duration },
              {
                label: t("completedSidebar.contentPieces"),
                val: campaign.campaignSummary.contentPieces,
              },
              {
                label: t("completedSidebar.avgEngagement"),
                val: campaign.campaignSummary.avgEngagement,
              },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center">
                <p className="text-[11px] text-slate-400">{row.label}</p>
                <p className="text-xs font-bold text-slate-800">{row.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════
   SIMILAR CAMPAIGNS — Shared
   ═══════════════════════════════════════════════════ */
function SimilarCampaigns({ campaign }) {
  const t = useTranslations("InfluencerOffersId");
  const [similar, setSimilar] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSimilar = async () => {
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
          const tags = campaign?.tags || [];
          const filtered = data.campaigns
            .filter((c) => c.id !== campaign?.id && c.status === "Active")
            .filter((c) => tags.length === 0 || c.tags?.some((t) => tags.some((ct) => t.toLowerCase().includes(ct.toLowerCase()))))
            .slice(0, 4);
          setSimilar(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch similar campaigns:", err);
      }
    };
    if (campaign) fetchSimilar();
  }, [campaign]);

  const handleSeeAll = () => {
    const category = campaign?.tags?.[0] || "";
    router.push(`/influencer/campaigns${category ? `?category=${encodeURIComponent(category)}` : ""}`);
  };

  if (similar.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-800">{t("similar.title")}</h4>
        <button onClick={handleSeeAll} className="text-[10px] font-bold text-pink-500 cursor-pointer hover:underline">{t("similar.viewAll")}</button>
      </div>
      <div className="space-y-3">
        {similar.map((c) => (
          <div
            key={c.id}
            onClick={() => router.push(`/influencer/offers/${c.id}`)}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-xl p-2 -mx-2 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {c.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{c.title}</p>
              <p className="text-[10px] text-slate-400">{c.brandName} · {c.budget}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_STEPS = [
  { key: "pending", label: "Applied" },
  // B15 negotiation flow — the brand replies to an application with a
  // priced offer; the creator accepts (one shot, no counter) and the
  // brand then funds escrow, which flips the row to "approved".
  { key: "offer_sent", label: "Offer Received" },
  { key: "offer_accepted", label: "Offer Accepted" },
  { key: "approved", label: "Escrow Funded" },
  { key: "submitted", label: "Deliverables Submitted" },
  { key: "accepted", label: "Work Accepted" },
  { key: "live_submitted", label: "Live Links Submitted" },
  { key: "payment", label: "Payment in Progress" },
  { key: "completed", label: "Completed" },
];

// These statuses branch off the main flow
const SPECIAL_STATUSES = {
  revision_needed: { label: "Revision Requested", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: "⟳" },
  rejected: { label: "Rejected", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: "✕" },
  withdrawn: { label: "Withdrawn", color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: "✕" },
};

// B15 — the creator's response to a priced offer. One shot: accept
// locks the rate in and tells the brand to fund escrow; withdraw ends
// the application. No counter-offer round exists by design.
function OfferResponseCard({ campaign, refetch }) {
  const t = useTranslations("InfluencerOffersId");
  const { user } = useAuth();
  const supabase = createClient();
  const [busy, setBusy] = useState(null); // "accept" | "withdraw" | null
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [popup, setPopup] = useState(null);
  const offer = Number(campaign?.brandOfferedRate || 0);

  const respond = async (nextStatus) => {
    if (!user?.id || !campaign?.applicationId) return;
    setBusy(nextStatus === "offer_accepted" ? "accept" : "withdraw");
    try {
      const { data, error } = await supabase.functions.invoke("update-application-status", {
        body: {
          applicationId: campaign.applicationId,
          influencerId: user.id,
          status: nextStatus,
        },
      });
      if (error || data?.error) {
        setPopup(error?.message || data?.error || t("offer.updateError"));
        return;
      }
      refetch?.();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-black text-sm shrink-0">₹</div>
        <div>
          <p className="text-sm font-black text-purple-800">
            {t("offer.offerAmount", { amount: offer.toLocaleString("en-IN") })}
          </p>
          <p className="text-[11px] text-purple-600">
            {Number(campaign?.proposedRate || 0) > 0 && offer !== Number(campaign.proposedRate)
              ? t("offer.counteredNote", { amount: Number(campaign.proposedRate).toLocaleString("en-IN") })
              : t("offer.approvedNote")}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-purple-700 leading-relaxed">
        {t("offer.lockItInNote")}
      </p>
      {!confirmWithdraw ? (
        <div className="flex gap-2">
          <button
            onClick={() => respond("offer_accepted")}
            disabled={!!busy}
            className="flex-1 h-11 rounded-xl text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {busy === "accept" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {t("offer.acceptAmount", { amount: offer.toLocaleString("en-IN") })}
          </button>
          <button
            onClick={() => setConfirmWithdraw(true)}
            disabled={!!busy}
            className="h-11 px-4 rounded-xl border border-purple-200 bg-white text-purple-700 text-sm font-bold cursor-pointer disabled:opacity-60"
          >
            {t("offer.withdraw")}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-white rounded-xl border border-red-200 space-y-2">
          <p className="text-[11px] font-bold text-red-600">
            {t("offer.withdrawConfirm")}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => respond("withdrawn")}
              disabled={!!busy}
              className="flex-1 h-9 rounded-lg bg-red-600 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {busy === "withdraw" ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              {t("offer.yesWithdraw")}
            </button>
            <button
              onClick={() => setConfirmWithdraw(false)}
              disabled={!!busy}
              className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-bold cursor-pointer"
            >
              {t("offer.keepOffer")}
            </button>
          </div>
        </div>
      )}
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
}

function ApplicationStatusBar({ status = "pending", campaign, refetch, compact = false }) {
  const t = useTranslations("InfluencerOffersId");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const isSpecial = SPECIAL_STATUSES[status];
  const isRevision = status === "revision_needed";
  const isRejected = status === "rejected";
  // For revision, show progress up to "submitted" level (index 2) since they need to resubmit
  const effectiveStatus = isRevision ? "submitted" : isRejected ? "submitted" : status;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === effectiveStatus);
  const currentStep = isSpecial ? { label: isSpecial.label } : STATUS_STEPS[Math.max(currentStepIndex, 0)] || STATUS_STEPS[0];
  const currentStepLabel = isSpecial
    ? t(`specialStatus.${status}`)
    : t(`statusSteps.${(STATUS_STEPS[Math.max(currentStepIndex, 0)] || STATUS_STEPS[0]).key}`);
  const canUpload = status === "approved" || status === "revision_needed" || status === "accepted";
  const hasOffer = status === "offer_sent";
  const waitingEscrow = status === "offer_accepted";

  if (compact) {
    return (
      <div className="space-y-2">
        {/* B15 — priced offer waiting for the creator's response takes
            over the whole compact bar; the status chip would be
            redundant next to the Accept CTA. */}
        {hasOffer ? (
          <OfferResponseCard campaign={campaign} refetch={refetch} />
        ) : (
        <div className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold ${
          isRejected ? "bg-red-500 text-white" : isRevision ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
        }`}>
          {isRejected ? <X size={16} /> : isRevision ? <Clock size={16} /> : <CheckCircle size={16} />} {currentStepLabel}
        </div>
        )}
        {waitingEscrow && (
          <p className="text-[11px] text-center text-slate-500 font-semibold">
            {t("statusBar.offerAcceptedWaiting")}
          </p>
        )}
        {canUpload && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            <Upload size={16} /> {isRevision ? t("statusBar.resubmitDeliverables") : status === "accepted" ? t("statusBar.submitLiveLinks") : t("statusBar.uploadSubmission")}
          </button>
        )}
        {showSubmitModal && (
          <SubmitDeliverablesModal
            campaign={campaign}
            onClose={() => setShowSubmitModal(false)}
            onSuccess={() => { setShowSubmitModal(false); refetch?.(); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FD] rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
      <h4 className="text-base font-black text-slate-800">{t("statusBar.applicationStatus")}</h4>

      {/* B15 — offer response card sits above the step tracker so the
          Accept CTA is impossible to miss. */}
      {hasOffer && <OfferResponseCard campaign={campaign} refetch={refetch} />}
      {waitingEscrow && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-[12px] font-bold text-emerald-700">
            {t("statusBar.acceptedWaiting", { amount: Number(campaign?.brandOfferedRate || 0).toLocaleString("en-IN") })}
          </p>
        </div>
      )}
      <div className="relative pl-7">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-[3px] rounded-full overflow-hidden">
          <div className="w-full bg-slate-200 h-full" />
          <div
            className="w-full bg-emerald-500 absolute top-0 left-0 transition-all duration-500"
            style={{ height: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />
        </div>
        {STATUS_STEPS.map((step, i) => {
          const isDone = i < currentStepIndex;
          const isCurrent = i === currentStepIndex;
          return (
            <div key={step.key} className="relative flex items-center gap-4 pb-6 last:pb-0">
              {/* Circle */}
              <div className={`absolute -left-7 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all ${
                isDone
                  ? "bg-emerald-500 text-white shadow-sm"
                  : isCurrent
                    ? "bg-slate-700 text-white shadow-md ring-4 ring-slate-200"
                    : "bg-white border-2 border-slate-200"
              }`}>
                {isDone && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {isCurrent && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
              </div>
              {/* Label */}
              <p className={`text-sm font-bold ${
                isDone ? "text-emerald-600" : isCurrent ? "text-slate-900" : "text-slate-400"
              }`}>
                {t(`statusSteps.${step.key}`)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Revision requested banner */}
      {isRevision && (() => {
        let note = "";
        let revisionLinks = [];
        try {
          const parsed = typeof campaign?.rejectionReason === "string" ? JSON.parse(campaign.rejectionReason) : campaign?.rejectionReason;
          note = parsed?.note || "";
          revisionLinks = parsed?.links || [];
        } catch {
          note = campaign?.rejectionReason || "";
        }
        return (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 text-sm font-bold shrink-0">⟳</div>
              <p className="text-sm font-bold text-amber-700">{t("statusBar.revisionRequested")}</p>
            </div>
            {note && <p className="text-xs text-amber-700 leading-relaxed pl-9">{note}</p>}
            {revisionLinks.length > 0 && (
              <div className="pl-9 space-y-1.5">
                <p className="text-[10px] font-bold text-amber-600 uppercase">{t("statusBar.deliverablesToRevise")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {revisionLinks.map((link, i) => (
                    <span key={i} className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">{link}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Rejected banner */}
      {isRejected && (() => {
        let reason = "";
        try {
          const parsed = typeof campaign?.rejectionReason === "string" ? JSON.parse(campaign.rejectionReason) : campaign?.rejectionReason;
          reason = parsed?.note || parsed?.reason || (typeof campaign?.rejectionReason === "string" ? campaign.rejectionReason : "");
        } catch {
          reason = campaign?.rejectionReason || "";
        }
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-sm font-bold shrink-0">✕</div>
              <p className="text-sm font-bold text-red-700">{t("statusBar.applicationRejected")}</p>
            </div>
            {reason && <p className="text-xs text-red-600 leading-relaxed pl-9">{reason}</p>}
          </div>
        );
      })()}

      {/* Upload / Resubmit button */}
      {canUpload && (
        <button
          onClick={() => setShowSubmitModal(true)}
          className="w-full h-12 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
          style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
        >
          <Upload size={16} /> {isRevision ? t("statusBar.resubmitDeliverables") : status === "accepted" ? t("statusBar.submitLiveLinks") : t("statusBar.uploadSubmission")}
        </button>
      )}

      {/* Submitted deliverables — always visible when links exist */}
      {campaign?.submissionLinks?.length > 0 && (
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-500" /> {t("statusBar.yourSubmissions")}
          </h4>
          <div className="space-y-2">
            {campaign.submissionLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center shrink-0">
                  <Instagram size={14} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{link.label || link.type}</p>
                  <p className="text-[11px] font-bold text-slate-700 truncate">{link.url}</p>
                </div>
                <ExternalLink size={12} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {showSubmitModal && (
        <SubmitDeliverablesModal
          campaign={campaign}
          onClose={() => setShowSubmitModal(false)}
          onSuccess={() => { setShowSubmitModal(false); refetch?.(); }}
        />
      )}
    </div>
  );
}

function SubmitDeliverablesModal({ campaign, onClose, onSuccess }) {
  const t = useTranslations("InfluencerOffersId");
  const router = useRouter();
  const isRevision = campaign?.applicationStatus === "revision_needed";

  // Parse revision info
  let revisionNote = "";
  let revisionRequested = [];
  let revisionFrom = "";
  if (isRevision && campaign?.rejectionReason) {
    try {
      const parsed = typeof campaign.rejectionReason === "string" ? JSON.parse(campaign.rejectionReason) : campaign.rejectionReason;
      revisionNote = parsed?.note || "";
      revisionRequested = (parsed?.links || []).map((l) => l.toLowerCase());
      revisionFrom = parsed?.from || "";
    } catch {}
  }

  // True when the user is submitting live links — either initial accepted
  // state OR a revision after live_submitted. We never prefill the URL
  // fields in this flow; they should always start empty so the user pastes
  // fresh post URLs.
  const isLiveLinksFlow =
    campaign?.applicationStatus === "accepted" ||
    (isRevision && revisionFrom === "live_submitted");

  // Parse content_types_required: ["reels:2", "stories:3"] → [{type: "reels", count: 2}, ...]
  const deliverables = (campaign?.contentTypesRequired || []).flatMap((item) => {
    const [type, countStr] = item.split(":");
    const count = parseInt(countStr) || 1;
    const baseLabel = type.charAt(0).toUpperCase() + type.slice(1);
    return Array.from({ length: count }, (_, i) => {
      const itemLabel = `${baseLabel} ${count > 1 ? i + 1 : ""}`.trim();
      const itemLabelLc = itemLabel.toLowerCase();
      const typeLc = type.toLowerCase();
      // needsRevision is true when:
      //  - we aren't revising at all (normal submission flow), OR
      //  - the brand requested a blanket revision (no specific items), OR
      //  - the revision labels include this specific item (compare the full
      //    "Reels 2"-style label, not just the base "Reels")
      const needsRevision =
        !isRevision ||
        revisionRequested.length === 0 ||
        revisionRequested.some(
          (r) =>
            itemLabelLc === r ||
            itemLabelLc.includes(r) ||
            r.includes(itemLabelLc) ||
            typeLc === r
        );
      return {
        key: `${type}_${i + 1}`,
        label: itemLabel,
        type,
        needsRevision,
      };
    });
  });

  // Prefill with existing submission links if revising deliverables.
  // Live-links flow always starts empty — `submission_links` from a prior
  // "submitted" stage are deliverable URLs, not live post URLs, so we
  // shouldn't carry them over.
  const [links, setLinks] = useState(() => {
    const initial = {};
    const existingLinks = isLiveLinksFlow ? [] : (campaign?.submissionLinks || []);
    deliverables.forEach((d, i) => {
      const matchByLabel = existingLinks.find((el) => el.label === d.label);
      const matchByIndex = existingLinks[i];
      const existing = matchByLabel || matchByIndex;

      if (isRevision && d.needsRevision) {
        initial[d.key] = "";
      } else if (existing?.url && !isLiveLinksFlow) {
        initial[d.key] = existing.url;
      } else {
        initial[d.key] = "";
      }
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // AI compliance pre-check — runs the draft caption against the campaign's
  // requirements (brand tag, required hashtags, ASCI #ad/#collab disclosure,
  // dos/donts) BEFORE the brand ever sees it. Optional, campaign-aware.
  const [caption, setCaption] = useState("");
  const [checkOpen, setCheckOpen] = useState(false);
  const [complianceCopied, setComplianceCopied] = useState(false);
  const {
    generate: runCompliance,
    loading: checking,
    result: complianceResult,
    error: complianceErr,
    limitReached: complianceLimit,
    setResult: setComplianceResult,
  } = useAiTool();

  const handleCompliance = () => {
    if (!caption.trim()) return;
    runCompliance({
      tool: "compliance",
      campaignId: campaign?.id,
      inputs: { draft_caption: caption.trim() },
    });
  };

  // All deliverables must have links — non-revision ones are prefilled so they pass
  const allFilled = deliverables.length > 0 && deliverables.every((d) => links[d.key]?.trim());

  // Per-input link analysis. We split it into two passes:
  //   - Duplicates always count (any flow): two deliverables can't share a URL.
  //   - Reel / post / story type detection is ONLY meaningful on the live
  //     links stage. Initial deliverable uploads accept any media URL —
  //     drafts can be Google Drive folders, WeTransfer links, watermarked
  //     mp4s on Notion, whatever — so we skip the type badges there.
  const linkAnalysis = useMemo(() => {
    const counts = new Map();
    deliverables.forEach((d) => {
      const url = links[d.key]?.trim();
      if (!url) return;
      const key = normaliseInstagramUrl(url);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const out = {};
    deliverables.forEach((d) => {
      const url = links[d.key]?.trim();
      const norm = url ? normaliseInstagramUrl(url) : "";
      const duplicate = !!norm && (counts.get(norm) || 0) > 1;
      if (!isLiveLinksFlow) {
        // Initial submission: skip type/expected entirely.
        out[d.key] = { detected: null, expected: null, mismatch: false, duplicate };
        return;
      }
      if (!url) {
        out[d.key] = { detected: null, expected: expectedLinkType(d.type), mismatch: false, duplicate: false };
        return;
      }
      const detected = detectInstagramLinkType(url);
      const expected = expectedLinkType(d.type);
      const mismatch = expected && detected !== "unknown" && detected !== expected;
      out[d.key] = { detected, expected, mismatch, duplicate };
    });
    return out;
  }, [links, deliverables, isLiveLinksFlow]);

  const hasDuplicates = Object.values(linkAnalysis).some((a) => a.duplicate);

  const handleSubmit = async () => {
    if (!allFilled || submitting) return;
    if (hasDuplicates) {
      setError(t("modal.duplicateError"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const submissionLinks = deliverables.map((d) => ({
        type: d.type,
        label: d.label,
        url: links[d.key],
      }));

      const res = await fetch(`${supabaseUrl}/functions/v1/submit-deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ applicationId: campaign?.applicationId, submissionLinks }),
      });

      const data = await res.json();
      if (data?.error) { setError(data.error); return; }
      if (data?.success) onSuccess();
    } catch (err) {
      setError(err.message || t("modal.failedToSubmit"));
    } finally {
      setSubmitting(false);
    }
  };

  const isLiveSubmit = isLiveLinksFlow;
  const heading = isLiveSubmit ? t("modal.submitLiveLinksHeading") : t("modal.uploadSubmissions");

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed inset-0 z-[151] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-lg lg:max-h-[85vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* Header — shrink-0 so it doesn't get pushed by the form */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="text-base font-bold text-slate-900 truncate">{heading}</h2>
            <p className="text-[11px] text-slate-400 truncate">{t("modal.titleDeliverables", { title: campaign?.title, count: deliverables.length })}</p>
            {isLiveSubmit && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 leading-tight">
                {t("modal.postThenPaste")}
              </p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {isRevision && revisionNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">{t("modal.revisionNote")}</p>
              <p className="text-xs text-amber-700">{revisionNote}</p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            {isRevision
              ? t("modal.instructionsRevision")
              : isLiveLinksFlow
                ? t("modal.instructionsLive")
                : t("modal.instructionsDraft")}
          </p>

          {deliverables.map((d) => {
            const analysis = linkAnalysis[d.key] || {};
            const { detected, expected, mismatch, duplicate } = analysis;
            const hasUrl = !!links[d.key]?.trim();
            // Drafts are the content file for brand review (Drive, WeTransfer,
            // an mp4, etc.) — NOT the live post. If the creator pastes an
            // Instagram link here, gently tell them it isn't needed yet.
            const isDraftInstagramLink =
              !isLiveLinksFlow && hasUrl && !!normaliseInstagramUrl(links[d.key]);
            const placeholder = !isLiveLinksFlow
              ? t("modal.placeholderAnyMedia")
              : expected === "story"
                ? "https://www.instagram.com/stories/..."
                : expected === "post"
                  ? "https://www.instagram.com/p/..."
                  : "https://www.instagram.com/reel/...";
            return (
              <div key={d.key} className={`space-y-1.5 ${isRevision && d.needsRevision ? "p-3 -mx-3 bg-amber-50/50 rounded-xl border border-amber-100" : ""}`}>
                <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 flex-wrap">
                  <Instagram size={12} className="text-pink-500" />
                  <span className={isRevision && d.needsRevision ? "text-amber-700" : "text-slate-500"}>{d.label}</span>
                  {expected && (
                    <span className="text-[9px] font-bold text-slate-400 normal-case">
                      {t("modal.expectingUrl", { type: labelForLinkType(expected) })}
                    </span>
                  )}
                  {isRevision && d.needsRevision && <span className="text-[8px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-black">{t("modal.revise")}</span>}
                  {isRevision && !d.needsRevision && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black">{t("modal.ok")}</span>}
                </label>
                <input
                  type="url"
                  placeholder={placeholder}
                  value={links[d.key]}
                  onChange={(e) => setLinks((prev) => ({ ...prev, [d.key]: e.target.value }))}
                  disabled={isRevision && !d.needsRevision}
                  className={`w-full py-3 px-4 border rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all ${
                    isRevision && !d.needsRevision
                      ? "bg-slate-100 border-slate-100 opacity-60 cursor-not-allowed"
                      : duplicate || mismatch
                        ? "bg-white border-rose-300 focus:border-rose-400"
                        : isRevision && d.needsRevision
                          ? "bg-white border-amber-200 focus:border-amber-400"
                          : "bg-slate-50 border-slate-100 focus:border-pink-200 focus:bg-white"
                  }`}
                />
                {isDraftInstagramLink && (
                  <div className="flex items-start gap-1.5 text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1.5 rounded-lg leading-relaxed">
                    <span className="shrink-0 font-black">ℹ</span>
                    <span>
                      {t("modal.draftInstagramNote")}
                    </span>
                  </div>
                )}
                {hasUrl && (detected || mismatch || duplicate) && (
                  <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
                    {detected && detected !== "unknown" && !mismatch && (
                      <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {t("modal.detected", { type: labelForLinkType(detected) })}
                      </span>
                    )}
                    {mismatch && (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {t("modal.mismatch", { detected: labelForLinkType(detected), expected: labelForLinkType(expected) })}
                      </span>
                    )}
                    {detected === "unknown" && (
                      <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {t("modal.notInstagramUrl")}
                      </span>
                    )}
                    {duplicate && (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        {t("modal.duplicateBadge")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {deliverables.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">{t("modal.noDeliverables")}</div>
          )}

          {/* AI Compliance Pre-Check — optional, catches missing #ad / brand tag / hashtags before the brand sees it */}
          <div className="mt-2 rounded-2xl border border-purple-100 bg-gradient-to-br from-[#9810FA]/[0.03] to-[#E60076]/[0.03] overflow-hidden">
            <button
              type="button"
              onClick={() => setCheckOpen((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-left"
            >
              <ShieldCheck size={16} className="text-[#9810FA] shrink-0" />
              <span className="text-xs font-bold text-slate-700 flex-1">{t("compliance.title")}</span>
              <ChevronRight size={15} className={`text-slate-400 transition-transform ${checkOpen ? "rotate-90" : ""}`} />
            </button>

            {checkOpen && (
              <div className="px-4 pb-4 space-y-3">
                <p className="text-[11px] text-slate-500 leading-snug">{t("compliance.subtitle")}</p>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  placeholder={t("compliance.placeholder")}
                  className="w-full py-2.5 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-purple-300 resize-none"
                />

                {!complianceLimit && (
                  <button
                    type="button"
                    onClick={handleCompliance}
                    disabled={checking || !caption.trim()}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-xs shadow-lg shadow-pink-100 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} />
                    {checking ? t("compliance.checking") : t("compliance.run")}
                  </button>
                )}

                {complianceLimit && (
                  <div className="text-center bg-white rounded-xl p-3 border border-slate-100">
                    <p className="text-[11px] text-slate-600 mb-2">{t("compliance.limit")}</p>
                    <button type="button" onClick={() => router.push("/influencer/pricing")} className="h-8 px-3 rounded-lg bg-[#9810FA] text-white text-[11px] font-bold">
                      {t("compliance.upgrade")}
                    </button>
                  </div>
                )}

                {complianceErr && !complianceLimit && <p className="text-[11px] text-rose-500">{complianceErr}</p>}

                {complianceResult && (
                  <div className="bg-white rounded-xl p-3 border border-purple-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold text-[#9810FA] uppercase tracking-wider">{t("compliance.resultTitle")}</span>
                      <button
                        type="button"
                        onClick={async () => { await navigator.clipboard.writeText(complianceResult); setComplianceCopied(true); setTimeout(() => setComplianceCopied(false), 1500); }}
                        className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-[10px] font-bold"
                      >
                        {complianceCopied ? <Check size={12} /> : <Copy size={12} />} {complianceCopied ? t("compliance.copied") : t("compliance.copy")}
                      </button>
                    </div>
                    <AiMarkdown text={complianceResult} className="text-[11.5px]" />
                    <button type="button" onClick={() => setComplianceResult("")} className="mt-2 text-[10px] font-bold text-[#9810FA]">{t("compliance.recheck")}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer — shrink-0 so it stays anchored at the bottom */}
        <div
          className="shrink-0 flex gap-3 px-5 py-4 border-t border-slate-100 bg-white"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">{t("modal.cancel")}</button>
          <button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="flex-1 h-12 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting
              ? t("modal.submitting")
              : isLiveSubmit && isRevision
                ? t("modal.resubmitLiveLinks", { count: deliverables.filter((d) => d.needsRevision).length })
                : isLiveSubmit
                  ? t("modal.submitLiveLinks", { count: deliverables.length })
                  : isRevision
                    ? t("modal.resubmitDeliverables", { count: deliverables.filter((d) => d.needsRevision).length })
                    : t("modal.submitDeliverables", { count: deliverables.length })}
          </button>
        </div>
      </div>
    </>
  );
}
