"use client";

import React, { useEffect, useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";

const StarRow = ({ value, onChange, max = 5 }) => {
  const t = useTranslations("RatingModal");
  return (
  <div className="flex items-center gap-1.5">
    {Array.from({ length: max }, (_, i) => {
      const v = i + 1;
      const filled = v <= value;
      return (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className="cursor-pointer p-1.5 rounded-full transition-colors hover:bg-amber-50"
          aria-label={t("starLabel", { count: v })}
        >
          <Star
            size={28}
            className={
              filled
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200"
            }
          />
        </button>
      );
    })}
  </div>
  );
};

/**
 * RatingModal — multi-section star rating used in two places:
 *   1. Brand approving live links (raterRole="brand", target = influencer).
 *      Single section: target_rating (overall rating of the influencer).
 *   2. Influencer viewing completed campaign (raterRole="influencer").
 *      Three sections: target_rating (brand overall), brief_clarity,
 *      fairness — see migration 009 for the schema.
 *
 * Caller passes `sections: [{ key, label }]`. Each key must be a column on
 * campaign_ratings. The modal writes via supabase client and RLS gates the
 * insert to the authenticated rater.
 */
export default function RatingModal({
  open,
  onClose,
  applicationId,
  campaignId,
  brandId,
  influencerId,
  raterRole, // "brand" | "influencer"
  title,
  subtitle,
  sections, // [{ key: 'target_rating', label: '…' }, ...]
  primaryCta,
  secondaryCta,
  onPrimary, // optional async, runs AFTER successful save (e.g. brand: release payment)
  onSkip, // optional, runs when secondary clicked
  onSaved, // optional, fired with the saved values map after a successful upsert
}) {
  const t = useTranslations("RatingModal");
  const primaryLabel = primaryCta ?? t("submit");
  const secondaryLabel = secondaryCta === undefined ? t("skip") : secondaryCta;
  const supabase = createClient();
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState("");

  // Reset every time the modal is reopened — stale values from a previous
  // session would otherwise carry over.
  useEffect(() => {
    if (open) {
      setValues({});
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const reset = () => {
    setValues({});
    setError("");
  };

  const setVal = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));

  const handleClose = () => {
    if (submitting || skipping) return;
    reset();
    onClose?.();
  };

  const handleSkip = async () => {
    if (submitting) return;
    setSkipping(true);
    try {
      await onSkip?.();
      reset();
      onClose?.();
    } finally {
      setSkipping(false);
    }
  };

  const handleSubmit = async () => {
    const missing = (sections || []).find((s) => !values[s.key]);
    if (missing) {
      setError(t("errors.pleaseRate", { label: missing.label }));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const row = {
        application_id: applicationId,
        campaign_id: campaignId,
        brand_id: brandId,
        influencer_id: influencerId,
        rater_role: raterRole,
      };
      for (const s of sections) row[s.key] = values[s.key];

      const { error: dbErr } = await supabase
        .from("campaign_ratings")
        .upsert(row, { onConflict: "application_id,rater_role" });
      if (dbErr) throw new Error(dbErr.message);

      onSaved?.({ ...values });
      await onPrimary?.();
      reset();
      onClose?.();
    } catch (e) {
      setError(e.message || t("errors.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || skipping;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-3">
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={busy}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
            aria-label={t("close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 py-2">
          {(sections || []).map((s) => (
            <div key={s.key}>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {s.label}
              </p>
              {s.helper && (
                <p className="text-[11px] text-slate-400 mb-2 -mt-1.5">{s.helper}</p>
              )}
              <StarRow value={values[s.key] || 0} onChange={(v) => setVal(s.key, v)} />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 font-semibold mt-3">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          {secondaryLabel && (
            <button
              onClick={handleSkip}
              disabled={busy}
              className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 text-sm bg-white cursor-pointer disabled:opacity-50"
            >
              {skipping ? (
                <span className="inline-flex items-center gap-2 justify-center">
                  <Loader2 size={14} className="animate-spin" />
                  {t("working")}
                </span>
              ) : (
                secondaryLabel
              )}
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? t("submitting") : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
