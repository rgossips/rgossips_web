import React, { useState } from "react";
import {
  ArrowLeft,
  Eye,
  Heart,
  Users,
  DollarSign,
  ChevronDown,
  TrendingUp,
  BarChart3,
  ChevronRight,
} from "lucide-react";

// Chart.js Imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
);

const AnalyticsPage = ({ onBack, onCampaignAnalytics }) => {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Chart.js Data Configuration
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        fill: true,
        label: "Earnings",
        data: [800, 1200, 1000, 1400, 1800, 2100],
        borderColor: "#10b981",
        borderWidth: 3,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.2)");
          gradient.addColorStop(1, "rgba(16, 185, 129, 0)");
          return gradient;
        },
        tension: 0.4, // Smoothing the line
        pointRadius: 0, // Hides points for a cleaner look
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#10b981",
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1A1A1A",
        titleFont: { size: 10, weight: "bold" },
        bodyFont: { size: 12, weight: "bold" },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10, weight: "700" } },
        border: { display: false },
      },
      y: {
        display: false, // Hide Y axis for that clean "Dashboard" look
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 bg-pink-50 text-pink-500 rounded-full hover:bg-pink-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-900">Analytics</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Trending Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
              Total Performance
            </p>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 text-green-500 rounded-lg">
                <TrendingUp size={18} />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Trending Up</h2>
            </div>
          </div>

          {/* Time Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold shadow-sm"
            >
              {timeRange} <ChevronDown size={14} className="text-gray-400" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-30 overflow-hidden animate-in fade-in zoom-in duration-200">
                {[
                  "Last 7 Days",
                  "Last 30 Days",
                  "Last 90 Days",
                  "Last Year",
                ].map((range) => (
                  <button
                    key={range}
                    className={`w-full text-left px-4 py-3 text-[11px] font-bold ${timeRange === range ? "bg-pink-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                    onClick={() => {
                      setTimeRange(range);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            icon={<Eye size={20} />}
            color="bg-blue-500"
            label="Total Views"
            value="1.2M"
            trend="+12%"
          />
          <MetricCard
            icon={<Heart size={20} />}
            color="bg-pink-500"
            label="Engagement"
            value="8.5%"
            trend="+2.3%"
          />
          <MetricCard
            icon={<Users size={20} />}
            color="bg-purple-500"
            label="Followers"
            value="125K"
            trend="+5.2K"
          />
          <MetricCard
            icon={<DollarSign size={20} />}
            color="bg-green-500"
            label="Revenue"
            value="$12.4K"
            trend="+23%"
          />
        </div>

        {/* Chart.js Container */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-6 px-1">
            <h3 className="font-black text-gray-900 text-sm">
              Monthly Earnings
            </h3>
            <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-lg">
              ↗ +23%
            </span>
          </div>
          <div className="h-48 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 space-y-6">
          <h3 className="font-black text-gray-900 text-sm">
            Audience Demographics
          </h3>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              Gender Distribution
            </p>
            <ProgressBar label="Female" percentage={58} color="bg-pink-500" />
            <ProgressBar label="Male" percentage={35} color="bg-blue-500" />
            <ProgressBar label="Other" percentage={7} color="bg-purple-500" />
          </div>

          <div className="pt-4 space-y-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              Age Distribution
            </p>
            <div className="space-y-3">
              <ProgressBar
                label="18-24"
                percentage={42}
                color="bg-indigo-500"
              />
              <ProgressBar
                label="25-34"
                percentage={38}
                color="bg-indigo-400"
              />
              <ProgressBar
                label="35-44"
                percentage={15}
                color="bg-indigo-300"
              />
              <ProgressBar label="45+" percentage={5} color="bg-indigo-200" />
            </div>
          </div>
        </div>

        {/* Campaign Analytics Footer */}
        <button
          onClick={onCampaignAnalytics}
          className="w-full bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
              <BarChart3 size={20} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-black text-gray-900">
                Campaign Analytics
              </h4>
              <p className="text-[10px] text-gray-400 font-bold">
                View detailed brand reports
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </button>
      </div>
    </div>
  );
};

// Sub-components
const MetricCard = ({ icon, color, label, value, trend }) => (
  <div className="bg-white p-5 rounded-[2rem] border border-gray-50 shadow-sm space-y-3">
    <div
      className={`w-10 h-10 ${color} text-white flex items-center justify-center rounded-2xl shadow-lg`}
    >
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h4 className="text-xl font-black text-gray-900">{value}</h4>
        <span className="text-[9px] font-black text-green-500">{trend}</span>
      </div>
    </div>
  </div>
);

const ProgressBar = ({ label, percentage, color }) => (
  <div className="space-y-1 px-1">
    <div className="flex justify-between items-center text-[11px] font-bold">
      <span className="text-gray-700">{label}</span>
      <span className="text-gray-900">{percentage}%</span>
    </div>
    <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

export default AnalyticsPage;
