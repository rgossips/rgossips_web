"use client";

// The creator's résumé — a one-page PDF they can hand a brand.
//
// This page was a prototype that shipped: it rendered a hardcoded creator
// ("Rohan Sharma", 145K followers, a W3C sample PDF) to anyone who opened the
// URL, alongside a "Regenerate AI Resume" button that only ran a setTimeout.
// It now renders the signed-in creator's real profile through the same
// helpers the media kit uses, and the PDF is built in the browser — there is
// no `resume_pdf_url` column and never was, so nothing here fetches one.
//
// Owner-only, deliberately. The route carries an [id], but check-profile
// returns email, address and referral_code for any id it is given, so serving
// someone else's résumé from that id would publish those. Until a public
// résumé needs to exist, the id is only honoured when it is your own — the
// public artefact for brands is /kit/<handle>, which is built for that.

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, FileText, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { useAuth } from "@/context/AuthContext";
import ResumeTemplate from "@/components/ResumeTemplate";
import { buildResumeData } from "@/lib/resumeData";

// PDFViewer touches window on import.
const ResumeViewer = dynamic(() => import("@/components/ResumeViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] sm:h-[78vh] grid place-items-center text-gray-500">
      <Loader2 size={22} className="animate-spin" />
    </div>
  ),
});

export default function ResumePage() {
  const t = useTranslations("InfluencerResumeId");
  const params = useParams();
  const { user, profile, loading } = useAuth();

  const routeId = params?.id ? String(params.id) : "";
  const isOwner = !!user?.id && (!routeId || routeId === user.id);

  const data = useMemo(
    () => (isOwner ? buildResumeData(profile) : null),
    [isOwner, profile],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white grid place-items-center">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  // Signed out, or looking at someone else's id.
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white grid place-items-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-white/5 grid place-items-center text-gray-400">
            <Lock size={20} />
          </div>
          <h1 className="text-xl font-bold">{t("privateTitle")}</h1>
          <p className="text-sm text-gray-400 leading-relaxed">{t("privateBody")}</p>
          <Link
            href="/influencer/media-kit"
            className="inline-flex items-center justify-center gap-2 bg-white text-black px-5 py-3 rounded-xl font-bold"
          >
            <FileText size={16} />
            {t("openMediaKit")}
          </Link>
        </div>
      </div>
    );
  }

  // Signed in, but the profile has not loaded (or has no Instagram data yet).
  if (!data) {
    return (
      <div className="min-h-screen bg-[#0b0b0f] text-white grid place-items-center">
        <Loader2 size={24} className="animate-spin text-gray-500" />
      </div>
    );
  }

  const fileName = `${(data.handle || "creator").replace(/[^a-z0-9_.-]/gi, "")}-rgossips-resume.pdf`;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-white pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-gray-400 mt-2">{t("insightsFor", { name: data.name })}</p>
        </div>

        {/* Builds the same document the preview shows and hands it over as a
            file — no server round trip, no stored URL. */}
        <PDFDownloadLink
          document={<ResumeTemplate data={data} />}
          fileName={fileName}
          className="flex items-center cursor-pointer justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
        >
          {({ loading: building }) =>
            building ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t("preparing")}
              </>
            ) : (
              <>
                <Download size={20} />
                {t("downloadPdf")}
              </>
            )
          }
        </PDFDownloadLink>
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:items-start">
        <div className="flex-1 w-full min-w-0">
          <ResumeViewer data={data} />
          <p className="text-center text-gray-500 text-sm mt-4 italic">{t("scrollHint")}</p>
        </div>

        <aside className="w-full lg:w-[400px] lg:sticky lg:top-28">
          <div className="space-y-6">
            <div className="bg-[#16161d] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                {t("creatorSnapshot")}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-xs text-gray-500">{t("stats.followers")}</p>
                  <p className="text-xl font-bold">{data.followers}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl text-center">
                  <p className="text-xs text-gray-500">{t("stats.engagement")}</p>
                  <p className="text-xl font-bold">{data.engagement || "—"}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-4 leading-relaxed">
                {t("sourceNote")}
              </p>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-indigo-400 mb-2">{t("shareTitle")}</h3>
              <p className="text-sm text-gray-400 mb-4">{t("shareBody")}</p>
              <Link
                href="/influencer/media-kit"
                className="w-full py-3 bg-indigo-500 rounded-xl font-bold hover:bg-indigo-600 transition-colors inline-flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                {t("openMediaKit")}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
