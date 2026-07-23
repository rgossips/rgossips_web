"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Compact client-side pager shared by the influencer campaign + brand lists
// (30 per page). Windows the page numbers so 20 pages don't spill: always
// shows first/last with ellipses around the current neighbourhood.
export default function ListPagination({ page, pageCount, onPage }) {
  const t = useTranslations("Pagination");
  if (pageCount <= 1) return null;

  const nums = [];
  for (let i = 1; i <= pageCount; i++) {
    if (i === 1 || i === pageCount || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }

  const btn =
    "min-w-9 h-9 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className={`${btn} bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 flex items-center gap-1`}
      >
        <ChevronLeft size={14} /> {t("prev")}
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="px-1 text-slate-300 font-bold">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`${btn} ${
              n === page
                ? "text-white shadow-md shadow-pink-100"
                : "bg-white border border-slate-100 text-slate-500 hover:bg-slate-50"
            }`}
            style={n === page ? { background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" } : undefined}
          >
            {n}
          </button>
        )
      )}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount}
        className={`${btn} bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 flex items-center gap-1`}
      >
        {t("next")} <ChevronRight size={14} />
      </button>
    </div>
  );
}
