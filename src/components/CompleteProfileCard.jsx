"use client";

import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function CompleteProfileCard() {
  const { profile } = useAuth();

  const hasInstagram = !!profile?.instagram_handle;

  const steps = [
    {
      id: 1,
      title: "Create your account",
      subtitle: "You're all set",
      completed: true,
    },
    {
      id: 2,
      title: "Connect Instagram",
      subtitle: hasInstagram ? `@${profile.instagram_handle}` : "Brands discover you instantly",
      action: hasInstagram ? null : "Connect",
      completed: hasInstagram,
      active: !hasInstagram,
    },
    {
      id: 3,
      title: "Generate AI Media Kit",
      subtitle: "Look pro in 60 seconds",
      action: "Create",
      active: hasInstagram,
    },
    {
      id: 4,
      title: "Set your rate card",
      subtitle: "Know your worth",
      action: "Set Rates",
    },
    {
      id: 5,
      title: "Apply to first campaign",
      subtitle: "Land your first deal",
      action: "Browse",
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="w-full flex justify-center">
      <Card className="w-full max-w-2xl lg:max-w-none p-6 rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            {/* Progress Circle */}
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#9810fa] border-r-[#e60076] rotate-[45deg]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Get Your First Brand Deal
              </h3>
              <p className="text-sm text-slate-500">{completedCount}/5 steps — {completedCount === 5 ? "all done!" : "keep going!"}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full bg-gradient-to-r from-[#9810fa] to-[#e60076]`} style={{ width: `${(completedCount / 5) * 100}%` }} />
          </div>
        </div>

        {/* Steps */}
        <div className="divide-y divide-slate-200">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-4">
                {/* Step Indicator */}
                {step.completed ? (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9810fa] to-[#e60076] flex items-center justify-center text-white">
                    <Check size={16} strokeWidth={3} />
                  </div>
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold
                      ${
                        step.active
                          ? "border-[#9810fa] text-[#9810fa]"
                          : "border-slate-300 text-slate-400"
                      }`}
                  >
                    {step.id}
                  </div>
                )}

                {/* Text */}
                <div>
                  <p
                    className={`font-semibold ${
                      step.completed
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-slate-500">{step.subtitle}</p>
                </div>
              </div>

              {/* Action Button */}
              {step.action && (
                <button
                  className={`px-4 cursor-pointer py-2 rounded-xl text-sm font-semibold transition
                    ${
                      step.active
                        ? "bg-gradient-to-r from-[#9810fa] to-[#e60076] text-white shadow-sm"
                        : "border border-slate-300 text-slate-500 hover:border-slate-400"
                    }`}
                >
                  {step.action}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
