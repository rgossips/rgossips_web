import React, { useState } from "react";
import { useTranslations } from "next-intl";
import AlertPopup from "@/components/AlertPopup";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Instagram,
  Youtube,
  Facebook,
  Music2, // For TikTok
  Sparkles,
  Camera,
  Utensils,
  Plane,
  Heart,
  Shirt,
  Smile,
} from "lucide-react";

export default function AddReelFlow({ onBack }) {
  const t = useTranslations("AddReelFlow");
  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()
  const [step, setStep] = useState(1);
  const [uploadMethod, setUploadMethod] = useState("url"); // 'url' or 'file'

  // Form State
  const [formData, setFormData] = useState({
    url: "",
    file: null,
    thumbnail: null,
    title: "",
    description: "",
    category: "Lifestyle",
    platform: "Instagram",
    views: "",
    engagement: "",
  });

  const categories = [
    { key: "beautySkincare", name: "Beauty & Skincare", icon: Sparkles, color: "text-pink-500" },
    { key: "fashionLifestyle", name: "Fashion & Lifestyle", icon: Shirt, color: "text-purple-500" },
    { key: "foodBeverage", name: "Food & Beverage", icon: Utensils, color: "text-orange-500" },
    { key: "healthFitnessWellness", name: "Health, Fitness & Wellness", icon: Heart, color: "text-green-500" },
    { key: "travelHospitality", name: "Travel & Hospitality", icon: Plane, color: "text-blue-500" },
    { key: "technologyGadgets", name: "Technology & Gadgets", icon: Camera, color: "text-slate-600" },
    { key: "gamingEntertainment", name: "Gaming & Entertainment", icon: Smile, color: "text-red-500" },
    { key: "educationCareer", name: "Education & Career", icon: Sparkles, color: "text-blue-600" },
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePublish = () => {
    // Show a success popup; navigate back only once it's dismissed (else the
    // component unmounts before the message is seen).
    setPopup({ title: t("publishedTitle"), message: t("publishedMessage"), tone: "success" });
  };

  return (
    <div className="w-full max-w-md lg:max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden min-h-full relative flex flex-col">
      {/* --- Header Section --- */}
      <div className="pt-8 px-6 pb-2 bg-white z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="w-10 h-10 cursor-pointer rounded-full bg-pink-50 text-pink-500 flex items-center justify-center hover:bg-pink-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-xs text-gray-400 font-medium">
              {t("stepOf", { step })}
            </p>
          </div>
        </div>

        {/* Segmented Gradient Progress Bars */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step
                  ? "bg-gradient-to-r from-pink-500 to-purple-600"
                  : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        {/* Green Bubble Step Indicators */}
        <div className="flex justify-between items-center px-2 mb-4">
          <StepPill
            number={1}
            label={t("steps.upload")}
            active={step >= 1}
            current={step === 1}
          />
          <StepPill
            number={2}
            label={t("steps.details")}
            active={step >= 2}
            current={step === 2}
          />
          <StepPill
            number={3}
            label={t("steps.preview")}
            active={step >= 3}
            current={step === 3}
          />
        </div>
      </div>

      {/* --- Scrollable Content Area --- */}
      <div className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar">
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pt-2"
            >
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-800">
                  {t("chooseUploadMethod")}
                </h3>
                <div className="flex bg-pink-50/50 p-1.5 rounded-xl">
                  <button
                    onClick={() => setUploadMethod("url")}
                    className={`flex-1 cursor-pointer py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                      uploadMethod === "url"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    <LinkIcon size={16} /> {t("videoUrl")}
                  </button>
                  <button
                    onClick={() => setUploadMethod("file")}
                    className={`flex-1 cursor-pointer py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                      uploadMethod === "file"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400"
                    }`}
                  >
                    <Upload size={16} /> {t("uploadFile")}
                  </button>
                </div>
              </div>

              {uploadMethod === "url" ? (
                <div className="space-y-2">
                  <Label text={t("videoUrl")} required />
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <LinkIcon size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="https://instagram.com/reel/..."
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 text-sm rounded-xl focus:ring-pink-500 focus:border-pink-500 block p-4 pl-12 font-medium outline-none"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {["Instagram", "TikTok", "YouTube", "Facebook"].map((p) => (
                      <span
                        key={p}
                        className="bg-white border border-gray-200 text-[10px] font-bold px-2 py-1 rounded-md text-gray-500"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-pink-200 rounded-3xl p-10 flex flex-col items-center justify-center bg-pink-50/20">
                  <div className="text-pink-500 mb-3">
                    <Upload size={32} />
                  </div>
                  <p className="text-sm font-bold text-gray-800 mb-1">
                    {t("clickToUpload")}
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    {t("videoFormats")}
                  </p>
                  <button className="px-6 cursor-pointer py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg shadow-pink-200">
                    {t("browseFiles")}
                  </button>
                </div>
              )}

              {/* Thumbnail Section (Missing in previous code) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label text={t("thumbnail")} />
                  <span className="text-xs text-gray-400">{t("optional")}</span>
                </div>
                <div className="border border-gray-100 rounded-3xl h-40 flex flex-col items-center justify-center bg-white shadow-sm">
                  <div className="w-10 h-10 bg-pink-50 text-pink-500 rounded-xl flex items-center justify-center mb-2">
                    <ImageIcon size={20} />
                  </div>
                  <p className="text-xs font-bold text-gray-700">
                    {t("uploadCustomThumbnail")}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {t("thumbnailFormats")}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pt-2"
            >
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800">
                  {t("basicInformation")}
                </h3>
                <div>
                  <Label text={t("titleLabel")} required />
                  <input
                    placeholder={t("titlePlaceholder")}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-pink-500 transition-colors"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label text={t("description")} />
                  <textarea
                    placeholder={t("descriptionPlaceholder")}
                    rows={4}
                    className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-pink-500 transition-colors resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                  <p className="text-[10px] text-gray-400 mt-2">
                    {t("descriptionHint")}
                  </p>
                </div>
              </div>

              {/* Category & Platform */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-800">
                  {t("categoryAndPlatform")}
                </h3>

                {/* Category Grid */}
                <div>
                  <Label text={t("category")} required />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() =>
                          setFormData({ ...formData, category: cat.name })
                        }
                        className={`flex cursor-pointer items-center gap-2 p-3 rounded-xl border transition-all ${
                          formData.category === cat.name
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-full bg-white shadow-sm ${cat.color}`}
                        >
                          <cat.icon size={14} />
                        </div>
                        <span
                          className={`text-xs font-bold ${formData.category === cat.name ? "text-gray-900" : "text-gray-500"}`}
                        >
                          {t(`categories.${cat.key}`)}
                        </span>
                        {formData.category === cat.name && (
                          <div className="ml-auto text-pink-500">
                            <Check size={14} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Buttons */}
                <div>
                  <Label text={t("platform")} required />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <PlatformButton
                      name="Instagram"
                      active={formData.platform === "Instagram"}
                      onClick={() =>
                        setFormData({ ...formData, platform: "Instagram" })
                      }
                    />
                    <PlatformButton
                      name="TikTok"
                      active={formData.platform === "TikTok"}
                      onClick={() =>
                        setFormData({ ...formData, platform: "TikTok" })
                      }
                    />
                    <PlatformButton
                      name="YouTube"
                      active={formData.platform === "YouTube"}
                      onClick={() =>
                        setFormData({ ...formData, platform: "YouTube" })
                      }
                    />
                    <PlatformButton
                      name="Facebook"
                      active={formData.platform === "Facebook"}
                      onClick={() =>
                        setFormData({ ...formData, platform: "Facebook" })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="text-sm font-bold text-gray-800">
                    {t("performanceMetrics")}
                  </h3>
                  <span className="text-xs text-gray-400">{t("optional")}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label text={t("views")} />
                    <input
                      placeholder={t("viewsPlaceholder")}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500"
                      value={formData.views}
                      onChange={(e) =>
                        setFormData({ ...formData, views: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label text={t("engagementRate")} />
                    <input
                      placeholder={t("engagementPlaceholder")}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-pink-500"
                      value={formData.engagement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          engagement: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">
                  {t("metricsHint")}
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 pt-4"
            >
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("reviewYourReel")}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("checkDetails")}
                  </p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 p-4 border border-pink-100 rounded-xl bg-pink-50/30">
                    <div className="flex items-center gap-2 mb-2 text-pink-500">
                      <Instagram size={16} />{" "}
                      <span className="text-[10px] font-bold uppercase">
                        {t("platform")}
                      </span>
                    </div>
                    <p className="font-bold text-gray-800">
                      {formData.platform}
                    </p>
                  </div>
                  <div className="flex-1 p-4 border border-pink-100 rounded-xl bg-pink-50/30">
                    <div className="flex items-center gap-2 mb-2 text-pink-500">
                      <Sparkles size={16} />{" "}
                      <span className="text-[10px] font-bold uppercase">
                        {t("category")}
                      </span>
                    </div>
                    <p className="font-bold text-gray-800">
                      {formData.category}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex gap-4 items-start">
                  <div className="bg-orange-100 p-2 rounded-full text-orange-500">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      {t("readyToPublish")}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {t("readyToPublishDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Footer Actions --- */}
      <div className="absolute bottom-0 w-full bg-white border-t border-gray-50 p-5 z-20">
        <div className="flex gap-4">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-4 bg-white cursor-pointer border border-gray-100 text-gray-500 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              {t("back")}
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex-1 py-4 cursor-pointer bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl shadow-xl shadow-pink-200 hover:shadow-pink-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {t("continueTo", {
                dest: step === 1 ? t("steps.details") : t("steps.preview"),
              })}
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="flex-1 py-4 bg-[#10b981] cursor-pointer text-white font-bold rounded-xl shadow-xl shadow-emerald-200 hover:bg-[#059669] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check size={18} strokeWidth={3} /> {t("publishReel")}
            </button>
          )}
        </div>
      </div>
      <AlertPopup
        popup={popup}
        onClose={() => {
          setPopup(null);
          if (onBack) onBack();
        }}
      />
    </div>
  );
}

// --- Helper Components ---

const StepPill = ({ number, label, active, current }) => (
  <div
    className={`px-4 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
      active
        ? "bg-[#10b981] text-white shadow-lg shadow-emerald-100"
        : "bg-white border border-gray-200 text-gray-400"
    }`}
  >
    {active ? (
      <Check size={12} strokeWidth={4} />
    ) : (
      <span className="text-[10px] font-black">{number}.</span>
    )}
    <span className="text-[10px] font-bold uppercase tracking-wide">
      {label}
    </span>
  </div>
);

const Label = ({ text, required }) => (
  <label className="text-xs font-bold text-gray-800 mb-1.5 block">
    {text} {required && <span className="text-pink-500">*</span>}
  </label>
);

const PlatformButton = ({ name, active, onClick }) => (
  <button
    onClick={onClick}
    className={`py-3 px-4 cursor-pointer rounded-xl text-xs font-bold transition-all ${
      active
        ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-pink-200"
        : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
    }`}
  >
    {name}
  </button>
);
