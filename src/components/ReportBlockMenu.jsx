"use client";

// Safety actions on another user's content — report and block.
//
// The web half of the mobile ReportBlockSheet. The backend for both has
// existed since migration 059 (content_reports, user_blocks) and the app has
// shipped the UI since the store review that required it, but the website
// offered no way to report or block anyone — same product, same users, and
// moderation only where a store forced it.
//
// One component owns the trigger and the modal so any surface gets both
// affordances from a single mount:
//   <ReportBlockMenu targetUserId={id} targetName={name} entityType="user" />
//
// Auth: report-content derives the reporter from the JWT and block-user is
// verify_jwt=true, so both go through invokeAuthed — a bare functions.invoke
// can fall back to the publishable key and would be refused.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Ban, Check, Flag, Loader2, MoreVertical, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { invokeAuthed } from "@/lib/invokeAuthed";

// Must stay in step with the reason CHECK constraint in migration 059 and the
// REASONS set in the report-content edge function.
const REASONS = [
  { key: "spam", labelKey: "reasons.spam" },
  { key: "harassment", labelKey: "reasons.harassment" },
  { key: "hate_speech", labelKey: "reasons.hateSpeech" },
  { key: "sexual_content", labelKey: "reasons.sexualContent" },
  { key: "violence", labelKey: "reasons.violence" },
  { key: "scam_or_fraud", labelKey: "reasons.scam" },
  { key: "impersonation", labelKey: "reasons.impersonation" },
  { key: "intellectual_property", labelKey: "reasons.ip" },
  { key: "other", labelKey: "reasons.other" },
];

export default function ReportBlockMenu({
  targetUserId,
  targetName,
  entityType = "user",
  entityId = null,
  /** Fires after a successful block so a list can drop the row. */
  onBlocked,
  className = "",
}) {
  const t = useTranslations("ReportBlock");
  const { user } = useAuth();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("menu"); // menu | report | blockConfirm | done
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Esc closes, like every other dismissible popup on the site.
  const busyRef = useRef(busy);
  busyRef.current = busy;
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !busyRef.current) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Nothing to act on when signed out, and nobody reports themselves.
  // `inv_*` ids are invitation stubs merged into search results by
  // list-influencers — there is no auth.users row behind them, so both
  // functions would refuse.
  if (
    !targetUserId ||
    String(targetUserId).startsWith("inv_") ||
    (user?.id && user.id === targetUserId)
  )
    return null;

  const close = () => {
    if (busy) return;
    setOpen(false);
    setStage("menu");
    setReason(null);
    setDetails("");
    setError("");
    setDoneMessage("");
  };

  const name = targetName || t("thisUser");

  const submitReport = async () => {
    if (!reason) return;
    setBusy(true);
    setError("");
    try {
      const res = await invokeAuthed(supabase, "report-content", {
        reportedUserId: targetUserId,
        entityType,
        entityId: entityType === "user" ? null : entityId,
        reason,
        details: details.trim() || undefined,
      });
      if (res?.needsLogin) {
        setError(t("errorSignedOut"));
        return;
      }
      const { data, error: fnErr } = res;
      if (fnErr || !data?.success) {
        setError(data?.error || fnErr?.message || t("errorGeneric"));
        return;
      }
      setDoneMessage(data.message || t("reportThanks"));
      setStage("done");
    } catch (e) {
      setError(e?.message || t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const submitBlock = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await invokeAuthed(supabase, "block-user", {
        action: "block",
        targetUserId,
      });
      if (res?.needsLogin) {
        setError(t("errorSignedOut"));
        return;
      }
      const { data, error: fnErr } = res;
      if (fnErr || !data?.success) {
        setError(data?.error || fnErr?.message || t("errorGeneric"));
        return;
      }
      setDoneMessage(t("blockDone", { name }));
      setStage("done");
      onBlocked?.(targetUserId);
    } catch (e) {
      setError(e?.message || t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const modal = (
    // z-[250]: popups sit above the mobile bottom navs (z-100 / z-150).
    <div
      data-scroll-lock
      className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={close}
      role="presentation"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("menuTitle")}
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85dvh]"
      >
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="text-sm font-black text-slate-800">
            {stage === "report"
              ? t("reportTitle")
              : stage === "blockConfirm"
                ? t("blockTitle")
                : stage === "done"
                  ? t("doneTitle")
                  : t("menuTitle")}
          </p>
          <button
            onClick={close}
            disabled={busy}
            aria-label={t("close")}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {error ? (
            <p role="alert" className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          {stage === "menu" && (
            <div className="space-y-2">
              <button
                onClick={() => setStage("report")}
                className="w-full flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left cursor-pointer"
              >
                <Flag size={16} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <span className="block text-sm font-bold text-slate-800">{t("reportAction")}</span>
                  <span className="block text-[11px] text-slate-500">{t("reportSubtitle")}</span>
                </span>
              </button>
              <button
                onClick={() => setStage("blockConfirm")}
                className="w-full flex items-start gap-3 p-4 rounded-2xl border border-slate-200 hover:border-red-300 hover:bg-red-50/50 text-left cursor-pointer"
              >
                <Ban size={16} className="mt-0.5 shrink-0 text-red-500" />
                <span>
                  <span className="block text-sm font-bold text-slate-800">{t("blockAction")}</span>
                  <span className="block text-[11px] text-slate-500">{t("blockSubtitle")}</span>
                </span>
              </button>
            </div>
          )}

          {stage === "report" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">{t("reportPrompt")}</p>
              <div className="space-y-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setReason(r.key)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                      reason === r.key
                        ? "border-purple-400 bg-purple-50 text-purple-800"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {t(r.labelKey)}
                    {reason === r.key ? <Check size={14} className="shrink-0" /> : null}
                  </button>
                ))}
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={t("detailsPlaceholder")}
                rows={3}
                maxLength={1000}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none focus:border-purple-300 resize-none"
              />
              <button
                onClick={submitReport}
                disabled={!reason || busy}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
                {t("submitReport")}
              </button>
            </div>
          )}

          {stage === "blockConfirm" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">{t("blockConfirmBody", { name })}</p>
              <div className="flex gap-2">
                <button
                  onClick={submitBlock}
                  disabled={busy}
                  className="flex-1 h-11 rounded-xl bg-red-600 text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
                  {t("confirmBlock")}
                </button>
                <button
                  onClick={() => setStage("menu")}
                  disabled={busy}
                  className="h-11 px-5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold cursor-pointer disabled:opacity-60"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="py-4 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Check size={22} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{doneMessage}</p>
              <button
                onClick={close}
                className="w-full h-11 rounded-xl bg-slate-900 text-white text-sm font-black cursor-pointer"
              >
                {t("done")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        aria-label={t("menuTitle")}
        title={t("menuTitle")}
        className={`w-7 h-7 shrink-0 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer ${className}`}
      >
        <MoreVertical size={15} />
      </button>
      {open && mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
