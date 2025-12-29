"use client";

import { useState, useEffect } from "react";
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

import { db } from "@/lib/firebase";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";

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

// 👇 Dummy payload to upload first time (You can remove later)
const initialData = {
  Jan: {
    earnings: 1200,
    hotel: 300,
    product: 400,
    restaurant: 200,
    salon: 150,
  },
  Feb: {
    earnings: 2000,
    hotel: 400,
    product: 350,
    restaurant: 300,
    salon: 200,
  },
  Mar: {
    earnings: 1800,
    hotel: 350,
    product: 450,
    restaurant: 250,
    salon: 180,
  },
  Apr: {
    earnings: 2500,
    hotel: 500,
    product: 500,
    restaurant: 350,
    salon: 220,
  },
};

export default function MyEarningsAndAnalytics() {
  const uid = "USER_Demo"; // Replace with logged-in user's UID
  const [selectedYear, setSelectedYear] = useState("2025");

  const [monthlyDataState, setMonthlyDataState] = useState(null);
  const [categoryDataState, setCategoryDataState] = useState(null);

  // ========================= 🔥 SAVE DATA TO FIREBASE =========================
  const uploadDataToFirebase = async () => {
    try {
      for (const month in initialData) {
        await setDoc(doc(db, "analytics", uid, selectedYear, month), {
          data: initialData[month],
        });
      }
      console.log("Data uploaded successfully!");
    } catch (error) {
      console.error("Error uploading data:", error);
    }
  };

  // ========================= 📥 FETCH DATA FROM FIREBASE =====================
  const fetchAnalytics = async () => {
    try {
      const yearRef = collection(db, "analytics", uid, selectedYear);
      const snapshot = await getDocs(yearRef);

      const months = [];
      const monthlyEarnings = [];
      const hotel = [];
      const product = [];
      const restaurant = [];
      const salon = [];

      snapshot.forEach((doc) => {
        const monthName = doc.id;
        const d = doc.data().data;

        months.push(monthName);
        monthlyEarnings.push(d.earnings);
        hotel.push(d.hotel);
        product.push(d.product);
        restaurant.push(d.restaurant);
        salon.push(d.salon);
      });

      // ========== Line Chart ==========
      setMonthlyDataState({
        labels: months,
        datasets: [
          {
            label: "Monthly Earnings",
            data: monthlyEarnings,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,0.2)",
            fill: true,
          },
        ],
      });

      // ========== Bar Chart ==========
      setCategoryDataState({
        labels: months,
        datasets: [
          { label: "Hotel", data: hotel, backgroundColor: "#3b82f6" },
          { label: "Product", data: product, backgroundColor: "#f43f5e" },
          { label: "Restaurant", data: restaurant, backgroundColor: "#f59e0b" },
          { label: "Salon", data: salon, backgroundColor: "#10b981" },
        ],
      });
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // 🔄 Fetch data whenever year changes
  useEffect(() => {
    fetchAnalytics();
  }, [selectedYear]);

  return (
    <div className="space-y-8 mt-4">
      <div className="flex justify-end">
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

      {/* ========== LINE CHART ========== */}
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="text-xl font-semibold mb-4">Monthly Earnings</div>
          {monthlyDataState && (
            <Line
              data={monthlyDataState}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* ========== BAR CHART ========== */}
      <Card className="shadow">
        <CardContent className="p-6">
          <div className="text-xl font-semibold mb-4">
            Category Earnings Per Month
          </div>
          {categoryDataState && (
            <Bar
              data={categoryDataState}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
