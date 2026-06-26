import React from "react";
import { ArrowLeft, Target, Activity, Eye, DollarSign } from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const DetailedCampaignAnalytics = ({ onBack }) => {
  const barData = {
    labels: ["Nike Summer", "Spotify", "Sephora", "Disney", "Netflix"],
    datasets: [
      {
        data: [2000, 1500, 2500, 1100, 1800],
        backgroundColor: "#ff2d55",
        borderRadius: 8,
        barThickness: 35,
      },
    ],
  };

  const doughnutData = {
    labels: ["Instagram", "TikTok", "YouTube", "Other"],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: ["#ff2d55", "#8b5cf6", "#ef4444", "#64748b"],
        borderWidth: 0,
        cutout: "65%",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans lg:pt-24">
      {/* Header */}
      <div className="sticky top-0 bg-white lg:bg-gray-50  z-20 px-6 lg:px-40 py-4 lg:px-8 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 cursor-pointer bg-pink-50 text-pink-500 rounded-2xl active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <div>
          <h1 className="text-lg lg:text-2xl font-black text-gray-900 tracking-tight">
            Campaign Analytics
          </h1>
          <p className="hidden lg:block text-xs text-gray-400 font-bold">
            Detailed analytics and performance metrics for all campaigns
          </p>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8 max-w-7xl mx-auto px-8 py-8">
        {/* Total Campaigns Banner */}
        {/* <div className="col-span-12 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">
            All Campaigns
          </p>
          <h2 className="text-2xl font-black text-gray-900">12 Total</h2>
        </div> */}

        {/* Stats Grid - 4 columns */}
        <div className="col-span-12 grid grid-cols-4 gap-4">
          <StatMiniCard
            icon={<Target size={16} />}
            label="Total Campaigns"
            value="12"
            trend="+3 this month"
            iconBg="bg-pink-500"
            trendColor="text-pink-500"
          />
          <StatMiniCard
            icon={<Activity size={16} />}
            label="Active"
            value="5"
            trend="In progress"
            iconBg="bg-emerald-400"
            trendColor="text-emerald-400"
          />
          <StatMiniCard
            icon={<Eye size={16} />}
            label="Total Views"
            value="850K"
            trend="+15%"
            iconBg="bg-violet-500"
            trendColor="text-pink-500"
          />
          <StatMiniCard
            icon={<DollarSign size={16} />}
            label="Total Earnings"
            value="$24.5K"
            trend="+20%"
            iconBg="bg-pink-500"
            trendColor="text-pink-500"
          />
        </div>

        {/* Campaign Performance Bar Chart - Full Width */}
        <div className="col-span-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 text-sm mb-6">
            Campaign Performance
          </h3>
          <div className="h-64">
            <Bar
              data={{
                ...barData,
                datasets: [
                  {
                    ...barData.datasets[0],
                    backgroundColor: "#EC4899",
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      font: { size: 10, weight: "bold", family: "inherit" },
                      color: "#EC4899",
                    },
                  },
                  y: { display: false },
                },
              }}
            />
          </div>
        </div>

        {/* Platform Distribution and Performance by Category - Side by side */}
        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 text-sm mb-6 text-center">
            Platform Distribution
          </h3>
          <div className="h-56 relative flex justify-center">
            <Doughnut
              data={{
                ...doughnutData,
                datasets: [
                  {
                    ...doughnutData.datasets[0],
                    backgroundColor: [
                      "#EC4899",
                      "#8b5cf6",
                      "#ef4444",
                      "#64748b",
                    ],
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      font: { size: 10, weight: "bold" },
                      color: "#1F2937",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="col-span-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-gray-900 text-sm">
            Performance by Category
          </h3>
          <CategoryProgress
            label="Fashion"
            count="4 campaigns"
            value="$90,500"
            progress="w-[90%]"
            color="bg-pink-500"
          />
          <CategoryProgress
            label="Beauty"
            count="3 campaigns"
            value="$35,200"
            progress="w-[60%]"
            color="bg-pink-500"
          />
          <CategoryProgress
            label="Tech"
            count="2 campaigns"
            value="$65,300"
            progress="w-[75%]"
            color="bg-pink-500"
          />
          <CategoryProgress
            label="Lifestyle"
            count="3 campaigns"
            value="$54,100"
            progress="w-[65%]"
            color="bg-pink-500"
          />
        </div>

        {/* Recent Campaigns Table Format */}
        <div className="col-span-12">
          <h3 className="font-black text-gray-900 text-sm mb-4 px-2">
            Recent Campaigns
          </h3>
          {/* overflow-x-auto so the table scrolls horizontally on
              narrow viewports instead of being clipped by the parent's
              overflow-hidden — was cutting off the rightmost columns
              on mobile with no way to reach them. */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 font-black text-gray-400 text-[11px] uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="text-left px-6 py-4 font-black text-gray-400 text-[11px] uppercase tracking-wider">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 font-black text-gray-400 text-[11px] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-6 py-4 font-black text-gray-400 text-[11px] uppercase tracking-wider">
                    Views
                  </th>
                  <th className="text-center px-6 py-4 font-black text-gray-400 text-[11px] uppercase tracking-wider">
                    Engagement
                  </th>
                  <th className="text-right px-6 py-4 font-black text-gray-400 text-[11px] uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                <CampaignTableRow
                  title="Nike Summer Launch"
                  date="Jan 10 - Jan 31"
                  status="Completed"
                  views="45K"
                  engagement="12.5%"
                  revenue="$2,500"
                  badgeColor="bg-blue-100 text-blue-500"
                />
                <CampaignTableRow
                  title="Spotify Playlist Series"
                  date="Jan 15 - Feb 5"
                  status="Active"
                  views="11K"
                  engagement="8.8%"
                  revenue="$1,800"
                  badgeColor="bg-emerald-100 text-emerald-500"
                />
                <CampaignTableRow
                  title="Sephora Tutorial"
                  date="Feb 1 - Feb 10"
                  status="Active"
                  views="8K"
                  engagement="7.2%"
                  revenue="$1,200"
                  badgeColor="bg-emerald-100 text-emerald-500"
                />
              </tbody>
            </table>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden p-5 space-y-6">
        {/* Total Campaigns Banner */}
        {/* <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">
            All Campaigns
          </p>
          <h2 className="text-2xl font-black text-gray-900">12 Total</h2>
        </div> */}

        {/* 4-Grid Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatMiniCard
            icon={<Target size={16} />}
            label="Total Campaigns"
            value="12"
            trend="+3 this month"
            iconBg="bg-pink-500"
            trendColor="text-pink-500"
          />
          <StatMiniCard
            icon={<Activity size={16} />}
            label="Active"
            value="5"
            trend="In progress"
            iconBg="bg-emerald-400"
            trendColor="text-emerald-400"
          />
          <StatMiniCard
            icon={<Eye size={16} />}
            label="Total Views"
            value="850K"
            trend="+15%"
            iconBg="bg-violet-500"
            trendColor="text-pink-500"
          />
          <StatMiniCard
            icon={<DollarSign size={16} />}
            label="Total Earnings"
            value="$24.5K"
            trend="+20%"
            iconBg="bg-pink-500"
            trendColor="text-pink-500"
          />
        </div>

        {/* Campaign Performance Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 text-[13px] mb-6">
            Campaign Performance
          </h3>
          <div className="h-52">
            <Bar
              data={{
                ...barData,
                datasets: [
                  {
                    ...barData.datasets[0],
                    backgroundColor: "#EC4899", // pink-500
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      font: { size: 10, weight: "bold", family: "inherit" },
                      color: "#EC4899",
                    },
                  },
                  y: { display: false },
                },
              }}
            />
          </div>
        </div>

        {/* Platform Distribution Doughnut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-900 text-[13px] mb-6 text-center">
            Platform Distribution
          </h3>
          <div className="h-48 relative flex justify-center">
            <Doughnut
              data={{
                ...doughnutData,
                datasets: [
                  {
                    ...doughnutData.datasets[0],
                    backgroundColor: [
                      "#EC4899",
                      "#8b5cf6",
                      "#ef4444",
                      "#64748b",
                    ],
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      font: { size: 11, weight: "bold" },
                      color: "#EC4899",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Missing Element: Performance by Category */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
          <h3 className="font-black text-gray-900 text-[13px]">
            Performance by Category
          </h3>
          <CategoryProgress
            label="Fashion"
            count="4 campaigns"
            value="$90,500"
            progress="w-[90%]"
            color="bg-pink-500"
          />
          <CategoryProgress
            label="Beauty"
            count="3 campaigns"
            value="$35,200"
            progress="w-[60%]"
            color="bg-pink-500"
          />
          <CategoryProgress
            label="Tech"
            count="2 campaigns"
            value="$65,300"
            progress="w-[75%]"
            color="bg-pink-500"
          />
          <CategoryProgress
            label="Lifestyle"
            count="3 campaigns"
            value="$54,100"
            progress="w-[65%]"
            color="bg-pink-500"
          />
        </div>

        {/* Recent Campaigns with Full Metadata */}
        <div className="space-y-4">
          <h3 className="font-black text-gray-900 text-[13px] px-2">
            Recent Campaigns
          </h3>
          <CampaignItem
            title="Nike Summer Launch"
            date="Jan 10 - Jan 31"
            status="Completed"
            views="45K"
            engagement="12.5%"
            revenue="$2,500"
            badgeColor="bg-blue-100 text-blue-500 border-blue-200"
          />
          <CampaignItem
            title="Spotify Playlist Series"
            date="Jan 15 - Feb 5"
            status="Active"
            views="11K"
            engagement="8.8%"
            revenue="$1,800"
            badgeColor="bg-emerald-100 text-emerald-500 border-emerald-200"
          />
          <CampaignItem
            title="Sephora Tutorial"
            date="Feb 1 - Feb 10"
            status="Active"
            views="8K"
            engagement="7.2%"
            revenue="$1,200"
            badgeColor="bg-emerald-100 text-emerald-500 border-emerald-200"
          />
        </div>
      </div>
    </div>
  );
};

/* Sub-components updated with design specific styling */
const StatMiniCard = ({ icon, label, value, trend, iconBg, trendColor }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3 flex items-center gap-3">
    <div
      className={`w-10 h-10 ${iconBg} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-pink-100`}
    >
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter leading-none mb-1">
        {label}
      </p>
      <h4 className="text-xl font-black text-gray-900 leading-none">{value}</h4>
      <p className={`text-[9px] font-bold mt-1 ${trendColor}`}>{trend}</p>
    </div>
  </div>
);

const CategoryProgress = ({ label, count, value, progress, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end">
      <div>
        <p className="text-[11px] font-black text-gray-900 leading-none">
          {label}
        </p>
        <p className="text-[9px] font-bold text-gray-400">{count}</p>
      </div>
      <p className="text-[10px] font-black text-pink-500">{value}</p>
    </div>
    <div className="w-full h-2 bg-pink-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} ${progress} rounded-full`}></div>
    </div>
  </div>
);

const CampaignItem = ({
  title,
  date,
  status,
  views,
  engagement,
  revenue,
  badgeColor,
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="text-sm font-black text-gray-900">{title}</h4>
        <p className="text-[10px] font-bold text-gray-400">{date}</p>
      </div>
      <span
        className={`px-4 py-1.5 border font-black rounded-full text-[9px] uppercase tracking-wider ${badgeColor || "bg-blue-100 text-blue-500 border-blue-200"}`}
      >
        {status}
      </span>
    </div>
    <div className="grid grid-cols-3 gap-2">
      <StatBox label="Views" value={views} />
      <StatBox label="Engagement" value={engagement} />
      <StatBox label="Revenue" value={revenue} color="text-pink-500" />
    </div>
  </div>
);

const StatBox = ({ label, value, color = "text-gray-900" }) => (
  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center">
    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">
      {label}
    </p>
    <p className={`text-[11px] font-black ${color}`}>{value}</p>
  </div>
);

const CampaignTableRow = ({
  title,
  date,
  status,
  views,
  engagement,
  revenue,
  badgeColor,
}) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4">
      <p className="font-bold text-gray-900 text-sm">{title}</p>
    </td>
    <td className="px-6 py-4 text-sm text-gray-600">{date}</td>
    <td className="px-6 py-4">
      <span
        className={`px-3 py-1 border font-black rounded-full text-[10px] uppercase tracking-wider ${badgeColor || "bg-blue-100 text-blue-500"}`}
      >
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-center font-bold text-gray-900 text-sm">
      {views}
    </td>
    <td className="px-6 py-4 text-center font-bold text-gray-900 text-sm">
      {engagement}
    </td>
    <td className="px-6 py-4 text-right font-black text-pink-500">{revenue}</td>
  </tr>
);

export default DetailedCampaignAnalytics;
