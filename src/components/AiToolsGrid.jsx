import React from "react";
import { motion } from "framer-motion";
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

const tools = [
  {
    title: "Captions",
    icon: <Type className="text-orange-500" />,
    status: "Try free →",
    active: true,
  },
  {
    title: "Hashtags",
    icon: <Hash className="text-blue-500" />,
    status: "0/50",
    active: false,
  },
  {
    title: "Scripts",
    icon: <FileText className="text-amber-500" />,
    status: "0/50",
    active: false,
  },
  {
    title: "Rate Card",
    icon: <BarChart3 className="text-emerald-500" />,
    status: "Generate",
    active: false,
  },
  {
    title: "Hook Ideas",
    icon: <Zap className="text-rose-500" />,
    status: "0/50",
    active: false,
  },
  {
    title: "Brief Helper",
    icon: <ClipboardCheck className="text-indigo-500" />,
    status: "0/50",
    active: false,
  },
];

export function AiToolsGrid() {
  return (
    <Card className="w-full max-w-2xl p-8 bg-white border-slate-100 shadow-sm rounded-[32px]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-slate-900">AI Creator Tools</h2>
        <div className="text-xs font-medium text-slate-400">
          <span className="text-slate-600">0/50 used</span> • all free
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tools.map((tool, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -4 }}
            className={`cursor-pointer p-6 rounded-3xl border transition-colors flex flex-col items-center text-center space-y-3 ${
              tool.active
                ? "bg-orange-50/50 border-orange-100 shadow-sm"
                : "bg-slate-50 border-transparent hover:border-slate-200"
            }`}
          >
            <div className={`p-3 rounded-2xl bg-white shadow-sm`}>
              {tool.icon}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {tool.title}
              </p>
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
                  tool.active ? "text-orange-600" : "text-slate-400"
                }`}
              >
                {tool.status}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
