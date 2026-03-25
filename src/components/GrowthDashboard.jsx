import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Users, Eye, Mail, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

export function GrowthDashboard() {
  return (
    <div className="w-full px-4 lg:px-10 space-y-8">
      {/* SECTION: Stats Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-6 px-2">
          Your Growth
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <StatBox
            label="Engagement Rate"
            value="4.2%"
            trend="+ 0.3%"
            icon={<Users size={14} />}
          />
          <StatBox
            label="Profile Views"
            value="142"
            trend="+ 23% this week"
            icon={<Eye size={14} />}
          />
          <StatBox
            label="Brand Invites"
            value="6"
            trend="+ 2 vs last month"
            icon={<Mail size={14} />}
          />
          <StatBox
            label="Avg. Deal Size"
            value="₹9.2K"
            trend="+ ₹1.1K"
            icon={<DollarSign size={14} />}
          />
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ brand, type, time, pay, match, spots }) {
  return (
    <Card className="p-6 bg-white border-slate-100 hover:shadow-lg transition-shadow rounded-[28px] group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-50 flex items-center justify-center font-bold text-slate-300">
            {brand[0]}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{brand}</h4>
            <p className="text-xs text-slate-400 font-medium">
              {type} · {time}
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg">
          {match} MATCH
        </span>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-2xl font-black text-indigo-600">{pay}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">
            {spots}
          </p>
        </div>
        <button className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all group-hover:scale-105">
          Quick Apply →
        </button>
      </div>
    </Card>
  );
}

function StatBox({ label, value, trend, icon }) {
  return (
    <Card className="p-5 bg-white border-slate-100 rounded-[24px]">
      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-3">
        <span className="text-slate-300">{icon}</span> {label}
      </div>
      <p className="text-2xl font-black text-slate-900 mb-1">{value}</p>
      <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
        <ArrowUpRight size={12} /> {trend}
      </p>
    </Card>
  );
}
