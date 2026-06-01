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
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

const labelForMethod = (m) => {
  if (m.type === "upi") return m.upi_id || "UPI";
  if (m.type === "bank") {
    const last4 = (m.account_number || "").slice(-4);
    return `${m.bank_name || "Bank"} ••••${last4 || "0000"}`;
  }
  return m.label || "Payment Method";
};

const PaymentMethods = ({ onBack }) => {
  const supabase = createClient();
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [busyId, setBusyId] = useState(null);

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

  useEffect(() => {
    fetchMethods();
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
