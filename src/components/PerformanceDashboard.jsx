"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { DollarSign, Users, Eye, Activity, ArrowUpRight } from "lucide-react";
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

// This helper function ensures the gradient is created exactly when the chart needs it
function createGradient(ctx, area, color) {
  const gradient = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  gradient.addColorStop(0, color); // Full color at top
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Fade to transparent
  return gradient;
}

export default function PerformanceDashboard() {
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
        // The magic part: Chart.js passes 'chart' context here automatically
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
    maintainAspectRatio: false, // Forces chart to fill its parent <div>
    plugins: { legend: { display: false } },
  };

  return (
    <section className="w-full px-10 py-10 bg-[#F7F7FB] space-y-6">
      {/* TOP PERFORMANCE CARD */}
      <Card className="rounded-3xl p-8 flex flex-row items-center bg-white border shadow-sm h-[320px]">
        <div className="w-full max-w-[50%] space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
            YOUR PLAN THIS MONTH
          </div>
          <h1 className="text-5xl font-bold">
            <span className="text-7xl">26x</span>{" "}
            <span className="text-green-600">Return</span>
          </h1>
          <p className="text-lg font-semibold text-slate-500">
            Excellent performance on your{" "}
            <span className="font-bold text-slate-700">₹699</span> Pro plan.
          </p>
          <div className="inline-flex items-center font-semibold gap-2 bg-green-200 text-green-700 text-xs px-4 py-1.5 rounded-full">
            <ArrowUpRight size={14} /> +340% growth compared to last month
          </div>
        </div>

        {/* BLUE MINI CHART - Fixed full-width container */}
        <div className="flex-1 h-full bg-slate-50 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              Growth Trajectory
            </p>
            <Badge className="bg-blue-200 text-blue-700 text-[10px]">
              Last 30 days
            </Badge>
          </div>
          <div className="w-full flex-1">
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

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          icon={<DollarSign size={18} className="text-green-600" />}
          title="Total Earnings"
          value="₹2,00,000"
          growth="+12.5%"
          positive
        />
        <MetricCard
          icon={<Users size={18} className="text-blue-600" />}
          title="Total Followers"
          value="5.2M"
          growth="+5.2%"
          positive
        />
        <MetricCard
          icon={<Eye size={18} className="text-purple-600" />}
          title="Profile Views"
          value="15.4K"
          growth="-2.1%"
        />
        <MetricCard
          icon={<Activity size={18} className="text-pink-600" />}
          title="Avg Engagement"
          value="8.5%"
          growth="+1.2%"
          positive
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* PINK EARNINGS OVERVIEW */}
        <Card className="col-span-8 rounded-3xl p-6 border bg-white flex flex-col h-[400px]">
          <div className="mb-4">
            <h3 className="font-semibold text-lg">Earnings Overview</h3>
            <p className="text-xs text-slate-400">
              Your revenue growth over time
            </p>
          </div>
          <div className="w-full flex-1">
            <Line
              data={earningsData}
              options={{
                ...commonOptions,
                scales: {
                  x: { grid: { display: false } },
                  y: {
                    grid: { color: "#f1f1f1" },
                    ticks: { callback: (v) => `₹${v / 1000}k` },
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* SIDEBAR */}
        <div className="col-span-4 space-y-6">
          <Card className="p-6 rounded-3xl text-white bg-slate-900 shadow-lg h-[180px] flex flex-col justify-between">
            <div>
              <p className="text-[10px] uppercase opacity-60">
                Available Balance
              </p>
              <h2 className="text-3xl font-bold mt-1">₹1,50,000</h2>
            </div>
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 font-bold text-sm">
              Withdraw Funds →
            </button>
          </Card>

          <Card className="p-6 rounded-3xl border bg-white h-[195px]">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold text-sm">Today</p>
              <span className="bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                3 ACTIONS
              </span>
            </div>
            <div className="space-y-4">
              <ActionItem title="Submit BoAt Reel" sub="overdue" alert />
              <ActionItem
                title="Reply to Mamaearth"
                sub="brief clarification"
              />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ icon, title, value, growth, positive }) {
  return (
    <Card className="p-5 rounded-2xl border bg-white flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
          {icon}
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full ${positive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
        >
          {growth}
        </span>
      </div>
      <div>
        <p className="text-[11px] text-slate-400 font-medium mb-0.5">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </Card>
  );
}

function ActionItem({ title, sub, alert }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-700">{title}</span>
        <span className="text-[10px] text-slate-400">{sub}</span>
      </div>
      <button
        className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${alert ? "bg-red-500 text-white" : "border border-slate-200 text-slate-600"}`}
      >
        {alert ? "Upload" : "Reply"}
      </button>
    </div>
  );
}
