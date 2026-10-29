"use client";

// The brand's application review panel, and the status timeline beside it.
//
// Extracted from app/brands/campaign/[id]/page.js when the full
// /applications surface landed: the list and the per-application page both
// need every action a brand can take on an applicant (offer, approve, fund
// escrow, request a revision, reject, rate, release payment), and a second
// copy of 700 lines of state machine is a second copy that drifts.
//
// There used to be an ApplicationJourneyModal here wrapping both. Reviewing
// an applicant is not a glance — it is reading a pitch, a profile and a
// deliverable set and then committing money — and a dialog gave it a
// 2xl-wide column no matter how much screen there was, could not be linked
// to, shared, or reopened after a refresh, and put the back button to no
// use. It is a page now: /brands/campaign/[id]/applications/[appId].
//
// The i18n namespace is still BrandsCampaignId, because the copy belongs to
// the campaign surface as a whole rather than to any one page.

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Clock, ExternalLink, IndianRupee, Loader2, RotateCcw, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/utils/supabase/client";
import { invokeAuthed } from "@/lib/invokeAuthed";
import { useGlobalLoading } from "@/context/LoadingContext";
import RatingModal from "@/components/RatingModal";
import AlertPopup from "@/components/AlertPopup";
import { appStatusConfig, formatCount, formatDate } from "@/components/brands/applicationUi";


