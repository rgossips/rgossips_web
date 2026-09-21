"use client";

// Shown the moment a brand publishes — from the create dialog or from the
// Publish action on an existing draft.
//
// Publishing does NOT put a campaign in front of creators: `brand-campaigns`
// routes it to `under_review` unless the brand has `auto_approve_campaigns`
// on. Without this the brand saw "published", found their campaign nowhere in
// the creator feed, and assumed something had broken. The server tells us
// which of the two happened (`underReview`), so this only appears when the
// campaign genuinely is waiting on a human.
//
// Acknowledge-only: no outside-click dismiss. A stray tap must not be the
// thing that hides the one explanation of why the campaign isn't live.

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

export function CampaignUnderReviewModal({ open, onClose }) {
  const t = useTranslations("CampaignUnderReview");
  if (!open) return null;

  return (
    // Popups start at z-250, above BottomNavBrands (z-150) — see the popup
    // layering note in CLAUDE.md.
    <div data-scroll-lock className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm max-h-[90dvh] rounded-3xl bg-white shadow-2xl overflow-y-auto overscroll-contain">
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
            <ShieldCheck size={26} />
          </div>
          <h2 className="mt-4 text-lg font-black text-gray-900">{t("title")}</h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">{t("body")}</p>
          <p className="mt-3 text-xs text-gray-400 leading-relaxed">{t("note")}</p>
        </div>
        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#5851DB] text-white text-sm font-bold cursor-pointer active:scale-[0.99]"
          >
            {t("cta")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CampaignUnderReviewModal;
