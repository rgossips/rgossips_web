"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Link as LinkIcon,
  Send,
  Loader2,
  CheckCircle2,
  Info,
} from "lucide-react";
import { fetchServiceBySlug, formatINR, iconForName } from "@/lib/services";
import { useAuth } from "@/context/AuthContext";

// Scope options (the "Reel duration" field in the screenshot). The label and
// choices change per service tag so the form fits any offering.
const SCOPE_FOR_TAG = {
  CONTENT: {
    label: "Reel duration",
    required: true,
    options: ["15-30 seconds", "30-60 seconds", "60-90 seconds", "90s+"],
  },
  AUDIO: {
    label: "Episode length",
    required: true,
    options: ["Up to 30 min", "30-60 min", "60-90 min", "90 min+"],
  },
  DESIGN: {
    label: "Number of designs",
    required: true,
    options: ["1 design", "5-10 designs", "10-20 designs", "20+ designs"],
  },
  WRITING: {
    label: "Content volume",
    required: true,
    options: ["1-5 pieces", "5-10 pieces", "10-20 pieces", "20+ pieces"],
  },
  STRATEGY: {
    label: "Scope",
    required: true,
    options: ["Audit only", "Audit + 30-day roadmap", "Full quarterly retainer"],
  },
  ADS: {
    label: "Monthly ad spend",
    required: true,
    options: ["< ₹25K", "₹25K – ₹1L", "₹1L – ₹3L", "₹3L+"],
  },
  MANAGEMENT: {
    label: "Posting cadence",
    required: true,
    options: ["8 posts / month", "16 posts / month", "Daily posting"],
  },
  MARKETING: {
    label: "Campaign size",
    required: true,
    options: ["3 nano creators", "10 micro creators", "25+ creators"],
  },
};

const BUDGET_OPTIONS = [
  "Under ₹3,000",
  "₹3,000 – ₹7,000",
  "₹7,000 – ₹15,000",
  "₹15,000 – ₹50,000",
  "₹50,000+",
];

