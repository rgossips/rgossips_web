"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Building2,
  Smartphone,
  Wallet,
  Trash2,
  X,
  IndianRupee,
  Loader2,
  Download,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { PLAN_PRICING } from "@/lib/plans";

const labelForMethod = (m) => {
  if (m.type === "upi") return m.upi_id || "UPI";
  if (m.type === "bank") {
    const last4 = (m.account_number || "").slice(-4);
    return `${m.bank_name || "Bank"} ••••${last4 || "0000"}`;
  }
  return m.label || "Payment Method";
};

// Derive plan + cycle from the invoice amount (in paise) using the same
// price table the rest of the app uses. Razorpay's invoice notes don't
// inherit from the subscription, so the server returns null plan/cycle
// and we look it up here from the well-known amounts.
function planFromAmount(amountPaise, currency) {
  if (!amountPaise || currency !== "inr") return { plan: null, cycle: null };
  const rupees = Math.round(amountPaise / 100);
  for (const [planId, prices] of Object.entries(PLAN_PRICING)) {
    if (prices.monthly === rupees) return { plan: planId, cycle: "monthly" };
    if (prices.annual === rupees) return { plan: planId, cycle: "annual" };
  }
  return { plan: null, cycle: null };
}

const formatINR = (amountMinor) => {
  if (amountMinor == null) return "—";
  const rupees = Math.round(amountMinor / 100);
  return "₹" + rupees.toLocaleString("en-IN");
};

