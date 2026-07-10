"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Compact wallet strip on the influencer home. Renders only when the user
// has at least some RC (available or locked) so a fresh account without
// signups sees the same clean home as before. Tap → /influencer/refer.
export default function ReferBalanceCard() {
  const router = useRouter();
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
  // instead of a "0 available / +50 locked" strip.
  if (avail <= 0) return null;

  return (
    <button
      onClick={() => router.push("/influencer/refer")}
      className="w-full text-left flex items-center gap-3 rounded-2xl p-3 lg:p-4 my-2 border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
        style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
      >
        <Sparkles size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reward Credits</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-lg font-black text-slate-900">
            {avail} <span className="text-xs text-slate-400 font-bold">available</span>
          </p>
          {locked > 0 && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              +{locked} locked
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}
