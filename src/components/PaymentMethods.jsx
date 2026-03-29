"use client";
import React, { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Building2,
  Smartphone,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Trash2,
  X,
  IndianRupee,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const DUMMY_PAYMENT_METHODS = [
  { id: 1, type: "upi", label: "UPI", detail: "creator@okicici", icon: Smartphone, isPrimary: true },
  { id: 2, type: "bank", label: "Bank Account", detail: "HDFC ••••4521", icon: Building2, isPrimary: false },
];

const DUMMY_TRANSACTIONS = [
  { id: 1, campaign: "Summer Fashion Lookbook", brand: "Zara India", amount: 15000, status: "paid", date: "Mar 15, 2026", method: "UPI" },
  { id: 2, campaign: "Skincare Routine Reel", brand: "Minimalist", amount: 8500, status: "paid", date: "Mar 08, 2026", method: "UPI" },
  { id: 3, campaign: "Tech Unboxing Series", brand: "Samsung India", amount: 25000, status: "pending", date: "Mar 22, 2026", method: "Bank Transfer" },
  { id: 4, campaign: "Fitness Challenge", brand: "Cult.fit", amount: 12000, status: "processing", date: "Mar 18, 2026", method: "UPI" },
  { id: 5, campaign: "Food Review - New Menu", brand: "Swiggy", amount: 6000, status: "failed", date: "Feb 28, 2026", method: "Bank Transfer" },
  { id: 6, campaign: "Travel Vlog - Goa", brand: "MakeMyTrip", amount: 30000, status: "paid", date: "Feb 20, 2026", method: "UPI" },
  { id: 7, campaign: "Beauty Product Launch", brand: "Nykaa", amount: 10000, status: "paid", date: "Feb 10, 2026", method: "Bank Transfer" },
  { id: 8, campaign: "Gaming Stream Highlight", brand: "Boat Lifestyle", amount: 18000, status: "pending", date: "Mar 25, 2026", method: "UPI" },
];

const STATUS_CONFIG = {
  paid: { label: "Paid", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  pending: { label: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
  processing: { label: "Processing", icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
  failed: { label: "Failed", icon: XCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
};

const PaymentMethods = ({ onBack }) => {
  const [methods, setMethods] = useState(DUMMY_PAYMENT_METHODS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [expandedTx, setExpandedTx] = useState(null);

  const totalEarned = DUMMY_TRANSACTIONS.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const totalPending = DUMMY_TRANSACTIONS.filter((t) => t.status === "pending" || t.status === "processing").reduce((s, t) => s + t.amount, 0);

  const filteredTx = filter === "all" ? DUMMY_TRANSACTIONS : DUMMY_TRANSACTIONS.filter((t) => t.status === filter);

  const setPrimary = (id) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isPrimary: m.id === id })));
  };

  const removeMethod = (id) => {
    setMethods((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans text-gray-900 lg:pt-24 lg:px-40">
      {/* Header */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-30 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={onBack} className="p-2 cursor-pointer bg-pink-50 text-pink-500 rounded-full active:scale-90 transition-transform">
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-lg lg:text-2xl font-black tracking-tight">Payments</h1>
          <p className="hidden lg:block text-[10px] text-gray-400 font-black uppercase tracking-widest">Manage payment methods and view transaction history</p>
        </div>
      </div>

      <div className="px-5 lg:px-0 mt-6 space-y-6 max-w-6xl mx-auto">
        {/* Earnings Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Earned</p>
            <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-0.5">
              <IndianRupee size={18} />
              {totalEarned.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
            <p className="text-2xl font-black text-amber-600 mt-1 flex items-center gap-0.5">
              <IndianRupee size={18} />
              {totalPending.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
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
            {methods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No payment methods added</p>
                <p className="text-xs text-gray-300 mt-1">Add a UPI ID or bank account to receive payments</p>
              </div>
            ) : (
              methods.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border ${m.isPrimary ? "border-purple-200 bg-purple-50/30" : "border-gray-100 bg-gray-50"} transition-all`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${m.isPrimary ? "bg-purple-100 text-purple-600" : "bg-gray-100 text-gray-500"}`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-gray-800">{m.label}</p>
                        {m.isPrimary && <span className="text-[8px] font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full uppercase">Primary</span>}
                      </div>
                      <p className="text-xs font-bold text-gray-400 mt-0.5">{m.detail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!m.isPrimary && (
                        <button onClick={() => setPrimary(m.id)} className="text-[9px] font-black text-purple-500 border border-purple-100 px-2.5 py-1 rounded-full hover:bg-purple-50 transition-colors cursor-pointer">
                          Set Primary
                        </button>
                      )}
                      <button onClick={() => removeMethod(m.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Credit History */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-pink-500" />
              <h2 className="font-black text-gray-900 text-base">Credit History</h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { key: "all", label: "All" },
                { key: "paid", label: "Paid" },
                { key: "pending", label: "Pending" },
                { key: "processing", label: "Processing" },
                { key: "failed", label: "Failed" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all cursor-pointer ${
                    filter === f.key ? "bg-gray-900 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5 space-y-2.5 mt-2">
            {filteredTx.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-gray-400">No transactions found</p>
              </div>
            ) : (
              filteredTx.map((tx) => {
                const st = STATUS_CONFIG[tx.status];
                const StIcon = st.icon;
                const isExpanded = expandedTx === tx.id;
                return (
                  <div key={tx.id} className={`rounded-xl border ${st.border} overflow-hidden transition-all`}>
                    <div
                      onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-xl ${st.bg} flex items-center justify-center shrink-0`}>
                        <StIcon size={16} className={st.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-800 truncate">{tx.campaign}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{tx.brand} &middot; {tx.date}</p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-sm font-black text-gray-800 flex items-center justify-end gap-0.5">
                            <IndianRupee size={12} />
                            {tx.amount.toLocaleString("en-IN")}
                          </p>
                          <p className={`text-[9px] font-black ${st.color} mt-0.5`}>{st.label}</p>
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-gray-300" /> : <ChevronDown size={14} className="text-gray-300" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-50">
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Campaign</p>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">{tx.campaign}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Brand</p>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">{tx.brand}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Payment Method</p>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">{tx.method}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Transaction Date</p>
                            <p className="text-xs font-bold text-gray-700 mt-0.5">{tx.date}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && <AddPaymentModal onClose={() => setShowAddModal(false)} onAdd={(m) => { setMethods((prev) => [...prev, { ...m, id: Date.now() }]); setShowAddModal(false); }} />}
    </div>
  );
};

/* ── Add Payment Method Modal ── */
const AddPaymentModal = ({ onClose, onAdd }) => {
  const [type, setType] = useState("upi");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");

  const isValid = type === "upi" ? upiId.trim().includes("@") : bankName.trim() && accountNumber.trim() && ifsc.trim() && holderName.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    if (type === "upi") {
      onAdd({ type: "upi", label: "UPI", detail: upiId, icon: Smartphone, isPrimary: false });
    } else {
      onAdd({ type: "bank", label: "Bank Account", detail: `${bankName} ••••${accountNumber.slice(-4)}`, icon: Building2, isPrimary: false });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-md lg:max-h-[85vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-black text-gray-900">Add Payment Method</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Type Selector */}
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

          {/* UPI Fields */}
          {type === "upi" && (
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
          )}

          {/* Bank Fields */}
          {type === "bank" && (
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
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter account number" className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">IFSC Code</label>
                <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
          <button onClick={onClose} className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-black text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="flex-1 h-12 rounded-xl text-white text-sm font-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition-all shadow-lg"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Add Method
          </button>
        </div>
      </div>
    </>
  );
};

export default PaymentMethods;
