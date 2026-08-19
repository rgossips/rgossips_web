"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Coins } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Reward-credits cell for the influencer home. This used to be its own white
// strip floating under ProStatusCard; it now renders INSIDE that card as a
// fourth stat, so the account summary reads as one object instead of a card
// plus an orphan bar. Mounted by ProStatusCard, not by the page.
//
// It still self-hides at zero available RC, so the card collapses back to its
// original three sections for anyone who has never earned any. The divider
// ships with the cell for that reason — rendering it from the parent would
// leave a stray rule when the cell hides.
//
// Layout deliberately mirrors the plan/trial cell beside it: label + caption
// on the left, big gradient number on the right, mobile-only card chrome that
// flattens on desktop. Tap → /influencer/refer.
export default function ReferBalanceCard() {
  const router = useRouter();
  const t = useTranslations("ReferBalanceCard");
  const { user } = useAuth();
  const supabase = createClient();
  const [avail, setAvail] = useState(0);
  const [locked, setLocked] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("v_reward_credits_available_balance")
          .select("available_balance, locked_balance")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setAvail(data?.available_balance || 0);
        setLocked(data?.locked_balance || 0);
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [user?.id, supabase]);

  // Only show once there's spendable RC. A brand-new signup whose only RC is
  // the still-locked 50 welcome bonus is greeted by WelcomeRewardModal
  // instead of a "0 available / +50 locked" cell.
  if (avail <= 0) return null;

  return (
    <>
      {/* Vertical Divider - Desktop Only */}
      <div className="hidden lg:block w-px h-12 bg-slate-100 shrink-0" />

      <button
        type="button"
        onClick={() => router.push("/influencer/refer")}
        className="group cursor-pointer text-left lg:shrink-0"
      >
        <div className="flex items-center justify-between lg:gap-6 p-4 lg:p-0 lg:px-3 lg:py-2 bg-white border border-slate-100 rounded-2xl shadow-sm lg:shadow-lg hover:bg-slate-50 lg:hover:bg-transparent transition-all">
          <div className="flex-1 lg:w-28">
            <div className="flex items-center gap-2 mb-1">
              <Coins size={14} className="text-purple-600" />
              <span className="text-[10px] lg:text-[11px] font-black tracking-widest text-slate-500 uppercase">
                {t("rewardCredits")}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {locked > 0 ? t("locked", { count: locked }) : t("available")}
            </p>
          </div>

          <div className="pl-4 lg:pl-0 border-l lg:border-0 border-slate-100 text-center">
            <span className="text-3xl lg:text-3xl font-black leading-none bg-gradient-to-r from-[#9810fa] to-[#e60076] text-transparent bg-clip-text">
              {avail}
            </span>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
              {t("available")}
            </p>
          </div>
        </div>
      </button>
    </>
  );
}
