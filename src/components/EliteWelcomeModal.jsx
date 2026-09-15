"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BadgeCheck,
  Crown,
  Infinity as InfinityIcon,
  LayoutTemplate,
  Sparkles,
  TrendingUp,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getEffectivePlan, PLAN_IDS } from "@/lib/plans";
import { isInstagramTokenExpired } from "@/lib/instagramToken";

// One-time "Welcome to Elite" popup.
//
// Shows while the creator's EFFECTIVE plan is elite (date-aware, so a lapsed
// Elite never sees it) and elite_welcome_seen_at is null. A DB trigger
// (migration 072) clears that column whenever a plan becomes elite, from any
// grant path — so it greets every new Elite subscription exactly once, on any
// device, including creators who were already Elite before this shipped.
//
// Lists only perks that are actually delivered (verified 2026-09-16), not the
// full pricing matrix — several matrix rows have no implementation yet.
//
// Waits while the Instagram reconnect popup is up, so the two never stack.
const PERKS = [
  { key: "topSpot", Icon: TrendingUp },
  { key: "spotlight", Icon: Sparkles },
  { key: "badge", Icon: BadgeCheck },
  { key: "applications", Icon: InfinityIcon },
  { key: "ai", Icon: Wand2 },
  { key: "mediaKit", Icon: LayoutTemplate },
  { key: "payouts", Icon: Zap },
];

export default function EliteWelcomeModal() {
  const t = useTranslations("EliteWelcomeModal");
  const router = useRouter();
  const { user, profile, setProfile, instagramTokenMissing } = useAuth();
  const [closed, setClosed] = useState(false);

  const isElite = !!profile && getEffectivePlan(profile) === PLAN_IDS.ELITE;
  const reconnectPending =
    !!profile?.instagram_connected && (instagramTokenMissing || isInstagramTokenExpired(profile));
  if (!isElite || profile.elite_welcome_seen_at || closed || reconnectPending) return null;

  const dismiss = async (href) => {
    setClosed(true);
    const seenAt = new Date().toISOString();
    // Reflect locally at once so no other surface re-opens it this session.
    setProfile?.((p) => (p ? { ...p, elite_welcome_seen_at: seenAt } : p));
    if (href) router.push(href);
    if (!user?.id) return;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ userId: user.id, table: "influencer_profiles", eliteWelcomeSeen: true }),
      });
    } catch {
      // Best effort — worst case it greets them once more next visit.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[205] flex items-end sm:items-center justify-center bg-black/60 px-3 sm:px-4 pb-3 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="elite-welcome-title"
    >
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-[#F59E0B] via-[#E1306C] to-[#833AB4] px-6 pt-7 pb-6 text-white">
          <button
            onClick={() => dismiss()}
            aria-label={t("close")}
            className="absolute top-3 right-3 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <Crown size={30} />
          </div>
          <h2 id="elite-welcome-title" className="text-2xl font-black leading-tight pr-8">
            {t("title")}
          </h2>
          <p className="mt-1.5 text-sm text-white/90">{t("subtitle")}</p>
          <div className="pointer-events-none absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-white/10" />
        </div>

        <ul className="px-5 sm:px-6 py-5 space-y-3">
          {PERKS.map(({ key, Icon }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-pink-50 border border-pink-100 flex items-center justify-center text-[#C2185B]">
                <Icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">{t(`perks.${key}.title`)}</span>
                <span className="block text-xs text-slate-500 leading-relaxed">{t(`perks.${key}.body`)}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="px-5 sm:px-6 pb-6 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => dismiss()}
            className="sm:flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t("close")}
          </button>
          <button
            onClick={() => dismiss("/influencer/campaigns")}
            className="sm:flex-1 h-11 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: "linear-gradient(135deg, #F59E0B 0%, #E1306C 50%, #833AB4 100%)" }}
          >
            {t("cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
