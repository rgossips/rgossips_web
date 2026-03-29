"use client";
import React from "react";
import {
  Calendar,
  MapPin,
  FileText,
  DollarSign,
  ChevronRight,
  Instagram,
  Youtube,
  CheckCircle2,
  Award,
  BarChart3,
  Eye,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CampaignCard({ campaign, onApply, matchScore }) {
  const isApplied = campaign.status === "Applied";
  const isCompleted = campaign.status === "Completed";
  const isActive = campaign.status === "Active";
  const router = useRouter();

  // Status Badge Colors
  const statusStyles = {
    Active: "bg-[#00BA88] text-white",
    Applied: "bg-[#4E82EE] text-white",
    Completed: "bg-[#E2E8F0] text-slate-600",
  };

  return (
    <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-50 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg overflow-hidden">
            {/* Initials or Logo placeholder */}
            <span className="bg-gradient-to-br from-blue-400 to-indigo-600 w-full h-full flex items-center justify-center text-white text-sm">
              {campaign.initials}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h4 className="font-bold text-slate-800 truncate max-w-[160px]">
                {campaign.title}
              </h4>
              <Award size={14} className="text-amber-500 fill-amber-100" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {campaign.brandName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {matchScore > 0 && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              matchScore >= 80 ? "text-emerald-500 bg-emerald-50" :
              matchScore >= 60 ? "text-amber-500 bg-amber-50" :
              "text-slate-400 bg-slate-50"
            }`}>
              <Zap size={10} />
              <span className="text-[10px] font-black">{matchScore}%</span>
            </div>
          )}
          <span
            className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${statusStyles[campaign.status]}`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Info Rows */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {campaign.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {campaign.platforms.includes("instagram") && (
            <Instagram size={18} className="text-[#E60076]" />
          )}
          {campaign.platforms.includes("youtube") && (
            <Youtube size={18} className="text-red-500" />
          )}
        </div>
      </div>

      {/* Data Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
            <DollarSign size={10} className="text-[#00BA88]" /> Budget
          </p>
          <p className="text-xs font-bold text-[#00BA88]">{campaign.budget}</p>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
            <Calendar size={10} className="text-blue-500" /> Deadline
          </p>
          <p className="text-xs font-bold text-slate-800">
            {campaign.deadline}
            {campaign.daysLeft && (
              <span className="text-[9px] text-red-500 ml-1">
                {campaign.daysLeft} left
              </span>
            )}
          </p>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
            <FileText size={10} className="text-purple-500" /> Deliverables
          </p>
          <p className="text-xs font-bold text-slate-800 truncate">
            {campaign.deliverables}
          </p>
        </div>
        <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50">
          <p className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase mb-1">
            <MapPin size={10} className="text-orange-500" /> Location
          </p>
          <p className="text-xs font-bold text-slate-800">
            {campaign.location}
          </p>
        </div>
      </div>

      {/* Conditional Action Button */}
      <div className="flex gap-3">
        {isActive && (
          <Button
            onClick={() => {
              if (onApply) {
                onApply();
              } else {
                router.push("/influencer/offers/" + campaign.id);
              }
            }}
            className="flex-1 cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100"
          >
            Apply Now <ChevronRight size={16} className="ml-1" />
          </Button>
        )}

        {isApplied && (
          <Button
            onClick={() => router.push("/influencer/offers/" + campaign.id)}
            className="flex-1 cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100"
          >
            <Eye size={16} className="mr-2" /> View Status{" "}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        )}

        {isCompleted && (
          <Button
            onClick={() => router.push("/influencer/offers/" + campaign.id)}
            className="flex-1 cursor-pointer h-12 rounded-2xl bg-gradient-to-r from-[#9810FA] to-[#E60076] text-white font-bold text-sm shadow-lg shadow-pink-100"
          >
            <BarChart3 size={16} className="mr-2" /> Full Analytics{" "}
            <ChevronRight size={16} className="ml-1" />
          </Button>
        )}

      </div>
    </div>
  );
}
