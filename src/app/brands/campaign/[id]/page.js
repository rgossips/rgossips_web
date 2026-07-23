"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  ExternalLink,
  IndianRupee,
  Loader2,
  MapPin,
  Package,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Users,
  AlertCircle,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useGlobalLoading } from "@/context/LoadingContext";
import RatingModal from "@/components/RatingModal";
import ErrorModal from "@/components/ErrorModal";
import AlertPopup from "@/components/AlertPopup";

// The Create/Edit dialog is fat (form + image compression + upload
// helpers) and only mounts on an Edit click, so lazy-load to keep the
// campaign-detail bundle lean.
const CreateCampaignDialog = dynamic(
  () => import("@/components/brands/CreateCampaignDialog").then((m) => m.CreateCampaignDialog),
  { ssr: false },
);

// Brand-side escrow funding uses the same Razorpay Checkout SDK as the
// subscription flow. Loaded lazily on first Approve click to keep the
// initial bundle lean.
const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Bound an edge-function invoke so a hung request can't leave the escrow
// loader spinning forever. The server-side gateway fetches have their own
// AbortSignal timeout; this is the client-side belt to that server braces.
function withTimeout(promise, ms = 20000, label = "The request") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out. Please check your connection and try again.`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => resolve());
    });
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

const statusStyles = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-purple-50 text-purple-700 border-purple-200",
};

const appStatusConfig = {
  pending: { bg: "bg-amber-50 text-amber-700", labelKey: "applied" },
  // B15 negotiation flow — brand sends a priced offer, creator accepts
  // (or withdraws), and only then does escrow funding happen.
  offer_sent: { bg: "bg-purple-50 text-purple-700", labelKey: "offerSent" },
  offer_accepted: { bg: "bg-emerald-50 text-emerald-700", labelKey: "offerAcceptedPay" },
  withdrawn: { bg: "bg-gray-100 text-gray-600", labelKey: "withdrawn" },
  approved: { bg: "bg-indigo-50 text-indigo-700", labelKey: "approved" },
  submitted: { bg: "bg-purple-50 text-purple-700", labelKey: "submitted" },
  revision_needed: { bg: "bg-orange-50 text-orange-700", labelKey: "revisionNeeded" },
  accepted: { bg: "bg-emerald-50 text-emerald-700", labelKey: "accepted" },
  live_submitted: { bg: "bg-cyan-50 text-cyan-700", labelKey: "live" },
  // From the brand's perspective, releasing payment is their final step —
  // the campaign is effectively done for them. The influencer side still
  // labels this stage as "Payment in Progress" because admin reconciliation
  // happens on their payout pipeline.
  payment: { bg: "bg-blue-50 text-blue-700", labelKey: "completed" },
  completed: { bg: "bg-blue-50 text-blue-700", labelKey: "completed" },
  rejected: { bg: "bg-red-50 text-red-700", labelKey: "rejected" },
  withdrawn: { bg: "bg-gray-100 text-gray-600", labelKey: "withdrawn" },
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
  const t = useTranslations("BrandsCampaignId");
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const { startLoading, stopLoading } = useGlobalLoading();

  const [campaign, setCampaign] = useState(null);
  const [applications, setApplications] = useState([]);
  const [ratingsByApp, setRatingsByApp] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  // Count of active influencers whose profile matches this campaign's
  // categories + follower band + cities. Server computes on get; also
  // returned by create so we can update from a stale-cached value.
  const [matchingCount, setMatchingCount] = useState(0);
  // B15f — which application's journey modal is open. The aside shows
  // compact cards only; the full review panel + timeline lives in the
  // modal keyed by this id.
  const [selectedAppId, setSelectedAppId] = useState(null);
  // Edit dialog visibility. Not-editable modal fires when the client-
  // side check (applications.length > 0) or the server ("has_applications"
  // race) says the brief is frozen.
  const [editOpen, setEditOpen] = useState(false);
  const [notEditableOpen, setNotEditableOpen] = useState(false);
  // Duplicate flow re-uses CreateCampaignDialog in create mode with a
  // prefill payload. duplicatePrefill holds the source campaign (with
  // title prepended by "Copy of ") — non-null value opens the dialog.
  const [duplicatePrefill, setDuplicatePrefill] = useState(null);
  // Delete confirmation modal + in-flight guard.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Styled error popup replacing raw window.alert() for page-level
  // failures (status flips, delete). String message or null.
  const [errorPopup, setErrorPopup] = useState(null);

  const load = async () => {
    if (!user?.id || !id) return;
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.functions.invoke("brand-campaigns", { body: { action: "get", campaignId: id, brandId: user.id } });
    if (err || data?.error) {
      setError(err?.message || data?.error || t("errors.loadFailed"));
      setLoading(false);
      return;
    }
    setCampaign(data.campaign);
    const apps = data.applications || [];
    setApplications(apps);
    setMatchingCount(Number(data.matchingCount || 0));
    setLoading(false);

    // Pull existing brand-side ratings for all applications in this campaign
    // (one query — RLS lets the brand read its own rows).
    const appIds = apps.map((a) => a.id).filter(Boolean);
    if (appIds.length > 0) {
      const { data: ratings } = await supabase.from("campaign_ratings").select("application_id, target_rating").in("application_id", appIds).eq("rater_role", "brand");
      const map = {};
      for (const r of ratings || []) map[r.application_id] = r;
      setRatingsByApp(map);
    } else {
      setRatingsByApp({});
    }
  };

  const upsertRating = (applicationId, partial) => setRatingsByApp((prev) => ({ ...prev, [applicationId]: { ...(prev[applicationId] || {}), ...partial } }));

  useEffect(() => {
    if (!authLoading && user?.id && id) load();
  }, [authLoading, user?.id, id]);

  const updateStatus = async (newStatus) => {
    if (!user?.id || !campaign?.id) return;
    setStatusUpdating(true);
    startLoading(t("loading.updatingStatus", { status: newStatus }));
    try {
      const { data, error: err } = await supabase.functions.invoke("brand-campaigns", {
        body: {
          action: "updateStatus",
          campaignId: campaign.id,
          brandId: user.id,
          status: newStatus,
        },
      });
      if (err || data?.error) {
        setErrorPopup(err?.message || data?.error || t("errors.updateStatusFailed"));
        return;
      }
      setCampaign((prev) => ({ ...prev, status: newStatus }));
    } finally {
      setStatusUpdating(false);
      stopLoading();
    }
  };

  // Matching-creator callout click. Routes to /brands/search with the
  // campaign's target_categories + target_cities + follower range
  // pre-filled so the drawer chips light up without the brand having
  // to re-set them.
  const handleMatchClick = () => {
    if (!campaign) return;
    const p = new URLSearchParams();
    const cats = Array.isArray(campaign.categories) ? campaign.categories.filter(Boolean) : [];
    if (cats.length > 0 && !(cats.length === 1 && cats[0] === "General")) {
      p.set("categories", cats.map((c) => encodeURIComponent(c)).join(","));
    }
    const cities = Array.isArray(campaign.targetCities) ? campaign.targetCities.filter(Boolean) : [];
    if (cities.length > 0 && !(cities.length === 1 && cities[0] === "All India")) {
      p.set("cities", cities.map((c) => encodeURIComponent(c)).join(","));
    }
    if (campaign.targetFollowerMin) p.set("followerMin", String(campaign.targetFollowerMin));
    if (campaign.targetFollowerMax) p.set("followerMax", String(campaign.targetFollowerMax));
    const qs = p.toString();
    router.push(qs ? `/brands/search?${qs}` : "/brands/search");
  };

  // Edit gate — click Edit. Client-side we already know how many apps
  // exist, so we short-circuit to the "not editable" modal without a
  // round-trip. The server re-verifies on submit either way.
  const handleEditClick = () => {
    if (applications.length > 0) {
      setNotEditableOpen(true);
      return;
    }
    setEditOpen(true);
  };

  // Duplicate — opens the create dialog with the current campaign's
  // fields prefilled (title prefixed with "Copy of "). Nothing hits the
  // server until the brand actually saves in the dialog, so a brand
  // that closes it mid-tweak leaves no artefacts behind.
  const handleDuplicate = () => {
    if (!campaign) return;
    setNotEditableOpen(false);
    setDuplicatePrefill({
      ...campaign,
      title: t("copyOfTitle", { title: campaign.title || t("campaignFallback") }),
    });
  };

  // Hard-delete the campaign. Server refuses if any application exists,
  // but the client hides the Delete button in that case so the modal
  // only opens when it's safe. The confirmation is intentional — this
  // is destructive and there's no undo.
  const handleDelete = async () => {
    if (!user?.id || !campaign?.id || deleting) return;
    setDeleting(true);
    startLoading(t("loading.deletingCampaign"));
    try {
      const { data, error: err } = await supabase.functions.invoke("brand-campaigns", {
        body: { action: "delete", brandId: user.id, campaignId: campaign.id },
      });
      if (err || data?.error) {
        // has_applications only fires if a race snuck an application in
        // between the client-side check and now — treat it the same as
        // any other server error and surface a clear message.
        const msg = data?.error === "has_applications"
          ? t("errors.deleteHasApplications")
          : (err?.message || data?.error || t("errors.deleteFailed"));
        setErrorPopup(msg);
        return;
      }
      setDeleteOpen(false);
      router.push("/brands/campaigns");
    } finally {
      setDeleting(false);
      stopLoading();
    }
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
        <p className="text-sm font-semibold text-gray-700">{error || t("errors.notFound")}</p>
        <button onClick={() => router.back()} className="mt-4 text-sm font-semibold text-[#5851DB]">
          {t("actions.goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-24">
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white sticky top-0 z-40 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-gray-50 cursor-pointer">
          <ArrowLeft size={22} />
        </button>
        <div className="flex items-center gap-2">
          {/* Derived display status: DB-status "active" with a lapsed
              application deadline reads as "Applications Closed", not
              a misleading ACTIVE. */}
          {campaign.status === "active" &&
          campaign.applicationDeadline &&
          new Date(campaign.applicationDeadline).getTime() < Date.now() ? (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
              {t("statusBadge.applicationsClosed")}
            </span>
          ) : (
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${statusStyles[campaign.status] || statusStyles.draft}`}>{(campaign.status || "draft").replace("_", " ").toUpperCase()}</span>
          )}
          <button
            onClick={handleEditClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#5851DB] text-[#5851DB] hover:bg-purple-50 cursor-pointer"
            title={applications.length > 0 ? t("tooltips.editLocked") : t("tooltips.edit")}
          >
            <Edit size={13} />
            {t("actions.edit")}
          </button>
          {/* Delete is only offered when zero creators have applied.
              After the first application, the brief is frozen and the
              brand should use Pause / Duplicate from the Edit flow
              instead. Server enforces the same rule. */}
          {applications.length === 0 && (
            <button
              onClick={() => setDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
              title={t("tooltips.delete")}
            >
              <Trash2 size={13} />
              {t("actions.delete")}
            </button>
          )}
          <button onClick={load} disabled={loading} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer disabled:opacity-50" title={t("tooltips.refresh")}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </nav>

      {/* Profile-match callout — shown on every campaign detail. The
          server recomputes matchingCount on every get() so this stays
          accurate as the directory changes. Notifications only fan out
          at create time (not on every view). Click routes to
          /brands/search with the campaign's criteria prefilled so the
          brand can browse the matched set. Copy adapts for the 0 case. */}
      <div className="px-6 pt-4 max-w-6xl mx-auto">
        <button
          onClick={handleMatchClick}
          type="button"
          className={`w-full flex items-center gap-3 rounded-2xl border text-left px-4 py-3 cursor-pointer transition-colors ${
            matchingCount > 0
              ? "border-purple-100 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 hover:from-purple-100 hover:via-pink-100 hover:to-amber-100"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100"
          }`}
        >
          <div
            className={`shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center ${
              matchingCount > 0 ? "bg-white/70 text-[#5B3DF5]" : "bg-white text-slate-400"
            }`}
          >
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            {matchingCount > 0 ? (
              <>
                <p className="text-[13px] font-black text-gray-900">
                  {t("match.perfect", { count: matchingCount })}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {t("match.notified")}
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-black text-gray-900">
                  {t("match.noneTitle")}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {t("match.noneSubtitle")}
                </p>
              </>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-400 shrink-0" />
        </button>
      </div>

      <div className="px-6 pt-5 pb-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        {/* ─── LEFT: Campaign details ─── */}
        <div className="space-y-5 min-w-0">
          {/* Banner */}
          {campaign.bannerImage && (
            <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
              <img src={campaign.bannerImage} alt={campaign.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title + status actions */}
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-[#5851DB] capitalize">{campaign.campaignType}</span>
              {campaign.categories?.slice(0, 2).map((c) => (
                <span key={c} className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                  {c}
                </span>
              ))}
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">{campaign.title}</h1>
            {campaign.description && <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{campaign.description}</p>}

            {/* Status actions */}
            <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-50">
              <StatusActions status={campaign.status} onChange={updateStatus} loading={statusUpdating} />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<IndianRupee size={16} />} label={t("stats.budgetPerInfluencer")} value={campaign.budgetPerInfluencer ? `₹${campaign.budgetPerInfluencer.toLocaleString("en-IN")}` : "—"} />
            <StatCard icon={<IndianRupee size={16} />} label={t("stats.totalBudget")} value={campaign.budgetTotal ? `₹${campaign.budgetTotal.toLocaleString("en-IN")}` : "—"} />
            <StatCard icon={<Users size={16} />} label={t("stats.slots")} value={`${applications.length}/${campaign.maxInfluencers || 0}`} />
            <StatCard icon={<Calendar size={16} />} label={t("stats.deadline")} value={formatDate(campaign.applicationDeadline)} />
          </div>

          {/* Deliverables */}
          <Section title={t("sections.contentDeliverables")}>
            <div className="grid grid-cols-4 gap-3">
              {[
                { key: "reels" },
                { key: "posts" },
                { key: "stories" },
                { key: "videos" },
              ].map((d) => (
                <div key={d.key} className="bg-[#F8F9FE] rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-gray-900">{parsedContent[d.key]}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">{t(`deliverables.${d.key}`)}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Requirements */}
          <Section title={t("sections.influencerRequirements")}>
            <DetailRow icon={<TrendingUp size={16} />} label={t("requirements.followers")} value={`${formatCount(campaign.targetFollowerMin)} – ${formatCount(campaign.targetFollowerMax)}`} />
            <DetailRow icon={<Target size={16} />} label={t("requirements.tier")} value={campaign.targetInfluencerTier || t("requirements.tierAll")} capitalize />
            {campaign.minEngagementRate > 0 && <DetailRow icon={<TrendingUp size={16} />} label={t("requirements.minEngagement")} value={`${campaign.minEngagementRate}%`} />}
            <DetailRow icon={<MapPin size={16} />} label={t("requirements.location")} value={(campaign.targetCities || []).join(", ") || t("requirements.panIndia")} />
          </Section>

          {/* Schedule */}
          <Section title={t("sections.schedule")}>
            <DetailRow icon={<Calendar size={16} />} label={t("schedule.start")} value={formatDate(campaign.startDate)} />
            <DetailRow icon={<Calendar size={16} />} label={t("schedule.applicationDeadline")} value={formatDate(campaign.applicationDeadline)} />
            <DetailRow icon={<Calendar size={16} />} label={t("schedule.campaignEnd")} value={formatDate(campaign.endDate)} />
          </Section>

          {/* Gallery */}
          {campaign.galleryImages?.length > 0 && (
            <Section title={t("sections.gallery")}>
              <BrandGallery images={campaign.galleryImages} />
            </Section>
          )}
        </div>

        {/* ─── RIGHT: Applications — compact cards (B15f). Each card is
            just DP + name + status; clicking opens the full journey
            modal with the timeline + all review actions. ─── */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">{t("applications.heading")}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-[#5851DB]">{applications.length}</span>
            </div>
            {applications.length === 0 ? (
              <div className="py-10 text-center">
                <Users size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">{t("applications.empty")}</p>
                <p className="text-[10px] text-gray-400 mt-1">{t("applications.emptyHint")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map((a) => {
                  const inf = a.influencer_profiles || {};
                  const name = inf.full_name || inf.username || inf.instagram_handle || t("common.creator");
                  const st = appStatusConfig[a.status] || appStatusConfig.pending;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAppId(a.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-purple-200 text-left cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                        {inf.profile_photo_url ? <img src={inf.profile_photo_url} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                        {inf.instagram_handle && <p className="text-[11px] text-gray-400 truncate">@{inf.instagram_handle}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} shrink-0`}>{t(`appStatus.${st.labelKey}`)}</span>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Journey modal — full application detail: status timeline from
          application_status_history + the review panel with all actions. */}
      {selectedAppId && (() => {
        const selApp = applications.find((a) => a.id === selectedAppId);
        if (!selApp) return null;
        return (
          <ApplicationJourneyModal
            app={selApp}
            brandId={user?.id}
            defaultRate={campaign.budgetPerInfluencer || 0}
            rating={ratingsByApp[selApp.id] || null}
            onRated={(r) => upsertRating(selApp.id, r)}
            onRefresh={load}
            onClose={() => setSelectedAppId(null)}
          />
        );
      })()}

      {/* Edit dialog — lazy-loaded so the fat form only enters the
          bundle when actually opened. Server enforces the same
          applications guard on submit; if a race lets us through, the
          dialog closes and the not-editable modal fires. */}
      {editOpen && (
        <CreateCampaignDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          brandId={user?.id}
          campaignId={campaign.id}
          initialCampaign={campaign}
          mode="edit"
          onUpdated={() => {
            setEditOpen(false);
            load();
          }}
          onEditBlocked={() => setNotEditableOpen(true)}
        />
      )}

      {/* Not-editable guard modal — surfaced when the campaign already
          has applications. Two escape hatches: pause the campaign so no
          more applications land, or duplicate it as a fresh draft. */}
      {notEditableOpen && (
        <NotEditableModal
          open={notEditableOpen}
          onClose={() => setNotEditableOpen(false)}
          onPause={async () => {
            await updateStatus("paused");
            setNotEditableOpen(false);
          }}
          onDuplicate={handleDuplicate}
          isPaused={campaign.status === "paused"}
          applicationCount={applications.length}
        />
      )}

      {/* Duplicate flow — CreateCampaignDialog in create mode with the
          source campaign's fields prefilled. Insert happens only if the
          brand actually saves in the dialog. */}
      {duplicatePrefill && (
        <CreateCampaignDialog
          open={!!duplicatePrefill}
          onOpenChange={(v) => !v && setDuplicatePrefill(null)}
          brandId={user?.id}
          mode="create"
          initialCampaign={duplicatePrefill}
          onCreated={(newId) => {
            setDuplicatePrefill(null);
            router.push(`/brands/campaign/${newId}`);
          }}
        />
      )}

      {/* Delete confirmation — small dedicated modal (destructive
          actions deserve a slower path than a stock alert()). */}
      {deleteOpen && (
        <DeleteCampaignModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          deleting={deleting}
          title={campaign.title}
        />
      )}

      {/* Styled error popup — replaces window.alert for page-level
          failures like "banner required before publishing". */}
      <ErrorModal
        open={!!errorPopup}
        errorText={errorPopup || ""}
        onClose={() => setErrorPopup(null)}
      />
    </div>
  );
};

const StatusActions = ({ status, onChange, loading }) => {
  const t = useTranslations("BrandsCampaignId");
  const btn = "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed border";
  return (
    <>
      {status === "draft" && (
        <button onClick={() => onChange("active")} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {t("statusActions.activate")}
        </button>
      )}
      {status === "active" && (
        <>
          <button onClick={() => onChange("paused")} disabled={loading} className={`${btn} bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
            {t("statusActions.pause")}
          </button>
          <button onClick={() => onChange("completed")} disabled={loading} className={`${btn} bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100`}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {t("statusActions.complete")}
          </button>
        </>
      )}
      {status === "paused" && (
        <button onClick={() => onChange("active")} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {t("statusActions.resume")}
        </button>
      )}
      {status === "under_review" && <span className="text-xs font-semibold text-purple-600 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">{t("statusActions.underReviewNote")}</span>}
      {status === "completed" && <span className="text-xs text-gray-400 italic">{t("statusActions.completedNote")}</span>}
    </>
  );
};

const BrandGallery = ({ images }) => {
  const t = useTranslations("BrandsCampaignId");
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
          <button key={i} type="button" onClick={() => setIndex(i)} className="aspect-square rounded-xl overflow-hidden bg-gray-100 block group cursor-pointer">
            <img src={src} alt={t("gallery.imageAlt", { n: i + 1 })} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </button>
        ))}
      </div>
      {index >= 0 && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={close}>
          <button type="button" onClick={close} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer" aria-label={t("common.close")}>
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
          <img src={images[index]} alt={t("gallery.imageAlt", { n: index + 1 })} className="max-w-[90vw] max-h-[85vh] object-contain" onClick={(e) => e.stopPropagation()} />
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
    <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
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
      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-xs font-bold text-gray-900 mt-0.5 truncate ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  </div>
);

const ApplicationRow = ({ app, brandId, defaultRate = 0, rating = null, onRated, onRefresh, alwaysExpanded = false }) => {
  const t = useTranslations("BrandsCampaignId");
  const supabase = createClient();
  const { startLoading, stopLoading } = useGlobalLoading();
  // Auto-expand actionable statuses so the brand can review immediately.
  // We also auto-expand "accepted" so the brand can re-verify what they
  // just approved without an extra click. Inside the journey modal
  // (alwaysExpanded) the panel is permanently open.
  const autoExpand = alwaysExpanded || app.status === "pending" || app.status === "offer_accepted" || app.status === "submitted" || app.status === "live_submitted" || app.status === "accepted";
  const [expanded, setExpanded] = useState(autoExpand);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // "approve" | "reject" | "revision" | null
  const [payAmount, setPayAmount] = useState(String(app.proposed_rate || defaultRate || 0));
  const [reason, setReason] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionIndexes, setRevisionIndexes] = useState([]);
  const [showRating, setShowRating] = useState(false);
  // Compact popup for escrow / validation errors — replaces window.alert().
  // Uses AlertPopup (plain fixed z-[120]) so it renders above the z-[110]
  // journey modal this row lives inside.
  const [popup, setPopup] = useState(null);

  const inf = app.influencer_profiles || {};
  const st = appStatusConfig[app.status] || appStatusConfig.pending;
  const displayName = inf.full_name || inf.username || inf.instagram_handle || t("common.creator");
  const links = Array.isArray(app.submission_links) ? app.submission_links : [];

  const updateStatus = async (newStatus, extra = {}) => {
    setLoading(true);
    startLoading(t("loading.updatingApplication"));
    try {
      const { data, error } = await supabase.functions.invoke("update-application-status", {
        body: {
          applicationId: app.id,
          brandId,
          status: newStatus,
          ...extra,
        },
      });
      if (error || data?.error) {
        setPopup(error?.message || data?.error || t("errors.updateFailed"));
        return;
      }
      setMode(null);
      setReason("");
      setRevisionNote("");
      setRevisionIndexes([]);
      onRefresh?.();
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  // B15: brand reviews the application and sends a priced offer. No
  // money moves here — the creator gets a notification and can accept
  // or withdraw. Escrow funding happens only after acceptance.
  const handleSendOffer = () => {
    const rate = parseInt(payAmount || "0", 10);
    if (!rate || rate <= 0) { setPopup({ title: t("popups.enterAmount.title"), message: t("popups.enterAmount.message"), tone: "info" }); return; }
    updateStatus("offer_sent", { agreedRate: rate });
  };

  // Pay to Escrow = fund escrow + flip status to approved. Only
  // reachable once the creator has accepted the offer (server enforces
  // this too). Flow:
  //   1. escrow-fund creates a Razorpay Order for the ACCEPTED offer
  //      amount (server rejects a mismatched amount).
  //   2. We open Razorpay Checkout against that order. The brand pays.
  //   3. On payment success, Razorpay returns { payment_id, order_id,
  //      signature } via the handler callback.
  //   4. We pass those into update-application-status (status='approved'),
  //      which verifies the signature server-side and flips
  //      escrow_status='held' atomically with the status change.
  // If the brand dismisses Checkout, the application stays 'offer_accepted'.
  const handleApprove = async () => {
    const rate = Number(app.brand_offered_rate || 0);
    if (!rate || rate <= 0) { setPopup(t("errors.noAcceptedOffer")); return; }
    setLoading(true);
    startLoading(t("loading.preparingEscrow"));
    try {
      // Explicit session check — supabase.functions.invoke() falls back
      // to sending the publishable key as Bearer when no user session
      // is present, and escrow-fund's inline supabase.auth.getUser()
      // then correctly rejects it as unauthorized. This can happen
      // when the admin app is signed in on the same browser origin —
      // its cookie collides with the user app's cookie because both
      // clients derive their key from the same project ref.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const { data: fund, error: fundErr } = await withTimeout(
        supabase.functions.invoke("escrow-fund", {
          body: { applicationId: app.id, agreedRate: rate },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        20000,
        "Escrow"
      );
      if (fundErr || fund?.error) {
        setPopup(fundErr?.message || fund?.error || t("errors.escrowCreateFailed"));
        return;
      }
      await loadRazorpayCheckout();
      if (typeof window === "undefined" || !window.Razorpay) {
        setPopup(t("errors.razorpayLoadFailed"));
        return;
      }

      stopLoading();
      const rzp = new window.Razorpay({
        key: fund.key_id,
        order_id: fund.order_id,
        amount: fund.amount_paise,
        currency: fund.currency || "INR",
        name: "RGossips",
        description: t("razorpay.escrowDescription", { name: displayName }),
        theme: { color: "#5851DB" },
        handler: async (response) => {
          // Payment captured. Confirm to the server so escrow flips to held.
          startLoading(t("loading.confirmingPayment"));
          setLoading(true);
          try {
            await updateStatus("approved", {
              agreedRate: rate,
              escrowPaymentId: response.razorpay_payment_id,
              escrowOrderId: response.razorpay_order_id,
              escrowSignature: response.razorpay_signature,
            });
          } finally {
            setLoading(false);
            stopLoading();
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            stopLoading();
          },
        },
      });
      rzp.on("payment.failed", (resp) => {
        console.error("Escrow payment failed:", resp?.error);
        setPopup(resp?.error?.description || t("errors.paymentFailed"));
        setLoading(false);
        stopLoading();
      });
      rzp.open();
    } catch (e) {
      console.error("handleApprove failed:", e);
      setPopup(e?.message || t("errors.somethingWrong"));
      setLoading(false);
      stopLoading();
    }
  };

  const handleReject = () => {
    updateStatus("rejected", { rejectionReason: reason || undefined });
  };

  // "Accept & Release Payment" — talks to escrow-release rather than
  // update-application-status because the release leg has more state to
  // manage (plan-tier delay, pending_creator_info routing, notifications,
  // escrow_status flip). The escrow-release function takes over once the
  // brand confirms the live submission is good.
  const releaseEscrow = async () => {
    setLoading(true);
    startLoading(t("loading.releasingPayment"));
    try {
      // Same session-guard as handleApprove — escrow-release also
      // does an inline supabase.auth.getUser() so a fallback publishable
      // key Bearer fails the same way.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const { data, error } = await supabase.functions.invoke("escrow-release", {
        body: { applicationId: app.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error || data?.error) {
        setPopup(error?.message || data?.error || t("errors.releaseFailed"));
        return;
      }
      onRefresh?.();
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleRevision = () => {
    if (revisionIndexes.length === 0) {
      { setPopup({ title: t("popups.nothingSelected.title"), message: t("popups.nothingSelected.message"), tone: "info" }); return; }
    }
    const selectedLabels = revisionIndexes.map((i) => links[i]?.label || links[i]?.type || t("common.deliverableN", { n: i + 1 }));
    updateStatus("revision_needed", {
      revisionNote,
      revisionLinks: selectedLabels,
    });
  };

  const toggleRevisionIndex = (i) => setRevisionIndexes((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const btn = "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border";

  // "hasActions" is a misnomer at this point — it really means "the
  // expanded panel has something worth showing." Accepted is the same
  // shape as live_submitted for review purposes: the brand should still
  // see Creator Details + the submitted deliverables. There are no
  // action buttons at this stage (the next step is the creator posting
  // live), so the action slot just shows a status line.
  const hasActions =
    app.status === "pending" || app.status === "offer_sent" || app.status === "offer_accepted" || app.status === "approved" || app.status === "submitted" || app.status === "revision_needed" || app.status === "live_submitted" || app.status === "payment" || app.status === "accepted";

  return (
    <div className={`rounded-xl bg-white overflow-hidden ${alwaysExpanded ? "" : "border border-gray-100"}`}>
      {/* Summary row — clickable */}
      <button
        type="button"
        onClick={() => !alwaysExpanded && hasActions && setExpanded((e) => !e)}
        className={`w-full flex items-center gap-3 p-3 text-left ${!alwaysExpanded && hasActions ? "hover:bg-gray-50 cursor-pointer" : "cursor-default"}`}
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
          {inf.profile_photo_url ? <img src={inf.profile_photo_url} alt={displayName} className="w-full h-full object-cover" /> : displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
          <p className="text-[11px] text-gray-400 truncate">
            {inf.instagram_handle && <>@{inf.instagram_handle} · </>}
            {formatCount(inf.followers_count)} {t("row.followers")}
            {app.proposed_rate != null && (
              <>
                {" "}
                · <span className="text-[#5851DB] font-semibold">₹{Number(app.proposed_rate).toLocaleString("en-IN")}</span>
              </>
            )}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} shrink-0`}>{t(`appStatus.${st.labelKey}`)}</span>
        {app.escrow_status === "held" && app.escrow_amount != null && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-bold shrink-0">
            <IndianRupee size={9} />
            {Math.round(app.escrow_amount / 100).toLocaleString("en-IN")} {t("row.held")}
          </span>
        )}
        {rating && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold shrink-0">
            <Star size={10} className="fill-amber-400 text-amber-400" />
            {rating.target_rating}/5
          </span>
        )}
        {!alwaysExpanded && hasActions && <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />}
      </button>

      {/* Expanded actions */}
      {(expanded || alwaysExpanded) && hasActions && (
        <div className="px-3 pb-3 border-t border-gray-50">
          {rating && (
            <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                <Star size={14} className="fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">{t("panel.yourRating")}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {displayName} <span className="font-bold">{rating.target_rating}/5</span>
                </p>
              </div>
            </div>
          )}

          {/* Creator details — review before approving */}
          <div className="mt-3 p-3 bg-[#F8F9FE] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{t("panel.creatorDetails")}</p>
              {inf.instagram_handle && inf.media_kit_published && (
                <a href={`/kit/${inf.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5851DB] hover:underline">
                  <ExternalLink size={10} /> {t("panel.mediaKit")}
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <Fact label={t("facts.fullName")} value={inf.full_name || "—"} />
              <Fact label="Instagram" value={inf.instagram_handle ? `@${inf.instagram_handle}` : "—"} href={inf.instagram_handle ? `https://instagram.com/${inf.instagram_handle}` : null} />
              <Fact label={t("facts.followers")} value={formatCount(inf.followers_count)} />
              <Fact label={t("facts.engagement")} value={inf.engagement_rate != null ? `${inf.engagement_rate}%` : "—"} />
              <Fact label={t("facts.posts")} value={formatCount(inf.media_count)} />
              <Fact label={t("facts.location")} value={inf.location || "—"} />
              {inf.email && <Fact label={t("facts.email")} value={inf.email} />}
              {app.proposed_rate != null && <Fact label={t("facts.proposedRate")} value={`₹${Number(app.proposed_rate).toLocaleString("en-IN")}`} highlight />}
              {app.brand_offered_rate != null && Number(app.brand_offered_rate) > 0 && <Fact label={t("facts.yourOffer")} value={`₹${Number(app.brand_offered_rate).toLocaleString("en-IN")}`} highlight />}
              {app.final_agreed_rate != null && <Fact label={t("facts.agreedRate")} value={`₹${Number(app.final_agreed_rate).toLocaleString("en-IN")}`} highlight />}
            </div>

            {app.pitch && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-extrabold text-[#5851DB] uppercase tracking-wider mb-1">{t("panel.pitch")}</p>
                <p className="text-[11px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#5851DB]/5 rounded-lg p-2.5">{app.pitch}</p>
              </div>
            )}

            {inf.bio && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">{t("panel.bio")}</p>
                <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap">{inf.bio}</p>
              </div>
            )}

            {Array.isArray(inf.categories) && inf.categories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{t("panel.categories")}</p>
                <div className="flex flex-wrap gap-1">
                  {inf.categories.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-gray-600 border border-gray-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {app.status === "rejected" && app.rejection_reason && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider mb-1">{t("panel.rejectionReason")}</p>
                <p className="text-[11px] text-gray-700">{app.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Submission links (when present) */}
          {links.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{t("panel.submissions")}</p>
              {links.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-[#F8F9FE] hover:bg-gray-100 rounded-lg transition-colors group">
                  <ExternalLink size={12} className="text-[#5851DB] shrink-0" />
                  <p className="text-[11px] font-semibold text-gray-700 capitalize flex-1 truncate">{item.label || item.type || t("common.deliverableN", { n: i + 1 })}</p>
                  <span className="text-[9px] uppercase font-bold text-gray-400 shrink-0">{item.type}</span>
                </a>
              ))}
            </div>
          )}

          {/* Default actions per status */}
          {mode === null && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {app.status === "pending" && (
                <>
                  <button onClick={() => setMode("offer")} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
                    <Check size={12} /> {t("actions.approveWithPrice")}
                  </button>
                  <button onClick={() => setMode("reject")} className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}>
                    <X size={12} /> {t("actions.reject")}
                  </button>
                </>
              )}
              {app.status === "offer_sent" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-purple-700 font-semibold bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg">
                  <Clock size={12} /> {t("actionMsgs.offerSent", { amount: Number(app.brand_offered_rate || 0).toLocaleString("en-IN") })}
                </span>
              )}
              {app.status === "offer_accepted" && (
                <button onClick={handleApprove} disabled={loading} className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`}>
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <IndianRupee size={12} />}
                  {t("actions.payToEscrow", { amount: Number(app.brand_offered_rate || 0).toLocaleString("en-IN") })}
                </button>
              )}
              {app.status === "withdrawn" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 font-semibold bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                  <X size={12} /> {t("actionMsgs.withdrew")}
                </span>
              )}
              {app.status === "approved" && (
                <>
                  <span className="text-[11px] text-gray-400 italic px-1 py-1">{t("actionMsgs.waitingSubmission")}</span>
                  <button onClick={() => setMode("reject")} className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}>
                    <X size={12} /> {t("actions.reject")}
                  </button>
                </>
              )}
              {app.status === "submitted" && (
                <>
                  <button onClick={() => updateStatus("accepted")} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {t("actions.accept")}
                  </button>
                  <button onClick={() => setMode("revision")} className={`${btn} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`}>
                    <RotateCcw size={12} /> {t("actions.revision")}
                  </button>
                  <button onClick={() => setMode("reject")} className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}>
                    <X size={12} /> {t("actions.reject")}
                  </button>
                </>
              )}
              {app.status === "revision_needed" && <span className="text-[11px] text-gray-400 italic px-1 py-1">{t("actionMsgs.waitingResubmit")}</span>}
              {app.status === "accepted" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                  <Check size={12} /> {t("actionMsgs.draftsAccepted")}
                </span>
              )}
              {app.status === "live_submitted" && (
                <>
                  <button onClick={() => setShowRating(true)} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                    {t("actions.approveRelease")}
                  </button>
                  <button onClick={() => setMode("revision")} className={`${btn} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`}>
                    <RotateCcw size={12} /> {t("actions.revision")}
                  </button>
                </>
              )}
              {app.status === "payment" && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                  <Check size={12} /> {t("actionMsgs.paymentReleased")}
                </span>
              )}
            </div>
          )}

          {/* Offer form — B15: no payment here, just the priced offer.
              The creator's proposed rate seeds the input; the brand can
              counter with a different number. One shot: the creator can
              only accept or withdraw, not counter back. */}
          {mode === "offer" && (
            <div className="mt-3 space-y-2 p-3 bg-emerald-50/40 rounded-lg border border-emerald-100">
              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t("offerForm.label")}</label>
              <input
                type="number"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <p className="text-[10px] text-emerald-700/80 leading-snug">
                {t("offerForm.hint")}
              </p>
              <div className="flex gap-2">
                <button onClick={handleSendOffer} disabled={loading} className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`}>
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {t("offerForm.send")}
                </button>
                <button onClick={() => setMode(null)} className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Reject form */}
          {mode === "reject" && (
            <div className="mt-3 space-y-2 p-3 bg-red-50/40 rounded-lg border border-red-100">
              <label className="text-[10px] font-bold text-red-700 uppercase tracking-wider">{t("rejectForm.label")}</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("rejectForm.placeholder")}
                className="w-full px-3 py-2 rounded-lg bg-white border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleReject} disabled={loading} className={`${btn} bg-red-600 text-white border-red-600 hover:bg-red-500`}>
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                  {t("rejectForm.confirm")}
                </button>
                <button onClick={() => setMode(null)} className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Revision form */}
          {mode === "revision" && (
            <div className="mt-3 space-y-2 p-3 bg-orange-50/40 rounded-lg border border-orange-100">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">{t("revisionForm.title")}</p>
              <div className="space-y-1">
                {links.map((item, i) => {
                  const selected = revisionIndexes.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleRevisionIndex(i)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        selected ? "bg-orange-100 border-orange-300" : "bg-white border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "bg-orange-500 border-orange-500" : "border-gray-300"}`}>
                        {selected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-[11px] font-semibold text-gray-700 capitalize flex-1 truncate">{item.label || item.type || t("common.deliverableN", { n: i + 1 })}</span>
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder={t("revisionForm.placeholder")}
                className="w-full px-3 py-2 rounded-lg bg-white border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleRevision} disabled={loading || revisionIndexes.length === 0} className={`${btn} bg-orange-600 text-white border-orange-600 hover:bg-orange-500`}>
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  {t("revisionForm.send")}
                </button>
                <button onClick={() => setMode(null)} className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <RatingModal
        open={showRating}
        onClose={() => setShowRating(false)}
        applicationId={app.id}
        campaignId={app.campaign_id}
        brandId={brandId}
        influencerId={app.influencer_id}
        raterRole="brand"
        title={t("rating.title")}
        subtitle={t("rating.subtitle", { name: displayName })}
        sections={[{ key: "target_rating", label: t("rating.sectionLabel", { name: displayName }) }]}
        primaryCta={t("rating.primaryCta")}
        secondaryCta={t("rating.secondaryCta")}
        onSaved={(saved) => onRated?.(saved)}
        onPrimary={() => releaseEscrow()}
        onSkip={() => releaseEscrow()}
      />
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
};

// B15f — full application journey. Timeline from
// application_status_history (RLS lets the brand read rows for its own
// campaigns) + the complete review panel (ApplicationRow, permanently
// expanded) with every action the brand can take at the current stage.
const JOURNEY_LABELS = {
  pending: "pending",
  offer_sent: "offer_sent",
  offer_accepted: "offer_accepted",
  withdrawn: "withdrawn",
  approved: "approved",
  submitted: "submitted",
  revision_needed: "revision_needed",
  accepted: "accepted",
  live_submitted: "live_submitted",
  payment: "payment",
  completed: "completed",
  rejected: "rejected",
};

function ApplicationJourneyModal({ app, brandId, defaultRate, rating, onRated, onRefresh, onClose }) {
  const t = useTranslations("BrandsCampaignId");
  const supabase = createClient();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const inf = app.influencer_profiles || {};
  const displayName = inf.full_name || inf.username || inf.instagram_handle || t("common.creator");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("application_status_history")
          .select("id, from_status, to_status, changed_by_role, reason, created_at")
          .eq("application_id", app.id)
          .order("created_at", { ascending: true });
        if (!cancelled) setHistory(data || []);
      } catch {
        /* timeline is progressive enhancement — panel still works */
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [app.id, supabase]);

  // Synthesise the "Applied" event if history starts later (backfill rows
  // exist for old applications, but a fresh application's first history
  // row is its first TRANSITION, not the application itself).
  const events = useMemo(() => {
    const out = [];
    const hasInitial = history.some((h) => !h.from_status);
    if (!hasInitial) {
      out.push({
        id: "applied",
        to_status: "pending",
        changed_by_role: "influencer",
        reason: app.proposed_rate ? t("journeyModal.proposed", { amount: Number(app.proposed_rate).toLocaleString("en-IN") }) : null,
        created_at: app.created_at,
      });
    }
    return [...out, ...history];
  }, [history, app.created_at, app.proposed_rate]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-black text-gray-900 truncate">{displayName}</h2>
            <p className="text-[11px] text-gray-400">{t("journeyModal.subtitle")}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Timeline */}
          <div className="bg-[#F8F9FE] rounded-2xl p-4">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">{t("journeyModal.journey")}</p>
            {historyLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                <Loader2 size={14} className="animate-spin" /> {t("journeyModal.loadingHistory")}
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">{t("journeyModal.noHistory")}</p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200 rounded-full" />
                {events.map((ev, i) => {
                  const isLast = i === events.length - 1;
                  const label = JOURNEY_LABELS[ev.to_status] ? t(`journey.${JOURNEY_LABELS[ev.to_status]}`) : ev.to_status;
                  return (
                    <div key={ev.id} className="relative pb-4 last:pb-0">
                      <div
                        className={`absolute -left-5 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isLast ? "bg-[#5851DB] border-[#5851DB]" : "bg-white border-gray-300"
                        }`}
                      >
                        {isLast && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <p className={`text-[12px] font-bold ${isLast ? "text-gray-900" : "text-gray-600"}`}>{label}</p>
                      <p className="text-[10px] text-gray-400">
                        {formatDate(ev.created_at)}
                        {ev.changed_by_role && ` · ${t("journeyModal.by", { role: ev.changed_by_role })}`}
                        {ev.reason && ` · ${ev.reason}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Full review panel — same component the aside used to render
              inline, permanently expanded, with all stage actions. */}
          <ApplicationRow
            app={app}
            brandId={brandId}
            defaultRate={defaultRate}
            rating={rating}
            onRated={onRated}
            onRefresh={() => {
              onRefresh?.();
            }}
            alwaysExpanded
          />
        </div>
      </div>
    </div>
  );
}

// Small modal shown when a brand hits Edit on a campaign that already
// has applications. The brief is frozen at that point (applying
// creators agreed to those specific terms) — we surface Pause +
// Duplicate as the two safe paths forward.
function NotEditableModal({ open, onClose, onPause, onDuplicate, isPaused, applicationCount }) {
  const t = useTranslations("BrandsCampaignId");
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-6 pb-2 flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-gray-900">{t("notEditable.title")}</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              {t("notEditable.body", { count: applicationCount })}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onPause}
            disabled={isPaused}
            className="inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Pause size={14} />
            {isPaused ? t("notEditable.alreadyPaused") : t("notEditable.pauseCampaign")}
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold text-white bg-[#5851DB] hover:bg-[#4742c4] cursor-pointer"
          >
            <Copy size={14} />
            {t("notEditable.duplicate")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small confirm modal for the hard delete. Only reachable when the
// campaign has zero applications (client-side gate); the server
// re-verifies before executing.
function DeleteCampaignModal({ open, onClose, onConfirm, deleting, title }) {
  const t = useTranslations("BrandsCampaignId");
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="px-6 pt-6 pb-2 flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
            <Trash2 size={18} />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-gray-900">{t("deleteModal.title")}</h2>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              {t.rich("deleteModal.body", {
                title: title || t("campaignFallback"),
                b: (c) => <span className="font-bold text-gray-800">{c}</span>,
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="py-3 rounded-2xl text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? t("deleteModal.deleting") : t("deleteModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

const Fact = ({ label, value, highlight, href }) => {
  const content = (
    <>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-[11px] font-semibold truncate ${highlight ? "text-[#5851DB]" : "text-gray-900"} ${href ? "group-hover:underline" : ""}`}>{value}</p>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="min-w-0 group">
        {content}
      </a>
    );
  }
  return <div className="min-w-0">{content}</div>;
};

export default CampaignDetailPage;
