"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const categories = [
  "Beauty",
  "Fashion",
  "Tech",
  "Fitness",
  "Travel",
  "Food",
  "Lifestyle",
  "Finance",
  "Gaming",
  "Education",
  "Photography",
  "Vlogging",
];

const CategorySelection = ({ onNext }) => {
  const [selected, setSelected] = useState([]);

  const toggle = (cat) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((i) => i !== cat) : [...prev, cat],
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">
          What Do You Create?
        </h2>
        <p className="text-slate-500 text-sm">
          Select categories to get better campaign matches
        </p>
      </div>

      {/* Pill Layout */}
      <div className="flex flex-wrap justify-center gap-3 px-2">
        {categories.map((cat) => {
          const isSelected = selected.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggle(cat)}
              className={`px-6 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-300 transform active:scale-95 ${
                isSelected
                  ? "border-transparent text-white shadow-md shadow-purple-200"
                  : "border-slate-100 bg-white text-slate-500 hover:border-slate-200"
              }`}
              style={{
                // Applying the linear gradient from the spec (#9810FA to #E60076)
                background: isSelected
                  ? "linear-gradient(135deg, #9810FA 0%, #E60076 100%)"
                  : "white",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 pt-4">
        <p className="text-center text-[11px] text-slate-400">
          You can change this later
        </p>
        <Button
          disabled={selected.length < 1}
          onClick={onNext}
          className={`w-full h-[54px] rounded-2xl text-base font-semibold transition-all duration-300 ${
            selected.length < 1
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "btn-purple text-white shadow-lg shadow-purple-200"
          }`}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CategorySelection;
