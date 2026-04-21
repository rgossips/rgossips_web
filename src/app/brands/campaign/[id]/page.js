"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  IndianRupee,
  Loader2,
  MapPin,
  Package,
  Pause,
  Play,
  Target,
  TrendingUp,
  Users,
  AlertCircle,
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
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
            statusStyles[campaign.status] || statusStyles.draft
          }`}
        >
          {(campaign.status || "draft").toUpperCase()}
        </span>
      </nav>

      <div className="px-6 pt-5 space-y-5 max-w-3xl mx-auto">
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
            <div className="grid grid-cols-3 gap-2">
              {campaign.galleryImages.map((src, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Applications */}
        <Section title={`Applications (${applications.length})`}>
          {applications.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              No applications yet.
            </p>
          ) : (
            <div className="space-y-2">
              {applications.map((a) => (
                <ApplicationRow key={a.id} app={a} />
              ))}
            </div>
          )}
        </Section>
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

const ApplicationRow = ({ app }) => {
  const inf = app.influencer_profiles || {};
  const st = appStatusConfig[app.status] || appStatusConfig.pending;
  const displayName = inf.full_name || inf.username || inf.instagram_handle || "Creator";
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
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
        </p>
      </div>
      <span
        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${st.bg} shrink-0`}
      >
        {st.label}
      </span>
    </div>
  );
};

export default CampaignDetailPage;
