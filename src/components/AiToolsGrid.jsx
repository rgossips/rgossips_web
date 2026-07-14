import React from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  Type,
  Hash,
  FileText,
  BarChart3,
  Zap,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// `titleKey` → AiToolsGrid.tools.<key>; `statusKey` → AiToolsGrid.<key> when
// present, else the literal `status` (a usage count that isn't translated).
const tools = [
  { titleKey: "captions", icon: <Type className="text-orange-500" />, statusKey: "tryFree", active: true },
  { titleKey: "hashtags", icon: <Hash className="text-blue-500" />, status: "0/50", active: false },
  { titleKey: "scripts", icon: <FileText className="text-amber-500" />, status: "0/50", active: false },
  { titleKey: "rateCard", icon: <BarChart3 className="text-emerald-500" />, statusKey: "generate", active: false },
  { titleKey: "hookIdeas", icon: <Zap className="text-rose-500" />, status: "0/50", active: false },
  { titleKey: "briefHelper", icon: <ClipboardCheck className="text-indigo-500" />, status: "0/50", active: false },
];

export function AiToolsGrid() {
  const t = useTranslations("AiToolsGrid");
  return (
    <Card className="w-full h-full max-w-2xl p-5 lg:p-8 bg-white border-slate-200 shadow-sm rounded-3xl relative group/card">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] rounded-3xl flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl">
          <p className="text-sm font-black tracking-wide uppercase">{t("comingSoon")}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-slate-900">{t("title")}</h2>
        <div className="text-xs font-medium text-slate-400">
          {t.rich("usage", { b: (c) => <span className="text-slate-600">{c}</span> })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {tools.map((tool, index) => (
          <motion.div
            key={index}
            className={`p-6 rounded-3xl border transition-colors flex flex-col items-center text-center space-y-3 ${
              tool.active
                ? "bg-orange-50/50 border-orange-100 shadow-sm"
                : "bg-slate-50 border-transparent"
            }`}
          >
            <div className={`p-3 rounded-2xl bg-white shadow-sm`}>
              {tool.icon}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {t(`tools.${tool.titleKey}`)}
              </p>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                  tool.active ? "text-orange-600" : "text-slate-400"
                }`}
              >
                {tool.statusKey ? t(tool.statusKey) : tool.status}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