// Brand-side escrow funding uses the same Razorpay Checkout SDK as the
// subscription flow. Loaded lazily on first Approve click to keep the
// initial bundle lean.
// supabase-js reports any non-2xx from an edge function as the opaque
// "Edge Function returned a non-2xx status code", and puts the real response
// on error.context. Every one of our functions answers with { error: "..." }
// explaining exactly what it refused and why — "Escrow is not held", "Payout
// already in state 'scheduled'", "forbidden" — so reading the body turns an
// unactionable popup into the actual reason.
async function readFnError(err, fallback) {
  try {
    const body = await err?.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    /* not JSON, or the body was already consumed — fall through */
  }
  return err?.message || fallback;
}

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Bound an edge-function invoke so a hung request can't leave the escrow
// loader spinning forever. The server-side gateway fetches have their own
// AbortSignal timeout; this is the client-side belt to that server braces.
function withTimeout(promise, ms = 20000, label = "The request") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out. Please check your connection and try again.`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function loadRazorpayCheckout() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  const existing = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => resolve());
    });
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = RAZORPAY_CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

const ApplicationRow = ({ app, brandId, defaultRate = 0, campaignType = "", rating = null, onRated, onRefresh, alwaysExpanded = false }) => {
  const t = useTranslations("BrandsCampaignId");
  const supabase = createClient();
  const { startLoading, stopLoading } = useGlobalLoading();
  // Auto-expand actionable statuses so the brand can review immediately.
  // We also auto-expand "accepted" so the brand can re-verify what they
  // just approved without an extra click. Inside the journey modal
  // (alwaysExpanded) the panel is permanently open.
  const autoExpand = alwaysExpanded || app.status === "pending" || app.status === "offer_accepted" || app.status === "submitted" || app.status === "live_submitted" || app.status === "accepted";
  const [expanded, setExpanded] = useState(autoExpand);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null); // "approve" | "reject" | "revision" | null
  const [payAmount, setPayAmount] = useState(String(app.proposed_rate || defaultRate || 0));
  const [reason, setReason] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionIndexes, setRevisionIndexes] = useState([]);
  const [showRating, setShowRating] = useState(false);
  // Compact popup for escrow / validation errors — replaces window.alert().
  // Uses AlertPopup (plain fixed z-[320]) so it renders above the z-[310]
  // journey modal this row lives inside.
  const [popup, setPopup] = useState(null);

  // Barter pays nothing: no priced offer, no escrow. The brand just approves,
  // and update-application-status allows approved straight from pending.
  const isBarter = String(campaignType || "").toLowerCase() === "barter";
  const inf = app.influencer_profiles || {};
  const st = appStatusConfig[app.status] || appStatusConfig.pending;
  const displayName = inf.full_name || inf.username || inf.instagram_handle || t("common.creator");
  const links = Array.isArray(app.submission_links) ? app.submission_links : [];

  const updateStatus = async (newStatus, extra = {}) => {
    setLoading(true);
    startLoading(t("loading.updatingApplication"));
    try {
      // This runs immediately after a successful Razorpay payment, so a dead
      // token here means the money moved and the escrow flip did not — which
      // is precisely the "paid but not recorded" state application 81b7af4a
      // was found in. Refresh and retry rather than losing the confirmation.
      const res = await invokeAuthed(supabase, "update-application-status", {
        applicationId: app.id,
        brandId,
        status: newStatus,
        ...extra,
      });
      if (res?.needsLogin) {
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const { data, error } = res;
      if (error || data?.error) {
        setPopup(await readFnError(error, data?.error || t("errors.updateFailed")));
        return;
      }
      setMode(null);
      setReason("");
      setRevisionNote("");
      setRevisionIndexes([]);
      onRefresh?.();
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  // B15: brand reviews the application and sends a priced offer. No
  // money moves here — the creator gets a notification and can accept
  // or withdraw. Escrow funding happens only after acceptance.
  const handleSendOffer = () => {
    const rate = parseInt(payAmount || "0", 10);
    if (!rate || rate <= 0) { setPopup({ title: t("popups.enterAmount.title"), message: t("popups.enterAmount.message"), tone: "info" }); return; }
    updateStatus("offer_sent", { agreedRate: rate });
  };

  // Pay to Escrow = fund escrow + flip status to approved. Only
  // reachable once the creator has accepted the offer (server enforces
  // this too). Flow:
  //   1. escrow-fund creates a Razorpay Order for the ACCEPTED offer
  //      amount (server rejects a mismatched amount).
  //   2. We open Razorpay Checkout against that order. The brand pays.
  //   3. On payment success, Razorpay returns { payment_id, order_id,
  //      signature } via the handler callback.
  //   4. We pass those into update-application-status (status='approved'),
  //      which verifies the signature server-side and flips
  //      escrow_status='held' atomically with the status change.
  // If the brand dismisses Checkout, the application stays 'offer_accepted'.
  const handleApprove = async () => {
    const rate = Number(app.brand_offered_rate || 0);
    if (!rate || rate <= 0) { setPopup(t("errors.noAcceptedOffer")); return; }
    setLoading(true);
    startLoading(t("loading.preparingEscrow"));
    try {
      // Explicit session check — supabase.functions.invoke() falls back
      // to sending the publishable key as Bearer when no user session
      // is present, and escrow-fund's inline supabase.auth.getUser()
      // then correctly rejects it as unauthorized. This can happen
      // when the admin app is signed in on the same browser origin —
      // its cookie collides with the user app's cookie because both
      // clients derive their key from the same project ref.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        // Every early return in THIS handler has to clear the overlay itself.
        // Unlike releaseEscrow below, this try has no finally — only the catch
        // stops the loader, and a `return` skips the catch. That is what left
        // "Preparing escrow" on screen indefinitely, with the popup stranded
        // behind it and no way forward but a reload.
        setLoading(false);
        stopLoading();
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const fundRes = await withTimeout(
        invokeAuthed(supabase, "escrow-fund", { applicationId: app.id, agreedRate: rate }),
        20000,
        "Escrow"
      );
      if (fundRes?.needsLogin) {
        setLoading(false);
        stopLoading();
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const { data: fund, error: fundErr } = fundRes;
      if (fundErr || fund?.error) {
        setLoading(false);
        stopLoading();
        setPopup(await readFnError(fundErr, fund?.error || t("errors.escrowCreateFailed")));
        return;
      }
      await loadRazorpayCheckout();
      if (typeof window === "undefined" || !window.Razorpay) {
        setLoading(false);
        stopLoading();
        setPopup(t("errors.razorpayLoadFailed"));
        return;
      }

      stopLoading();
      const rzp = new window.Razorpay({
        key: fund.key_id,
        order_id: fund.order_id,
        amount: fund.amount_paise,
        currency: fund.currency || "INR",
        name: "RGossips",
        description: t("razorpay.escrowDescription", { name: displayName }),
        theme: { color: "#5851DB" },
        handler: async (response) => {
          // Payment captured. Confirm to the server so escrow flips to held.
          startLoading(t("loading.confirmingPayment"));
          setLoading(true);
          try {
            await updateStatus("approved", {
              agreedRate: rate,
              escrowPaymentId: response.razorpay_payment_id,
              escrowOrderId: response.razorpay_order_id,
              escrowSignature: response.razorpay_signature,
            });
          } finally {
            setLoading(false);
            stopLoading();
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            stopLoading();
          },
        },
      });
      rzp.on("payment.failed", (resp) => {
        console.error("Escrow payment failed:", resp?.error);
        setPopup(resp?.error?.description || t("errors.paymentFailed"));
        setLoading(false);
        stopLoading();
      });
      rzp.open();
    } catch (e) {
      console.error("handleApprove failed:", e);
      setPopup(e?.message || t("errors.somethingWrong"));
      setLoading(false);
      stopLoading();
    }
  };

  const handleReject = () => {
    updateStatus("rejected", { rejectionReason: reason || undefined });
  };

  // "Accept & Release Payment" — talks to escrow-release rather than
  // update-application-status because the release leg has more state to
  // manage (plan-tier delay, pending_creator_info routing, notifications,
  // escrow_status flip). The escrow-release function takes over once the
  // brand confirms the live submission is good.
  const releaseEscrow = async () => {
    setLoading(true);
    startLoading(t("loading.releasingPayment"));
    try {
      // Same session-guard as handleApprove — escrow-release also
      // does an inline supabase.auth.getUser() so a fallback publishable
      // key Bearer fails the same way.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const releaseRes = await invokeAuthed(supabase, "escrow-release", { applicationId: app.id });
      if (releaseRes?.needsLogin) {
        setPopup({ title: t("popups.sessionExpired.title"), message: t("popups.sessionExpired.message"), tone: "info" });
        return;
      }
      const { data, error } = releaseRes;
      if (error || data?.error) {
        setPopup(await readFnError(error, data?.error || t("errors.releaseFailed")));
        return;
      }
      onRefresh?.();
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleRevision = () => {
    if (revisionIndexes.length === 0) {
      { setPopup({ title: t("popups.nothingSelected.title"), message: t("popups.nothingSelected.message"), tone: "info" }); return; }
    }
    const selectedLabels = revisionIndexes.map((i) => links[i]?.label || links[i]?.type || t("common.deliverableN", { n: i + 1 }));
    updateStatus("revision_needed", {
      revisionNote,
      revisionLinks: selectedLabels,
    });
  };

  const toggleRevisionIndex = (i) => setRevisionIndexes((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  // Padding grew with the type. These are the buttons that approve a
  // creator and move money; at 11px in a 26px pill they read as footnotes
  // on a full page, which is the one place they should not.
  const btn = "inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border";

  // This used to be `hasActions`, a list of the statuses with buttons, and
  // the whole panel was gated on it — so `completed`, `rejected` and
  // `withdrawn` rendered the summary line and NOTHING else. On the review
  // page that left the entire main column empty under a one-line header.
  //
  // The panel is not the actions. It is the creator's details, their pitch,
  // the delivery address, the agreed rate, the deliverable links and the
  // rejection reason — every one of which a brand still wants to read after
  // the campaign is over, and some of which (the links, the reason) only
  // exist at those late statuses. The action slot below already handles
  // "nothing to do here" with a status line. So: always render it.
  const hasPanel = true;

  return (
    <div className={`rounded-xl bg-white overflow-hidden ${alwaysExpanded ? "" : "border border-gray-100"}`}>
      {/* Summary row — clickable. Hidden when the panel is the page: the
          page header and the profile rail already carry the name, handle,
          status and rating, and a third copy of them was the first thing
          on screen. */}
      {!alwaysExpanded && (
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
          {inf.profile_photo_url ? <img src={inf.profile_photo_url} alt={displayName} className="w-full h-full object-cover" /> : displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
          <p className="text-[13px] text-gray-400 truncate">
            {inf.instagram_handle && <>@{inf.instagram_handle} · </>}
            {formatCount(inf.followers_count)} {t("row.followers")}
            {app.proposed_rate != null && (
              <>
                {" "}
                · <span className="text-[#5851DB] font-semibold">₹{Number(app.proposed_rate).toLocaleString("en-IN")}</span>
              </>
            )}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${st.bg} shrink-0`}>{t(`appStatus.${st.labelKey}`)}</span>
        {app.escrow_status === "held" && app.escrow_amount != null && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[12px] font-bold shrink-0">
            <IndianRupee size={11} />
            {Math.round(app.escrow_amount / 100).toLocaleString("en-IN")} {t("row.held")}
          </span>
        )}
        {rating && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[12px] font-bold shrink-0">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            {rating.target_rating}/5
          </span>
        )}
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      )}

      {/* The panel. pt-1 rather than pt-4 when it stands alone: every block
          inside already carries mt-3, which was spacing it off the summary
          row that is no longer there. */}
      {(expanded || alwaysExpanded) && hasPanel && (
        <div className={alwaysExpanded ? "px-4 pb-4 pt-1" : "px-3 pb-3 border-t border-gray-50"}>
          {rating && (
            <div className="mt-3 p-3 bg-amber-50/60 rounded-lg border border-amber-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 shrink-0">
                <Star size={16} className="fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-extrabold text-amber-700 uppercase tracking-wider">{t("panel.yourRating")}</p>
                <p className="text-[13px] text-amber-800 mt-0.5">
                  {displayName} <span className="font-bold">{rating.target_rating}/5</span>
                </p>
              </div>
            </div>
          )}

          {/* Creator details — review before approving */}
          <div className="mt-3 p-4 bg-[#F8F9FE] rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider">{t("panel.creatorDetails")}</p>
              {inf.instagram_handle && inf.media_kit_published && (
                <a href={`/kit/${inf.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-[#5851DB] hover:underline">
                  <ExternalLink size={12} /> {t("panel.mediaKit")}
                </a>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              <Fact label={t("facts.fullName")} value={inf.full_name || "—"} />
              <Fact label="Instagram" value={inf.instagram_handle ? `@${inf.instagram_handle}` : "—"} href={inf.instagram_handle ? `https://instagram.com/${inf.instagram_handle}` : null} />
              <Fact label={t("facts.followers")} value={formatCount(inf.followers_count)} />
              <Fact label={t("facts.engagement")} value={inf.engagement_rate != null ? `${inf.engagement_rate}%` : "—"} />
              <Fact label={t("facts.posts")} value={formatCount(inf.media_count)} />
              <Fact label={t("facts.location")} value={inf.location || "—"} />
              {inf.email && <Fact label={t("facts.email")} value={inf.email} />}
              {app.proposed_rate != null && <Fact label={t("facts.proposedRate")} value={`₹${Number(app.proposed_rate).toLocaleString("en-IN")}`} highlight />}
              {app.brand_offered_rate != null && Number(app.brand_offered_rate) > 0 && <Fact label={t("facts.yourOffer")} value={`₹${Number(app.brand_offered_rate).toLocaleString("en-IN")}`} highlight />}
              {app.final_agreed_rate != null && <Fact label={t("facts.agreedRate")} value={`₹${Number(app.final_agreed_rate).toLocaleString("en-IN")}`} highlight />}
              {/* Escrow used to show only as a chip on the summary row, which
                  the review page hides. Money the brand has already committed
                  belongs with the other money anyway. */}
              {app.escrow_status === "held" && app.escrow_amount != null && (
                <Fact label={t("facts.escrowHeld")} value={`₹${Math.round(app.escrow_amount / 100).toLocaleString("en-IN")}`} highlight />
              )}
            </div>

            {app.pitch && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[12px] font-extrabold text-[#5851DB] uppercase tracking-wider mb-1">{t("panel.pitch")}</p>
                <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#5851DB]/5 rounded-lg p-3">{app.pitch}</p>
              </div>
            )}

            {/* Delivery. The address itself only arrives from the API once
                this creator is approved — before that we get a flag, so the
                brand can tell "they gave one" apart from "they didn't". */}
            {(app.shipping_address || app.has_shipping_address || app.shipping_tracking_url) && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[12px] font-extrabold text-emerald-600 uppercase tracking-wider mb-1">{t("panel.delivery")}</p>
                {app.shipping_address ? (
                  <>
                    <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap bg-emerald-50 rounded-lg p-2.5">{app.shipping_address}</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(app.shipping_address)}
                      className="mt-1.5 text-[12px] font-bold text-[#5851DB] hover:underline"
                    >
                      {t("panel.copyAddress")}
                    </button>
                  </>
                ) : (
                  <p className="text-[13px] text-gray-500 italic">{t("panel.addressHiddenUntilApproved")}</p>
                )}
                {app.shipping_tracking_url && (
                  <p className="mt-1.5 text-[12px] text-gray-500">
                    <a href={app.shipping_tracking_url} target="_blank" rel="noopener noreferrer" className="font-bold text-[#5851DB] hover:underline">
                      {t("panel.trackShipment")}
                    </a>
                    {app.product_received === true ? " · " + t("panel.creatorConfirmed") : null}
                    {app.product_received === false ? " · " + t("panel.creatorNotReceived") : null}
                  </p>
                )}
                {app.product_feedback && (
                  <p className="mt-1.5 text-[13px] italic text-gray-600 bg-gray-50 rounded-lg p-2">{app.product_feedback}</p>
                )}
              </div>
            )}

            {inf.bio && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">{t("panel.bio")}</p>
                <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{inf.bio}</p>
              </div>
            )}

            {Array.isArray(inf.categories) && inf.categories.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">{t("panel.categories")}</p>
                <div className="flex flex-wrap gap-1">
                  {inf.categories.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full text-[12px] font-semibold bg-white text-gray-600 border border-gray-200">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {app.status === "rejected" && app.rejection_reason && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[12px] font-extrabold text-red-500 uppercase tracking-wider mb-1">{t("panel.rejectionReason")}</p>
                <p className="text-[13px] text-gray-700">{app.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Submission links (when present) */}
          {links.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider">{t("panel.submissions")}</p>
              {links.map((item, i) => (
                <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-[#F8F9FE] hover:bg-gray-100 rounded-lg transition-colors group">
                  <ExternalLink size={14} className="text-[#5851DB] shrink-0" />
                  <p className="text-[13px] font-semibold text-gray-700 capitalize flex-1 truncate">{item.label || item.type || t("common.deliverableN", { n: i + 1 })}</p>
                  <span className="text-[11px] uppercase font-bold text-gray-400 shrink-0">{item.type}</span>
                </a>
              ))}
            </div>
          )}

          {/* Default actions per status */}
          {mode === null && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
              {app.status === "pending" && (
                <>
                  {isBarter ? (
                    <button onClick={() => updateStatus("approved")} disabled={loading} className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`}>
                      {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {t("actions.approveBarter")}
                    </button>
                  ) : (
                    <button onClick={() => setMode("offer")} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
                      <Check size={14} /> {t("actions.approveWithPrice")}
                    </button>
                  )}
                  <button onClick={() => setMode("reject")} className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}>
                    <X size={14} /> {t("actions.reject")}
                  </button>
                </>
              )}
              {app.status === "offer_sent" && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-purple-700 font-semibold bg-purple-50 border border-purple-200 px-2 py-1 rounded-lg">
                  <Clock size={14} /> {t("actionMsgs.offerSent", { amount: Number(app.brand_offered_rate || 0).toLocaleString("en-IN") })}
                </span>
              )}
              {app.status === "offer_accepted" && (
                <button onClick={handleApprove} disabled={loading} className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <IndianRupee size={14} />}
                  {t("actions.payToEscrow", { amount: Number(app.brand_offered_rate || 0).toLocaleString("en-IN") })}
                </button>
              )}
              {app.status === "withdrawn" && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 font-semibold bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                  <X size={14} /> {t("actionMsgs.withdrew")}
                </span>
              )}
              {app.status === "approved" && (
                <>
                  <span className="text-[13px] text-gray-400 italic px-1 py-1">{t("actionMsgs.waitingSubmission")}</span>
                  <button onClick={() => setMode("reject")} className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}>
                    <X size={14} /> {t("actions.reject")}
                  </button>
                </>
              )}
              {app.status === "submitted" && (
                <>
                  <button onClick={() => updateStatus("accepted")} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {t("actions.accept")}
                  </button>
                  <button onClick={() => setMode("revision")} className={`${btn} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`}>
                    <RotateCcw size={14} /> {t("actions.revision")}
                  </button>
                  <button onClick={() => setMode("reject")} className={`${btn} bg-red-50 text-red-700 border-red-200 hover:bg-red-100`}>
                    <X size={14} /> {t("actions.reject")}
                  </button>
                </>
              )}
              {app.status === "revision_needed" && <span className="text-[13px] text-gray-400 italic px-1 py-1">{t("actionMsgs.waitingResubmit")}</span>}
              {app.status === "accepted" && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                  <Check size={14} /> {t("actionMsgs.draftsAccepted")}
                </span>
              )}
              {app.status === "live_submitted" && (
                <>
                  {/* Barter holds no escrow, so there is nothing to release:
                      approving the links IS the completion. What the creator
                      is owed next is the product, not a payout. */}
                  <button onClick={() => setShowRating(true)} disabled={loading} className={`${btn} bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100`}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {isBarter ? t("actions.approveComplete") : t("actions.approveRelease")}
                  </button>
                  <button onClick={() => setMode("revision")} className={`${btn} bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100`}>
                    <RotateCcw size={14} /> {t("actions.revision")}
                  </button>
                </>
              )}
              {app.status === "payment" && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                  <Check size={14} /> {t("actionMsgs.paymentReleased")}
                </span>
              )}
              {/* The two terminal states. They had no line here because the
                  panel never rendered for them at all. */}
              {app.status === "completed" && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                  <Check size={14} /> {t("actionMsgs.completed")}
                </span>
              )}
              {app.status === "rejected" && (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-red-700 font-semibold bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                  <X size={14} /> {t("actionMsgs.rejected")}
                </span>
              )}
            </div>
          )}

          {/* Offer form — B15: no payment here, just the priced offer.
              The creator's proposed rate seeds the input; the brand can
              counter with a different number. One shot: the creator can
              only accept or withdraw, not counter back. */}
          {mode === "offer" && !isBarter && (
            <div className="mt-3 space-y-2 p-3 bg-emerald-50/40 rounded-lg border border-emerald-100">
              <label className="text-[12px] font-bold text-emerald-700 uppercase tracking-wider">{t("offerForm.label")}</label>
              <input
                type="number"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <p className="text-[12px] text-emerald-700/80 leading-snug">
                {t("offerForm.hint")}
              </p>
              <div className="flex gap-2">
                <button onClick={handleSendOffer} disabled={loading} className={`${btn} bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-500`}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {t("offerForm.send")}
                </button>
                <button onClick={() => setMode(null)} className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Reject form */}
          {mode === "reject" && (
            <div className="mt-3 space-y-2 p-3 bg-red-50/40 rounded-lg border border-red-100">
              <label className="text-[12px] font-bold text-red-700 uppercase tracking-wider">{t("rejectForm.label")}</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("rejectForm.placeholder")}
                className="w-full px-3 py-2 rounded-lg bg-white border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleReject} disabled={loading} className={`${btn} bg-red-600 text-white border-red-600 hover:bg-red-500`}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  {t("rejectForm.confirm")}
                </button>
                <button onClick={() => setMode(null)} className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Revision form */}
          {mode === "revision" && (
            <div className="mt-3 space-y-2 p-3 bg-orange-50/40 rounded-lg border border-orange-100">
              <p className="text-[12px] font-bold text-orange-700 uppercase tracking-wider">{t("revisionForm.title")}</p>
              <div className="space-y-1">
                {links.map((item, i) => {
                  const selected = revisionIndexes.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleRevisionIndex(i)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        selected ? "bg-orange-100 border-orange-300" : "bg-white border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selected ? "bg-orange-500 border-orange-500" : "border-gray-300"}`}>
                        {selected && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-[13px] font-semibold text-gray-700 capitalize flex-1 truncate">{item.label || item.type || t("common.deliverableN", { n: i + 1 })}</span>
                    </button>
                  );
                })}
              </div>
              <textarea
                rows={2}
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder={t("revisionForm.placeholder")}
                className="w-full px-3 py-2 rounded-lg bg-white border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleRevision} disabled={loading || revisionIndexes.length === 0} className={`${btn} bg-orange-600 text-white border-orange-600 hover:bg-orange-500`}>
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                  {t("revisionForm.send")}
                </button>
                <button onClick={() => setMode(null)} className={`${btn} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`}>
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <RatingModal
        open={showRating}
        onClose={() => setShowRating(false)}
        applicationId={app.id}
        campaignId={app.campaign_id}
        brandId={brandId}
        influencerId={app.influencer_id}
        raterRole="brand"
        title={t("rating.title")}
        subtitle={t("rating.subtitle", { name: displayName })}
        sections={[{ key: "target_rating", label: t("rating.sectionLabel", { name: displayName }) }]}
        primaryCta={t("rating.primaryCta")}
        secondaryCta={t("rating.secondaryCta")}
        onSaved={(saved) => onRated?.(saved)}
        onPrimary={() => (isBarter ? updateStatus("completed") : releaseEscrow())}
        onSkip={() => (isBarter ? updateStatus("completed") : releaseEscrow())}
      />
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </div>
  );
};

// B15f — full application journey. Timeline from
// application_status_history (RLS lets the brand read rows for its own
// campaigns) + the complete review panel (ApplicationRow, permanently
// expanded) with every action the brand can take at the current stage.
const JOURNEY_LABELS = {
  pending: "pending",
  offer_sent: "offer_sent",
  offer_accepted: "offer_accepted",
  withdrawn: "withdrawn",
  approved: "approved",
  submitted: "submitted",
  revision_needed: "revision_needed",
  accepted: "accepted",
  live_submitted: "live_submitted",
  payment: "payment",
  completed: "completed",
  rejected: "rejected",
};

/**
 * The application's status history, as a timeline.
 *
 * Lives on the application page rather than in a modal now, and is NOT
 * rendered for a still-pending application: its only entry would be
 * "Applied", which the page already says in its header and its status chip.
 * A one-step timeline is chrome, not information.
 */
function ApplicationJourney({ applicationId, createdAt, proposedRate }) {
  const t = useTranslations("BrandsCampaignId");
  const supabase = createClient();
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("application_status_history")
          .select("id, from_status, to_status, changed_by_role, reason, created_at")
          .eq("application_id", applicationId)
          .order("created_at", { ascending: true });
        if (!cancelled) setHistory(data || []);
      } catch {
        /* timeline is progressive enhancement — the review panel still works */
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId, supabase]);

  // Synthesise the "Applied" event if history starts later (backfill rows
  // exist for old applications, but a fresh application's first history
  // row is its first TRANSITION, not the application itself).
  const events = useMemo(() => {
    const out = [];
    const hasInitial = history.some((h) => !h.from_status);
    if (!hasInitial) {
      out.push({
        id: "applied",
        to_status: "pending",
        changed_by_role: "influencer",
        reason: proposedRate ? t("journeyModal.proposed", { amount: Number(proposedRate).toLocaleString("en-IN") }) : null,
        created_at: createdAt,
      });
    }
    return [...out, ...history];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, createdAt, proposedRate]);

  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
      <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-wider mb-3">{t("journeyModal.journey")}</p>
      {historyLoading ? (
        <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
          <Loader2 size={16} className="animate-spin" /> {t("journeyModal.loadingHistory")}
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-gray-400 py-2">{t("journeyModal.noHistory")}</p>
      ) : (
        <div className="relative pl-5">
          <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200 rounded-full" />
          {events.map((ev, i) => {
            const isLast = i === events.length - 1;
            const label = JOURNEY_LABELS[ev.to_status] ? t(`journey.${JOURNEY_LABELS[ev.to_status]}`) : ev.to_status;
            return (
              <div key={ev.id} className="relative pb-4 last:pb-0">
                <div
                  className={`absolute -left-5 top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isLast ? "bg-[#5851DB] border-[#5851DB]" : "bg-white border-gray-300"
                  }`}
                >
                  {isLast && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <p className={`text-[14px] font-bold ${isLast ? "text-gray-900" : "text-gray-600"}`}>{label}</p>
                <p className="text-[12px] text-gray-400">
                  {formatDate(ev.created_at)}
                  {ev.changed_by_role && ` · ${t("journeyModal.by", { role: ev.changed_by_role })}`}
                  {ev.reason && ` · ${ev.reason}`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


const Fact = ({ label, value, highlight, href }) => {
  const content = (
    <>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-[13px] font-semibold truncate ${highlight ? "text-[#5851DB]" : "text-gray-900"} ${href ? "group-hover:underline" : ""}`}>{value}</p>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="min-w-0 group">
        {content}
      </a>
    );
  }
  return <div className="min-w-0">{content}</div>;
};


export { ApplicationRow, ApplicationJourney };
