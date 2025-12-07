"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";

export default function MyCampaignsTable() {
  const allCampaigns = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    brandImg:
      "https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=50&h=50",
    title: `Brand ${i + 1}`,
    status: ["Applied", "Shortlisted", "Completed"][i % 3],
    date: `2025-${(i % 12) + 1}-0${(i % 28) + 1}`,
    details: {
      transactionStatus: ["Pending", "Paid"][i % 2],
      amount: `₹${(i + 1) * 1000}`,
      receivedDate: i % 2 === 0 ? "-" : `2025-12-${(i % 28) + 1}`,
    },
  }));

  const [expandedRows, setExpandedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleRow = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c) => {
                const isExpanded = expandedRows.includes(c.id);
                return (
                  <React.Fragment key={c.id}>
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="p-3 flex items-center gap-3">
                        <Image
                          src={c.brandImg}
                          width={60}
                          height={60}
                          alt={c.title}
                          className="rounded-full aspect-square object-cover"
                        />
                        <span className="font-semibold">{c.title}</span>
                      </td>
                      <td className="p-3">{c.status}</td>
                      <td className="p-3">{c.date}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => toggleRow(c.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700">
                            <div>
                              <span className="font-semibold">
                                Transaction Status:
                              </span>{" "}
                              {c.details.transactionStatus}
                            </div>
                            <div>
                              <span className="font-semibold">Amount:</span>{" "}
                              {c.details.amount}
                            </div>
                            <div>
                              <span className="font-semibold">
                                Received Date:
                              </span>{" "}
                              {c.details.receivedDate}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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
