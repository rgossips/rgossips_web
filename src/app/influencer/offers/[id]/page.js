"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { ApplyCampaignForm } from "@/components/ApplyCampaignForm";

/* ─── Fetch campaign from DB ─── */
function useCampaign(id) {
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

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
          body: JSON.stringify({}),
        });

        const data = await res.json();
        const found = data?.campaigns?.find((c) => c.id === id);
        if (found) {
          // Enrich with display fields the UI expects
          setCampaign({
            ...found,
            heroImg: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
            slots: found.maxInfluencers || 0,
            about: found.description || "No description available for this campaign.",
            requirements: [
              { icon: "users", label: `Min Followers: ${found.tags?.length > 0 ? "1K+" : "Any"}`, sub: "Minimum requirement" },
              { icon: "trending", label: `Category: ${found.tags?.[0] || "Any"}`, sub: "Target niche" },
              { icon: "star", label: `Location: ${found.location}`, sub: "Target region" },
            ],
            payments: [
              { type: "base", label: "Base Payment", val: found.budget, sub: "Per influencer" },
            ],
            brandStats: { campaigns: 0, success: "—", response: "—" },
            deliverableIcons: found.deliverables ? found.deliverables.split(" + ").map((d) => {
              const parts = d.split(":");
              return { platform: "instagram", count: parts[1] || "1", label: parts[0] || d };
            }) : [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  return { campaign, loading };
}

const _REMOVED = [
  {
    deadline: "Apr 15, 2026",
    daysLeft: "20d",
    deliverables: "2 Reels + 2 Stories",
    location: "Mumbai",
    platforms: ["instagram", "tiktok"],
    heroImg:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80",
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
    proTips: [
      "Tag the brand in all posts and stories",
      "Use natural lighting for best results",
      "Engage with comments within the first hour",
    ],
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
    heroImg:
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80",
    brandStats: { campaigns: 312, success: "97%", response: "12h" },
    slots: 30,
    about:
      "Nike India is launching a new running gear collection. We need fitness influencers to create authentic content showcasing the products in action.",
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
    proTips: [
      "Show the product in real workout scenarios",
      "Mention comfort and fit in your review",
    ],
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
    heroImg:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80",
    applicationDate: "Jan 18, 2026",
    applicationNote:
      "Your profile is a great fit and we're glad to see you apply! It may take 3-5 business days to process.",
    estimatedReach: "1.25K",
    estimatedEngagement: "4.8%",
    otherNotes: [
      "Do not delete/archive any Reel, Short or content during or a week after the campaign duration.",
      "Content schedule: Post 3 days before event and engage content.",
    ],
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
    heroImg:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80",
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

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function CampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const { campaign, loading } = useCampaign(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-purple-500" />
          <p className="text-sm font-bold text-slate-400">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-bold text-slate-600">Campaign not found</p>
          <button onClick={() => router.back()} className="text-sm text-purple-500 font-bold hover:underline cursor-pointer">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isActive = campaign.status === "Active";
  const isApplied = campaign.status === "Applied";
  const isCompleted = campaign.status === "Completed";

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-20 lg:pb-0 font-sans lg:mt-20">
      <AnimatePresence>
        {isApplyOpen && (
          <ApplyCampaignForm
            onClose={() => setIsApplyOpen(false)}
            campaignData={campaign}
          />
        )}
      </AnimatePresence>

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-4 lg:mb-6"
        >
          <ChevronLeft size={16} /> Back to Campaigns
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-32 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative h-[200px] lg:h-[280px] rounded-2xl lg:rounded-3xl overflow-hidden">
              <img
                src={campaign.heroImg}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Action buttons on image */}
              <div className="absolute top-4 right-4 flex gap-2">
                {isCompleted && (
                  <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full">
                    Completed
                  </span>
                )}
                <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <Share2 size={16} />
                </button>
                <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                  <Heart size={16} />
                </button>
              </div>

              {/* Initials badge */}
              <div className="absolute bottom-4 left-4 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl lg:text-2xl font-bold shadow-lg border-2 border-white/20">
                {campaign.initials}
              </div>
            </div>

            {/* Title & Brand */}
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 mb-1">
                {campaign.title}
              </h1>
              <p className="text-sm text-slate-400 font-medium">
                {campaign.brandName}{" "}
                <CheckCircle2
                  size={14}
                  className="inline text-blue-500 fill-blue-50"
                />
              </p>
            </div>

            {/* ─── ACTIVE VIEW ─── */}
            {isActive && <ActiveContent campaign={campaign} />}

            {/* ─── APPLIED VIEW ─── */}
            {isApplied && <AppliedContent campaign={campaign} />}

            {/* ─── COMPLETED VIEW ─── */}
            {isCompleted && <CompletedContent campaign={campaign} />}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">
            <div className="lg:sticky lg:top-8 space-y-5">
              {/* ─── Active Sidebar ─── */}
              {isActive && (
                <ActiveSidebar
                  campaign={campaign}
                  onApply={() => setIsApplyOpen(true)}
                />
              )}

              {/* ─── Applied Sidebar ─── */}
              {isApplied && <AppliedSidebar campaign={campaign} />}

              {/* ─── Completed Sidebar ─── */}
              {isCompleted && <CompletedSidebar campaign={campaign} />}

              {/* Similar Campaigns — shared */}
              <SimilarCampaigns />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating bar — Active only */}
      {isActive && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm shadow-lg bg-gradient-to-r from-[#9810FA] to-[#E60076] flex items-center justify-center gap-2"
          >
            Apply for Campaign <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ACTIVE — Left Content
   ═══════════════════════════════════════════════════ */
function ActiveContent({ campaign }) {
  return (
    <div className="space-y-6">
      {/* Brand stats row */}
      {campaign.brandStats && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
            {campaign.initials}
          </div>
          <div className="flex gap-2">
            {[
              { val: campaign.brandStats.campaigns, label: "Campaigns" },
              { val: campaign.brandStats.success, label: "Success" },
              { val: campaign.brandStats.response, label: "Response" },
            ].map((s, i) => (
              <div
                key={i}
                className="text-center px-3 py-1.5 bg-slate-50 rounded-xl"
              >
                <p className="text-xs font-black text-slate-800">{s.val}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget / Deadline / Slots pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-2xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">
            ₹
          </div>
          <div>
            <p className="text-xs font-black text-slate-800">
              {campaign.budget}
            </p>
            <p className="text-[9px] text-slate-400">Budget</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-2xl">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
            <Calendar size={14} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800">
              {campaign.deadline}
            </p>
            <p className="text-[9px] text-red-400">{campaign.daysLeft} left</p>
          </div>
        </div>
        {campaign.slots && (
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2.5 rounded-2xl">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500">
              <Users size={14} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">
                {campaign.slots} slots
              </p>
              <p className="text-[9px] text-slate-400">Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Deliverables */}
      {campaign.deliverableIcons && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">
            Content Deliverables
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {campaign.deliverableIcons.map((d, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <PlatformIcon platform={d.platform} size={20} />
                </div>
                <p className="text-2xl font-black text-slate-800">{d.count}</p>
                <p className="text-[10px] font-bold text-slate-400">
                  {d.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Campaign */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-800">About Campaign</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {campaign.about}
        </p>
      </div>

      {/* Requirements */}
      {campaign.requirements && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">Requirements</h3>
          <div className="space-y-2.5">
            {campaign.requirements.map((req, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-50 shadow-sm"
              >
                <div className="w-9 h-9 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                  <ReqIcon type={req.icon} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {req.label}
                  </p>
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
            <h3 className="text-base font-bold text-slate-800">
              Payment & Benefits
            </h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase">
              <ShieldCheck size={12} /> Verified
            </span>
          </div>
          <div className="space-y-2.5">
            {campaign.payments.map((p, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-4 rounded-2xl border shadow-sm ${
                  p.type === "product"
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-100"
                    : "bg-white border-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    p.type === "base"
                      ? "bg-emerald-50 text-emerald-500"
                      : p.type === "bonus"
                        ? "bg-pink-50 text-pink-500"
                        : "bg-purple-50 text-purple-500"
                  }`}
                >
                  {p.type === "base" ? (
                    <Wallet size={18} />
                  ) : p.type === "bonus" ? (
                    <TrendingUp size={18} />
                  ) : (
                    <Gift size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {p.label}
                  </p>
                  <p className="text-sm font-black text-slate-800">{p.val}</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 max-w-[100px] text-right hidden sm:block">
                  {p.sub}
                </p>
              </div>
            ))}
          </div>
          {/* Exclusive banner */}
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-2xl p-4 flex items-center gap-3">
            <Gift size={20} className="text-white shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                Exclusive Event/Rights
              </p>
              <p className="text-[10px] text-emerald-100">
                Brand gets content + licensing for 6 months
              </p>
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
function ActiveSidebar({ campaign, onApply }) {
  return (
    <>
      {/* Apply button */}
      <button
        onClick={onApply}
        className="hidden lg:flex w-full items-center justify-center gap-2 h-14 rounded-2xl text-white font-bold text-sm shadow-lg shadow-pink-100 bg-gradient-to-r from-[#9810FA] to-[#E60076] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
      >
        Apply for Campaign <ChevronRight size={16} />
      </button>
      <p className="hidden lg:block text-center text-[10px] text-slate-400">
        Or apply via an agent or partnership
      </p>

      {/* About Brand */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-800">About Brand</h4>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-bold">
            {campaign.initials}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {campaign.brandName}{" "}
              <CheckCircle2
                size={12}
                className="inline text-blue-500 fill-blue-50"
              />
            </p>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4].map((s) => (
                <Star
                  key={s}
                  size={10}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
              <Star size={10} className="text-slate-200 fill-slate-200" />
              <span className="text-[9px] font-bold text-slate-400 ml-1">
                4.8
              </span>
            </div>
          </div>
        </div>
        {campaign.brandStats && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: campaign.brandStats.campaigns, label: "Campaigns" },
              { val: campaign.brandStats.success, label: "Success" },
              { val: campaign.brandStats.response, label: "Response" },
            ].map((s, i) => (
              <div key={i} className="text-center p-2 bg-slate-50 rounded-xl">
                <p className="text-xs font-black text-slate-800">{s.val}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">
                  {s.label}
                </p>
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
  return (
    <div className="space-y-6">
      {/* Application Status Card */}
      <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Application Status
            </h3>
            <p className="text-[11px] text-slate-400">
              Submitted on {campaign.applicationDate}
            </p>
          </div>
        </div>
        <p className="text-xs font-bold text-emerald-600 mb-2">Under Review</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {campaign.applicationNote}
        </p>
      </div>

      {/* Budget & Deadline */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-emerald-50 px-4 py-3 rounded-2xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">
            ₹
          </div>
          <div>
            <p className="text-xs font-black text-slate-800">
              {campaign.budget}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl">
          <Calendar size={14} className="text-slate-400" />
          <p className="text-xs font-bold text-slate-800">
            {campaign.deadline}
          </p>
        </div>
      </div>

      {/* Application Timeline */}
      {campaign.timeline && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800">
            Application Timeline
          </h3>
          <div className="relative space-y-6 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
            {campaign.timeline.map((step, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div
                  className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                    step.done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle size={14} />
                  ) : (
                    <div className="w-2 h-2 bg-slate-300 rounded-full" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-sm font-bold ${step.done ? "text-slate-800" : "text-slate-400"}`}
                  >
                    {step.label}
                  </p>
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
  return (
    <>
      {/* Estimated Information */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 size={16} className="text-slate-400" /> Estimated
          Information
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-slate-800">
              {campaign.estimatedReach}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Est. Reach
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-emerald-600">
              {campaign.estimatedEngagement}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">
              Engagement
            </p>
          </div>
        </div>
      </div>

      {/* Other Notes */}
      {campaign.otherNotes && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Other Notes</h4>
          <ul className="space-y-2">
            {campaign.otherNotes.map((note, i) => (
              <li
                key={i}
                className="text-[11px] text-slate-500 flex gap-2 leading-relaxed"
              >
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
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Match Score
            </p>
            <p className="text-sm font-bold text-slate-800">Your Profile Fit</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
            <span className="text-lg font-black text-emerald-600">
              {campaign.matchScore}
            </span>
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
  return (
    <div className="space-y-6">
      {/* Payment Status */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Payment Status
            </p>
            <p className="text-sm font-black text-emerald-600">
              {campaign.paymentStatus}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Earnings
          </p>
          <p className="text-xl font-black text-slate-900">
            {campaign.paymentAmount}
          </p>
        </div>
      </div>

      {/* Performance Highlights */}
      {campaign.performance && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-purple-500 rounded-lg flex items-center justify-center text-white">
              <BarChart3 size={14} />
            </div>
            <h3 className="font-bold text-slate-900">Performance Highlights</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Eye size={12} className="text-orange-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Total Views
                </p>
              </div>
              <p className="text-lg font-black text-slate-900">
                {campaign.performance.totalViews}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Heart size={12} className="text-emerald-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Engagement
                </p>
              </div>
              <p className="text-lg font-black text-slate-900">
                {campaign.performance.engagement}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Users size={12} className="text-blue-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Reach
                </p>
              </div>
              <p className="text-lg font-black text-slate-900">
                {campaign.performance.reach}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Bookmark size={12} className="text-amber-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Saves
                </p>
              </div>
              <p className="text-lg font-black text-slate-900">
                {campaign.performance.saves}
              </p>
            </div>
          </div>

          {/* Bottom stats row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">
                {campaign.performance.likes}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">
                Likes
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">
                {campaign.performance.comments}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">
                Comments
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">
                {campaign.performance.shares}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">
                Shares
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Content Delivered */}
      {campaign.contentDelivered && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">
            Content Delivered
          </h3>
          <div className="space-y-2.5">
            {campaign.contentDelivered.map((item, i) => (
              <div
                key={i}
                className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">
                    {item.type}
                  </p>
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-400">{item.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-800">
                    {item.views}
                  </p>
                  <p className="text-[9px] text-slate-400">views</p>
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
  return (
    <>
      {/* Brand Feedback */}
      {campaign.brandFeedback && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-800">Brand Feedback</h4>
            <div className="flex gap-0.5">
              {[...Array(campaign.brandFeedback.rating)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  className="fill-amber-400 text-amber-400"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">
              {campaign.initials}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {campaign.brandName}
              </p>
              <p className="text-[10px] text-slate-400">Brand Partner</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic leading-relaxed">
            {campaign.brandFeedback.text}
          </p>
        </div>
      )}

      {/* Congratulations Card */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-100">
        <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
          <Star size={28} />
        </div>
        <h4 className="text-base font-black text-slate-900 mb-1">
          Congratulations! 🎉
        </h4>
        <p className="text-[11px] text-slate-400 mb-4">
          You&apos;ve successfully completed this campaign with outstanding
          results.
        </p>
        <button className="w-full h-11 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all cursor-pointer">
          <Share2 size={16} /> Share Results
        </button>
      </div>

      {/* Campaign Summary */}
      {campaign.campaignSummary && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Campaign Summary</h4>
          <div className="space-y-2">
            {[
              { label: "Duration", val: campaign.campaignSummary.duration },
              {
                label: "Content Pieces",
                val: campaign.campaignSummary.contentPieces,
              },
              {
                label: "Avg Engagement",
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
function SimilarCampaigns() {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-slate-800">Similar Campaigns</h4>
        <button className="text-[10px] font-bold text-pink-500 cursor-pointer hover:underline">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {SIMILAR_CAMPAIGNS.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-xl p-2 -mx-2 transition-colors"
          >
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
              <img
                src={c.img}
                alt={c.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {c.title}
              </p>
              <p className="text-[10px] text-slate-400">{c.budget}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
