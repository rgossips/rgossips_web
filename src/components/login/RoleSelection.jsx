"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Briefcase, CheckCircle2 } from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";

const RoleSelection = ({ onNext }) => {
  const { type, setType } = useGlobal(); // Using your global context to store role

  const handleSelect = (role) => {
    setType(role);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Choose your Role</h2>
        <p className="text-slate-500 text-sm">
          Select how you want to use the platform
        </p>
      </div>

      <div className="grid gap-4">
        {/* Role: Influencer */}
        <button
          onClick={() => handleSelect("influencer")}
          className="relative flex items-center p-5 rounded-2xl text-left transition-all duration-300 group"
          style={{
            background:
              type === "influencer"
                ? "linear-gradient(white, white) padding-box, linear-gradient(135deg, #9810FA, #E60076) border-box"
                : "white",
            border: "1.5px solid",
            borderColor: type === "influencer" ? "transparent" : "#F1F5F9",
            boxShadow: type === "influencer" ? "0 0 0 1px #6938EF" : "none",
          }}
        >
          <div
            className={`p-3 rounded-xl mr-4 transition-colors ${
              type === "influencer"
                ? "text-white"
                : "bg-slate-100 text-slate-600"
            }`}
            style={{
              background:
                type === "influencer"
                  ? "linear-gradient(135deg, #9810FA, #E60076)"
                  : "",
            }}
          >
            <User size={24} />
          </div>
          <div className="flex-1">
            <p
              className={`font-bold ${type === "influencer" ? "text-slate-900" : "text-slate-700"}`}
            >
              Influencer / Creator
            </p>
            <p className="text-xs text-slate-500">
              I want to collaborate with brands
            </p>
          </div>
          {type === "influencer" && (
            <CheckCircle2
              className="text-[#9810FA] animate-in zoom-in"
              size={20}
            />
          )}
        </button>

        {/* Role: Brand */}
        <button
          onClick={() => handleSelect("brand")}
          className="relative flex items-center p-5 rounded-2xl text-left transition-all duration-300 group"
          style={{
            background:
              type === "brand"
                ? "linear-gradient(white, white) padding-box, linear-gradient(135deg, #9810FA, #E60076) border-box"
                : "white",
            border: "1.5px solid",
            borderColor: type === "brand" ? "transparent" : "#F1F5F9",
            boxShadow: type === "brand" ? "0 0 0 1px #6938EF" : "none",
          }}
        >
          <div
            className={`p-3 rounded-xl mr-4 transition-colors ${
              type === "brand" ? "text-white" : "bg-slate-100 text-slate-600"
            }`}
            style={{
              background:
                type === "brand"
                  ? "linear-gradient(135deg, #9810FA, #E60076)"
                  : "",
            }}
          >
            <Briefcase size={24} />
          </div>
          <div className="flex-1">
            <p
              className={`font-bold ${type === "brand" ? "text-slate-900" : "text-slate-700"}`}
            >
              Brand / Business
            </p>
            <p className="text-xs text-slate-500">
              I want to hire creators for campaigns
            </p>
          </div>
          {type === "brand" && (
            <CheckCircle2
              className="text-[#9810FA] animate-in zoom-in"
              size={20}
            />
          )}
        </button>
      </div>

      <Button
        onClick={onNext}
        disabled={!type}
        className="w-full btn-purple h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-purple-100 disabled:opacity-50"
      >
        Continue
      </Button>
    </div>
  );
};

export default RoleSelection;
