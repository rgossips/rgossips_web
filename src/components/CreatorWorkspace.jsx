"use client";

import React, { useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  Check,
  ChevronRight,
  Type,
  Hash,
  FileText,
  BarChart3,
  Zap,
  ClipboardCheck,
  Search,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const tools = [
  { title: "Captions", icon: <Type size={16} className="text-orange-500" />, active: true },
  { title: "Hashtags", icon: <Hash size={16} className="text-blue-500" /> },
  { title: "Scripts", icon: <FileText size={16} className="text-amber-500" /> },
  { title: "Rate Card", icon: <BarChart3 size={16} className="text-emerald-500" /> },
  { title: "Hook Ideas", icon: <Zap size={16} className="text-rose-500" /> },
  { title: "Brief Helper", icon: <ClipboardCheck size={16} className="text-indigo-500" /> },
];

export default function CreatorWorkspace() {
  const { profile } = useAuth();
  const router = useRouter();
  const scrollRef = useRef(null);

  const hasInstagram = !!profile?.instagram_handle;

  const steps = [
    { id: 1, title: "Create account", completed: true },
    {
      id: 2,
      title: "Connect Instagram",
      completed: hasInstagram,
      active: !hasInstagram,
    },
    {
      id: 3,
      title: "AI Media Kit",
      completed: false,
      active: hasInstagram,
    },
    { id: 4, title: "Set rate card", completed: false },
    { id: 5, title: "First campaign", completed: false },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <section className="w-full px-4 lg:px-10 lg:max-w-[1480px] lg:mx-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Creator Workspace
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tools and tasks to grow your career
          </p>
        </div>
        <button
          onClick={() => router.push("/influencer/profile")}
          className="text-xs font-semibold text-pink-500 flex items-center gap-1"
        >
          See all <ChevronRight size={14} />
        </button>
      </div>

      {/* Horizontal Scrollable Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Card 1: Onboarding */}
        <Card className="min-w-[280px] lg:min-w-0 lg:flex-1 snap-start p-5 rounded-2xl border border-slate-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Onboarding</h3>
            <span className="text-xs font-semibold text-slate-400">
              {completedCount}/5
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden mb-4">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#9810fa] to-[#e60076]"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2.5">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                {step.completed ? (
                  <div className="w-6 h-6 rounded-full bg-linear-to-br from-[#9810fa] to-[#e60076] flex items-center justify-center">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      step.active
                        ? "border-[#9810fa] text-[#9810fa]"
                        : "border-slate-200 text-slate-400"
                    }`}
                  >
                    {step.id}
                  </div>
                )}
                <span
                  className={`text-sm ${
                    step.completed
                      ? "text-slate-400 line-through"
                      : step.active
                      ? "text-slate-800 font-semibold"
                      : "text-slate-500"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2: Creator Tools */}
        <Card className="min-w-[280px] lg:min-w-0 lg:flex-1 snap-start p-5 rounded-2xl border border-slate-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">
              Creator Tools
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              AI Powered
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {tools.map((tool, i) => (
              <button
                key={i}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-colors ${
                  tool.active
                    ? "bg-orange-50 border border-orange-100"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="p-2 rounded-lg bg-white shadow-sm">
                  {tool.icon}
                </div>
                <span className="text-[11px] font-semibold text-slate-700">
                  {tool.title}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Card 3: Discover / Browse Matches */}
        <Card className="min-w-[280px] lg:min-w-0 lg:flex-1 snap-start p-5 rounded-2xl border border-slate-200 bg-white shadow-sm shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Discover</h3>
            <Sparkles size={16} className="text-purple-500" />
          </div>

          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Find brands and campaigns that match your niche and audience.
          </p>

          {/* Quick Stats */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-purple-700">142</p>
              <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide">
                Brands
              </p>
            </div>
            <div className="flex-1 bg-pink-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-pink-700">38</p>
              <p className="text-[10px] font-semibold text-pink-500 uppercase tracking-wide">
                Campaigns
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/influencer/discover")}
            className="w-full py-3 rounded-xl bg-linear-to-r from-[#9810fa] to-[#e60076] text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Search size={16} />
            Browse Matches
          </button>
        </Card>
      </div>
    </section>
  );
}
