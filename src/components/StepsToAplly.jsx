"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function StepsToApply() {
  const [open, setOpen] = useState(true);

  const steps = [
    { label: "Step 1", description: "Apply for campaign" },
    { label: "Step 2", description: "Get Approval From Brand" },
    { label: "Step 3", description: "Submit Content for approval" },
    { label: "Step 4", description: "Submit live link" },
  ];

  return (
    <div className="w-full max-w-md lg:max-w-none mx-auto bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-3 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2 className="font-medium text-gray-700">Steps to apply</h2>
        {open ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </div>

      {/* Steps */}
      {open && (
        <div className="px-6 py-4 space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start relative">
              {/* Vertical line */}
              {idx !== steps.length - 1 && (
                <span className="absolute left-2 top-5 h-full w-[2px] bg-blue-500" />
              )}
              {/* Step circle */}
              <span className="flex-shrink-0 w-4 h-4 mt-1 rounded-full bg-blue-500" />
              {/* Step content */}
              <div className="ml-4">
                <p className="font-medium text-gray-800">{step.label}</p>
                <p className="text-gray-400 text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
