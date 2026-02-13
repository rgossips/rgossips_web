import React, { useState } from "react";
import { ArrowLeft, AlertCircle, ChevronRight } from "lucide-react";

const DeactivateAccount = ({ onBack, onNavigateToPrivacy }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const reasons = [
    "Taking a break from social media",
    "Found another platform",
    "Privacy concerns",
    "Not getting enough collaboration opportunities",
    "Too many notifications",
    "Account security issues",
    "Other",
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans lg:px-40 lg:pt-24">
      {/* Header */}
      <div className="sticky top-0 bg-white lg:bg-gray-50 z-20 px-6 py-4 flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-2 bg-pink-100 cursor-pointer text-pink-500 rounded-full"
        >
          <ArrowLeft size={20} strokeWidth={3} />
        </button>
        <h1 className="text-lg font-black tracking-tight text-gray-900">
          Deactivate Account
        </h1>
      </div>

      <div className="p-5 space-y-6">
        {/* Warning Section */}
        <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-100">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-black text-sm text-gray-900">
              We're sorry to see you go
            </h3>
          </div>

          <p className="text-[11px] font-bold text-gray-500 ml-1">
            Before you deactivate, please note the following:
          </p>

          <ul className="space-y-3 ml-1">
            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-700">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              Your profile will be hidden from brands
            </li>
            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-700">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              Active campaigns will be cancelled
            </li>
            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-700">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              Your data will be preserved for 30 days
            </li>
            <li className="flex items-center gap-3 text-[11px] font-bold text-gray-700">
              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
              You can reactivate anytime within 30 days
            </li>
          </ul>
        </div>

        {/* Reason Survey */}
        <div className="space-y-4">
          <div className="px-1">
            <h3 className="text-sm font-black text-gray-900">
              Tell us why you're leaving
            </h3>
            <p className="text-[10px] font-bold text-gray-400 mt-1">
              This helps us improve My Mall for everyone
            </p>
          </div>

          <div className="space-y-3">
            {reasons.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full flex items-center cursor-pointer justify-between p-4 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-pink-200 ${
                  selectedReason === reason
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 bg-white"
                }`}
                type="button"
              >
                <span
                  className={`text-[11px] font-bold ${selectedReason === reason ? "text-pink-600" : "text-gray-600"}`}
                >
                  {reason}
                </span>
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-colors ${
                    selectedReason === reason
                      ? "border-pink-500"
                      : "border-gray-200"
                  }`}
                >
                  {selectedReason === reason && (
                    <span className="w-2.5 h-2.5 bg-pink-500 rounded-full" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Final Acknowledgment */}
        <label className="flex items-start gap-4 p-5 bg-white border border-gray-100 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform shadow-sm">
          <input
            type="checkbox"
            className="mt-1 w-5 h-5 rounded-md border-2 border-gray-200 text-pink-500 focus:ring-pink-200"
            checked={hasAcknowledged}
            onChange={(e) => setHasAcknowledged(e.target.checked)}
          />
          <div className="space-y-1">
            <span className="text-[11px] font-black text-gray-900">
              I understand my account will be deactivated
            </span>
            <p className="text-[10px] font-bold text-gray-400 leading-relaxed">
              Your account will be hidden and you won't be able to access it
              until you reactivate.
            </p>
          </div>
        </label>

        {/* Alternative Tip */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-3">
          <h4 className="text-[11px] font-black text-gray-900">
            Not ready to deactivate?
          </h4>
          <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
            You can take a break by turning off notifications or hiding your
            profile from brands.
          </p>
          <button
            onClick={onNavigateToPrivacy}
            className="text-[11px] cursor-pointer font-black text-blue-600 flex items-center gap-1 hover:underline"
            type="button"
          >
            Go to Privacy Settings <ChevronRight size={14} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onBack}
            className="flex-1 py-4 cursor-pointer bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-500"
            type="button"
          >
            Cancel
          </button>
          <button
            disabled={!selectedReason || !hasAcknowledged}
            className={`flex-1 py-4 rounded-xl text-sm font-black text-white shadow-lg transition-all ${
              selectedReason && hasAcknowledged
                ? "bg-rose-500 shadow-rose-100 crusor-pointer"
                : "bg-gray-200 shadow-none cursor-not-allowed"
            }`}
            type="button"
          >
            Deactivate Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAccount;