const formatDate = (unixSeconds) => {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const PaymentMethods = ({ onBack }) => {
  const supabase = createClient();
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [busyId, setBusyId] = useState(null);
  // Subscription history — invoices across Stripe + Razorpay, merged
  // by the subscription-history edge function.
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);

  const fetchMethods = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) console.error("payment_methods read failed:", error.message);
    setMethods(data || []);
    setLoading(false);
  };

  const fetchInvoices = async () => {
    if (!user?.id) return;
    setInvoicesLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("subscription-history", {
        body: { userId: user.id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
    } catch (e) {
      console.error("subscription-history fetch failed:", e?.message);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const setPrimary = async (id) => {
    if (!user?.id) return;
    setBusyId(id);
    try {
      // Sequence matters: clear all first (RLS limits to own rows), then set
      // the target row. Doing it in one statement would race with the partial
      // unique index.
      await supabase.from("payment_methods").update({ is_primary: false }).eq("user_id", user.id);
      await supabase.from("payment_methods").update({ is_primary: true, updated_at: new Date().toISOString() }).eq("id", id);
      fetchMethods();
    } finally {
      setBusyId(null);
    }
  };

  const removeMethod = async (id) => {
    setBusyId(id);
    try {
      await supabase.from("payment_methods").delete().eq("id", id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const addMethod = async (payload) => {
    if (!user?.id) return;
    // First method is automatically primary so payouts always have a target.
    const isFirst = methods.length === 0;
    const { error } = await supabase
      .from("payment_methods")
      .insert({
        user_id: user.id,
        ...payload,
        is_primary: isFirst,
      });
    if (error) {
      console.error("payment_methods insert failed:", error.message);
      return false;
    }
    setShowAddModal(false);
    fetchMethods();
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-900 lg:pt-24">
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-30 border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 cursor-pointer bg-pink-50 text-pink-500 rounded-full active:scale-90 transition-transform">
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-lg lg:text-2xl font-black tracking-tight">Payments</h1>
            <p className="hidden lg:block text-[10px] text-gray-400 font-black uppercase tracking-widest">Manage payment methods you use to receive earnings</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 mt-6 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-orange-500" />
              <h2 className="font-black text-gray-900 text-base">Payment Methods</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 text-[10px] font-black text-purple-600 border border-purple-100 px-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors cursor-pointer"
            >
              <Plus size={12} /> Add New
            </button>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-pink-500" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No payment methods added</p>
                <p className="text-xs text-gray-300 mt-1">Add a UPI ID or bank account to receive payments</p>
              </div>
            ) : (
              methods.map((m) => {
                const Icon = m.type === "upi" ? Smartphone : Building2;
                const isBusy = busyId === m.id;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      m.is_primary ? "border-purple-200 bg-purple-50/30" : "border-gray-100 bg-gray-50"
                    } transition-all`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        m.is_primary ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-gray-800">
                          {m.type === "upi" ? "UPI" : "Bank Account"}
                        </p>
                        {m.is_primary && (
                          <span className="text-[8px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full uppercase">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-400 mt-0.5 truncate">{labelForMethod(m)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!m.is_primary && (
                        <button
                          onClick={() => setPrimary(m.id)}
                          disabled={isBusy}
                          className="text-[9px] font-black text-purple-500 border border-purple-100 px-2.5 py-1 rounded-full hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? "…" : "Set Primary"}
                        </button>
                      )}
                      <button
                        onClick={() => removeMethod(m.id)}
                        disabled={isBusy}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <SubscriptionHistorySection
          loading={invoicesLoading}
          invoices={invoices}
          onRefresh={fetchInvoices}
        />

        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-pink-500" />
              <h2 className="font-black text-gray-900 text-base">Credit History</h2>
            </div>
            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
              <IndianRupee size={28} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">No payouts yet</p>
              <p className="text-[11px] text-gray-300 mt-1">Once your campaign earnings are released they'll show up here.</p>
            </div>
          </div>
        </section>
      </div>

      {showAddModal && <AddPaymentModal onClose={() => setShowAddModal(false)} onAdd={addMethod} />}
    </div>
  );
};

// Renders the merged Stripe + Razorpay invoice list. Each row has its
// gateway badge, the plan + cycle (derived from amount), date, amount,
// status, and a Download / View button that opens the gateway's hosted
// PDF (Stripe) or hosted invoice page (Razorpay) in a new tab.
const SubscriptionHistorySection = ({ loading, invoices, onRefresh }) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Receipt size={18} className="text-indigo-500" />
          <h2 className="font-black text-gray-900 text-base">Subscription History</h2>
        </div>
        <button
          onClick={onRefresh}
          className="text-[10px] font-black text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full hover:bg-indigo-50 transition-colors cursor-pointer"
        >
          Refresh
        </button>
      </div>

      <div className="px-5 pb-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-indigo-500" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
            <Receipt size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No subscription invoices yet</p>
            <p className="text-[11px] text-gray-300 mt-1">
              Invoices for plan upgrades and renewals will show up here once you've made a payment.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <InvoiceRow key={`${inv.gateway}-${inv.id}`} inv={inv} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

const STATUS_STYLES = {
  paid:           "bg-emerald-50 text-emerald-700",
  open:           "bg-amber-50 text-amber-700",
  draft:          "bg-gray-100 text-gray-500",
  issued:         "bg-amber-50 text-amber-700",
  partially_paid: "bg-amber-50 text-amber-700",
  expired:        "bg-gray-100 text-gray-500",
  cancelled:      "bg-rose-50 text-rose-700",
  canceled:       "bg-rose-50 text-rose-700",
  void:           "bg-gray-100 text-gray-500",
  uncollectible:  "bg-rose-50 text-rose-700",
  failed:         "bg-rose-50 text-rose-700",
};

const InvoiceRow = ({ inv }) => {
  const { plan: derivedPlan, cycle: derivedCycle } = planFromAmount(inv.amount, inv.currency);
  const plan = inv.plan || derivedPlan;
  const cycle = inv.cycle || derivedCycle;
  const planLabel = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Subscription";
  const cycleLabel = cycle === "annual" || cycle === "yearly" ? "Annual" : cycle === "monthly" ? "Monthly" : "";
  const downloadUrl = inv.pdf_url || inv.hosted_url;
  const isPdf = !!inv.pdf_url;
  const statusKey = String(inv.status || "").toLowerCase();
  const statusClass = STATUS_STYLES[statusKey] || "bg-gray-100 text-gray-500";

  // Subscription-level state. The server collapses every Razorpay /
  // Stripe state into "active" or "cancelled" for display purposes — UI
  // doesn't care about the difference between halted vs completed vs
  // past-due. If the sub is active we surface its next renewal date.
  const subActive = inv.subscription_status === "active";
  const renewalLabel = subActive && inv.next_charge_at
    ? `Renews ${formatDate(inv.next_charge_at)}`
    : null;

  return (
    <li className="py-3.5 flex items-center gap-4">
      {/* Gateway chip */}
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
        <span
          className={`text-[9px] font-black uppercase tracking-wider ${
            inv.gateway === "razorpay" ? "text-[#0c2451]" : "text-[#635BFF]"
          }`}
        >
          {inv.gateway === "razorpay" ? "RZP" : "STRP"}
        </span>
      </div>

      {/* Plan + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-gray-800 truncate">
            {planLabel}{cycleLabel ? ` · ${cycleLabel}` : ""}
          </p>
          {/* Subscription-level status — the persistent answer to "is
              this still billing me." Invoice-level status is shown
              underneath. */}
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
              subActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {subActive ? "Active" : "Cancelled"}
          </span>
          {/* Invoice-level status only adds info when it isn't simply
              "paid" — paid is the expected case for active subs. */}
          {statusKey && statusKey !== "paid" && (
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}>
              {statusKey}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 font-bold mt-0.5 truncate">
          {formatDate(inv.paid_at || inv.created_at)}
          {renewalLabel ? ` · ${renewalLabel}` : ""}
          {inv.number ? ` · ${inv.number}` : ""}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-gray-900">{formatINR(inv.amount)}</p>
      </div>

      {/* Action */}
      {downloadUrl ? (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={isPdf ? `${inv.number || inv.id}.pdf` : undefined}
          className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 border border-indigo-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors cursor-pointer shrink-0"
          title={isPdf ? "Download PDF" : "Open invoice"}
        >
          {isPdf ? <Download size={11} /> : <ExternalLink size={11} />}
          {isPdf ? "PDF" : "Invoice"}
        </a>
      ) : (
        <span className="text-[10px] font-bold text-gray-300 shrink-0">—</span>
      )}
    </li>
  );
};

const AddPaymentModal = ({ onClose, onAdd }) => {
  const [type, setType] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isValid =
    type === "upi"
      ? upiId.trim().includes("@") && upiId.trim().length > 3
      : bankName.trim() && accountNumber.trim().length >= 6 && ifsc.trim().length >= 6 && holderName.trim();

  const handleSubmit = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setError("");
    const payload =
      type === "upi"
        ? { type: "upi", upi_id: upiId.trim(), label: "UPI" }
        : {
            type: "bank",
            bank_name: bankName.trim(),
            account_number: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
            account_holder_name: holderName.trim(),
            label: "Bank Account",
          };
    const ok = await onAdd(payload);
    if (!ok) {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-md lg:max-h-[85vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-black text-gray-900">Add Payment Method</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "upi", label: "UPI", icon: Smartphone },
              { key: "bank", label: "Bank Account", icon: Building2 },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.key}
                  onClick={() => setType(opt.key)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    type === opt.key ? "border-purple-500 bg-purple-50 text-purple-600" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-black">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {type === "upi" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-400">Enter your UPI ID linked to Google Pay, PhonePe, Paytm, etc.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Account Holder Name</label>
                <input type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Full name as per bank" className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Bank Name</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 20))} placeholder="Enter account number" inputMode="numeric" className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">IFSC Code</label>
                <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase().slice(0, 11))} placeholder="e.g. HDFC0001234" className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all" />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
          <button onClick={onClose} disabled={saving} className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || saving}
            className="flex-1 h-12 rounded-xl text-white text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all shadow-lg inline-flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Add Method"}
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentMethods;
