import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Eye,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PerformanceDashboard() {
  return (
    <div className="w-full px-10 space-y-6">
      {/* SECTION: Plan ROI */}
      <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 rounded-[32px] overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={80} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">
          Your Plan This Month
        </p>
        <div className="flex items-baseline gap-2 mb-6">
          <h2 className="text-5xl font-black text-indigo-600">26x</h2>
          <p className="text-slate-600 font-medium">
            return on your ₹699 Pro plan
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <span className="p-1 rounded bg-amber-100 text-amber-600 font-bold">
                ₹
              </span>{" "}
              Earned
            </div>
            <p className="text-lg font-bold text-slate-900">₹18,500</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <Target size={14} className="text-rose-500" /> Campaigns
            </div>
            <p className="text-lg font-bold text-slate-900">4 landed</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
              <Eye size={14} className="text-blue-500" /> Views
            </div>
            <p className="text-lg font-bold text-slate-900">12 brand</p>
          </div>
        </div>
      </Card>

      {/* SECTION: Today's Tasks */}
      <Card className="p-6 bg-white border-slate-100 rounded-[32px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Today</h3>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full uppercase">
              3 actions
            </span>
          </div>
          <p className="text-xs font-medium text-slate-400">Mar 1</p>
        </div>

        <div className="space-y-1">
          <TaskRow
            label="Submit BoAt Reel"
            sub="overdue by 1 day"
            color="bg-rose-500"
            btnText="Upload"
            variant="destructive"
          />
          <TaskRow
            label="Reply to Mamaearth"
            sub="brief clarification"
            color="bg-amber-400"
            btnText="Reply"
          />
          <TaskRow
            label="Sugar Cosmetics"
            sub="shoot scheduled tomorrow"
            color="bg-blue-500"
            btnText="View Brief"
            isLast
          />
        </div>
      </Card>

      {/* SECTION: Earnings */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 bg-emerald-50/50 border-emerald-100 rounded-[24px]">
          <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
            Cleared
          </p>
          <p className="text-2xl font-black text-emerald-700">₹12,500</p>
        </Card>
        <Card className="p-5 bg-amber-50/50 border-amber-100 rounded-[24px]">
          <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">
            Pending
          </p>
          <p className="text-2xl font-black text-amber-700">₹6,000</p>
        </Card>
      </div>
      <div className="w-full p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm">
          <Clock size={16} className="text-indigo-400" />
          <span>
            Next payout: <span className="font-bold">₹6,000 on Mar 3</span>
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          (in 2 days)
        </span>
      </div>
    </div>
  );
}

function TaskRow({
  label,
  sub,
  color,
  btnText,
  variant = "outline",
  isLast = false,
}) {
  return (
    <div
      className={`flex items-center justify-between py-4 ${!isLast ? "border-b border-slate-50" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
        <div>
          <p className="text-sm font-bold text-slate-800 leading-none mb-1">
            {label}
          </p>
          <p className="text-xs text-slate-400 font-medium">{sub}</p>
        </div>
      </div>
      <Button
        variant={variant}
        size="sm"
        className="rounded-xl font-bold h-8 text-xs px-4"
      >
        {btnText}
      </Button>
    </div>
  );
}