// 7 days out from today — keeps the user one full work-week ahead without
// being unrealistic. The HTML <input type="date" min={...}> guard below
// stops them from picking a past date.
const defaultDeliveryISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function QuoteRequestPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user, role } = useAuth();
  const [service, setService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchServiceBySlug(id);
      if (cancelled) return;
      setService(data);
      setLoadingService(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const scopeCfg = useMemo(
    () => SCOPE_FOR_TAG[service?.tag] || { label: "Scope", required: false, options: [] },
    [service]
  );

  const [description, setDescription] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryISO());
  const [scope, setScope] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [styleRefs, setStyleRefs] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Seed scope to the first option once the service (and therefore scopeCfg)
  // arrives from the DB.
  useEffect(() => {
    if (!scope && scopeCfg.options.length > 0) setScope(scopeCfg.options[0]);
  }, [scopeCfg, scope]);

  if (loadingService) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-pink-500" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-base font-bold text-slate-600">Service not found</p>
        <button
          onClick={() => router.push("/influencer/services")}
          className="mt-4 text-sm font-bold text-pink-500 hover:underline cursor-pointer"
        >
          Back to All Services
        </button>
      </div>
    );
  }

  const Icon = iconForName(service.icon_name);

  const isValidUrl = (s) => /^(https?:\/\/|http:\/\/)\S+\.\S+/i.test(s.trim());

  const handleSubmit = async () => {
    setError("");
    if (!user?.id) {
      setError("Please sign in to request a quote.");
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      setError("Please describe your project in at least 20 characters.");
      return;
    }
    if (!assetUrl.trim() || !isValidUrl(assetUrl)) {
      setError("Paste a Google Drive / WeTransfer / Dropbox link so the team can review your assets.");
      return;
    }
    if (scopeCfg.required && !scope) {
      setError(`Please select a ${scopeCfg.label.toLowerCase()}.`);
      return;
    }
    setSubmitting(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/submit-quote-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          userRole: role || "",
          serviceSlug: service.slug,
          description: description.trim(),
          assetUrl: assetUrl.trim(),
          desiredDeliveryDate: deliveryDate || null,
          scope: scope || null,
          budgetRange: budgetRange || null,
          styleReferences: styleRefs.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setDone(true);
    } catch (e) {
      setError(e.message || "Failed to submit quote request");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-3xl border border-slate-100 p-8 lg:p-10 max-w-lg w-full text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-slate-900 mt-4">
            Quote request submitted!
          </h2>
          <p className="text-[13px] text-slate-500 mt-2 leading-snug">
            We'll review your brief and get back with a custom quote within{" "}
            <span className="font-bold text-slate-700">{service.quote_sla_hours} hours</span>.
            You'll receive an update on the phone number tied to your account.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => router.push("/influencer/services")}
              className="flex-1 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black cursor-pointer hover:border-pink-200 hover:text-pink-500"
            >
              Browse more services
            </button>
            <button
              onClick={() => router.push("/influencer")}
              className="flex-1 py-3 rounded-2xl btn-purple text-white text-sm font-black cursor-pointer"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-24 lg:pb-12 lg:pt-24 font-sans">
      <div className="max-w-[760px] mx-auto px-4 lg:px-6 py-6 space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-pink-500 hover:underline cursor-pointer"
        >
          <ChevronLeft size={14} /> Back to {service.tag.toLowerCase()}
        </button>

        {/* Header card */}
        <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-violet-50 border border-rose-100 rounded-2xl p-4 lg:p-5 flex items-center gap-4">
          <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl flex items-center justify-center shrink-0 ${service.accent} bg-white`}>
            <Icon size={22} strokeWidth={1.8} className="text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-black text-slate-900 leading-tight truncate">
              {service.title}
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Step 1 of 1 · Quote request</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-full whitespace-nowrap">
            Quote Request
          </span>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 lg:p-6 space-y-5">
          {/* Description */}
          <Field
            label="Project description"
            required
            hint="Be specific to get a faster quote"
          >
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need… e.g., I want a 30-second reel showcasing my new skincare product launch. Footage was shot in natural light, mostly close-ups of the product and me applying it. Want a soft, dreamy vibe."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          </Field>

          {/* Asset URL (URL-only — no raw file upload) */}
          <Field label="Reference link to your raw footage / assets" required>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 lg:p-5 bg-slate-50/40 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  <LinkIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-slate-800">Share a link to your assets</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Paste a Google Drive, WeTransfer, Dropbox or YouTube link — we don't accept direct uploads here.
                  </p>
                </div>
              </div>
              <input
                type="url"
                value={assetUrl}
                onChange={(e) => setAssetUrl(e.target.value)}
                placeholder="https://drive.google.com/folders/…"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </Field>

          {/* Date + Scope row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Desired delivery date">
              <input
                type="date"
                value={deliveryDate}
                min={todayISO()}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </Field>

            {scopeCfg.options.length > 0 && (
              <Field label={scopeCfg.label} required={scopeCfg.required}>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
                >
                  {scopeCfg.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          {/* Budget */}
          <Field label="Budget range" hint="Optional, helps us send the right quote">
            <select
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
            >
              <option value="">Select a range</option>
              {BUDGET_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {service.price_to && (
              <div className="mt-2 bg-rose-50 border border-rose-100 rounded-xl p-2.5 flex gap-2 items-start text-[11px] text-rose-700">
                <Info size={12} className="text-rose-500 shrink-0 mt-0.5" />
                <p>
                  Typical range for similar projects:{" "}
                  <span className="font-bold">{formatINR(service.price_starting)} – {formatINR(service.price_to)}</span>
                  {" "}depending on footage complexity and revision count.
                </p>
              </div>
            )}
          </Field>

          {/* Style refs */}
          <Field label="Style references / inspiration" hint="Optional but recommended">
            <input
              type="text"
              value={styleRefs}
              onChange={(e) => setStyleRefs(e.target.value)}
              placeholder="Paste Instagram reel links or describe a vibe"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </Field>

          {/* Notes */}
          <Field label="Additional notes">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything else our team should know? Brand colors, do's and don'ts, etc."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            />
          </Field>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-[12px] font-semibold rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-black cursor-pointer hover:border-pink-200 hover:text-pink-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-2xl btn-purple text-white text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-pink-100"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {submitting ? "Submitting…" : "Submit Quote Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label className="text-[12px] font-black text-slate-800">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
        {hint && (
          <span className="text-[11px] text-pink-500 font-medium">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}
