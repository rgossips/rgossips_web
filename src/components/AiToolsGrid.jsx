"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Type, FileText, BarChart3, Zap, ClipboardCheck, X, Copy, Check, Loader2, Sparkles, RotateCw, Hash } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";
import { useAiTool } from "@/hooks/useAiTool";
import { getAiUsageStatus } from "@/lib/plans";
import { AiMarkdown, parseAiRates } from "@/components/AiMarkdown";

// Maps each tile to a real `ai-generate` tool.
const TOOLS = [
  { key: "captions", tool: "caption", Icon: Type, color: "text-orange-500", tint: "bg-orange-50 border-orange-100" },
  { key: "scripts", tool: "script", Icon: FileText, color: "text-amber-500", tint: "bg-amber-50 border-amber-100" },
  { key: "hookIdeas", tool: "hooks", Icon: Zap, color: "text-rose-500", tint: "bg-rose-50 border-rose-100" },
  { key: "hashtags", tool: "hashtags", Icon: Hash, color: "text-sky-500", tint: "bg-sky-50 border-sky-100" },
  { key: "rateCard", tool: "rate_card", Icon: BarChart3, color: "text-emerald-500", tint: "bg-emerald-50 border-emerald-100" },
  { key: "briefHelper", tool: "brief_checklist", Icon: ClipboardCheck, color: "text-indigo-500", tint: "bg-indigo-50 border-indigo-100" },
];

export function AiToolsGrid() {
  const t = useTranslations("AiToolsGrid");
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [open, setOpen] = useState(null);
  const [usedThisMonth, setUsedThisMonth] = useState(0);

  // Monthly usage for the quota meter; refetch whenever a tool modal closes.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const period = new Date().toISOString().slice(0, 7);
      const { data } = await supabase.from("ai_generation_usage").select("count").eq("user_id", user.id).eq("period", period);
      if (!cancelled) setUsedThisMonth((data || []).reduce((s, r) => s + (r.count || 0), 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, open]);

  const usage = getAiUsageStatus(profile, usedThisMonth);
  const pct = usage.unlimited || !usage.limit ? 0 : Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const exhausted = !usage.unlimited && usage.remaining <= 0;

  return (
    <Card className="w-full h-full max-w-2xl p-5 lg:p-8 bg-white border-slate-200 shadow-sm rounded-3xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-500" />
          <h2 className="text-xl font-bold text-slate-900">{t("title")}</h2>
        </div>
        <span className="text-[10px] font-black tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full capitalize">{usage.plan}</span>
      </div>

      {/* AI usage meter */}
      <div className="mb-6">
        {usage.unlimited ? (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <Sparkles size={13} /> {t("unlimited")}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-1.5">
              <div>
                <span>{t("usageLabel")}</span>{" "}
                <Link href="/influencer/pricing" className="text-[10px] font-black text-[#9810FA] hover:underline">
                  {t("upgradeCta")}
                </Link>
              </div>
              <span className={exhausted ? "text-rose-500 font-bold" : "text-slate-700 font-bold"}>{t("usedOfLimit", { used: usage.used, limit: usage.limit })}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${exhausted ? "bg-rose-400" : pct >= 80 ? "bg-amber-400" : "bg-gradient-to-r from-[#9810FA] to-[#E60076]"}`}
                style={{ width: `${Math.max(pct, usage.used > 0 ? 4 : 0)}%` }}
              />
            </div>
            {(exhausted || pct >= 80) && (
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-slate-400">{exhausted ? t("limitBody") : t("leftThisMonth", { count: usage.remaining })}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <motion.button
            key={tool.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setOpen(tool)}
            className={`p-6 rounded-3xl border transition-all flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-md ${tool.tint}`}
          >
            <div className="p-3 rounded-2xl bg-white shadow-sm">
              <tool.Icon className={tool.color} />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{t(`tools.${tool.key}`)}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-1 text-slate-400">{t("generate")}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>{open && <ToolModal spec={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </Card>
  );
}

function ToolModal({ spec, onClose }) {
  const t = useTranslations("AiToolsGrid");
  const { user, profile, refreshProfile } = useAuth();
  const { generate, loading, result, remaining, error, limitReached, setResult } = useAiTool();
  const [ctx, setCtx] = useState("");
  const [copied, setCopied] = useState(false);
  const [savingRates, setSavingRates] = useState(false);
  const [ratesSaved, setRatesSaved] = useState(false);

  // Rate card replies end with a machine-readable RATES_JSON line — strip it
  // from the display and surface it as a one-click "Update my pricing" action.
  const isRateCard = spec.key === "rateCard";
  const { rates: aiRates, cleanText } = isRateCard ? parseAiRates(result) : { rates: null, cleanText: result };

  const run = () => {
    setRatesSaved(false);
    generate({ tool: spec.tool, inputs: ctx.trim() ? { context: ctx.trim() } : {} });
  };
  const copy = () => {
    if (!cleanText) return;
    navigator.clipboard?.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const applyRates = async () => {
    if (!aiRates || !user?.id || savingRates) return;
    setSavingRates(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          userId: user.id,
          table: "influencer_profiles",
          // Merge over existing rates so services the AI didn't price keep theirs.
          serviceRates: { ...(profile?.service_rates || {}), ...aiRates },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data?.error) {
        setRatesSaved(true);
        await refreshProfile?.();
      }
    } catch (e) {
      console.error("Failed to apply AI rates:", e);
    } finally {
      setSavingRates(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <spec.Icon className={spec.color} size={20} />
            <h3 className="text-base font-black text-slate-900">{t(`tools.${spec.key}`)}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {limitReached ? (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm font-bold text-slate-900">{t("limitTitle")}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{t("limitBody")}</p>
              <Link
                href="/influencer/pricing"
                className="inline-block mt-1 px-6 py-2.5 rounded-full text-white text-sm font-black"
                style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
              >
                {t("upgradeCta")}
              </Link>
            </div>
          ) : (
            <>
              <textarea
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder={t(`placeholders.${spec.key}`)}
                rows={3}
                className="w-full p-3 bg-slate-50 border border-slate-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all resize-none"
              />
              {result && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <AiMarkdown text={cleanText} />
                  {isRateCard && aiRates && (
                    <button
                      onClick={applyRates}
                      disabled={savingRates || ratesSaved}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${
                        ratesSaved ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "text-white active:scale-95"
                      }`}
                      style={ratesSaved ? undefined : { background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
                    >
                      {savingRates ? <Loader2 size={15} className="animate-spin" /> : ratesSaved ? <Check size={15} /> : <BarChart3 size={15} />}
                      {savingRates ? t("updatingPricing") : ratesSaved ? t("pricingUpdated") : t("updatePricing")}
                    </button>
                  )}
                </div>
              )}
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            </>
          )}
        </div>

        {!limitReached && (
          <div className="p-5 border-t border-slate-100 flex items-center gap-3">
            {result && (
              <button onClick={copy} className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all">
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                {copied ? t("copied") : t("copy")}
              </button>
            )}
            <button
              onClick={run}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-lg disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : result ? <RotateCw size={15} /> : <Sparkles size={15} />}
              {loading ? t("generating") : result ? t("regenerate") : t("generate")}
            </button>
          </div>
        )}
        {typeof remaining === "number" && !limitReached && <p className="text-[10px] text-center text-slate-400 pb-3 -mt-2">{t("leftThisMonth", { count: remaining })}</p>}
      </motion.div>
    </motion.div>
  );
}
