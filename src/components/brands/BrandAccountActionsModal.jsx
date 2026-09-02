"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, AlertTriangle, Trash2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";

// Two flavours of "I want to leave" that share one shell so we don't ship two
// near-identical modals. `variant="deactivate"` is the soft, self-restorable
// pause (signing back in reactivates). `variant="delete"` is the 30-day
// purge — only admin can restore in the grace window.

const REASONS_DEACTIVATE = [
  { key: "break", value: "Taking a break from campaigns" },
  { key: "otherPlatform", value: "Found another platform" },
  { key: "privacy", value: "Privacy concerns" },
  { key: "notFindingCreators", value: "Not finding the right creators" },
  { key: "tooManyNotifications", value: "Too many notifications" },
  { key: "security", value: "Account security issues" },
  { key: "other", value: "Other" },
];

const REASONS_DELETE = [
  { key: "closingBusiness", value: "Closing the business" },
  { key: "movingPlatform", value: "Moving to a different platform" },
  { key: "privacy", value: "Privacy concerns" },
  { key: "createdByMistake", value: "Created the account by mistake" },
  { key: "duplicate", value: "Duplicate account" },
  { key: "other", value: "Other" },
];

export default function BrandAccountActionsModal({ variant, open, onClose }) {
  const t = useTranslations("BrandsBrandAccountActionsModal");
  const router = useRouter();
  const supabase = createClient();
  const { user, signOut } = useAuth();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;
  if (typeof window === "undefined") return null;

  const isDelete = variant === "delete";
  const reasons = isDelete ? REASONS_DELETE : REASONS_DEACTIVATE;
  const reasonsGroup = isDelete ? "reasonsDelete" : "reasonsDeactivate";

  // Delete needs an extra typed-confirmation gate ("DELETE") because the
  // grace window can be revoked but we want the user to feel the weight.
  const canSubmit =
    !!reason &&
    confirmed &&
    !submitting &&
    (!isDelete || confirmText.trim().toUpperCase() === "DELETE");

  const handleSubmit = async () => {
    if (!user?.id || !canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const update = isDelete
        ? {
            status: "pending_deletion",
            deleted_at: now,
            deletion_reason: reason,
            updated_at: now,
          }
        : {
            status: "deactivated",
            updated_at: now,
          };

      const { error: upErr } = await supabase
        .from("brand_profiles")
        .update(update)
        .eq("brand_id", user.id);
      if (upErr) throw new Error(upErr.message);

      // Boot every signed-in device. For delete, this also prevents the
      // user from accidentally signing back in (verify-otp blocks the OTP).
      await supabase
        .from("device_sessions")
        .update({ is_active: false })
        .eq("user_id", user.id);

      // Confirmation email (deactivate → "your account is paused";
      // delete → "scheduled for deletion, 30-day grace"). Server-side
      // function derives the recipient from the JWT — fire-and-forget so
      // a mail outage can't block the sign-out path.
      try {
        await supabase.functions.invoke("send-account-event-email", {
          body: {
            event: isDelete ? "deletion_pending" : "deactivated",
            role: "brand",
          },
        });
      } catch (_) { /* non-fatal */ }

      await signOut();
      router.replace("/login");
    } catch (e) {
      setError(e.message || t("errors.failedToSubmit"));
      setSubmitting(false);
    }
  };

  return createPortal((
    <div className="fixed inset-0 z-[9999] flex items-end lg:items-center lg:justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full lg:max-w-lg bg-white rounded-t-[32px] lg:rounded-[32px] max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#E4E9F4]">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDelete ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
              }`}
            >
              {isDelete ? <Trash2 size={18} /> : <UserMinus size={18} />}
            </div>
            <div>
              <h3 className="text-lg font-black text-[#16224E]">
                {isDelete ? t("title.delete") : t("title.deactivate")}
              </h3>
              <p className="text-[11px] text-[#9C97B8] font-semibold">
                {isDelete
                  ? t("subtitle.delete")
                  : t("subtitle.deactivate")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 -mr-2 cursor-pointer disabled:opacity-50"
            aria-label={t("close")}
          >
            <X size={20} className="text-[#9C97B8]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-[12px] font-black text-red-900">{t("deleteInfo.heading")}</p>
                  <ul className="space-y-1.5 text-[11px] font-bold text-red-700/90">
                    <li>{t("deleteInfo.point1")}</li>
                    <li>{t("deleteInfo.point2")}</li>
                    <li>{t.rich("deleteInfo.point3", { email: (c) => <span className="font-extrabold">{c}</span> })}</li>
                    <li>{t("deleteInfo.point4")}</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-[12px] font-black text-amber-900">{t("deactivateInfo.heading")}</p>
                  <ul className="space-y-1.5 text-[11px] font-bold text-amber-700/90">
                    <li>{t("deactivateInfo.point1")}</li>
                    <li>{t("deactivateInfo.point2")}</li>
                    <li>{t("deactivateInfo.point3")}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-black text-[#16224E] mb-1">{isDelete ? t("reasonHeading.delete") : t("reasonHeading.deactivate")}</h4>
            <p className="text-[11px] text-[#9C97B8] font-bold mb-3">{t("reasonSubtext")}</p>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`w-full appearance-none p-3.5 pr-10 rounded-xl border text-[13px] font-bold outline-none cursor-pointer transition-all bg-white ${
                  reason
                    ? isDelete
                      ? "border-red-400 text-red-700"
                      : "border-[#6A66C9] text-[#6A66C9]"
                    : "border-[#E4E9F4] text-[#6B6785]"
                }`}
              >
                <option value="" disabled>
                  {t("reasonSelectPlaceholder")}
                </option>
                {reasons.map((r) => (
                  <option key={r.key} value={r.value}>
                    {t(`${reasonsGroup}.${r.key}`)}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#9C97B8] text-xs">▾</span>
            </div>
          </div>

          {isDelete && (
            <div>
              <label className="text-[10px] font-extrabold text-[#9C97B8] uppercase tracking-widest ml-1 mb-1.5 block">
                {t.rich("typeToConfirm", { hl: (c) => <span className="text-red-600">{c}</span> })}
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full p-3.5 bg-gray-50 border border-[#E4E9F4] focus:border-red-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none uppercase tracking-wider"
              />
            </div>
          )}

          {error && (
            <p className="text-[12px] text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}
        </div>

        {/* Footer — the confirm checkbox lives HERE (not in the scroll body)
            so it's always visible next to the action buttons. */}
        <div className="p-4 border-t border-[#E4E9F4] space-y-3">
          <label className="flex items-start gap-3 p-3.5 bg-gray-50 border border-[#E4E9F4] rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer"
            />
            <span className="text-[12px] font-bold text-gray-700 leading-snug">
              {isDelete
                ? t("confirmCheckbox.delete")
                : t("confirmCheckbox.deactivate")}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="py-3.5 rounded-2xl font-bold text-sm text-gray-700 border border-[#E4E9F4] cursor-pointer disabled:opacity-50"
          >
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`py-3.5 rounded-2xl font-black text-sm text-white shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDelete ? "bg-red-500 shadow-red-100 hover:bg-red-600" : "bg-amber-500 shadow-amber-100 hover:bg-amber-600"
            }`}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? t("actions.working") : isDelete ? t("actions.deleteAccount") : t("actions.deactivate")}
          </button>
          </div>
        </div>
      </div>
    </div>
  ), document.body);
}
