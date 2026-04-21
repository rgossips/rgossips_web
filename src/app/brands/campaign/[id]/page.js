"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  Package,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Target,
  TrendingUp,
  Users,
  AlertCircle,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const statusStyles = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
};

const appStatusConfig = {
  pending: { bg: "bg-amber-50 text-amber-700", label: "Pending" },
  approved: { bg: "bg-indigo-50 text-indigo-700", label: "Approved" },
  submitted: { bg: "bg-purple-50 text-purple-700", label: "Submitted" },
  revision_needed: { bg: "bg-orange-50 text-orange-700", label: "Revision Needed" },
  accepted: { bg: "bg-emerald-50 text-emerald-700", label: "Accepted" },
  live_submitted: { bg: "bg-cyan-50 text-cyan-700", label: "Live" },
  payment: { bg: "bg-amber-50 text-amber-700", label: "Payment" },
  completed: { bg: "bg-blue-50 text-blue-700", label: "Completed" },
  rejected: { bg: "bg-red-50 text-red-700", label: "Rejected" },
  withdrawn: { bg: "bg-gray-100 text-gray-600", label: "Withdrawn" },
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const formatCount = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
};

const CampaignDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = async () => {
    if (!user?.id || !id) return;
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.functions.invoke(
      "brand-campaigns",
      { body: { action: "get", campaignId: id, brandId: user.id } }
    );
    if (err || data?.error) {
      setError(err?.message || data?.error || "Failed to load campaign");
      setLoading(false);
      return;
    }
    setCampaign(data.campaign);
    setApplications(data.applications || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user?.id && id) load();
  }, [authLoading, user?.id, id]);

  const updateStatus = async (newStatus) => {
    if (!user?.id || !campaign?.id) return;
    setStatusUpdating(true);
    const { data, error: err } = await supabase.functions.invoke(
      "brand-campaigns",
      {
        body: {
          action: "updateStatus",
          campaignId: campaign.id,
          brandId: user.id,
          status: newStatus,
        },
      }
    );
    setStatusUpdating(false);
    if (err || data?.error) {
      alert(err?.message || data?.error || "Failed to update status");
      return;
    }
    setCampaign((prev) => ({ ...prev, status: newStatus }));
  };

  const parsedContent = useMemo(() => {
    const out = { reels: 0, posts: 0, stories: 0, videos: 0 };
    for (const item of campaign?.contentTypesRequired || []) {
      const [k, v] = item.split(":");
      if (k && v && out[k] !== undefined) out[k] = Number(v) || 0;
    }
    return out;
  }, [campaign]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#5851DB]" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center px-6">
        <AlertCircle size={40} className="text-red-400 mb-3" />
        <p className="text-sm font-semibold text-gray-700">
          {error || "Campaign not found"}
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm font-semibold text-[#5851DB]"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-24">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-40 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-50 cursor-pointer"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
              statusStyles[campaign.status] || statusStyles.draft
            }`}
          >
            {(campaign.status || "draft").toUpperCase()}
          </span>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </nav>

      <div className="px-6 pt-5 pb-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* ─── LEFT: Campaign details ─── */}
        <div className="space-y-5 min-w-0">
        {/* Banner */}
        {campaign.bannerImage && (
          <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
            <img
              src={campaign.bannerImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title + status actions */}
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#5851DB] capitalize">
              {campaign.campaignType}
            </span>
            {campaign.categories?.slice(0, 2).map((c) => (
              <span
                key={c}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600"
              >
                {c}
              </span>
            ))}
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">
              {campaign.description}
            </p>
          )}

          {/* Status actions */}
          <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-50">
            <StatusActions
              status={campaign.status}
              onChange={updateStatus}
              loading={statusUpdating}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<IndianRupee size={16} />}
            label="Budget / Influencer"
            value={
              campaign.budgetPerInfluencer
                ? `₹${campaign.budgetPerInfluencer.toLocaleString("en-IN")}`
                : "—"
            }
          />
          <StatCard
            icon={<IndianRupee size={16} />}
            label="Total Budget"
            value={
              campaign.budgetTotal
                ? `₹${campaign.budgetTotal.toLocaleString("en-IN")}`
                : "—"
            }
          />
          <StatCard
            icon={<Users size={16} />}
            label="Slots"
            value={`${applications.length}/${campaign.maxInfluencers || 0}`}
          />
          <StatCard
            icon={<Calendar size={16} />}
            label="Deadline"
            value={formatDate(campaign.applicationDeadline)}
          />
        </div>

        {/* Deliverables */}
        <Section title="Content Deliverables">
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: "reels", label: "Reels" },
              { key: "posts", label: "Posts" },
              { key: "stories", label: "Stories" },
              { key: "videos", label: "Videos" },
            ].map((d) => (
              <div
                key={d.key}
                className="bg-[#F8F9FE] rounded-xl p-3 text-center"
              >
                <p className="text-xl font-extrabold text-gray-900">
                  {parsedContent[d.key]}
                </p>
                <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">
                  {d.label}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Requirements */}
        <Section title="Influencer Requirements">
          <DetailRow
            icon={<TrendingUp size={16} />}
            label="Followers"
            value={`${formatCount(campaign.targetFollowerMin)} – ${formatCount(campaign.targetFollowerMax)}`}
          />
          <DetailRow
            icon={<Target size={16} />}
            label="Tier"
            value={campaign.targetInfluencerTier || "All"}
            capitalize
          />
          {campaign.minEngagementRate > 0 && (
            <DetailRow
              icon={<TrendingUp size={16} />}
              label="Min. Engagement"
              value={`${campaign.minEngagementRate}%`}
            />
          )}
          <DetailRow
            icon={<MapPin size={16} />}
            label="Location"
            value={(campaign.targetCities || []).join(", ") || "Pan India"}
          />
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <DetailRow
            icon={<Calendar size={16} />}
            label="Start"
            value={formatDate(campaign.startDate)}
          />
          <DetailRow
            icon={<Calendar size={16} />}
            label="End"
            value={formatDate(campaign.endDate)}
          />
          <DetailRow
            icon={<Calendar size={16} />}
            label="Application Deadline"
            value={formatDate(campaign.applicationDeadline)}
          />
        </Section>

        {/* Gallery */}
        {campaign.galleryImages?.length > 0 && (
          <Section title="Gallery">
            <BrandGallery images={campaign.galleryImages} />
          </Section>
        )}
        </div>

        {/* ─── RIGHT: Applications ─── */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Applications
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#5851DB]">
                {applications.length}
              </span>
            </div>
            {applications.length === 0 ? (
              <div className="py-10 text-center">
                <Users size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">
                  No applications yet.
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Creators will appear here once they apply.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map((a) => (
                  <ApplicationRow
                    key={a.id}
                    app={a}
                    brandId={user?.id}
                    defaultRate={campaign.budgetPerInfluencer || 0}
                    onRefresh={load}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatusActions = ({ status, onChange, loading }) => {
  const btn = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed border";
  return (
    <>
      {status === "draft" && (
        <button
          onClick={() => onChange("active")}
          disabled={loading}
          className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Activate
        </button>
      )}
      {status === "active" && (
        <>
          <button
            onClick={() => onChange("paused")}
            disabled={loading}
            className={`${btn} bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
            Pause
          </button>
          <button
            onClick={() => onChange("completed")}
            disabled={loading}
            className={`${btn} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Complete
          </button>
        </>
      )}
      {status === "paused" && (
        <button
          onClick={() => onChange("active")}
          disabled={loading}
          className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          Resume
        </button>
      )}
      {status === "completed" && (
        <span className="text-xs text-gray-400 italic">
          This campaign is completed.
        </span>
      )}
    </>
  );
};

const BrandGallery = ({ images }) => {
  const [index, setIndex] = useState(-1);
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
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className="aspect-square rounded-xl overflow-hidden bg-gray-100 block group cursor-pointer"
          >
            <img
              src={src}
              alt={`Gallery ${i + 1}`}
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
            aria-label="Close"
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
                aria-label="Previous"
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
                aria-label="Next"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <img
            src={images[index]}
            alt={`Gallery ${index + 1}`}
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
    </>
  );
};

const Section = ({ title, children }) => (
  <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
    <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </h3>
    {children}
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center gap-2 text-gray-400 mb-1.5">
      {icon}
      <p className="text-[10px] uppercase font-bold tracking-wider">{label}</p>
    </div>
    <p className="text-base font-extrabold text-gray-900">{value}</p>
  </div>
);

const DetailRow = ({ icon, label, value, capitalize }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-none">
    <div className="p-2 bg-[#F8F9FE] rounded-lg text-gray-400">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">
        {label}
      </p>
      <p className={`text-xs font-bold text-gray-900 mt-0.5 truncate ${capitalize ? "capitalize" : ""}`}>
        {value}
      </p>
    </div>
  </div>
);

const ApplicationRow = ({ app, brandId, defaultRate = 0, onRefresh }) => {
  const supabase = createClient();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // "approve" | "reject" | "revision" | null
  const [payAmount, setPayAmount] = useState(
    String(app.proposed_rate || defaultRate || 0)
  );
  const [reason, setReason] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionIndexes, setRevisionIndexes] = useState([]);

  const inf = app.influencer_profiles || {};
  const st = appStatusConfig[app.status] || appStatusConfig.pending;
  const displayName = inf.full_name || inf.username || inf.instagram_handle || "Creator";
  const links = Array.isArray(app.submission_links) ? app.submission_links : [];

  const updateStatus = async (newStatus, extra = {}) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke(
      "update-application-status",
      {
        body: {
          applicationId: app.id,
          brandId,
          status: newStatus,
          ...extra,
        },
      }
    );
    setLoading(false);
    if (error || data?.error) {
      alert(error?.message || data?.error || "Failed to update");
      return;
    }
    setMode(null);
    setReason("");
    setRevisionNote("");
    setRevisionIndexes([]);
    onRefresh?.();
  };

  const handleApprove = () => {
    const rate = parseInt(payAmount || "0", 10);
    if (!rate || rate <= 0) return alert("Enter an agreed rate first");
    updateStatus("approved", { agreedRate: rate });
  };

  const handleReject = () => {
    updateStatus("rejected", { rejectionReason: reason || undefined });
  };

  const handleRevision = () => {
    if (revisionIndexes.length === 0) {
      return alert("Select at least one deliverable that needs revision");
    }
    const selectedLabels = revisionIndexes.map(
      (i) => links[i]?.label || links[i]?.type || `Deliverable ${i + 1}`
    );
    updateStatus("revision_needed", {
      revisionNote,
      revisionLinks: selectedLabels,
    });
  };

  const toggleRevisionIndex = (i) =>
    setRevisionIndexes((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );

  const btn =
    "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border";

  const hasActions =
    app.status === "pending" ||
    app.status === "approved" ||
    app.status === "submitted" ||
    app.status === "revision_needed" ||
    app.status === "live_submitted" ||
    app.status === "payment";

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Summary row — clickable */}
      <button
        type="button"
        onClick={() => hasActions && setExpanded((e) => !e)}
        className={`w-full flex items-center gap-3 p-3 text-left ${
          hasActions ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
          {inf.profile_photo_url ? (
            <img
              src={inf.profile_photo_url}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
          <p className="text-[11px] text-gray-400 truncate">
            {inf.instagram_handle && <>@{inf.instagram_handle} · </>}
            {formatCount(inf.followers_count)} followers
            {app.proposed_rate != null && (
              <> · <span className="text-[#5851DB] font-semibold">₹{Number(app.proposed_rate).toLocaleString("en-IN")}</span></>
            )}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} shrink-0`}
        >
          {st.label}
        </span>
        {hasActions && (
          <ChevronDown
            size={14}
            className={`text-gray-400 shrink-0 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Expanded actions */}
      {expanded && hasActions && (
        <div className="px-3 pb-3 border-t border-gray-50">
          {/* Submission links (when present) */}
          {links.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                Submissions
              </p>
              {links.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-[#F8F9FE] hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <ExternalLink size={12} className="text-[#5851DB] shrink-0" />
                  <p className="text-[11px] font-semibold text-gray-700 capitalize flex-1 truncate">
                    {item.label || item.type || `Deliverable ${i + 1}`}
                  </p>
                  <span className="text-[9px] uppercase font-bold text-gray-400 shrink-0">
                    {item.type}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Default actions per status */}
          {mode === null && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {app.status === "pending" && (
                <>
                  <button
                    onClick={() => setMode("approve")}
                    className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}
                  >
                    <Check size={12} /> Approve
                  </button>
                  <button
                    onClick={() => setMode("reject")}
                    className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}
                  >
                    <X size={12} /> Reject
                  </button>
                </>
              )}
              {app.status === "approved" && (
                <>
                  <span className="text-[11px] text-gray-400 italic px-1 py-1">
                    Waiting for submission…
                  </span>
                  <button
                    onClick={() => setMode("reject")}
                    className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}
                  >
                    <X size={12} /> Reject
                  </button>
                </>
              )}
              {app.status === "submitted" && (
                <>
                  <button
                    onClick={() => updateStatus("accepted")}
                    disabled={loading}
                    className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    Accept
                  </button>
                  <button
                    onClick={() => setMode("revision")}
                    className={`${btn} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`}
                  >
                    <RotateCcw size={12} /> Revision
                  </button>
                  <button
                    onClick={() => setMode("reject")}
                    className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}
                  >
                    <X size={12} /> Reject
                  </button>
                </>
              )}
              {app.status === "revision_needed" && (
                <span className="text-[11px] text-gray-400 italic px-1 py-1">
                  Waiting for creator to re-submit…
                </span>
              )}
              {app.status === "live_submitted" && (
                <>
                  <button
                    onClick={() => updateStatus("payment")}
                    disabled={loading}
                    className={`${btn} bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100`}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <IndianRupee size={12} />}
                    Release Payment
                  </button>
                  <button
                    onClick={() => setMode("revision")}
                    className={`${btn} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`}
                  >
                    <RotateCcw size={12} /> Revision
                  </button>
                </>
              )}
              {app.status === "payment" && (
                <button
                  onClick={() => updateStatus("completed")}
                  disabled={loading}
                  className={`${btn} bg-green-50 text-green-700 border-green-200 hover:bg-green-100`}
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Mark Completed
                </button>
              )}
            </div>
          )}

          {/* Approve form */}
          {mode === "approve" && (
            <div className="mt-3 space-y-2 p-3 bg-emerald-50/40 rounded-lg border border-emerald-100">
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Agreed Rate (₹)
              </label>
              <input
                type="number"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`}
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Approve
                </button>
                <button
                  onClick={() => setMode(null)}
                  className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reject form */}
          {mode === "reject" && (
            <div className="mt-3 space-y-2 p-3 bg-red-50/40 rounded-lg border border-red-100">
              <label className="text-[10px] font-bold text-red-700 uppercase tracking-wider">
                Reason (optional)
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly explain why..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className={`${btn} bg-red-600 text-white border-red-600 hover:bg-red-500`}
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  Confirm Reject
                </button>
                <button
                  onClick={() => setMode(null)}
                  className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Revision form */}
          {mode === "revision" && (
            <div className="mt-3 space-y-2 p-3 bg-orange-50/40 rounded-lg border border-orange-100">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">
                Select deliverables needing revision
              </p>
              <div className="space-y-1">
                {links.map((item, i) => {
                  const selected = revisionIndexes.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleRevisionIndex(i)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        selected
                          ? "bg-orange-100 border-orange-300"
                          : "bg-white border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          selected
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-300"
                        }`}
                      >
                        {selected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-[11px] font-semibold text-gray-700 capitalize flex-1 truncate">
                        {item.label || item.type || `Deliverable ${i + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="What needs to change?"
                className="w-full px-3 py-2 rounded-lg bg-white border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleRevision}
                  disabled={loading || revisionIndexes.length === 0}
                  className={`${btn} bg-orange-600 text-white border-orange-600 hover:bg-orange-500`}
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Send for Revision
                </button>
                <button
                  onClick={() => setMode(null)}
                  className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignDetailPage;
