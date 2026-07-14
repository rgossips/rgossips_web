"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import {
  DollarSign,
  Activity,
  ArrowUpRight,
  Target,
  Building2,
  Wallet,
  ArrowRight,
} from "lucide-react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Badge } from "./ui/badge";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Filler,
);

function createGradient(ctx, area, color) {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  return gradient;
}

export default function PerformanceDashboard() {
  const t = useTranslations("PerformanceDashboard");

  const miniChartData = {
    labels: ["1", "2", "3", "4", "5", "6", "7"],
    datasets: [
      {
        data: [3, 4, 3.8, 6, 5.8, 8.5, 11],
        borderColor: "#6366F1",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return createGradient(ctx, chartArea, "rgba(99, 102, 241, 0.4)");
        },
      },
    ],
  };

  const earningsData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [12000, 18000, 15000, 24000, 22000, 30000, 28000],
        borderColor: "#EC4899",
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.45,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          return createGradient(ctx, chartArea, "rgba(236, 72, 153, 0.4)");
        },
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  return (
    <section className="w-full px-4 lg:px-10 py-6 lg:py-10 bg-[#F7F7FB]">
      <div className="max-w-[1440px] mx-auto space-y-4 lg:space-y-6">
      {/* TOP PERFORMANCE CARD */}
      <Card className="rounded-3xl p-5 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center bg-white border shadow-sm lg:h-80 gap-4 lg:gap-0">
        <div className="w-full lg:max-w-[50%] space-y-3 lg:space-y-4">
          <div className="flex items-center gap-2 text-[10px] lg:text-xs text-slate-500 font-semibold">
            <span className="text-indigo-500">✦</span>
            {t("planThisMonth")}
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold">
            <span className="text-4xl lg:text-7xl">26x</span>{" "}
            <span className="text-green-600">{t("return")}</span>
          </h1>
          <p className="text-sm lg:text-lg text-slate-500">
            {t.rich("planPerformance", {
              b: (chunks) => (
                <span className="font-bold text-slate-700">{chunks}</span>
              ),
            })}
          </p>
          <div className="inline-flex items-center font-semibold gap-1.5 bg-green-100 text-green-700 text-[10px] lg:text-xs px-3 py-1.5 rounded-full">
            <ArrowUpRight size={12} /> {t("growthBadge")}
          </div>
        </div>

        {/* BLUE MINI CHART */}
        <div className="w-full lg:flex-1 h-36 lg:h-full bg-slate-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {t("trajectory")}
            </p>
            <Badge className="bg-blue-100 text-blue-600 text-[9px] lg:text-[10px] border-0">
              {t("thirtyDays")}
            </Badge>
          </div>
          <div className="w-full flex-1 min-h-0">
            <Line
              data={miniChartData}
              options={{
                ...commonOptions,
                scales: { x: { display: false }, y: { display: false } },
              }}
            />
          </div>
        </div>
      </Card>

      {/* METRIC ROWS (mobile) / GRID (desktop) */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-3 lg:gap-6">
        <MetricRow
          icon={<DollarSign size={16} className="text-green-600" />}
          iconBg="bg-green-50"
          title={t("metrics.earnings")}
          value="₹18,500"
          growth="+12%"
          positive
        />
        <MetricRow
          icon={<Target size={16} className="text-orange-500" />}
          iconBg="bg-orange-50"
          title={t("metrics.campaigns")}
          value="4"
        />
        <MetricRow
          icon={<Building2 size={16} className="text-indigo-500" />}
          iconBg="bg-indigo-50"
          title={t("metrics.brands")}
          value="12"
        />
        <MetricRow
          icon={<Activity size={16} className="text-pink-600" />}
          iconBg="bg-pink-50"
          title={t("metrics.avgEngagement")}
          value="8.5%"
          growth="+1.2%"
          positive
        />
      </div>

      {/* AVAILABLE BALANCE — mobile: appears here, desktop: moves into right column */}
      <Card className="rounded-3xl p-5 lg:p-6 text-white bg-slate-900 shadow-lg lg:hidden">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={14} className="opacity-60" />
          <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
            {t("availableBalance")}
          </p>
        </div>
        <h2 className="text-3xl font-bold mt-1">₹1,50,000</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">{t("readyForWithdrawal")}</p>
        <button className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 transition-colors font-bold text-sm flex items-center justify-center gap-2">
          {t("withdrawFunds")} <ArrowRight size={16} />
        </button>
      </Card>

      {/* BOTTOM TWO-COLUMN LAYOUT (desktop) */}
      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 lg:gap-6">
        {/* EARNINGS CHART — left column */}
        <Card className="w-full rounded-3xl p-4 lg:p-6 border bg-white flex flex-col h-[300px] lg:h-auto lg:col-span-3">
          <div className="flex justify-between items-start mb-3 lg:mb-4">
            <div>
              <h3 className="font-bold text-base lg:text-lg">{t("earningsOverview")}</h3>
              <p className="text-[11px] lg:text-xs text-slate-400">
                {t("revenueSubtitle")}
              </p>
            </div>
            <div className="hidden lg:flex gap-2">
              <button className="text-xs px-3 py-1 rounded-lg bg-slate-100 text-slate-500">
                {t("week")}
              </button>
              <button className="text-xs px-3 py-1 rounded-lg bg-slate-900 text-white">
                {t("month")}
              </button>
            </div>
          </div>
          <div className="w-full flex-1 min-h-0">
            <Line
              data={earningsData}
              options={{
                ...commonOptions,
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                  },
                  y: {
                    grid: { color: "#f1f1f1" },
                    ticks: {
                      callback: (v) => `₹${v / 1000}k`,
                      font: { size: 10 },
                    },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* RIGHT COLUMN — desktop only: balance + today actions */}
        <div className="hidden lg:flex flex-col gap-6 lg:col-span-2">
          {/* AVAILABLE BALANCE (desktop) */}
          <Card className="rounded-3xl p-6 text-white bg-slate-900 shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={14} className="opacity-60" />
              <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                {t("availableBalance")}
              </p>
            </div>
            <h2 className="text-4xl font-bold mt-1">₹1,50,000</h2>
            <p className="text-xs text-slate-400 mt-1 mb-4">{t("readyForWithdrawal")}</p>
            <button className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 transition-colors font-bold text-sm flex items-center justify-center gap-2">
              {t("withdrawFunds")} <ArrowRight size={16} />
            </button>
          </Card>

          {/* TODAY ACTIONS (desktop) */}
          <Card className="p-6 rounded-3xl border bg-white flex-1">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <p className="font-bold text-base">{t("today")}</p>
                <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {t("actionsCount", { count: 3 })}
                </span>
              </div>
              <span className="text-xs text-slate-400">Mar 1</span>
            </div>
            <div className="space-y-4">
              <ActionItem title={t("actions.submitBoatReel")} sub={t("actions.overdueDay")} alert actionLabel={t("actions.upload")} />
              <ActionItem title={t("actions.replyMamaearth")} sub={t("actions.briefClarification")} actionLabel={t("actions.reply")} />
              <ActionItem title={t("actions.sugarCosmetics")} sub={t("actions.postScheduled")} actionLabel={t("actions.viewBrief")} />
            </div>
          </Card>
        </div>
      </div>

      {/* TODAY ACTIONS — mobile only */}
      <Card className="p-5 rounded-3xl border bg-white lg:hidden">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <p className="font-bold text-base">{t("today")}</p>
            <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {t("actionsCount", { count: 3 })}
            </span>
          </div>
          <span className="text-xs text-slate-400">Mar 1</span>
        </div>
        <div className="space-y-4">
          <ActionItem title={t("actions.submitBoatReel")} sub={t("actions.overdueDay")} alert actionLabel={t("actions.upload")} />
          <ActionItem title={t("actions.replyMamaearth")} sub={t("actions.briefClarification")} actionLabel={t("actions.reply")} />
          <ActionItem title={t("actions.sugarCosmetics")} sub={t("actions.postScheduled")} actionLabel={t("actions.viewBrief")} />
        </div>
      </Card>
      </div>
    </section>
  );
}

function MetricRow({ icon, iconBg = "bg-slate-50", title, value, growth, positive }) {
  return (
    <Card className="p-4 lg:p-5 rounded-2xl border bg-white">
      {/* Mobile: horizontal row | Desktop: stacked card */}
      <div className="flex lg:flex-col items-center lg:items-start gap-3 lg:gap-2">
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>{icon}</div>
        <div className="flex lg:flex-col items-center lg:items-start gap-1 lg:gap-0 flex-1">
          <p className="text-[10px] lg:text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            {title}
          </p>
          <p className="text-xl lg:text-2xl font-bold text-slate-800 lg:mt-0.5">
            {value}
          </p>
        </div>
        {growth && (
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${
              positive
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {growth}
          </span>
        )}
      </div>
    </Card>
  );
}

function ActionItem({ title, sub, alert, actionLabel }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full shrink-0 ${
            alert ? "bg-red-500" : "bg-slate-300"
          }`}
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-[11px] text-slate-400">{sub}</span>
        </div>
      </div>
      <button
        className={`px-4 py-1.5 rounded-full text-[10px] font-bold shrink-0 ${
          alert
            ? "bg-red-500 text-white"
            : "border border-slate-200 text-slate-600"
        }`}
      >
        {actionLabel}
      </button>
    </div>
  );
}
