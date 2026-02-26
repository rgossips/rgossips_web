import React from "react";
import { X, Check } from "lucide-react";

const comparisonData = [
  {
    feature: "Setup Time",
    agency: "2-4 weeks",
    others: "1-2 weeks",
    rg: "10 minutes",
  },
  {
    feature: "Commission/Fees",
    agency: "30-40%",
    others: "15-25%",
    rg: "5% only",
  },
  { feature: "AI Matching", agency: false, others: "Basic", rg: "Advanced" },
  {
    feature: "Payment Protection",
    agency: false,
    others: "Limited",
    rg: "Full Escrow",
  },
  {
    feature: "Real-time Analytics",
    agency: false,
    others: "Delayed",
    rg: "Live",
  },
  {
    feature: "Creator Verification",
    agency: "Manual",
    others: "Basic",
    rg: "AI + Manual",
  },
  {
    feature: "Support",
    agency: "Email only",
    others: "Email",
    rg: "24/7 Chat",
  },
  { feature: "Multi-platform", agency: "Limited", others: "Yes", rg: "Yes" },
];

export default function ComparisonTable() {
  return (
    <section className="py-24 bg-white w-full px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center text-slate-900 mb-16">
          Why RGossips Over the Alternatives?
        </h2>

        <div className="overflow-x-auto rounded-[24px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-sm font-bold text-slate-900">
                  Feature
                </th>
                <th className="p-6 text-sm font-bold text-slate-500">
                  Traditional Agency
                </th>
                <th className="p-6 text-sm font-bold text-slate-500">
                  Other Platforms
                </th>
                <th className="p-6 text-sm font-bold text-[#6C4DFF] bg-[#f4f0ff]/30">
                  RGossips
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.map((row, i) => (
                <tr
                  key={i}
                  className="group hover:bg-slate-50/30 transition-colors"
                >
                  <td className="p-6 text-sm font-semibold text-slate-700">
                    {row.feature}
                  </td>
                  <td className="p-6 text-sm text-slate-400">
                    {row.agency === false ? (
                      <X className="w-5 h-5 text-red-400" />
                    ) : (
                      row.agency
                    )}
                  </td>
                  <td className="p-6 text-sm text-slate-500">{row.others}</td>
                  <td className="p-6 text-sm font-bold text-[#6C4DFF] bg-indigo-50/30">
                    {row.rg}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
