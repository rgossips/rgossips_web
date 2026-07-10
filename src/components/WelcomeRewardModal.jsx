"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/AuthContext";

// First-time welcome-reward celebration for new influencer signups. On
// signup, create-profile grants 50 RC (locked 30 days) + the user is
// eligible for 50% off their first subscription. Instead of quietly showing
// a "+50 locked" wallet strip, we pop a celebratory modal ONCE — tracked in
// localStorage per user so it never nags again.
//
// Trigger: user has a locked welcome-bonus balance (≥50 RC locked, nothing
// available yet — the fresh-signup fingerprint) AND hasn't seen it before.
const SEEN_KEY = (uid) => `rg_welcome_reward_seen_v1_${uid}`;

export default function WelcomeRewardModal() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    // Already dismissed on this device? Never show again.
    try {
      if (localStorage.getItem(SEEN_KEY(user.id))) return;
    } catch { /* storage unavailable — fall through, will just re-check */ }

    (async () => {
      try {
        const { data } = await supabase
          .from("v_reward_credits_available_balance")
          .select("available_balance, locked_balance")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        const avail = data?.available_balance || 0;
        const locked = data?.locked_balance || 0;
        // Fresh-signup fingerprint: the 50 RC welcome bonus is still locked
        // and nothing has been unlocked/earned yet.
        if (locked >= 50 && avail <= 0) setOpen(true);
      } catch { /* silent */ }
    })();

    return () => { cancelled = true; };
  }, [user?.id, supabase]);

  const dismiss = (goToRefer) => {
    try { localStorage.setItem(SEEN_KEY(user.id), "1"); } catch { /* ignore */ }
    setOpen(false);
    if (goToRefer) router.push("/influencer/refer");
  };

  // Confetti pieces — a fixed set with pre-computed random-ish positions so
  // the burst looks organic without Math.random on the render path.
  const confetti = CONFETTI;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ background: "rgba(20, 6, 40, 0.62)", backdropFilter: "blur(6px)" }}
        >
          {/* Confetti layer — sits above the scrim, behind/over the card edges */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confetti.map((c, i) => (
              <span
                key={i}
                className="wr-confetti"
                style={{
                  left: `${c.left}%`,
                  background: c.color,
                  width: c.size,
                  height: c.size * 0.4,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.dur}s`,
                  borderRadius: c.round ? "9999px" : "2px",
                }}
              />
            ))}
          </div>

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(160deg, #ffffff 0%, #FBF7FF 100%)" }}
          >
            {/* Gradient header with the gift */}
            <div
              className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
              style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
            >
              {/* Soft glow behind the gift */}
              <div
                className="absolute left-1/2 top-10 -translate-x-1/2 w-40 h-40 rounded-full blur-2xl"
                style={{ background: "rgba(255,255,255,0.35)" }}
                aria-hidden
              />
              {/* "Your Reward" pill */}
              <div className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm mb-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Your Reward</span>
              </div>

              {/* Gift box with a bouncy entrance + gentle float */}
              <motion.div
                className="relative mx-auto"
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 12 }}
              >
                <div className="wr-gift text-[84px] leading-none select-none" aria-hidden>🎁</div>
              </motion.div>

              {/* Sparkles */}
              <span className="wr-spark" style={{ left: "18%", top: "26%", animationDelay: "0.2s" }}>✨</span>
              <span className="wr-spark" style={{ right: "16%", top: "34%", animationDelay: "0.6s" }}>⭐</span>
              <span className="wr-spark" style={{ left: "24%", bottom: "18%", animationDelay: "1s" }}>💜</span>
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-6 text-center">
              <h2 className="text-[22px] font-black text-slate-900 leading-tight">
                Congratulations! 🎉
              </h2>
              <p className="text-[13px] text-slate-500 font-medium mt-1.5 leading-relaxed">
                You&apos;ve been awarded a welcome reward for joining RGossips.
              </p>

              {/* Reward rows */}
              <div className="mt-4 space-y-2 text-left">
                <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-purple-50/60 p-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 text-sm font-black"
                    style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
                  >
                    RC
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-900">50 Reward Credits</p>
                    <p className="text-[11px] text-slate-500 font-medium leading-snug">
                      Your welcome bonus — unlocks 1 month after signup, then redeem on your subscription.
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => dismiss(true)}
                className="w-full mt-5 py-3.5 rounded-2xl text-white text-sm font-black cursor-pointer hover:opacity-95 active:scale-[0.99] transition shadow-lg"
                style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)", boxShadow: "0 12px 28px -10px rgba(230,0,118,0.6)" }}
              >
                Claim Your Reward
              </button>
              <button
                onClick={() => dismiss(false)}
                className="w-full mt-2 py-2 text-[12px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </motion.div>

          {/* Scoped animations */}
          <style jsx>{`
            .wr-confetti {
              position: absolute;
              top: -24px;
              display: block;
              opacity: 0;
              animation-name: wr-fall;
              animation-timing-function: ease-in;
              animation-iteration-count: 1;
              animation-fill-mode: forwards;
            }
            @keyframes wr-fall {
              0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              100% { transform: translateY(105vh) rotate(720deg); opacity: 0.9; }
            }
            .wr-gift {
              animation: wr-float 2.4s ease-in-out infinite;
              filter: drop-shadow(0 10px 18px rgba(0,0,0,0.25));
            }
            @keyframes wr-float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-8px); }
            }
            .wr-spark {
              position: absolute;
              font-size: 18px;
              animation: wr-twinkle 1.6s ease-in-out infinite;
            }
            @keyframes wr-twinkle {
              0%, 100% { transform: scale(0.7); opacity: 0.5; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pre-computed confetti config (colours from the brand palette + gold).
const COLORS = ["#9810FA", "#E60076", "#F59E0B", "#22C55E", "#3B82F6", "#EC4899"];
const CONFETTI = Array.from({ length: 34 }).map((_, i) => {
  // Deterministic pseudo-spread so it looks scattered but stable per render.
  const seed = (i * 9301 + 49297) % 233280;
  const rnd = seed / 233280;
  const rnd2 = ((i * 4523 + 7919) % 100) / 100;
  return {
    left: Math.round(rnd * 100),
    color: COLORS[i % COLORS.length],
    size: 7 + Math.round(rnd2 * 7),
    delay: +(rnd2 * 1.2).toFixed(2),
    dur: +(2.4 + rnd * 1.8).toFixed(2),
    round: i % 3 === 0,
  };
});
