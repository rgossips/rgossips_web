import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

// The Pro verified badge — the Pro counterpart of EliteBadge, same shape and
// sizes, cooler colours so the two read as a ladder rather than as rivals.
//
// Render it off the server's `is_pro` / `isPro` flag (list-influencers,
// public-media-kit, landing-match), never off a plan string read on the
// client: the flag is date-aware, so a lapsed Pro stops showing it on its
// own. The two flags are mutually exclusive server-side — a creator holds
// one plan — so a surface can render both badges without choosing.
export default function ProBadge({ size = "sm", className = "" }) {
  const t = useTranslations("ProBadge");
  const big = size === "md";
  return (
    <span
      title={t("title")}
      className={`inline-flex items-center gap-1 shrink-0 rounded-full font-black uppercase tracking-wide text-white bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#0EA5E9] ${
        big ? "px-2.5 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9px]"
      } ${className}`}
    >
      <BadgeCheck size={big ? 14 : 11} strokeWidth={2.5} />
      {t("label")}
    </span>
  );
}
