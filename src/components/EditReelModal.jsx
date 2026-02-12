import React, { useState } from "react";
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
  const categories = [
    "Lifestyle",
    "Travel",
    "Beauty",
    "Skincare",
    "Vloggers",
    "Health",
    "Fashion",
    "Food",
  ];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle platform change
  const handlePlatformChange = (platform) => {
    setFormData((prev) => ({ ...prev, platform }));
  };

  // Handle category change
  const handleCategoryChange = (e) => {
    setFormData((prev) => ({ ...prev, category: e.target.value }));
  };

  // Handle date change
  const handleDateChange = (e) => {
    setFormData((prev) => ({ ...prev, date: e.target.value }));
  };

  // Handle thumbnail upload
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
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
      <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[95vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-y-auto no-scrollbar shadow-2xl relative animate-in slide-in-from-bottom duration-300">
        {/* Header - Fixed/Sticky */}
        <div className="sticky top-0 bg-white z-10 p-5 flex justify-between items-center border-b border-gray-50">
          <button
            onClick={onClose}
            className="p-2 bg-pink-50 text-pink-500 rounded-full"
          >
            <ArrowLeft size={18} />
          </button>
          <h3 className="font-black text-gray-900">Edit Reel</h3>
          <button
            className="px-5 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full"
            onClick={() => onSave(formData)}
          >
            Save
          </button>
        </div>

        <div className="p-6 space-y-8 pb-32">
          {/* Thumbnail Section */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-800 uppercase px-1">
              Thumbnail
            </label>
            <div className="relative aspect-[9/13] w-full max-w-[240px] mx-auto rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src={formData.thumbnail}
                className="w-full h-full object-cover"
                alt="Thumb"
              />
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full">
                {formData.category}
              </div>
              <label className="absolute top-4 right-4 bg-pink-500 text-white p-2 rounded-full shadow-lg cursor-pointer">
                <Upload size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </label>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-[10px] text-white/90 text-center font-medium">
                  Click the upload icon to change thumbnail
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            <h4 className="text-xs font-black text-gray-900 border-l-4 border-pink-500 pl-3">
              Basic Information
            </h4>

            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  placeholder="Describe your reel..."
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-pink-500 outline-none resize-none"
                />
              </div>

              {/* Video Code */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700">
                  Video Code
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-500 font-bold">
                  <Hash size={14} className="text-gray-400" /> {formData.code}
                </div>
              </div>
            </div>

            <h4 className="text-xs font-black text-gray-900 border-l-4 border-pink-500 pl-3 pt-4">
              Category & Platform
            </h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                    <Activity size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase">
                      Selected Category
                    </p>
                    <select
                      className="text-xs font-black text-gray-900 bg-transparent outline-none"
                      value={formData.category}
                      onChange={handleCategoryChange}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="text-gray-900">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {["Instagram", "TikTok", "YouTube", "Facebook"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePlatformChange(p)}
                    className={`py-3 text-[11px] font-black rounded-xl transition-all ${formData.platform === p ? "bg-pink-500 text-white shadow-lg shadow-pink-100" : "bg-gray-50 text-gray-400 border border-gray-100"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <h4 className="text-xs font-black text-gray-900 border-l-4 border-pink-500 pl-3 pt-4">
              Performance Metrics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                <Eye size={16} className="text-gray-400" />
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">
                    Views
                  </p>
                  <p className="text-xs font-black text-gray-900">
                    {formData.views}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                <Activity size={16} className="text-gray-400" />
                <div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">
                    Engagement
                  </p>
                  <p className="text-xs font-black text-gray-900">
                    {formData.engagement}
                  </p>
                </div>
              </div>
            </div>

            <h4 className="text-xs font-black text-gray-900 border-l-4 border-pink-500 pl-3 pt-4">
              Additional Details
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700">
                  Video URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="url"
                    value={formData.url || ""}
                    onChange={handleChange}
                    placeholder="https://instagram.com/reel/..."
                    className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs text-gray-400 truncate outline-none"
                  />
                  <button
                    className="p-4 bg-pink-500 text-white rounded-2xl"
                    tabIndex={-1}
                  >
                    <Link size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-700">
                  Upload Date
                </label>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-600">
                  <Calendar size={14} className="text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={
                      formData.date
                        ? new Date(formData.date).toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={handleDateChange}
                    className="bg-transparent outline-none text-xs font-bold text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-10 p-5 bg-red-50 rounded-[2rem] border border-red-100">
              <h4 className="text-red-600 text-[11px] font-black uppercase mb-1">
                Danger Zone
              </h4>
              <p className="text-[10px] text-red-400 mb-4 font-medium leading-relaxed">
                Once you delete this reel, it will be permanently removed from
                your portfolio.
              </p>
              <button
                onClick={onDeleteTrigger}
                className="w-full py-3 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-black flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Delete Reel
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-0 inset-x-0 p-5 bg-white/80 backdrop-blur-md border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl text-xs font-black"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            className="flex-2 px-10 py-4 bg-green-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-green-100"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditReelModal;
