"use client";

// One-time welcome for a creator who has just signed up and has not applied
// to anything yet: what the free tier actually gives them, and a single door
// out of it into the campaign list.
//
// There is no trial any more, so a new creator arrives holding exactly
// FREE_BARTER_APPLICATIONS barter applications and nothing else. Without this
// they discover that by hitting a wall mid-application — this frames it as
// something they were given.
//
// Two independent suppressors, because neither alone is right:
//   * localStorage, so dismissing it makes it go away immediately; and
//   * `used === 0`, so it never appears to someone already using the product
//     (including on a second device where localStorage is empty).
// The pair means no migration and no chance of it nagging a working creator.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { PartyPopper, ArrowRight, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFreeApplications } from "@/hooks/useFreeApplications";
import { FREE_BARTER_APPLICATIONS } from "@/lib/plans";

const SEEN_KEY = (uid) => `rg_free_campaigns_welcome_v1_${uid}`;

// Read straight through rather than memoised: it is a synchronous key lookup,
// and wrapping it in useMemo only gives the React Compiler something it
// cannot preserve. Returns true ("already seen", so stay closed) whenever it
// cannot answer — on the server, before the user resolves, or with storage
// blocked and throwing.
function hasSeenWelcome(uid) {
  if (typeof window === "undefined" || !uid) return true;
  try {
    return !!localStorage.getItem(SEEN_KEY(uid));
  } catch {
    // Storage unavailable — showing it again is the harmless failure.
    return false;
  }
}

export default function FreeCampaignsWelcomeModal() {
  const t = useTranslations("FreeCampaignsWelcome");
  const router = useRouter();
  const { user, profile } = useAuth();
  const freeApps = useFreeApplications();
  const [dismissed, setDismissed] = useState(false);

  // Derived, not an effect: opening a modal by setting state from an effect
  // body costs an extra render pass and trips react-hooks/set-state-in-effect.
  //
  // Reading localStorage during render is safe here despite SSR. `open` also
  // requires `freeApps.known`, which is false until the count resolves after
  // mount — so the first client render agrees with the server (closed) and the
  // read only matters afterwards. No hydration mismatch.
  const open =
    !!user?.id &&
    !!profile &&
    !freeApps.subscribed &&
    freeApps.known &&
    freeApps.used === 0 &&
    !hasSeenWelcome(user?.id) &&
    !dismissed;

  const dismiss = (goToCampaigns) => {
    try {
      localStorage.setItem(SEEN_KEY(user.id), "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
    if (goToCampaigns) router.push("/influencer/campaigns");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          // Above the influencer BottomNav (z-100).
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.94, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() => dismiss(false)}
              aria-label={t("close")}
              className="absolute top-3 right-3 p-1.5 text-white/80 hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <div
              className="px-6 pt-8 pb-7 text-center text-white"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <PartyPopper size={30} />
              </div>
              <h2 className="mt-4 text-xl font-black leading-tight">{t("title")}</h2>
              <p className="mt-2 text-sm text-white/90 leading-relaxed">
                {t("body", { limit: FREE_BARTER_APPLICATIONS })}
              </p>
            </div>

            <div className="px-6 py-6">
              <p className="text-xs text-slate-500 leading-relaxed text-center">{t("note")}</p>
              <button
                type="button"
                onClick={() => dismiss(true)}
                className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg shadow-purple-200 cursor-pointer active:scale-[0.99] hover:brightness-110"
                style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
              >
                {t("cta")} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
