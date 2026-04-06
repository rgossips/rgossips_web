"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES as STANDARD_CATEGORIES } from "@/utils/categories";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Instagram,
  MapPin,
  Languages,
  CheckCircle2,
  ChevronDown,
  AtSign,
  TrendingUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function CreatorOnboardingForm({ onClose }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomLanguage, setIsCustomLanguage] = useState(false);
  const totalSteps = 5; // Increased to accommodate the final agreement/address step

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "",
    ageGroup: "", // NEW
    instaLink: "",
    instaUsername: "", // NEW
    primaryNiche: "",
    secondaryNiche: [],
    contentStyle: [],
    revealsFace: null,
    language: "",
    state: "",
    city: "",
    pincode: "", // NEW
    residentialAddress: "", // NEW
    followerTier: "",
    exactFollowers: "", // NEW
    avgViews: "", // NEW
    agreesToTerms: false, // NEW
  });

  const ageGroups = ["Under 18", "18-24", "25-34", "35-44", "45+"];
  const avgViewsOptions = [
    "1k - 10k",
    "10k - 25k",
    "25k - 50k",
    "50k - 100k",
    "100k+",
  ];
  const states = [
    // States
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttarakhand",
    "Uttar Pradesh",
    "West Bengal",

    // Union Territories
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi (NCT)",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];

  const categories = STANDARD_CATEGORIES;
  const contentStyles = [
    "Talking Head",
    "Aesthetic",
    "Cinematic",
    "Voiceover",
    "Review",
    "Meme",
    "Random",
  ];
  const languagesList = [
    "Assamese",
    "Bengali",
    "Bhojpuri",
    "English",
    "French",
    "Gujarati",
    "Haryanvi",
    "Hindi",
    "Hinglish",
    "Kannada",
    "Konkani",
    "Maithili",
    "Malayalam",
    "Manipuri",
    "Marathi",
    "Nepali",
    "Odia",
    "Punjabi",
    "Rajasthani",
    "Tamil",
    "Tulu",
    "Urdu",
    "Other",
  ];
  const followerOptions = [
    { label: "Under 1k", value: "baby" },
    { label: "1k - 5k", value: "nano_small" },
    { label: "5k - 10k", value: "nano" },
    { label: "10k - 50k", value: "micro" },
    { label: "50k - 100k", value: "mid" },
    { label: "100k+", value: "macro" },
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

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          formData.fullName &&
          formData.phone.length === 10 &&
          formData.gender &&
          formData.ageGroup &&
          formData.email
        );
      case 2:
        return (
          formData.primaryNiche &&
          formData.secondaryNiche.length > 0 &&
          formData.contentStyle.length > 0 &&
          formData.revealsFace
        );
      case 3:
        return (
          formData.instaLink.includes("instagram.com") &&
          formData.instaUsername &&
          formData.followerTier &&
          formData.language
          // formData.avgViews &&
        );
      case 4:
        return (
          formData.state &&
          formData.city &&
          formData.pincode &&
          formData.residentialAddress &&
          formData.agreesToTerms
        );
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "applications2"), {
        ...formData,
        status: "pending",
        appliedAt: serverTimestamp(),
      });
      nextStep(); // Move to success step
    } catch (e) {
      alert("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
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
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Creator Application
            </h2>
            {step < totalSteps && (
              <p className="text-xs text-[#E60076] font-bold uppercase tracking-widest">
                Step {step} of {totalSteps - 1}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-full cursor-pointer"
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
                    label="Email Address"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  <InputField
                    label="Phone (WhatsApp)"
                    type="tel"
                    maxLength={10}
                    placeholder="6399..."
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                  <SelectBox
                    label="Age Group"
                    options={ageGroups}
                    value={formData.ageGroup}
                    onChange={(e) =>
                      handleInputChange("ageGroup", e.target.value)
                    }
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
                {/* Existing Step 2 Content: Niches, Styles, Face Reveal */}
                <div className="space-y-6">
                  <SelectBox
                    label="Primary Niche"
                    options={categories}
                    value={formData.primaryNiche}
                    onChange={(e) =>
                      handleInputChange("primaryNiche", e.target.value)
                    }
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Secondary Niches
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
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
                      Content Styles (Select multiple)
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
                          className={`flex-1 py-3 cursor-pointer rounded-2xl border-2 transition-all font-bold text-sm ${formData.revealsFace === opt ? "border-[#E60076] bg-pink-50 text-[#E60076]" : "border-slate-100 text-slate-500 hover:bg-slate-50"}`}
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
              <StepContent title="Social Metrics">
                <div className="space-y-4">
                  <InputField
                    label="Instagram Profile Link"
                    icon={<Instagram size={16} />}
                    value={formData.instaLink}
                    onChange={(e) =>
                      handleInputChange("instaLink", e.target.value)
                    }
                  />
                  <InputField
                    label="Instagram Username"
                    icon={<AtSign size={16} />}
                    placeholder="@username"
                    value={formData.instaUsername}
                    onChange={(e) =>
                      handleInputChange("instaUsername", e.target.value)
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <SelectBox
                      label="Follower Tier"
                      options={followerOptions.map((f) => f.label)}
                      value={formData.followerTier}
                      onChange={(e) =>
                        handleInputChange("followerTier", e.target.value)
                      }
                    />
                    <InputField
                      label="Followers (Exact)"
                      type="number"
                      placeholder="e.g. 10200"
                      value={formData.exactFollowers}
                      onChange={(e) =>
                        handleInputChange("exactFollowers", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* <SelectBox
                      label="Avg Reels Views"
                      icon={<TrendingUp size={16} />}
                      options={avgViewsOptions}
                      value={formData.avgViews}
                      onChange={(e) =>
                        handleInputChange("avgViews", e.target.value)
                      }
                    /> */}
                    <SelectBox
                      label="Primary Language"
                      icon={<Languages size={16} />}
                      options={languagesList}
                      value={isCustomLanguage ? "Other" : formData.language}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsCustomLanguage(val === "Other");
                        handleInputChange(
                          "language",
                          val === "Other" ? "" : val,
                        );
                      }}
                    />
                  </div>
                  {isCustomLanguage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                    >
                      <InputField
                        label="Type your language"
                        value={formData.language}
                        onChange={(e) =>
                          handleInputChange("language", e.target.value)
                        }
                        autoFocus
                      />
                    </motion.div>
                  )}
                </div>
              </StepContent>
            )}

            {step === 4 && (
              <StepContent title="Shipping & Agreement">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <SelectBox
                      label="State"
                      icon={<MapPin size={16} />}
                      options={states}
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                    />
                    <InputField
                      label="City"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                    />
                  </div>
                  <InputField
                    label="Pincode"
                    maxLength={6}
                    placeholder="560001"
                    value={formData.pincode}
                    onChange={(e) =>
                      handleInputChange("pincode", e.target.value)
                    }
                  />
                  <InputField
                    label="Full Residential Address"
                    icon={<Package size={16} />}
                    placeholder="House No, Street, Landmark..."
                    value={formData.residentialAddress}
                    onChange={(e) =>
                      handleInputChange("residentialAddress", e.target.value)
                    }
                  />

                  <div className="mt-6 p-4 bg-pink-50 rounded-2xl border border-pink-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-1 accent-[#E60076] cursor-pointer"
                        checked={formData.agreesToTerms}
                        onChange={(e) =>
                          handleInputChange("agreesToTerms", e.target.checked)
                        }
                      />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        <b>Important:</b> I understand the agency role is to
                        connect creators with brands. Commercials and payments
                        are handled directly by the brand/agency. I agree to the
                        terms.
                      </span>
                    </label>
                  </div>
                </div>
              </StepContent>
            )}

            {step === 5 && (
              <div className="text-center py-10">
                <div className="w-20 h-20 bg-green-50 text-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">
                  Application Submitted!
                </h3>
                <p className="text-slate-500 mt-2">
                  We have received your details for the master database.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <div className="p-6 bg-slate-50/50 flex gap-3">
          {step > 1 && step < totalSteps && (
            <Button
              variant="ghost"
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl font-bold cursor-pointer"
            >
              Back
            </Button>
          )}
          <Button
            disabled={isSubmitting || !isStepValid()}
            onClick={() => {
              if (step === 4) handleSubmit();
              else if (step === 5) onClose();
              else nextStep();
            }}
            className="flex-[2] h-14 cursor-pointer rounded-2xl font-bold text-white bg-gradient-to-r from-[#9810FA] to-[#E60076] shadow-lg shadow-pink-100"
          >
            {isSubmitting
              ? "Submitting..."
              : step === 4
                ? "Submit Application"
                : step === 5
                  ? "Finish"
                  : "Next Step"}
            {!isSubmitting && step < 4 && (
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
          className={`w-full h-12 bg-slate-50 border-none rounded-xl ${icon ? "pl-10" : "pl-4"} pr-10 text-sm font-medium focus:ring-2 focus:ring-pink-100 outline-none appearance-none cursor-pointer custom-scrollbar max-h-56 relative z-0`}
        >
          <option value="" disabled>
            Select Option
          </option>
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
