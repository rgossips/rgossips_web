"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Check, X, Video, Smartphone, Youtube, Image as ImageIcon, Clapperboard, IndianRupee } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Returns the influencer's onboarding completion as a percentage (0-100).
 * Mirrors the steps shown on the homepage's "Get Your First Brand Deal" card.
 * Step 5 (apply to first campaign) auto-completes once step 4 (rate card) is done.
 */
export function useProfileCompletion(profile) {
  const hasInstagram = !!profile?.instagram_handle;
  const hasMediaKit = !!profile?.media_kit_published;
  const serviceRates = profile?.service_rates || profile?.serviceRates || {};
  const hasRates = Object.values(serviceRates).some((v) => v && Number(v) > 0);

  const completed =
    1 + // step 1: account created
    (hasInstagram ? 1 : 0) +
    (hasMediaKit ? 1 : 0) +
    (hasRates ? 1 : 0) +
    (hasRates ? 1 : 0); // step 5 mirrors step 4

  const total = 5;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
    hasInstagram,
    hasMediaKit,
    hasRates,
  };
}

const SERVICE_OPTIONS = [
  { id: "reels", label: "Reels", icon: <Video size={20} /> },
  { id: "stories", label: "Stories", icon: <Smartphone size={20} /> },
  { id: "shorts", label: "YouTube Shorts", icon: <Youtube size={20} /> },
  { id: "posts", label: "Static Posts", icon: <ImageIcon size={20} /> },
  { id: "ugc", label: "UGC Videos", icon: <Clapperboard size={20} /> },
];

export function CompleteProfileCard() {
  const { profile, user, refreshProfile } = useAuth();
  const router = useRouter();
  const [showRatesModal, setShowRatesModal] = useState(false);

  const hasInstagram = !!profile?.instagram_handle;
  const hasMediaKit = !!profile?.media_kit_published;
  const serviceRates = profile?.service_rates || profile?.serviceRates || {};
  const hasRates = Object.values(serviceRates).some((v) => v && Number(v) > 0);

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
      subtitle: hasRates ? "Rates configured" : "Know your worth",
      action: hasRates ? null : "Set Rates",
      completed: hasRates,
      active: hasMediaKit && !hasRates,
      onClick: () => setShowRatesModal(true),
    },
    {
      id: 5,
      title: "Apply to first campaign",
      // Auto-complete once the rate card is set — the user has done everything
      // needed for brands to find them, so we treat the funnel as 100%.
      subtitle: hasRates ? "You're discoverable to brands!" : "Land your first deal",
      action: hasRates ? null : "Browse",
      completed: hasRates,
      active: false,
      href: "/influencer/campaigns",
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
                    onClick={step.onClick ? step.onClick : step.href ? () => router.push(step.href) : undefined}
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

      {/* Services & Rates Modal */}
      {showRatesModal && (
        <SetRatesModal
          services={profile?.services || []}
          rates={profile?.service_rates || {}}
          onSave={async (svcs, rates) => {
            try {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
              const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
              await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
                body: JSON.stringify({ userId: user.id, table: "influencer_profiles", services: svcs, serviceRates: rates }),
              });
              await refreshProfile();
            } catch (err) {
              console.error("Failed to save rates:", err);
            }
            setShowRatesModal(false);
          }}
          onClose={() => setShowRatesModal(false)}
        />
      )}
    </div>
  );
}

function SetRatesModal({ services, rates, onSave, onClose }) {
  const [localServices, setLocalServices] = useState([...services]);
  const [localRates, setLocalRates] = useState({ ...rates });

  const toggleService = (id) => {
    setLocalServices((prev) => {
      if (prev.includes(id)) {
        const updated = prev.filter((s) => s !== id);
        const newRates = { ...localRates };
        delete newRates[id];
        setLocalRates(newRates);
        return updated;
      }
      return [...prev, id];
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4">
        <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900">Services & Rates</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select services you offer</p>
            <div className="grid grid-cols-3 gap-2">
              {SERVICE_OPTIONS.map((svc) => {
                const isSelected = localServices.includes(svc.id);
                return (
                  <button
                    key={svc.id}
                    onClick={() => toggleService(svc.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected ? "border-purple-500 bg-purple-50 text-purple-600" : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                    }`}
                  >
                    <div className={`mb-1.5 ${isSelected ? "text-purple-500" : "text-gray-300"}`}>{svc.icon}</div>
                    <span className="text-[9px] font-black text-center leading-tight">{svc.label}</span>
                  </button>
                );
              })}
            </div>

            {localServices.length > 0 && (
              <>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-2">Set your rates</p>
                <div className="space-y-3">
                  {localServices.map((svcId) => {
                    const svc = SERVICE_OPTIONS.find((s) => s.id === svcId);
                    if (!svc) return null;
                    return (
                      <div key={svcId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-purple-500 shrink-0">{svc.icon}</div>
                        <span className="text-xs font-bold text-gray-700 flex-1">{svc.label}</span>
                        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2 py-1.5">
                          <IndianRupee size={12} className="text-gray-400" />
                          <input
                            type="number"
                            value={localRates[svcId] || ""}
                            onChange={(e) => setLocalRates({ ...localRates, [svcId]: e.target.value })}
                            placeholder="0"
                            className="w-20 text-sm font-bold text-gray-700 outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-500 active:scale-95 transition-all cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => onSave(localServices, localRates)}
              className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-lg cursor-pointer"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
