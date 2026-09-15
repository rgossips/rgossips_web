import { BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";

// The Elite verified badge — one of the three Elite discovery perks.
// Render it off the server's `is_elite` flag (list-influencers,
// public-media-kit), never off a plan string read on the client: the flag
// is already date-aware, so a lapsed Elite stops showing it on its own.
export default function EliteBadge({ size = "sm", className = "" }) {
  const t = useTranslations("EliteBadge");
  const big = size === "md";
  return (
    <span
      title={t("title")}
      className={`inline-flex items-center gap-1 shrink-0 rounded-full font-black uppercase tracking-wide text-white bg-gradient-to-r from-[#F59E0B] via-[#E1306C] to-[#833AB4] ${
        big ? "px-2.5 py-1 text-[11px]" : "px-1.5 py-0.5 text-[9px]"
      } ${className}`}
    >
      <BadgeCheck size={big ? 14 : 11} strokeWidth={2.5} />
      {t("label")}
    </span>
  );
}
