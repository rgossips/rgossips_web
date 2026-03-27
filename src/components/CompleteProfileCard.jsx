"use client";

import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function CompleteProfileCard() {
  const { profile } = useAuth();
  const router = useRouter();

  const hasInstagram = !!profile?.instagram_handle;
  const hasMediaKit = !!profile?.media_kit_published;

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
      subtitle: hasInstagram
        ? `@${profile.instagram_handle}`
        : "Brands discover you instantly",
      action: hasInstagram ? null : "Connect",
      completed: hasInstagram,
      active: !hasInstagram,
    },
    {
      id: 3,
      title: "Generate AI Media Kit",
      subtitle: hasMediaKit ? "Published" : "Look pro in 60 seconds",
      action: hasMediaKit ? null : "Create",
      completed: hasMediaKit,
      active: hasInstagram && !hasMediaKit,
      href: "/influencer/media-kit",
    },
    {
      id: 4,
      title: "Set your rate card",
      subtitle: "Know your worth",
      action: "Set Rates",
      active: hasMediaKit,
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
    <div className="w-full h-full flex justify-center">
      <Card className="w-full h-full p-5 lg:p-6 rounded-[32px] border border-slate-200 bg-white shadow-sm flex flex-col">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-5">
            {/* Progress Circle Container */}
            <div className="relative w-14 h-14 shrink-0">
              {/* Background Track */}
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-slate-100"
                />
                {/* Progress Fill */}
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="transparent"
                  stroke="url(#gradient)"
                  strokeWidth="5"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - 150.8 * (completedCount / 5)}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#9810fa" />
                    <stop offset="100%" stopColor="#e60076" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Percentage Text in Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-slate-800">
                  {Math.round((completedCount / 5) * 100)}%
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-[17px] font-black text-slate-900 leading-tight">
                Get Your First Brand Deal
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {completedCount}/5 steps —{" "}
                {completedCount === 5 ? "All done!" : "Keep going!"}
              </p>
            </div>
          </div>

          {/* Horizontal Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#9810fa] to-[#e60076] transition-all duration-500"
              style={{ width: `${(completedCount / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 flex flex-col justify-between">
          {steps.map((step, index) => (
            <div key={step.id}>
              <div
                className={`flex items-center justify-between py-3.5 ${
                  index !== steps.length - 1 ? "border-b border-slate-50" : ""
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Step Indicator Icon */}
                  <div className="shrink-0">
                    {step.completed ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#9810fa] to-[#e60076] flex items-center justify-center text-white shadow-sm">
                        <Check size={16} strokeWidth={4} />
                      </div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[13px] font-black
                        ${
                          step.active
                            ? "border-[#9810fa] text-[#9810fa] bg-purple-50/30"
                            : "border-slate-200 text-slate-400"
                        }`}
                      >
                        {step.id}
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        step.completed
                          ? "text-slate-300 line-through"
                          : "text-slate-800"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate">
                      {step.subtitle}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                {step.action && !step.completed && (
                  <button
                    onClick={step.href ? () => router.push(step.href) : undefined}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer
                    ${
                      step.active
                        ? "bg-gradient-to-r from-[#9810fa] to-[#e60076] text-white shadow-md shadow-purple-100"
                        : "border border-slate-200 text-slate-400"
                    }`}
                  >
                    {step.action}
                  </button>
                )}
              </div>
              {/* Vertical Connector Line */}

              {index !== steps.length - 1 && (
                <div className="w-px h-6 border-l-2 border-dashed border-slate-200 my-1 mx-4" />
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
