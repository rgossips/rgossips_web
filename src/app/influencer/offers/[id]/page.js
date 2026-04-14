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
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { ApplyCampaignForm } from "@/components/ApplyCampaignForm";
import { useAuth } from "@/context/AuthContext";

/* ─── Fetch campaign from DB ─── */
function useCampaign(id, userId) {
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
            payments: [{ type: "base", label: "Base Payment", val: found.budget, sub: "Per influencer" }],
            brandStats: { campaigns: brandCampaigns.length, success: `${activeBrandCampaigns} active`, response: "24h" },
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

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function CampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const { user } = useAuth();

  const { campaign, loading, refetch } = useCampaign(id, user?.id);

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
            onSubmitSuccess={() => {
              setIsApplyOpen(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-6 lg:pt-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mb-4 lg:mb-6">
          <ChevronLeft size={16} /> Back to Campaigns
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
                    <CheckCircle size={12} /> Completed
                  </span>
                </div>
              )}

              {/* Initials badge */}
              <div className="absolute bottom-4 left-4 w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl lg:text-2xl font-bold shadow-lg border-2 border-white/20">
                {campaign.initials}
              </div>
            </div>

            {/* Title & Brand */}
            <div>
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 mb-1">{campaign.title}</h1>
              <p className="text-sm text-slate-400 font-medium">
                {campaign.brandName} <CheckCircle2 size={14} className="inline text-blue-500 fill-blue-50" />
              </p>
            </div>

            {/* Always show full campaign content */}
            <ActiveContent campaign={campaign} />
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">
            <div className="lg:sticky lg:top-8 space-y-5">
              <ActiveSidebar
                campaign={campaign}
                onApply={isActive && !campaign.applicationStatus ? () => setIsApplyOpen(true) : null}
                appliedStatus={campaign.applicationStatus || null}
                refetch={refetch}
              />

              {/* Similar Campaigns — shared */}
              <SimilarCampaigns campaign={campaign} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile floating bar */}
      {isActive && !campaign.applicationStatus && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <button
            onClick={() => setIsApplyOpen(true)}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm shadow-lg bg-gradient-to-r from-[#9810FA] to-[#E60076] flex items-center justify-center gap-2"
          >
            Apply for Campaign <ChevronRight size={16} />
          </button>
        </div>
      )}
      {campaign.applicationStatus && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
          <ApplicationStatusBar status={campaign.applicationStatus} campaign={campaign} refetch={refetch} compact />
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
      {/* Budget / Deadline / Slots pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-2xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">₹</div>
          <div>
            <p className="text-xs font-black text-slate-800">{campaign.budget}</p>
            <p className="text-[9px] text-slate-400">Budget</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-red-50 px-4 py-2.5 rounded-2xl">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center text-red-500">
            <Calendar size={14} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800">{campaign.deadline}</p>
            <p className="text-[9px] text-red-400">{campaign.daysLeft} left</p>
          </div>
        </div>
        {campaign.slots && (
          <div className="flex items-center gap-2 bg-purple-50 px-4 py-2.5 rounded-2xl">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center text-purple-500">
              <Users size={14} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800">{campaign.slots} slots</p>
              <p className="text-[9px] text-slate-400">Available</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Deliverables */}
      {campaign.deliverableIcons && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Content Deliverables</h3>
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
        <h3 className="text-base font-bold text-slate-800">About Campaign</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{campaign.about}</p>
      </div>

      {/* Requirements */}
      {campaign.requirements && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">Requirements</h3>
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
            <h3 className="text-base font-bold text-slate-800">Payment & Benefits</h3>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase">
              <ShieldCheck size={12} /> Verified
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
              <p className="text-sm font-bold text-white">Exclusive Event/Rights</p>
              <p className="text-[10px] text-emerald-100">Brand gets content + licensing for 6 months</p>
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
  return (
    <>
      {/* Apply button or Status tracker */}
      {onApply ? (
        <>
          <button
            onClick={onApply}
            className="hidden lg:flex w-full items-center justify-center gap-2 h-14 rounded-2xl text-white font-bold text-sm shadow-lg shadow-pink-100 bg-gradient-to-r from-[#9810FA] to-[#E60076] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
          >
            Apply for Campaign <ChevronRight size={16} />
          </button>
          <p className="hidden lg:block text-center text-[10px] text-slate-400">Or apply via an agent or partnership</p>
        </>
      ) : appliedStatus ? (
        <div className="hidden lg:block">
          <ApplicationStatusBar status={appliedStatus} campaign={campaign} refetch={refetch} />
        </div>
      ) : null}

      {/* About Brand */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-800">About Brand</h4>
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
            <p className="text-[10px] text-slate-400 mt-0.5">{campaign.tags?.join(", ") || "Brand"}</p>
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
  return (
    <div className="space-y-6">
      {/* Application Status Card */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Application Submitted</h3>
            <p className="text-[11px] text-slate-400">Your application is being reviewed by the brand</p>
          </div>
        </div>
        <p className="text-xs font-bold text-blue-600 mb-2">Pending Review</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">The brand will review your profile and media kit. You&apos;ll be notified once they respond.</p>
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
          <h3 className="text-base font-bold text-slate-800">Application Timeline</h3>
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
  return (
    <>
      {/* Application Status */}
      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Application Submitted</p>
            <p className="text-[10px] text-blue-600 font-bold">Pending Review</p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="relative space-y-4 pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-blue-100">
          {[
            { label: "Applied", done: true },
            { label: "Under Review", done: false },
            { label: "Shortlisted", done: false },
            { label: "Approved", done: false },
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
        <h4 className="text-sm font-bold text-slate-800">Campaign Details</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-slate-800">{campaign.budget}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Budget</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-sm font-black text-slate-800">{campaign.deadline}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Deadline</p>
          </div>
        </div>
      </div>

      {/* Placeholder for old otherNotes */}
      {campaign.otherNotes && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-slate-800">Other Notes</h4>
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
            <p className="text-[10px] font-bold text-slate-400 uppercase">Match Score</p>
            <p className="text-sm font-bold text-slate-800">Your Profile Fit</p>
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
  return (
    <div className="space-y-6">
      {/* Payment Status */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</p>
            <p className="text-sm font-black text-emerald-600">{campaign.paymentStatus}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Earnings</p>
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
            <h3 className="font-bold text-slate-900">Performance Highlights</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Eye size={12} className="text-orange-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Total Views</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.totalViews}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Heart size={12} className="text-emerald-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Engagement</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.engagement}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Users size={12} className="text-blue-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Reach</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.reach}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <div className="flex items-center gap-1 mb-1">
                <Bookmark size={12} className="text-amber-500" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Saves</p>
              </div>
              <p className="text-lg font-black text-slate-900">{campaign.performance.saves}</p>
            </div>
          </div>

          {/* Bottom stats row */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-50">
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">{campaign.performance.likes}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Likes</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">{campaign.performance.comments}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Comments</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-slate-800">{campaign.performance.shares}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Shares</p>
            </div>
          </div>
        </div>
      )}

      {/* Content Delivered */}
      {campaign.contentDelivered && (
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-800">Content Delivered</h3>
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
                <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold">{campaign.initials}</div>
            <div>
              <p className="text-xs font-bold text-slate-800">{campaign.brandName}</p>
              <p className="text-[10px] text-slate-400">Brand Partner</p>
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
        <h4 className="text-base font-black text-slate-900 mb-1">Congratulations! 🎉</h4>
        <p className="text-[11px] text-slate-400 mb-4">You&apos;ve successfully completed this campaign with outstanding results.</p>
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
function SimilarCampaigns({ campaign }) {
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
        <h4 className="text-sm font-bold text-slate-800">Similar Campaigns</h4>
        <button onClick={handleSeeAll} className="text-[10px] font-bold text-pink-500 cursor-pointer hover:underline">View All</button>
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
  { key: "approved", label: "Approved" },
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
};

function ApplicationStatusBar({ status = "pending", campaign, refetch, compact = false }) {
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const isSpecial = SPECIAL_STATUSES[status];
  const isRevision = status === "revision_needed";
  const isRejected = status === "rejected";
  // For revision, show progress up to "submitted" level (index 2) since they need to resubmit
  const effectiveStatus = isRevision ? "submitted" : isRejected ? "submitted" : status;
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === effectiveStatus);
  const currentStep = isSpecial ? { label: isSpecial.label } : STATUS_STEPS[Math.max(currentStepIndex, 0)] || STATUS_STEPS[0];
  const canUpload = status === "approved" || status === "revision_needed" || status === "accepted";

  if (compact) {
    return (
      <div className="space-y-2">
        <div className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold ${
          isRejected ? "bg-red-500 text-white" : isRevision ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
        }`}>
          {isRejected ? <XIcon size={16} /> : isRevision ? <Clock size={16} /> : <CheckCircle size={16} />} {currentStep.label}
        </div>
        {canUpload && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full h-12 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            <Upload size={16} /> {isRevision ? "Resubmit Deliverables" : status === "accepted" ? "Submit Live Links" : "Upload Submission"}
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
      <h4 className="text-base font-black text-slate-800">Application Status</h4>
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
                {step.label}
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
              <p className="text-sm font-bold text-amber-700">Revision Requested</p>
            </div>
            {note && <p className="text-xs text-amber-700 leading-relaxed pl-9">{note}</p>}
            {revisionLinks.length > 0 && (
              <div className="pl-9 space-y-1.5">
                <p className="text-[10px] font-bold text-amber-600 uppercase">Deliverables to revise:</p>
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
              <p className="text-sm font-bold text-red-700">Application Rejected</p>
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
          <Upload size={16} /> {isRevision ? "Resubmit Deliverables" : status === "accepted" ? "Submit Live Links" : "Upload Submission"}
        </button>
      )}

      {/* Submitted deliverables — always visible when links exist */}
      {campaign?.submissionLinks?.length > 0 && (
        <div className="space-y-3 pt-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-500" /> Your Submissions
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
  const isRevision = campaign?.applicationStatus === "revision_needed";

  // Parse revision info
  let revisionNote = "";
  let revisionRequested = [];
  if (isRevision && campaign?.rejectionReason) {
    try {
      const parsed = typeof campaign.rejectionReason === "string" ? JSON.parse(campaign.rejectionReason) : campaign.rejectionReason;
      revisionNote = parsed?.note || "";
      revisionRequested = (parsed?.links || []).map((l) => l.toLowerCase());
    } catch {}
  }

  // Parse content_types_required: ["reels:2", "stories:3"] → [{type: "reels", count: 2}, ...]
  const deliverables = (campaign?.contentTypesRequired || []).flatMap((item) => {
    const [type, countStr] = item.split(":");
    const count = parseInt(countStr) || 1;
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    return Array.from({ length: count }, (_, i) => ({
      key: `${type}_${i + 1}`,
      label: `${label} ${count > 1 ? i + 1 : ""}`.trim(),
      type,
      needsRevision: !isRevision || revisionRequested.length === 0 || revisionRequested.some((r) => type.toLowerCase().includes(r.toLowerCase()) || label.toLowerCase().includes(r.toLowerCase())),
    }));
  });

  // Prefill with existing submission links if revising
  const [links, setLinks] = useState(() => {
    const initial = {};
    const existingLinks = campaign?.submissionLinks || [];
    deliverables.forEach((d, i) => {
      // Try to match by label first, then by index
      const matchByLabel = existingLinks.find((el) => el.label === d.label);
      const matchByIndex = existingLinks[i];
      const existing = matchByLabel || matchByIndex;

      if (isRevision && d.needsRevision) {
        initial[d.key] = ""; // Clear for re-entry
      } else if (existing?.url) {
        initial[d.key] = existing.url; // Prefill with existing URL
      } else {
        initial[d.key] = "";
      }
    });
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // All deliverables must have links — non-revision ones are prefilled so they pass
  const allFilled = deliverables.length > 0 && deliverables.every((d) => links[d.key]?.trim());

  const handleSubmit = async () => {
    if (!allFilled || submitting) return;
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
      setError(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-lg lg:max-h-[85vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">{campaign?.applicationStatus === "accepted" ? "Submit Live Links" : "Upload Submissions"}</h2>
            <p className="text-[11px] text-slate-400">{campaign?.title} &middot; {deliverables.length} deliverables</p>
            {campaign?.applicationStatus === "accepted" && (
              <p className="text-[10px] text-emerald-600 font-semibold mt-1">Post your content on Instagram, then paste the live post links below.</p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

          {isRevision && revisionNote && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Revision Note</p>
              <p className="text-xs text-amber-700">{revisionNote}</p>
            </div>
          )}

          <p className="text-xs text-slate-500">
            {isRevision
              ? "Update the highlighted deliverables below and resubmit."
              : "Provide the link for each deliverable. All links are required before submitting."}
          </p>

          {deliverables.map((d) => (
            <div key={d.key} className={`space-y-1.5 ${isRevision && d.needsRevision ? "p-3 -mx-3 bg-amber-50/50 rounded-xl border border-amber-100" : ""}`}>
              <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Instagram size={12} className="text-pink-500" />
                <span className={isRevision && d.needsRevision ? "text-amber-700" : "text-slate-500"}>{d.label}</span>
                {isRevision && d.needsRevision && <span className="text-[8px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-black">REVISE</span>}
                {isRevision && !d.needsRevision && <span className="text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-black">OK</span>}
              </label>
              <input
                type="url"
                placeholder="https://www.instagram.com/reel/..."
                value={links[d.key]}
                onChange={(e) => setLinks((prev) => ({ ...prev, [d.key]: e.target.value }))}
                disabled={isRevision && !d.needsRevision}
                className={`w-full py-3 px-4 border rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all ${
                  isRevision && !d.needsRevision
                    ? "bg-slate-100 border-slate-100 opacity-60 cursor-not-allowed"
                    : isRevision && d.needsRevision
                      ? "bg-white border-amber-200 focus:border-amber-400"
                      : "bg-slate-50 border-slate-100 focus:border-pink-200 focus:bg-white"
                }`}
              />
            </div>
          ))}

          {deliverables.length === 0 && (
            <div className="text-center py-8 text-sm text-slate-400">No deliverables specified for this campaign.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-white sticky bottom-0">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!allFilled || submitting}
            className="flex-1 h-12 rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2 text-white"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Submitting..." : isRevision
              ? `Resubmit ${deliverables.filter((d) => d.needsRevision).length} Deliverable${deliverables.filter((d) => d.needsRevision).length !== 1 ? "s" : ""}`
              : `Submit ${deliverables.length} Deliverable${deliverables.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </>
  );
}
