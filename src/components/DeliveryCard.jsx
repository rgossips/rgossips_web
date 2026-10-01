"use client";

import { useState } from "react";
import { Truck, MapPin, PackageCheck, PackageX, AlertTriangle, Loader2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { fulfilmentState, CREATOR_STAGE_LABEL } from "@/lib/barterFulfilment";
import { reportError } from "@/lib/reportError";

// The creator's side of a barter delivery: where it's going, where it is, and
// whether it arrived.
//
// Everything shown here is derived from the application row at render time
// (lib/barterFulfilment.js) — including the "you haven't told us whether it
// arrived" prompt. There is no reminder job and nothing polls: the prompt
// appears because the creator opened the screen and the expected date has
// passed. The admin portal derives the identical state from the same row.
//
// Writes go straight to the table under the creator's own RLS policy
// (applications_creator_self_rw, migration 035). Migration 076's trigger is
// what makes that safe: it rejects any attempt to write the brand's tracking
// fields, and rejects an address change once the parcel is on its way. The
// UI hides both, but the database is the boundary.

const STAGE_TONE = {
  awaiting_address: "bg-amber-50 border-amber-200 text-amber-700",
  ready_to_ship: "bg-slate-50 border-slate-200 text-slate-600",
  shipped: "bg-purple-50 border-purple-200 text-purple-700",
  received: "bg-emerald-50 border-emerald-200 text-emerald-700",
  not_received: "bg-rose-50 border-rose-200 text-rose-700",
};

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

export function DeliveryCard({ applicationId, fulfilment, shippingMode, onChanged }) {
  const t = useTranslations("DeliveryCard");
  const supabase = createClient();
  const [address, setAddress] = useState(fulfilment?.shipping_address || "");
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!fulfilment || shippingMode === "no") return null;
  const s = fulfilmentState(fulfilment, shippingMode);
  if (s.stage === "not_applicable") return null;

  const saveAddress = async () => {
    if (address.trim().length < 15) {
      setError(t("addressTooShort"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: err } = await supabase
        .from("campaign_applications")
        .update({ shipping_address: address.trim(), shipping_address_updated_at: new Date().toISOString() })
        .eq("id", applicationId);
      // The trigger raises if it has already shipped — surface that plainly
      // rather than as a database string.
      if (err) throw new Error(/shipped/i.test(err.message) ? t("lockedAfterShipping") : err.message);
      setEditing(false);
      onChanged?.();
    } catch (e) {
      setError(e.message || t("saveFailed"));
      reportError("campaign_application", "delivery.address.save", e, { context: { applicationId } });
    } finally {
      setBusy(false);
    }
  };

  const answerReceipt = async (received) => {
    setBusy(true);
    setError("");
    try {
      const { error: err } = await supabase
        .from("campaign_applications")
        .update({
          product_received: received,
          product_received_at: new Date().toISOString(),
          product_feedback: feedback.trim() || null,
          product_feedback_at: feedback.trim() ? new Date().toISOString() : null,
        })
        .eq("id", applicationId);
      if (err) throw new Error(err.message);
      onChanged?.();
    } catch (e) {
      setError(e.message || t("saveFailed"));
      reportError("campaign_application", "delivery.receipt.save", e, { context: { applicationId, received } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
        <Truck size={16} className="text-purple-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("heading")}</h3>
        <span className={`ml-auto text-[11px] font-bold px-2.5 py-1 rounded-full border ${STAGE_TONE[s.stage] || STAGE_TONE.ready_to_ship}`}>
          {CREATOR_STAGE_LABEL[s.stage]}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* The derived reminder. No job sends this — it is true whenever the
            creator looks and the date has passed with no answer from them. */}
        {s.receiptOverdue && (
          <div className="flex gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              {s.daysOverdue > 0
                ? t("overdueDays", { days: s.daysOverdue })
                : t("overdueToday")}
            </p>
          </div>
        )}

        {shippingMode === "pickup" ? (
          <div className="flex gap-2.5">
            <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">{t("pickup")}</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">{t("addressLabel")}</span>
              {s.canEditAddress && !editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 hover:underline"
                >
                  <Pencil size={11} /> {fulfilment.shipping_address ? t("change") : t("add")}
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  maxLength={600}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("addressPlaceholder")}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 focus:border-pink-300 rounded-xl text-sm text-slate-700 outline-none resize-y"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveAddress}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
                  >
                    {busy && <Loader2 size={12} className="animate-spin" />}
                    {t("saveAddress")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setAddress(fulfilment.shipping_address || "");
                      setError("");
                    }}
                    disabled={busy}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    {t("cancel")}
                  </button>
                </div>
              </div>
            ) : fulfilment.shipping_address ? (
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{fulfilment.shipping_address}</p>
            ) : (
              <p className="text-xs text-amber-700">{t("noAddressYet")}</p>
            )}

            {!s.canEditAddress && fulfilment.shipping_address && (
              <p className="text-[10px] text-slate-400 mt-1.5">{t("lockedAfterShipping")}</p>
            )}
          </div>
        )}

        {/* Tracking */}
        {fulfilment.shipping_tracking_url && (
          <div className="pt-3 border-t border-slate-100">
            <a
              href={fulfilment.shipping_tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:underline"
            >
              <Truck size={13} /> {t("trackDelivery")}
            </a>
            <p className="text-[11px] text-slate-400 mt-1">
              {fulfilment.shipping_carrier
                ? t("shippedViaOn", { carrier: fulfilment.shipping_carrier, date: fmt(fulfilment.shipping_tracking_added_at) })
                : t("shippedOn", { date: fmt(fulfilment.shipping_tracking_added_at) })}
              {s.expectedAt ? ` · ${t("expectedBy", { date: fmt(s.expectedAt) })}` : ""}
            </p>
          </div>
        )}

        {/* Did it arrive? Only askable once something is on its way. */}
        {s.canConfirmReceipt && (
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <p className="text-xs font-bold text-slate-800">{t("didItArrive")}</p>
            <textarea
              rows={3}
              maxLength={800}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t("feedbackPlaceholder")}
              className="w-full py-2.5 px-3 bg-white border border-slate-200 focus:border-pink-300 rounded-xl text-sm text-slate-700 outline-none resize-y"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => answerReceipt(true)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:brightness-110 disabled:opacity-60"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <PackageCheck size={13} />}
                {t("yesReceived")}
              </button>
              <button
                type="button"
                onClick={() => answerReceipt(false)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 disabled:opacity-60"
              >
                <PackageX size={13} /> {t("notReceived")}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">{t("feedbackNote")}</p>
          </div>
        )}

        {/* Already answered */}
        {fulfilment.product_received !== null && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              {fulfilment.product_received
                ? t("confirmedOn", { date: fmt(fulfilment.product_received_at) })
                : t("reportedMissingOn", { date: fmt(fulfilment.product_received_at) })}
            </p>
            {fulfilment.product_feedback && (
              <p className="mt-1.5 text-xs italic text-slate-500 bg-slate-50 rounded-lg p-2.5 whitespace-pre-wrap">
                {fulfilment.product_feedback}
              </p>
            )}
          </div>
        )}

        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    </section>
  );
}
