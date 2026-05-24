"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, AlertTriangle, Trash2, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Two flavours of "I want to leave" that share one shell so we don't ship two
// near-identical modals. `variant="deactivate"` is the soft, self-restorable
// pause (signing back in reactivates). `variant="delete"` is the 30-day
// purge — only admin can restore in the grace window.

const REASONS_DEACTIVATE = [
  "Taking a break from campaigns",
  "Found another platform",
  "Privacy concerns",
  "Not finding the right creators",
  "Too many notifications",
  "Account security issues",
  "Other",
];

const REASONS_DELETE = [
  "Closing the business",
  "Moving to a different platform",
  "Privacy concerns",
  "Created the account by mistake",
  "Duplicate account",
  "Other",
];

export default function BrandAccountActionsModal({ variant, open, onClose }) {
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

      await signOut();
      router.replace("/login");
    } catch (e) {
      setError(e.message || "Failed to submit");
      setSubmitting(false);
    }
  };

  return createPortal((
    <div className="fixed inset-0 z-[9999] flex items-end lg:items-center lg:justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full lg:max-w-lg bg-white rounded-t-[32px] lg:rounded-[32px] max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDelete ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
              }`}
            >
              {isDelete ? <Trash2 size={18} /> : <UserMinus size={18} />}
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                {isDelete ? "Delete Account" : "Deactivate Account"}
              </h3>
              <p className="text-[11px] text-gray-400 font-semibold">
                {isDelete
                  ? "30-day grace period — admin can restore on request"
                  : "Reversible — sign back in any time"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 -mr-2 cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isDelete ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-[12px] font-black text-red-900">This is a soft delete with a 30-day grace window.</p>
                  <ul className="space-y-1.5 text-[11px] font-bold text-red-700/90">
                    <li>• Your brand and all related data is hidden immediately.</li>
                    <li>• Sign-in is blocked while the account is pending deletion.</li>
                    <li>• Email <span className="font-extrabold">grievance@rgossips.com</span> within 30 days if you want it restored.</li>
                    <li>• After 30 days, the account, campaigns, applications and contact details are permanently removed.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-[12px] font-black text-amber-900">Deactivating is reversible.</p>
                  <ul className="space-y-1.5 text-[11px] font-bold text-amber-700/90">
                    <li>• Your brand stops appearing to creators.</li>
                    <li>• Active campaigns are paused.</li>
                    <li>• Signing in again with the same number reactivates everything automatically.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-black text-gray-900 mb-1">Tell us why you're {isDelete ? "leaving" : "taking a break"}</h4>
            <p className="text-[11px] text-gray-400 font-bold mb-3">This helps us improve RGossips.</p>
            <div className="space-y-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  type="button"
                  className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    reason === r
                      ? isDelete
                        ? "border-red-400 bg-red-50/60"
                        : "border-[#5851DB] bg-purple-50/60"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`text-[12px] font-bold ${
                      reason === r ? (isDelete ? "text-red-700" : "text-[#5851DB]") : "text-gray-700"
                    }`}
                  >
                    {r}
                  </span>
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      reason === r
                        ? isDelete
                          ? "border-red-500"
                          : "border-[#5851DB]"
                        : "border-gray-200"
                    }`}
                  >
                    {reason === r && (
                      <span className={`w-2 h-2 rounded-full ${isDelete ? "bg-red-500" : "bg-[#5851DB]"}`} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer"
            />
            <span className="text-[12px] font-bold text-gray-700 leading-snug">
              {isDelete
                ? "I understand my account will be hidden now and permanently removed after 30 days unless I contact admin."
                : "I understand my account will be deactivated and creators will no longer see my brand."}
            </span>
          </label>

          {isDelete && (
            <div>
              <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
                Type <span className="text-red-600">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full p-3.5 bg-gray-50 border border-gray-200 focus:border-red-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none uppercase tracking-wider"
              />
            </div>
          )}

          {error && (
            <p className="text-[12px] text-red-600 font-bold bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="py-3.5 rounded-2xl font-bold text-sm text-gray-700 border border-gray-200 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`py-3.5 rounded-2xl font-black text-sm text-white shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDelete ? "bg-red-500 shadow-red-100 hover:bg-red-600" : "bg-amber-500 shadow-amber-100 hover:bg-amber-600"
            }`}
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Working…" : isDelete ? "Delete Account" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
