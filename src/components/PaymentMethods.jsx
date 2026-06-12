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
  AlertTriangle,
  Clock,
  Check,
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

// Renders the verification badge next to the method type. Validation
// happens server-side on register (RazorpayX fund-account validation
// API); pending → verification webhook hasn't arrived yet, success →
// safe to receive payouts, failed → name/account mismatch, fix needed.
const ValidationChip = ({ status, reason }) => {
  if (status === "success") {
    return (
      <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
        Verified
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span
        className="text-[8px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase"
        title={reason || "Could not verify the account holder"}
      >
        Verify failed
      </span>
    );
  }
  return (
    <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
      Verifying…
    </span>
  );
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

// NPCI's published VPA spec: <username>@<handle>. Username starts with
// alphanumeric, allows ./_/-, 2–50 chars. Handle starts with alpha,
// allows alphanumeric + dot, 2–30 chars. Total commonly < 50 chars.
// Returns null when valid, or a human-readable reason string.
const validateUpiId = (raw) => {
  const id = (raw || "").trim();
  if (!id) return "UPI ID is required.";
  if (id.length > 50) return "UPI ID is too long.";
  const at = id.indexOf("@");
  if (at < 0 || id.indexOf("@", at + 1) !== -1) return "Must contain exactly one @ symbol.";
  const [user, handle] = id.split("@");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,49}$/.test(user)) {
    return "The part before @ should start with a letter or digit and use only letters, digits, dot, underscore, or hyphen.";
  }
  if (!/^[a-zA-Z][a-zA-Z0-9.]{1,29}$/.test(handle)) {
    return "The bank handle (after @) should be alphabetic, e.g. okhdfcbank, paytm, ybl.";
  }
  return null;
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
  // Campaign earnings — applications with a payout leg. Rendered in
  // the existing "Credit History" section.
  const [earnings, setEarnings] = useState([]);
  const [earningsLoading, setEarningsLoading] = useState(true);

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

  const fetchEarnings = async () => {
    if (!user?.id) return;
    setEarningsLoading(true);
    // RLS gates campaign_applications by influencer ownership so the
    // direct select is safe. We fetch the application + denormalised
    // brand/campaign labels via the standard FK joins. Limit to 50 most
    // recent; the user can scroll history elsewhere if we add it.
    const { data, error } = await supabase
      .from("campaign_applications")
      .select(
        "id, escrow_amount, payout_status, payout_release_at, payout_processed_at, payout_utr, payout_method, payout_failure_reason, campaigns(title, brand_id, brand_profiles:brand_id(brand_name, gstin_trade_name, logo_url))"
      )
      .eq("influencer_id", user.id)
      .not("payout_status", "is", null)
      .order("payout_release_at", { ascending: false })
      .limit(50);
    if (error) console.error("earnings read failed:", error.message);
    setEarnings(data || []);
    setEarningsLoading(false);
  };

  useEffect(() => {
    fetchMethods();
    fetchInvoices();
    fetchEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Surface the pending_creator_info banner whenever an application is
  // stuck waiting on payout info. Once any verified method exists, the
  // register-payout-method auto-resume + cron flips these to scheduled.
  const pendingEarnings = earnings.filter((e) => e.payout_status === "pending_creator_info");
  const pendingTotalInr = pendingEarnings.reduce(
    (sum, e) => sum + Math.round((e.escrow_amount || 0) / 100),
    0
  );

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

  // Save goes through the register-payout-method Edge Function, which:
  //   (1) creates / reuses a RazorpayX Contact for this user,
  //   (2) registers the UPI/bank as a Razorpay Fund Account,
  //   (3) fires a name-match validation (test mode: synchronous),
  //   (4) inserts payment_methods with the Razorpay IDs + validation result.
  // Returns { ok, validation_status, resumed_payouts } so the modal can
  // surface "Verified" / "Verify failed" + how many waiting payouts were
  // released by adding this method.
  const addMethod = async (payload) => {
    if (!user?.id) return { ok: false, error: "Not signed in" };
    const { data, error } = await supabase.functions.invoke("register-payout-method", {
      body: payload,
    });
    if (error || data?.error) {
      const msg = error?.message || data?.error || "Failed to save";
      console.error("register-payout-method failed:", msg);
      return { ok: false, error: msg };
    }
    setShowAddModal(false);
    // Refresh both lists. fetchEarnings is the important one for the
    // pending-amount banner — register-payout-method auto-flips any
    // 'pending_creator_info' rows to 'scheduled' as part of saving, so
    // re-fetching pulls in the new statuses and the banner disappears.
    fetchMethods();
    fetchEarnings();
    return {
      ok: true,
      validation_status: data?.validation_status || "pending",
      resumed_payouts: data?.resumed_payouts || 0,
    };
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
        {pendingEarnings.length > 0 && (
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-amber-900">
                ₹{pendingTotalInr.toLocaleString("en-IN")} is waiting for you
              </p>
              <p className="text-[11px] font-bold text-amber-700 mt-0.5">
                Add a UPI ID or bank account to receive your campaign earnings.
              </p>
            </div>
            <Plus size={16} className="text-amber-700 shrink-0" />
          </button>
        )}

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
                        <ValidationChip status={m.validation_status} reason={m.validation_failure_reason} />
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

        {/* Credit History (campaign earnings) sits ABOVE Subscription
            History because the creator's primary financial concern is
            "did I get paid for my campaigns" — subscription billing is
            secondary. */}
        <CreditHistorySection loading={earningsLoading} earnings={earnings} />

        <SubscriptionHistorySection
          loading={invoicesLoading}
          invoices={invoices}
          onRefresh={fetchInvoices}
        />

      </div>

      {showAddModal && <AddPaymentModal onClose={() => setShowAddModal(false)} onAdd={addMethod} />}
    </div>
  );
};

// Campaign earnings — applications whose escrow has been released by
// the brand. Each row reflects the current payout_status:
//   pending_creator_info → "Add details to receive"
//   scheduled            → "Arriving by <date>"
//   processing           → "Processing"
//   processed            → "Paid · UTR …"
//   failed / reversed    → "Failed — re-add method or contact support"
const CreditHistorySection = ({ loading, earnings }) => {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-pink-500" />
          <h2 className="font-black text-gray-900 text-base">Credit History</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-pink-500" />
          </div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
            <IndianRupee size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-400">No payouts yet</p>
            <p className="text-[11px] text-gray-300 mt-1">Once your campaign earnings are released they'll show up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {earnings.map((e) => (
              <EarningRow key={e.id} earning={e} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

const EARNING_STATUS = {
  pending_creator_info: { label: "Add payout details to receive", chip: "bg-amber-50 text-amber-700", Icon: AlertTriangle },
  scheduled:            { label: "Scheduled",                     chip: "bg-indigo-50 text-indigo-700", Icon: Clock },
  processing:           { label: "Processing",                    chip: "bg-blue-50 text-blue-700",     Icon: Loader2 },
  processed:            { label: "Paid",                          chip: "bg-emerald-50 text-emerald-700", Icon: Check },
  failed:               { label: "Failed",                        chip: "bg-red-50 text-red-700",       Icon: AlertTriangle },
  reversed:             { label: "Reversed",                      chip: "bg-red-50 text-red-700",       Icon: AlertTriangle },
};

const EarningRow = ({ earning }) => {
  const status = EARNING_STATUS[earning.payout_status] || EARNING_STATUS.scheduled;
  const Icon = status.Icon;
  const brand = earning.campaigns?.brand_profiles || {};
  const brandName = brand.brand_name || brand.gstin_trade_name || "Brand";
  const campaignTitle = earning.campaigns?.title || "Campaign";
  const amountInr = Math.round((earning.escrow_amount || 0) / 100);

  // Date to show: processed → processed_at; everything else → release_at.
  const subtitleDate =
    earning.payout_status === "processed" && earning.payout_processed_at
      ? `Paid on ${new Date(earning.payout_processed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
      : earning.payout_release_at
      ? earning.payout_status === "scheduled"
        ? `Arriving by ${new Date(earning.payout_release_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        : new Date(earning.payout_release_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "";

  return (
    <li className="py-3.5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
        {brand.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo_url} alt={brandName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] font-black text-gray-400">
            {brandName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black text-gray-800 truncate">{campaignTitle}</p>
          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${status.chip}`}>
            <Icon size={9} className={earning.payout_status === "processing" ? "animate-spin" : ""} />
            {status.label}
          </span>
        </div>
        <p className="text-[11px] text-gray-400 font-bold mt-0.5 truncate">
          {brandName}
          {subtitleDate ? ` · ${subtitleDate}` : ""}
          {earning.payout_utr ? ` · UTR ${earning.payout_utr}` : ""}
          {earning.payout_method ? ` · ${earning.payout_method.toUpperCase()}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-gray-900">₹{amountInr.toLocaleString("en-IN")}</p>
      </div>
    </li>
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

  // For UPI we run the full VPA check so the user sees a meaningful
  // reason inline (not just a disabled button). Bank still uses the
  // simpler length checks since the IFSC + account number get
  // server-side fuzzy-matched by Razorpay anyway.
  const upiError = type === "upi" ? validateUpiId(upiId) : null;
  const isValid =
    type === "upi"
      ? !upiError
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
    const res = await onAdd(payload);
    if (!res?.ok) {
      setError(res?.error || "Failed to save. Please try again.");
      setSaving(false);
    }
    // On success the parent closes the modal — no further state to set.
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
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className={`w-full p-4 bg-gray-50 border focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all ${
                    upiId.trim() && upiError
                      ? "border-rose-200 focus:border-rose-300"
                      : "border-gray-100 focus:border-purple-300"
                  }`}
                />
                {/* Inline validation — only nag once the user has typed
                    something, otherwise an empty field shows "required"
                    on first open which is noisy. */}
                {upiId.trim() && upiError && (
                  <p className="text-[11px] font-bold text-rose-500">{upiError}</p>
                )}
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
            {saving ? "Verifying with bank…" : "Add Method"}
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentMethods;
