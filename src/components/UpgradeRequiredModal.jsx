"use client";

// Why a free creator cannot apply to THIS campaign, said before they invest
// anything in it.
//
// The server refuses both cases in apply-campaign, but until now that refusal
// arrived after the creator had opened the form and written a pitch — the
// worst possible moment to learn the rules. This fires on the Apply click
// instead, so nothing is wasted, and it names the specific reason rather than
// showing a generic paywall:
//
//   paid_campaign — the campaign carries cash (paid or hybrid). Free covers
//                   barter only, so the useful next step is either a plan or
//                   a barter campaign; both are offered.
//   quota         — the three free applications are spent. Only a plan helps.
//
// Deliberately not dismissible by outside click: it is the one explanation of
// why the button did nothing, and a stray tap must not remove it.

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Crown, Lock, X, Sparkles } from "lucide-react";
import { FREE_BARTER_APPLICATIONS, PLAN_PRICING, PLAN_IDS } from "@/lib/plans";

export function UpgradeRequiredModal({ reason, remaining = 0, campaignType, onClose }) {
  const t = useTranslations("UpgradeRequired");
  if (!reason) return null;

  // continue_paid — a free creator who applied to a paid campaign before
  //                 the barter-only limit existed, now trying to take it
  //                 forward. Not "your free applications cover barter":
  //                 they already applied; what they need is a plan.
  const isContinue = reason === "continue_paid";
  const isPaidCampaign = reason === "paid_campaign" || isContinue;
  const from = PLAN_PRICING?.[PLAN_IDS.STARTER]?.monthly;

  return (
    // Above the influencer BottomNav (z-100) and the sticky apply bar (z-50).
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-white cursor-pointer z-10"
        >
          <X size={18} />
        </button>

        <div
          className="px-6 pt-8 pb-6 text-center text-white"
          style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
        >
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            {isPaidCampaign ? <Lock size={26} /> : <Crown size={26} />}
          </div>
          <h2 className="mt-4 text-lg font-black leading-tight">
            {isContinue ? t("continue.title") : isPaidCampaign ? t("paid.title") : t("quota.title")}
          </h2>
          <p className="mt-2 text-sm text-white/90 leading-relaxed">
            {isContinue
              ? t("continue.body")
              : isPaidCampaign
              ? t("paid.body", {
                  limit: FREE_BARTER_APPLICATIONS,
                  kind:
                    String(campaignType || "").toLowerCase() === "hybrid"
                      ? t("kind.hybrid")
                      : t("kind.paid"),
                })
              : t("quota.body", { limit: FREE_BARTER_APPLICATIONS })}
          </p>
        </div>

        <div className="px-6 py-6">
          <ul className="space-y-2.5">
            {[t("perk1"), t("perk2"), t("perk3")].map((p) => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 text-purple-600">
                  <Sparkles size={14} />
                </span>
                <span className="text-[13px] text-slate-600 leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/influencer/pricing"
            className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg shadow-purple-200 cursor-pointer hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            <Crown size={16} />
            {from ? t("ctaFrom", { price: from }) : t("cta")}
          </Link>

          {/* A creator blocked by campaign TYPE still has free applications to
              spend — point them at the ones they can use. Someone out of quota
              has nowhere useful to go but the plans page. */}
          {isPaidCampaign && !isContinue && remaining > 0 ? (
            <Link
              href="/influencer/campaigns?type=barter"
              className="mt-2 w-full flex items-center justify-center py-3 rounded-2xl text-[13px] font-bold text-purple-700 border border-purple-200 hover:bg-purple-50 cursor-pointer"
            >
              {t("browseBarter", { remaining })}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full py-3 rounded-2xl text-[13px] font-bold text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              {t("notNow")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpgradeRequiredModal;
