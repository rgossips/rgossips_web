import React, { useState } from "react";
import { CATEGORIES as CATEGORIES_LIST } from "@/utils/categories";
import {
  ArrowLeft,
  Upload,
  Hash,
  ChevronDown,
  Eye,
  Activity,
  Trash2,
  Link,
  Calendar,
} from "lucide-react";

const EditReelModal = ({ reel, onClose, onSave, onDeleteTrigger }) => {
  const [formData, setFormData] = useState({ ...reel });
  const categories = CATEGORIES_LIST;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlatformChange = (platform) => {
    setFormData((prev) => ({ ...prev, platform }));
  };

  const handleCategoryChange = (e) => {
    setFormData((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleDateChange = (e) => {
    setFormData((prev) => ({ ...prev, date: e.target.value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, thumbnail: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm lg:p-6">
      <div className="bg-white w-full max-w-md lg:max-w-6xl h-[92vh] lg:h-[85vh] rounded-t-[2.5rem] lg:rounded-[3rem] shadow-2xl relative animate-in slide-in-from-bottom duration-300 flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="shrink-0 p-5 lg:px-10 lg:py-6 flex justify-between items-center border-b border-gray-50">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2.5 bg-pink-50 text-pink-500 rounded-2xl active:scale-90 transition-transform"
            >
              <ArrowLeft size={18} strokeWidth={3} />
            </button>
            <h3 className="font-black text-gray-900 lg:text-xl tracking-tight">
              Edit Reel
            </h3>
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-black text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
            <button
              className="px-8 py-2.5 bg-[#0AA573] text-white text-xs font-black rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-100"
              onClick={() => onSave(formData)}
            >
              Save Changes
            </button>
          </div>

          <button
            className="lg:hidden px-5 py-2 bg-[#0AA573] text-white text-[11px] font-black rounded-full shadow-lg shadow-green-100"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>

        {/* Main Content Area - Scrollable on Right Only for Laptop */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden no-scrollbar">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left Sidebar: Thumbnail - Sticky on Laptop */}
            <div className="w-full lg:w-[380px] p-6 lg:p-10 lg:border-r lg:border-gray-50 bg-gray-50/30 flex flex-col shrink-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Reel Preview
              </label>
              <div className="relative aspect-[9/16] w-full max-w-[280px] mx-auto lg:max-w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-white group">
                <img
                  src={formData.thumbnail}
                  className="w-full h-full object-cover"
                  alt="Thumb"
                />
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-4 py-1.5 rounded-full border border-white/20">
                  {formData.category}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <div className="bg-white text-pink-500 p-4 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Upload size={24} strokeWidth={3} />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </label>
              </div>
              <p className="mt-4 text-center text-[10px] font-bold text-gray-400">
                Resolution: 1080 x 1920 (Recommended)
              </p>
            </div>

            {/* Right Side: Form - Independently Scrollable */}
            <div className="flex-1 lg:overflow-y-auto p-6 lg:p-12 no-scrollbar">
              <div className="max-w-3xl space-y-10">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">
                      Basic Information
                    </h4>
                  </div>

                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase ml-1">
                        Reel Title
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-50 border border-transparent focus:border-pink-500 focus:bg-white rounded-2xl text-[13px] font-bold transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase ml-1">
                        Description
                      </label>
                      <textarea
                        rows={4}
                        name="description"
                        value={formData.description || ""}
                        onChange={handleChange}
                        className="w-full p-4 bg-gray-50 border border-transparent focus:border-pink-500 focus:bg-white rounded-2xl text-[13px] font-bold transition-all outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Platform & Category */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">
                      Classification
                    </h4>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase ml-1">
                        Content Category
                      </label>
                      <div className="relative">
                        <select
                          className="w-full p-4 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-[13px] font-black appearance-none outline-none"
                          value={formData.category}
                          onChange={handleCategoryChange}
                        >
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase ml-1">
                        Platform Distribution
                      </label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {["Instagram", "TikTok", "YouTube", "Facebook"].map(
                          (p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handlePlatformChange(p)}
                              className={`py-3.5 text-[11px] font-black rounded-2xl transition-all border ${formData.platform === p ? "bg-gray-900 text-white border-gray-900 shadow-xl" : "bg-white text-gray-400 border-gray-100 hover:border-gray-300"}`}
                            >
                              {p}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics & Meta */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">
                      Analytics & Meta
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                    <MetricBox
                      icon={<Eye size={16} />}
                      label="Views"
                      value={formData.views}
                    />
                    <MetricBox
                      icon={<Activity size={16} />}
                      label="Engagement"
                      value={formData.engagement}
                    />
                    <MetricBox
                      icon={<Hash size={16} />}
                      label="Internal Code"
                      value={formData.code}
                    />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase ml-1">
                        Video URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.url || ""}
                          className="flex-1 p-4 bg-gray-50 rounded-2xl text-[11px] font-bold text-blue-500 underline outline-none"
                          readOnly
                        />
                        <div className="p-4 bg-gray-100 text-gray-400 rounded-2xl">
                          <Link size={18} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase ml-1">
                        Publish Date
                      </label>
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <Calendar size={18} className="text-gray-400" />
                        <input
                          type="date"
                          value={
                            formData.date
                              ? new Date(formData.date)
                                  .toISOString()
                                  .slice(0, 10)
                              : ""
                          }
                          onChange={handleDateChange}
                          className="bg-transparent outline-none text-[13px] font-black text-gray-800 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="p-8 bg-red-50 rounded-[2.5rem] border border-red-100 flex flex-col lg:flex-row items-center justify-between gap-6 mt-12 mb-10">
                  <div>
                    <h4 className="text-red-600 text-xs font-black uppercase mb-1">
                      Delete this reel?
                    </h4>
                    <p className="text-[11px] text-red-400 font-bold max-w-sm">
                      This action cannot be undone. All engagement metrics for
                      this specific video will be removed.
                    </p>
                  </div>
                  <button
                    onClick={onDeleteTrigger}
                    className="w-full lg:w-auto px-8 py-3.5 bg-white text-red-500 border border-red-200 rounded-2xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 size={16} /> Delete Reel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Actions */}
        <div className="lg:hidden shrink-0 p-5 bg-white border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-xs font-black text-gray-500 bg-gray-50 rounded-2xl"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-[2] py-4 bg-[#0AA573] text-white rounded-2xl text-xs font-black shadow-lg shadow-green-100"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

const MetricBox = ({ icon, label, value }) => (
  <div className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-3">
    <div className="text-gray-400">{icon}</div>
    <div>
      <p className="text-[9px] text-gray-400 font-black uppercase">{label}</p>
      <p className="text-xs font-black text-gray-900">{value}</p>
    </div>
  </div>
);

export default EditReelModal;
