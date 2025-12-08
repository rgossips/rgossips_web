"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MyCampaignsTable() {
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

  const allCampaigns = brandNames.map((brand, i) => ({
    id: i + 1,
    brand,
    status: statuses[i % 3],
    date: `2025-${String((i % 12) + 1).padStart(2, "0")}-${String(
      (i % 28) + 1
    ).padStart(2, "0")}`,
    amount: `₹${(Math.floor(Math.random() * 15) + 5) * 1000}`, // 5k–20k
  }));

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(allCampaigns.length / itemsPerPage);
  const campaigns = allCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="mt-4 shadow">
      <CardContent className="p-6 space-y-4">
        <div className="text-xl font-semibold">My Campaigns</div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Brand</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {campaigns.map((c) => (
                <tr key={c.id} className="bg-white hover:bg-gray-50">
                  <td className="p-3 font-semibold">{c.brand}</td>

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
                  <td className="p-3">{c.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-100 disabled:opacity-50"
          >
            Prev
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
            Next
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
