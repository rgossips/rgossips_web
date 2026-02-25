"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Instagram,
  MapPin,
  Languages,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CreatorOnboardingForm({ onClose }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    instaLink: "",
    primaryNiche: "",
    secondaryNiche: [], // Now an array for multi-select
    contentStyle: [],
    revealsFace: null,
    language: "",
    state: "",
    city: "",
    followerTier: "",
  });

  const categories = [
    "Fashion",
    "Technology",
    "Fitness",
    "Beauty",
    "Food",
    "Travel",
    "Music",
    "Gaming",
    "Lifestyle",
    "Education",
  ];
  const contentStyles = [
    "Talking Head",
    "Aesthetic",
    "Cinematic",
    "Voiceover",
    "Review",
    "Meme",
    "Random",
  ];
  const languages = ["Hindi", "English", "Hinglish", "Regional"];
  const followerOptions = [
    { label: "Under 1k", value: "baby" },
    { label: "1k - 10k", value: "nano" },
    { label: "10k - 100k", value: "micro" },
    { label: "100k - 1M", value: "macro" },
    { label: "1M+", value: "celebrity" },
  ];

  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMultiSelect = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "applications2"), {
        ...formData,
        status: "pending",
        appliedAt: serverTimestamp(),
      });

      console.log("Document written with ID: ", docRef.id);
      nextStep(); // Move to the success step
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.fullName.trim() !== "" &&
          formData.phone.length === 10 &&
          formData.state !== "" &&
          formData.city !== "" &&
          formData.gender !== ""
        );
      case 2:
        return (
          formData.primaryNiche !== "" &&
          formData.secondaryNiche.length > 0 &&
          formData.contentStyle.length > 0 &&
          formData.revealsFace !== null
        );
      case 3:
        return (
          formData.instaLink.includes("instagram.com") &&
          formData.followerTier !== "" &&
          formData.language !== ""
        );
      default:
        return true;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full h-full lg:h-auto lg:max-w-2xl bg-white lg:rounded-[32px] overflow-hidden flex flex-col"
      >
        {/* Progress & Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Apply as Creator
            </h2>
            <p className="text-xs text-[#E60076] font-bold uppercase tracking-widest">
              Step {step} of {totalSteps}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepContent title="Basic Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                  />
                  <InputField
                    label="Phone"
                    type="tel"
                    placeholder="6399..."
                    value={formData.phone}
                    maxLength={10}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <InputField
                    label="State"
                    icon={<MapPin size={16} />}
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                  />
                  <InputField
                    label="City"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                  />
                  <SelectBox
                    label="Gender"
                    options={["Male", "Female", "Other"]}
                    value={formData.gender}
                    onChange={(e) =>
                      handleInputChange("gender", e.target.value)
                    }
                  />
                </div>
              </StepContent>
            )}

            {step === 2 && (
              <StepContent title="Content Details">
                <div className="space-y-6">
                  <SelectBox
                    label="Primary Niche (Main focus)"
                    options={categories}
                    value={formData.primaryNiche}
                    onChange={(e) =>
                      handleInputChange("primaryNiche", e.target.value)
                    }
                  />

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Secondary Niches (Select multiple)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <PillButton
                          key={cat}
                          label={cat}
                          isSelected={formData.secondaryNiche.includes(cat)}
                          onClick={() =>
                            toggleMultiSelect("secondaryNiche", cat)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Content Style
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {contentStyles.map((style) => (
                        <PillButton
                          key={style}
                          label={style}
                          isSelected={formData.contentStyle.includes(style)}
                          onClick={() =>
                            toggleMultiSelect("contentStyle", style)
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Do you do face videos?
                    </label>
                    <div className="flex gap-4">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleInputChange("revealsFace", opt)}
                          className={`flex-1 py-3 rounded-2xl border-2 transition-all font-bold text-sm cursor-pointer ${
                            formData.revealsFace === opt
                              ? "border-[#E60076] bg-pink-50 text-[#E60076]"
                              : "border-slate-100 text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </StepContent>
            )}

            {step === 3 && (
              <StepContent title="Reach & Metrics">
                <InputField
                  label="Instagram Profile Link"
                  icon={<Instagram size={16} />}
                  value={formData.instaLink}
                  onChange={(e) =>
                    handleInputChange("instaLink", e.target.value)
                  }
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectBox
                    label="Follower Count"
                    options={followerOptions.map((f) => f.label)}
                    value={formData.followerTier}
                    onChange={(e) =>
                      handleInputChange("followerTier", e.target.value)
                    }
                  />
                  <SelectBox
                    label="Content Language"
                    icon={<Languages size={16} />}
                    options={languages}
                    value={formData.language}
                    onChange={(e) =>
                      handleInputChange("language", e.target.value)
                    }
                  />
                </div>
              </StepContent>
            )}

            {step === 4 && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 text-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Form Submitted Successfully!
                </h3>
                <p className="text-slate-500 mt-2">
                  Your application is saved to our Master Data.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 bg-slate-50/50 flex gap-3">
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl font-bold cursor-pointer transition-colors"
            >
              Back
            </Button>
          )}
          <Button
            // Disable button while firebase is working
            disabled={isSubmitting || !isStepValid()}
            onClick={() => {
              if (step === 3) {
                handleSubmit(); // Call Firebase on the last input step
              } else if (step === totalSteps) {
                onClose(); // Close modal on the success screen
              } else {
                nextStep(); // Move through steps 1 and 2
              }
            }}
            className="flex-[2] h-14 rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] cursor-pointer shadow-lg shadow-pink-100 disabled:opacity-50"
          >
            {isSubmitting
              ? "Submitting..."
              : step === 3
                ? "Submit Application"
                : step === totalSteps
                  ? "Finish"
                  : "Next Step"}
            {!isSubmitting && step < totalSteps && (
              <ArrowRight size={18} className="ml-2" />
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Reusable Components
function StepContent({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h3 className="text-lg font-bold text-slate-800">{title}</h3>
      {children}
    </motion.div>
  );
}

function InputField({ label, icon, ...props }) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full h-12 bg-slate-50 border-none rounded-xl ${icon ? "pl-10" : "pl-4"} pr-4 text-sm font-medium focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
        />
      </div>
    </div>
  );
}

function SelectBox({ label, options, icon, ...props }) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
            {icon}
          </div>
        )}
        <select
          {...props}
          className={`w-full h-12 bg-slate-50 border-none rounded-xl ${icon ? "pl-10" : "pl-4"} pr-10 text-sm font-medium focus:ring-2 focus:ring-pink-100 outline-none appearance-none cursor-pointer relative z-0`}
        >
          <option value="">Select Option</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}

function PillButton({ label, isSelected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-xl border-2 transition-all text-xs font-bold cursor-pointer ${
        isSelected
          ? "border-[#E60076] bg-pink-50 text-[#E60076]"
          : "border-slate-100 text-slate-500 hover:border-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
