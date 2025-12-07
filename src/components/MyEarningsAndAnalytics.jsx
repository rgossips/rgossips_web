"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function MyEarningsAndAnalytics() {
  const [selectedYear, setSelectedYear] = useState("2025");

  // Placeholder data for monthly earnings (line chart)
  const monthlyData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Monthly Earnings",
        data: [
          1200, 2000, 1800, 2500, 3000, 2800, 4000, 3500, 3800, 4200, 4500,
          5000,
        ],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Placeholder data for category earnings per month (grouped bar chart)
  const categoryData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        label: "Hotel",
        data: [300, 400, 350, 500, 450, 600, 700, 650, 600, 750, 800, 850],
        backgroundColor: "#3b82f6",
      },
      {
        label: "Product",
        data: [400, 350, 450, 500, 550, 600, 650, 700, 720, 750, 800, 850],
        backgroundColor: "#f43f5e",
      },
      {
        label: "Restaurant",
        data: [200, 300, 250, 350, 400, 380, 450, 420, 430, 460, 480, 500],
        backgroundColor: "#f59e0b",
      },
      {
        label: "Salon",
        data: [150, 200, 180, 220, 250, 230, 280, 260, 270, 300, 320, 350],
        backgroundColor: "#10b981",
      },
    ],
  };

  return (
    <div className="space-y-8 mt-4">
      {/* ===================== TOP ROW — Totals ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow">
          <CardContent className="p-6 text-center">
            <div className="text-xl font-semibold text-gray-700">
              Total Earnings
            </div>
            <div className="text-5xl font-extrabold text-green-600 mt-2">
              ₹12,500
            </div>
          </CardContent>
        </Card>

        <Card className="shadow">
          <CardContent className="p-6 text-center">
            <div className="text-xl font-semibold text-gray-700">
              Current Month Earnings
            </div>
            <div className="text-5xl font-extrabold text-blue-600 mt-2">
              ₹2,800
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===================== SECOND ROW — Stats ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Avg. Monthly Earnings", value: "₹4,200" },
          { label: "Highest Earning Month", value: "₹7,900" },
          { label: "Lowest Earning Month", value: "₹1,200" },
        ].map((item, i) => (
          <Card key={i} className="shadow">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ===================== THIRD ROW — Charts ===================== */}
      <div className="space-y-10">
        {/* ===== LINE CHART — Monthly Earnings ===== */}
        <Card className="shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xl font-semibold">Monthly Earnings</div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Line
              data={monthlyData}
              options={{
                responsive: true,
                plugins: { legend: { display: true, position: "bottom" } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </CardContent>
        </Card>

        {/* ===== GROUPED BAR CHART — Category Earnings Per Month ===== */}
        <Card className="shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-xl font-semibold">
                Category Earnings Per Month
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Bar
              data={categoryData}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
                scales: {
                  y: { beginAtZero: true },
                  x: { stacked: false },
                },
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
