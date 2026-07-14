"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function MyCampaignsTable() {
  const t = useTranslations("MyCampaignsTable");
  const brandNames = [
    "Zomato",
    "Swiggy",
    "Mamaearth",
    "Boat",
    "Nykaa",
    "Tata 1mg",
    "Flipkart",
    "Myntra",
    "Amazon India",
    "Ajio",
    "Meesho",
    "Sugar Cosmetics",
    "Lenskart",
    "Beardo",
    "Cult Fit",
    "Paytm",
    "PhonePe",
    "BigBasket",
    "BluSmart",
    "Ola Electric",
  ];

  const statuses = ["Applied", "In Progress", "Completed"];

  const statusClasses = {
    Applied: "bg-blue-100 text-blue-700 border border-blue-300",
    "In Progress": "bg-yellow-100 text-yellow-700 border border-yellow-300",
    Completed: "bg-green-100 text-green-700 border border-green-300",
  };

  // ⬇️ Firestore data state
  const [campaigns, setCampaigns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(campaigns.length / itemsPerPage);

  // User + offer placeholders
  const userId = "user1";
  const offerId = "offer1";

  // ------------------------------ 📥 FETCH FROM FIREBASE ------------------------------
  const fetchCampaigns = async () => {
    try {
      const snapshot = await getDocs(collection(db, "applications"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCampaigns(data);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const currentItems = campaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="mt-4 shadow">
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">{t("columns.brand")}</th>
                <th className="p-3 text-left">{t("columns.status")}</th>
                <th className="p-3 text-left">{t("columns.date")}</th>
                <th className="p-3 text-left">{t("columns.amount")}</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {currentItems.map((c, i) => (
                <tr key={i} className="bg-white hover:bg-gray-50">
                  <td className="p-3 font-semibold">{c.brandId}</td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        statusClasses[c.status]
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="p-3">{c.date}</td>
                  <td className="p-3">₹{c.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {t("pagination.prev")}
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            {t("pagination.next")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
