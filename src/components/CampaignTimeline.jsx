import { Calendar } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function CampaignTimeline() {
  const t = await getTranslations("CampaignTimeline");

  const steps = [
    { label: t("steps.applicationReview.label"), time: t("steps.applicationReview.time") },
    { label: t("steps.contentCreation.label"), time: t("steps.contentCreation.time") },
    { label: t("steps.brandReview.label"), time: t("steps.brandReview.time") },
    { label: t("steps.publishContent.label"), time: t("steps.publishContent.time") },
    { label: t("steps.paymentRelease.label"), time: t("steps.paymentRelease.time") },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800">{t("title")}</h3>
      <div className="relative space-y-8 before:absolute before:inset-0 before:left-5 before:w-[2px] before:bg-slate-100">
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-center gap-6 pl-2">
            <div className="z-10 w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500 font-bold text-xs border-4 border-white shadow-sm">
              {i + 1}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{step.label}</p>
              <p className="text-[11px] text-slate-400">{step.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 border border-orange-100">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shrink-0">
          <Calendar size={18} />
        </div>
        <div>
          <p className="text-xs font-bold text-orange-900">
            {t("totalDuration")}
          </p>
          <p className="text-[10px] text-orange-700/70 leading-tight">
            {t("durationNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
