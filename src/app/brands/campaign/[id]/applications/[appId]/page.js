"use client";

// One applicant, reviewed.
//
// This replaced a modal. Reviewing an applicant is not a glance — the brand
// reads a pitch, a profile and a deliverable set and then commits money —
// and a dialog gave that a fixed 2xl column however wide the screen was,
// could not be linked to or shared with a colleague, vanished on refresh,
// and made the browser's back button do the wrong thing. A page fixes all
// four.
//
// The Journey timeline is NOT rendered while the application is still
// `pending`: its only entry would be "Applied", which the header and the
// status chip already say. A one-step timeline is chrome, not information.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, RefreshCw, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { creatorFromApplication, matchTone, scoreApplicant, targetFromCampaign } from "@/lib/applicationMatch";
import { ApplicationJourney, ApplicationRow } from "@/components/brands/ApplicationReview";
import { MATCH_TONE_CLASS, VERDICT_MARK, appStatusConfig, formatCount, formatDate } from "@/components/brands/applicationUi";

const ApplicationDetailPage = () => {
  const t = useTranslations("BrandsCampaignId");
  const { id, appId } = useParams();

  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [campaign, setCampaign] = useState(null);
  const [app, setApp] = useState(null);
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // brand-campaigns has no "one application" action, so this reads the
  // campaign and picks the row. The same call also yields the brief, which
  // the match breakdown needs anyway.
  const load = async () => {
    if (!user?.id || !id) return;
    setLoading(true);
    setError("");
    const { data, error: err } = await supabase.functions.invoke("brand-campaigns", {
      body: { action: "get", campaignId: id, brandId: user.id },
    });
    if (err || data?.error) {
      setError(err?.message || data?.error || t("errors.loadFailed"));
      setLoading(false);
      return;
    }
    setCampaign(data.campaign);
    const found = (data.applications || []).find((a) => a.id === appId) || null;
    setApp(found);
    setLoading(false);

    if (found) {
      const { data: ratings } = await supabase
        .from("campaign_ratings")
        .select("application_id, target_rating")
        .eq("application_id", found.id)
        .eq("rater_role", "brand");
      setRating(ratings?.[0] || null);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.id && id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, id, appId]);

  const match = useMemo(
    () => (app && campaign ? scoreApplicant(creatorFromApplication(app), targetFromCampaign(campaign)) : null),
    [app, campaign],
  );

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#5851DB]" />
      </div>
    );
  }

  if (error || !campaign || !app) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold text-gray-700">{error || t("allApplications.applicantNotFound")}</p>
        <Link href={`/brands/campaign/${id}/applications`} className="mt-4 text-sm font-semibold text-[#5851DB]">
          {t("allApplications.backToList")}
        </Link>
      </div>
    );
  }

  const inf = app.influencer_profiles || {};
  const name = inf.full_name || inf.username || inf.instagram_handle || t("common.creator");
  const st = appStatusConfig[app.status] || appStatusConfig.pending;
  // The one status with nothing to lay out: an application that has only
  // ever been applied to.
  const showJourney = app.status !== "pending";

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-24">
      <nav className="px-6 py-4 bg-white sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-[1480px] mx-auto flex items-center gap-3">
          <Link
            href={`/brands/campaign/${id}/applications`}
            className="p-2 -ml-2 rounded-full hover:bg-gray-50 cursor-pointer text-gray-700"
            aria-label={t("allApplications.backToList")}
          >
            <ArrowLeft size={22} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider truncate">
              {campaign.title}
            </p>
            <h1 className="text-[15px] font-extrabold text-gray-900 truncate">{name}</h1>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold whitespace-nowrap shrink-0 ${st.bg}`}>
            {t(`appStatus.${st.labelKey}`)}
          </span>
          <button
            onClick={load}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
            title={t("tooltips.refresh")}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </nav>

      <div className="px-6 pt-5 max-w-[1480px] mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* ─── Review panel ─── */}
        <div className="min-w-0">
          <ApplicationRow
            app={app}
            brandId={user?.id}
            defaultRate={campaign.budgetPerInfluencer || 0}
            campaignType={campaign.campaignType}
            rating={rating}
            onRated={(r) => setRating((prev) => ({ ...(prev || {}), ...r }))}
            onRefresh={load}
            alwaysExpanded
          />
        </div>

        {/* ─── Rail: who they are, how they fit, what has happened ─── */}
        <aside className="lg:sticky lg:top-28 space-y-4 min-w-0">
          <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                {inf.profile_photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={inf.profile_photo_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-gray-900 truncate">{name}</p>
                {inf.instagram_handle && <p className="text-[13px] text-gray-400 truncate">@{inf.instagram_handle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mt-3 text-[13px] text-gray-500 font-semibold">
              <span className="inline-flex items-center gap-1">
                <Users size={12} className="text-gray-400" />
                {formatCount(inf.followers_count)}
              </span>
              {Number(inf.engagement_rate) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp size={12} className="text-gray-400" />
                  {Number(inf.engagement_rate).toFixed(1)}%
                </span>
              )}
              {inf.location && (
                <span className="inline-flex items-center gap-1 min-w-0">
                  <MapPin size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{inf.location}</span>
                </span>
              )}
            </div>
            <p className="text-[13px] text-gray-400 mt-2">
              {t("allApplications.appliedOn", { date: formatDate(app.created_at) })}
            </p>

            {match?.percent !== null && match?.percent !== undefined && (
              <div className="mt-4 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider">
                    {t("allApplications.groupMatch")}
                  </p>
                  <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${MATCH_TONE_CLASS[matchTone(match.percent)]}`}>
                    {t("allApplications.matchBadge", { percent: match.percent })}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {match.dimensions.map((d) => (
                    <span
                      key={d.key}
                      className={`px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                        d.verdict === "match"
                          ? "bg-emerald-50 text-emerald-700"
                          : d.verdict === "miss"
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {VERDICT_MARK[d.verdict]} {d.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showJourney && (
            <ApplicationJourney
              applicationId={app.id}
              createdAt={app.created_at}
              proposedRate={app.proposed_rate}
            />
          )}
        </aside>
      </div>
    </div>
  );
};

export default ApplicationDetailPage;
