"use client";

import { useEffect, useMemo, useState } from "react";
import { applicationDeadlinePassed, campaignEnded } from "@/lib/campaignDates";
import { rankApplications, scoreApplicant, creatorFromApplication, targetFromCampaign, matchTone } from "@/lib/applicationMatch";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  IndianRupee,
  Loader2,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useGlobalLoading } from "@/context/LoadingContext";
import ErrorModal from "@/components/ErrorModal";
import { MATCH_TONE_CLASS, VERDICT_MARK, appStatusConfig, formatCount, formatDate } from "@/components/brands/applicationUi";

// The Create/Edit dialog is fat (form + image compression + upload
// helpers) and only mounts on an Edit click, so lazy-load to keep the
// campaign-detail bundle lean.
import { CampaignUnderReviewModal } from "@/components/brands/CampaignUnderReviewModal";

const CreateCampaignDialog = dynamic(
  () => import("@/components/brands/CreateCampaignDialog").then((m) => m.CreateCampaignDialog),
  { ssr: false },
);

// How many applicants the aside previews before handing off to the full
// /applications page. Six fills the column without turning the sidebar into
// a scroll container the brand has to work through.
const ASIDE_PREVIEW_COUNT = 6;

const statusStyles = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-yellow-50 text-yellow-700 border-yellow-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-purple-50 text-purple-700 border-purple-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  // Count of active influencers whose profile matches this campaign's
  // categories + follower band + cities. Server computes on get; also
  // returned by create so we can update from a stale-cached value.
  const [matchingCount, setMatchingCount] = useState(0);
  // Brand-sent invites tracking ("Invites" panel). responded = the invitee
  // applied to the campaign.
  const [inviteStats, setInviteStats] = useState({ sent: 0, responded: 0, total: 0 });
  const [invitees, setInvitees] = useState([]);
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
    setInviteStats(data.inviteStats || { sent: 0, responded: 0, total: 0 });
    setInvitees(Array.isArray(data.invitees) ? data.invitees : []);
    setLoading(false);
    // The ratings query that used to live here fed the review modal. The
    // review is its own page now and reads the one row it needs, so this
    // page no longer pulls ratings it never displayed.
  };

  useEffect(() => {
    if (!authLoading && user?.id && id) load();
  }, [authLoading, user?.id, id]);

  // True once a publish from this page landed in the moderation queue.
  const [reviewNotice, setReviewNotice] = useState(false);
  // Where to go once the notice is dismissed (duplicate flow only).
  const [reviewNoticeNext, setReviewNoticeNext] = useState(null);

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
      // Publishing a draft does not necessarily make it active: unless the
      // brand is on auto-approve, the server parks it in `under_review`.
      // Reflecting `newStatus` blindly showed a Live chip on a campaign no
      // creator could see.
      const applied = data?.underReview ? "under_review" : newStatus;
      setCampaign((prev) => ({ ...prev, status: applied }));
      if (data?.underReview) setReviewNotice(true);
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

  // "Invite creators" — same as the match click but lands Find Creators in
  // select-mode pre-bound to this campaign (Flow B). Only meaningful for a
  // live campaign; the search page + edge fn both re-check that.
  const inviteCreators = () => {
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
    p.set("invite", campaign.id);
    router.push(`/brands/search?${p.toString()}`);
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

  // Best fit first, rather than newest first. Newest tells a brand nothing
  // about who is worth reading; this ranks against the campaign’s own
  // targeting. See lib/applicationMatch.js — it is hand-synced with the
  // admin portal so both sides show the same order and the same reasons.
  const rankedApplications = useMemo(
    () => (campaign ? rankApplications(applications, campaign) : applications),
    [applications, campaign],
  );
  const matchTarget = useMemo(() => targetFromCampaign(campaign), [campaign]);

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
          {/* Derived display status. A finished campaign says CLOSED;
              one whose applications have shut while delivery continues says
              APPLICATIONS CLOSED, where that wording is literally true.
              See the note in CampaignCard. */}
          {campaign.status === "active" &&
          campaignEnded(campaign.endDate, campaign.applicationDeadline) ? (
            <span className="px-3 py-1 rounded-full text-[11px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
              {t("statusBadge.closed")}
            </span>
          ) : campaign.status === "active" &&
            campaign.applicationDeadline &&
            applicationDeadlinePassed(campaign.applicationDeadline) ? (
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

      {/* Why the campaign was turned down. The reason used to live only in
          a notification and the admin audit log, so a brand who missed the
          notification saw a bare status and had nothing to act on. It is
          cleared server-side the moment the campaign leaves `rejected`. */}
      {campaign.status === "rejected" && (
        <div className="px-6 pt-4 max-w-6xl mx-auto">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-2xl bg-white flex items-center justify-center text-red-600">
                <AlertCircle size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-red-800">{t("rejected.title")}</p>
                {campaign.reviewReason ? (
                  <p className="text-[12px] text-red-700 mt-1 leading-relaxed whitespace-pre-line">
                    {campaign.reviewReason}
                  </p>
                ) : (
                  <p className="text-[12px] text-red-700 mt-1 leading-relaxed">
                    {t("rejected.noReason")}
                  </p>
                )}
                <p className="text-[11px] text-red-600/80 mt-2">{t("rejected.next")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start space-y-5">
          {/* Invite creators — brand-initiated targeted invite, right above
              the invites tracker. Only a live campaign can be invited to
              (server re-checks). */}
          {campaign.status === "active" && (
            <button
              onClick={inviteCreators}
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#5851DB] text-white px-4 py-3 text-[13px] font-extrabold cursor-pointer hover:brightness-110"
            >
              <UserPlus size={16} />
              Invite creators to this campaign
            </button>
          )}

          {/* Invites tracking — brand-sent invites + how many responded
              (applied). Only rendered once at least one invite exists. */}
          {inviteStats.total > 0 && (
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Invites</h3>
                <UserPlus size={14} className="text-[#5851DB]" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#F8F9FE] rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-gray-900">{inviteStats.total}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Invited</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-extrabold text-emerald-600">{inviteStats.responded}</p>
                  <p className="text-[10px] text-emerald-500/80 uppercase font-bold mt-1">Responded</p>
                </div>
              </div>
              <div className="space-y-2">
                {invitees.map((iv) => (
                  <div key={iv.influencerId} className="flex items-center gap-3 p-2 rounded-xl">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {iv.photo ? <img src={iv.photo} alt={iv.name} className="w-full h-full object-cover" /> : (iv.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-gray-900 truncate">{iv.name}</p>
                      {iv.handle && <p className="text-[10px] text-gray-400 truncate">@{iv.handle}</p>}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        iv.status === "responded" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {iv.status === "responded" ? "Applied" : "Invited"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                {t("applications.heading")}
                {applications.length > ASIDE_PREVIEW_COUNT && (
                  <span className="ml-2 normal-case tracking-normal font-semibold text-gray-300">
                    {t("applications.showingTop", { count: ASIDE_PREVIEW_COUNT })}
                  </span>
                )}
              </h3>
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
                {/* The aside is a preview, not the list. It shows the best
                    fits and hands everything else — status tabs, filters,
                    the other sorts — to /applications, which is the page
                    built for reading ninety of these. */}
                {rankedApplications.slice(0, ASIDE_PREVIEW_COUNT).map((a) => {
                  const inf = a.influencer_profiles || {};
                  const match = scoreApplicant(creatorFromApplication(a), matchTarget);
                  const name = inf.full_name || inf.username || inf.instagram_handle || t("common.creator");
                  const st = appStatusConfig[a.status] || appStatusConfig.pending;
                  return (
                    <Link
                      key={a.id}
                      href={`/brands/campaign/${campaign.id}/applications/${a.id}`}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 hover:border-purple-200 text-left cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                        {inf.profile_photo_url ? <img src={inf.profile_photo_url} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {inf.instagram_handle && <p className="text-[11px] text-gray-400 truncate">@{inf.instagram_handle}</p>}
                          {match.percent !== null && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${MATCH_TONE_CLASS[matchTone(match.percent)]}`} title={match.dimensions.map((d) => `${VERDICT_MARK[d.verdict]} ${d.label}`).join(" · ")}>
                              {match.percent}% match
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.bg} shrink-0`}>{t(`appStatus.${st.labelKey}`)}</span>
                      <ChevronRight size={14} className="text-gray-300 shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}

            {applications.length > 0 && (
              <Link
                href={`/brands/campaign/${campaign.id}/applications`}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#5851DB] px-4 py-2.5 text-[12px] font-extrabold text-[#5851DB] hover:bg-purple-50 cursor-pointer"
              >
                {t("applications.viewAll", { count: applications.length })}
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </aside>
      </div>

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
          onCreated={(newId, info) => {
            setDuplicatePrefill(null);
            if (info?.underReview) {
              setReviewNoticeNext(newId || null);
              setReviewNotice(true);
              return;
            }
            router.push(`/brands/campaign/${newId}`);
          }}
        />
      )}

      {/* Delete confirmation — small dedicated modal (destructive
          actions deserve a slower path than a stock alert()). */}
      <CampaignUnderReviewModal
        open={reviewNotice}
        onClose={() => {
          const next = reviewNoticeNext;
          setReviewNotice(false);
          setReviewNoticeNext(null);
          if (next) router.push(`/brands/campaign/${next}`);
        }}
      />

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
      {/* A rejected campaign is fixed by editing it, then resubmitting.
          Resubmit goes to `under_review`, never straight to active — the
          server enforces that too. */}
      {status === "rejected" && (
        <button onClick={() => onChange("active")} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {t("statusActions.resubmit")}
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
        <div data-scroll-lock className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={close}>
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
          <img src={images[index]} alt={t("gallery.imageAlt", { n: index + 1 })} className="max-w-[90vw] max-h-[85dvh] object-contain" onClick={(e) => e.stopPropagation()} />
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



// Small modal shown when a brand hits Edit on a campaign that already
// has applications. The brief is frozen at that point (applying
// creators agreed to those specific terms) — we surface Pause +
// Duplicate as the two safe paths forward.
function NotEditableModal({ open, onClose, onPause, onDuplicate, isPaused, applicationCount }) {
  const t = useTranslations("BrandsCampaignId");
  if (!open) return null;
  return (
    <div
      data-scroll-lock
      className="fixed inset-0 z-[310] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90dvh] rounded-3xl bg-white shadow-2xl overflow-y-auto overscroll-contain"
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
      data-scroll-lock
      className="fixed inset-0 z-[310] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90dvh] rounded-3xl bg-white shadow-2xl overflow-y-auto overscroll-contain"
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


export default CampaignDetailPage;
