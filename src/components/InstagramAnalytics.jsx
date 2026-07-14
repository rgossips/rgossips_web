"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TabsContent } from "@/components/ui/tabs";
import {
  FaUsers,
  FaChartLine,
  FaHeart,
  FaEye,
  FaSave,
  FaThumbsUp,
} from "react-icons/fa";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// register chartjs parts
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

// ------------ DUMMY DATA ----------------
const overview = {
  followers: 28500,
  reach: 120000,
  engagementRate: "4.8%",
  profileVisits: 6500,
};

const performanceData = [20, 35, 40, 60, 80, 95, 110];

const genderData = {
  labels: ["Male", "Female", "Other"],
  datasets: [
    {
      data: [55, 42, 3],
      backgroundColor: ["#3b82f6", "#ec4899", "#a3a3a3"],
    },
  ],
};

const ageGroupData = {
  labels: ["13-17", "18-24", "25-34", "35-44", "45+"],
  datasets: [
    {
      data: [5, 35, 40, 15, 5],
      backgroundColor: ["#93c5fd", "#60a5fa", "#3b82f6", "#1e40af", "#1e3a8a"],
    },
  ],
};

const topLocations = ["Mumbai", "Delhi", "Bangalore", "Dubai", "London"];

const posts = [
  {
    id: 1,
    titleKey: "hotelStayVlog",
    likes: 5400,
    comments: 220,
    saves: 480,
    views: 45000,
  },
  {
    id: 2,
    titleKey: "beachfrontPromo",
    likes: 3200,
    comments: 115,
    saves: 190,
    views: 30000,
  },
  {
    id: 3,
    titleKey: "roomTour",
    likes: 1500,
    comments: 45,
    saves: 70,
    views: 15000,
  },
];

// -----------------------------------------

export default function InstagramAnalytics() {
  const t = useTranslations("InstagramAnalytics");
  return (
    <TabsContent value="instagram">
      <div className="space-y-8">
        {/* --------- TOP OVERVIEW CARDS ---------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <FaUsers />,
              label: t("stats.followers"),
              value: overview.followers,
            },
            {
              icon: <FaEye />,
              label: t("stats.reach"),
              value: overview.reach,
            },
            {
              icon: <FaChartLine />,
              label: t("stats.engagementRate"),
              value: overview.engagementRate,
            },
            {
              icon: <FaHeart />,
              label: t("stats.profileVisits"),
              value: overview.profileVisits,
            },
          ].map((stat, i) => (
            <Card key={i} className="shadow hover:shadow-lg transition-all">
              <CardContent className="flex items-center gap-3 py-6">
                <div className="text-blue-600 text-3xl">{stat.icon}</div>
                <div>
                  <h2 className="text-xs text-gray-600">{stat.label}</h2>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --------- TREND LINE CHART (FIXED) ---------- */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("trend.title")}
              <span className="text-sm text-green-600 font-medium">
                {t("trend.growth")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <Line
                data={{
                  labels: ["1", "5", "10", "15", "20", "25", "30"],
                  datasets: [
                    {
                      label: t("chart.engagement"),
                      data: performanceData,
                      borderColor: "#2563eb",
                      backgroundColor: "rgba(37,99,235,0.2)",
                      pointBackgroundColor: "#1d4ed8",
                      tension: 0.4,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      ticks: { color: "#555", padding: 8 },
                      grid: { color: "#e5e7eb" },
                    },
                    x: {
                      ticks: { color: "#555", padding: 8 },
                      grid: { display: false },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* --------- DEMOGRAPHICS SECTION ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("gender.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Doughnut
                data={{
                  ...genderData,
                  labels: [
                    t("gender.male"),
                    t("gender.female"),
                    t("gender.other"),
                  ],
                }}
              />
            </CardContent>
          </Card>

          {/* Age Groups */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("ageGroups.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Doughnut data={ageGroupData} />
            </CardContent>
          </Card>

          {/* Top Locations */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t("locations.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topLocations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b last:border-b-0 pb-2"
                >
                  <span className="font-medium">📍 {loc}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: `${80 - i * 10}%` }} // just dummy visual weight
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* --------- POSTS PERFORMANCE ---------- */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{t("posts.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="border rounded-lg p-4 hover:shadow hover:bg-gray-50 transition-all"
              >
                <h3 className="font-semibold mb-2">
                  {t(`posts.items.${post.titleKey}`)}
                </h3>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="flex items-center gap-2">
                    <FaThumbsUp className="text-blue-500" />{" "}
                    {t("post.likes", { value: post.likes })}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaHeart className="text-red-500" />{" "}
                    {t("post.comments", { value: post.comments })}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaSave className="text-green-600" />{" "}
                    {t("post.saves", { value: post.saves })}
                  </span>
                  <span className="flex items-center gap-2">
                    <FaEye className="text-purple-500" />{" "}
                    {t("post.views", { value: post.views.toLocaleString() })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
