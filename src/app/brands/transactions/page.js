"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Receipt, X, Printer, IndianRupee, Lock, CheckCircle2, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

// Brand-side transactions & invoices: every escrow payment the brand made,
// with a printable payment receipt per row. Data comes from the new
// `brand-campaigns` action:"transactions" (escrow facts live on
// campaign_applications).

const fmtINR = (paise) => `₹${(Math.round(paise || 0) / 100).toLocaleString("en-IN")}`;
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

// held → money parked; released_pending / released → paid out to creator;
// refunded overrides everything.
const statusKey = (t) => {
  if (t.refunded) return "refunded";
  if (t.escrowStatus === "held") return "inEscrow";
  if ((t.escrowStatus || "").startsWith("released")) return "released";
  return "processing";
};

const STATUS_STYLES = {
  inEscrow: "bg-indigo-50 text-indigo-600",
  released: "bg-emerald-50 text-emerald-600",
  refunded: "bg-amber-50 text-amber-600",
  processing: "bg-gray-100 text-gray-500",
};

export default function BrandTransactionsPage() {
  const t = useTranslations("BrandsTransactions");
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null); // transaction being viewed

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("brand-campaigns", {
          body: { action: "transactions", brandId: user.id },
        });
        if (cancelled) return;
        if (error || data?.error) throw new Error(error?.message || data?.error);
        setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
      } catch (e) {
        console.error("Failed to load transactions:", e);
        if (!cancelled) setTransactions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const totals = useMemo(() => {
    let held = 0;
    let released = 0;
    for (const tx of transactions) {
      const k = statusKey(tx);
      if (k === "inEscrow") held += tx.amountPaise;
      if (k === "released") released += tx.amountPaise;
    }
    return { held, released, all: transactions.reduce((s, tx) => s + tx.amountPaise, 0) };
  }, [transactions]);

  return (
    <div className="bg-[#F8F9FE] min-h-screen pb-10 font-sans">
      <div className="bg-linear-to-b from-[#4C75BE] to-[#4A3996] pt-12 pb-8 px-6 rounded-b-4xl mb-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="text-white/70 text-sm mt-1">{t("subtitle")}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-6">
        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t("summary.totalSpent"), value: fmtINR(totals.all), icon: <IndianRupee size={16} />, tint: "bg-violet-50 text-[#5851DB]" },
            { label: t("summary.inEscrow"), value: fmtINR(totals.held), icon: <Lock size={16} />, tint: "bg-indigo-50 text-indigo-600" },
            { label: t("summary.released"), value: fmtINR(totals.released), icon: <CheckCircle2 size={16} />, tint: "bg-emerald-50 text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-3xl p-5 border border-gray-100/50 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.tint}`}>{s.icon}</div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Transactions list */}
        <div className="bg-white rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-black text-gray-900">{t("listTitle")}</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#5851DB]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Receipt size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-500">{t("empty.title")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("empty.body")}</p>
              <Link
                href="/brands/campaigns"
                className="inline-block mt-4 px-5 py-2.5 rounded-full text-xs font-black text-white"
                style={{ background: "linear-gradient(135deg, #5851DB 0%, #4A3996 100%)" }}
              >
                {t("empty.cta")}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map((tx) => {
                const k = statusKey(tx);
                return (
                  <div key={tx.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{tx.campaignTitle || t("row.campaignFallback")}</p>
                      <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                        {t("row.toCreator", { name: tx.influencerName })} · {fmtDate(tx.fundedAt)}
                      </p>
                      <p className="text-[10px] text-gray-300 font-mono mt-0.5 truncate">{tx.orderId}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${STATUS_STYLES[k]}`}>
                        {t(`status.${k}`)}
                      </span>
                      <span className="text-sm font-black text-gray-900 w-24 text-right">{fmtINR(tx.amountPaise)}</span>
                      <button
                        onClick={() => setReceipt(tx)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[11px] font-bold text-[#5851DB] hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <Receipt size={13} /> {t("row.receipt")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {receipt && <ReceiptModal tx={receipt} profile={profile} onClose={() => setReceipt(null)} />}
    </div>
  );
}

// Printable payment receipt. `print:` classes hide the app chrome and the
// modal frame so window.print() outputs just the receipt card.
const ReceiptModal = ({ tx, profile, onClose }) => {
  const t = useTranslations("BrandsTransactions");
  const k = statusKey(tx);
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4 print:bg-white print:p-0">
      <div className="w-full max-w-lg bg-white rounded-3xl print:rounded-none shadow-2xl print:shadow-none max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <h3 className="text-sm font-black text-gray-900">{t("receipt.title")}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#5851DB] text-white text-[11px] font-bold cursor-pointer"
            >
              <Printer size={13} /> {t("receipt.print")}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div id="receipt-print-area" className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-black text-gray-900">RGossips</p>
              <p className="text-[11px] text-gray-500 font-semibold">RUDE LABS PVT. LTD.</p>
              <p className="text-[10px] text-gray-400">rgossips.com · grievance@rgossips.com</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t("receipt.receiptNo")}</p>
              <p className="text-[11px] font-mono font-bold text-gray-700">{String(tx.id).slice(0, 8).toUpperCase()}</p>
              <p className="text-[10px] text-gray-400 mt-1">{fmtDate(tx.fundedAt)}</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-100 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{t("receipt.billedTo")}</p>
              <p className="text-xs font-bold text-gray-900">{profile?.gstin_legal_name || profile?.brand_name || "—"}</p>
              {profile?.gstin && <p className="text-[10px] text-gray-500 font-mono mt-0.5">GSTIN: {profile.gstin}</p>}
              {profile?.gstin_address && <p className="text-[10px] text-gray-400 mt-0.5">{profile.gstin_address}</p>}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{t("receipt.paymentRefs")}</p>
              <p className="text-[10px] text-gray-500 font-mono break-all">{tx.orderId}</p>
              {tx.paymentId && <p className="text-[10px] text-gray-500 font-mono break-all mt-0.5">{tx.paymentId}</p>}
              <p className="text-[10px] text-gray-400 mt-1">Razorpay · {t(`status.${k}`)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between py-2">
              <div className="min-w-0 pr-4">
                <p className="text-xs font-bold text-gray-900">{t("receipt.lineItem", { campaign: tx.campaignTitle || t("row.campaignFallback") })}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t("row.toCreator", { name: tx.influencerName })}</p>
              </div>
              <p className="text-sm font-black text-gray-900 shrink-0">{fmtINR(tx.amountPaise)}</p>
            </div>
            <div className="flex items-center justify-between border-t-2 border-gray-900 pt-3 mt-2">
              <p className="text-sm font-black text-gray-900">{t("receipt.total")}</p>
              <p className="text-lg font-black text-gray-900">{fmtINR(tx.amountPaise)}</p>
            </div>
          </div>

          <p className="text-[9px] text-gray-400 leading-relaxed">{t("receipt.note")}</p>
        </div>
      </div>

      {/* Print isolation: everything except the receipt is display:none'd */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};
