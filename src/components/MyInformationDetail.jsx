import React, { useState } from "react";
import {
  ArrowLeft,
  Share2,
  Plus,
  Edit2,
  Play,
  MapPin,
  Instagram,
  ExternalLink,
  X,
  Trash2,
  Eye,
  Activity,
  Calendar,
  Hash,
  Monitor,
  ChevronDown,
  Upload,
  CheckCircle,
} from "lucide-react";
import EditReelModal from "./EditReelModal";

// --- 1. View Details Modal ---
const ReelDetailsModal = ({ reel, onClose, onEdit }) => {
  if (!reel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        {/* Header Image */}
        <div className="relative h-64 w-full">
          <img
            src={reel.thumbnail}
            alt="Reel"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition"
          >
            <X size={20} />
          </button>
          <div className="absolute top-4 left-4 bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
            {reel.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">{reel.title}</h2>
            <p className="text-xs text-gray-500 mt-1">
              Follow me through a typical day. From morning routine to evening
              wind-down.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Eye size={14} />{" "}
                <span className="text-[10px] font-bold">Views</span>
              </div>
              <p className="text-lg font-black text-gray-900">{reel.views}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-pink-600 mb-1">
                <Activity size={14} />{" "}
                <span className="text-[10px] font-bold">Engagement</span>
              </div>
              <p className="text-lg font-black text-gray-900">
                {reel.engagement}
              </p>
            </div>
          </div>

          {/* Metadata List */}
          <div className="space-y-3 text-xs font-bold text-gray-600">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="flex items-center gap-2 text-gray-400">
                <Hash size={14} /> Video Code
              </span>
              <span>{reel.code}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="flex items-center gap-2 text-gray-400">
                <Monitor size={14} /> Platform
              </span>
              <span>{reel.platform}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} /> Upload Date
              </span>
              <span>{reel.date}</span>
            </div>
          </div>

          {/* Link Box */}
          <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-[10px] text-gray-400 truncate flex-1">
              https://instagram.com/reel/{reel.code}
            </p>
            <ExternalLink size={14} className="text-gray-400" />
          </div>

          {/* Edit Button */}
          <button
            onClick={onEdit}
            className="w-full py-4 cursor-pointer bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Edit2 size={16} /> Edit Reel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. Delete Confirmation Modal ---
const DeleteConfirmModal = ({ onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-xs rounded-[2rem] p-6 text-center animate-in zoom-in duration-200">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} />
        </div>
        <h3 className="text-lg font-black text-gray-900 mb-2">Delete Reel?</h3>
        <p className="text-xs text-gray-500 mb-6">
          Are you sure you want to delete &ldquo;Day in My Life&rdquo;? This action cannot
          be undone.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 rounded-xl border border-gray-200 font-bold text-gray-600 text-xs"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="py-3 rounded-xl bg-red-500 font-bold text-white text-xs shadow-lg shadow-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const MyInformationDetail = ({ onBack, onAddReel }) => {
  // Mock Data for Reels
  const [reels, setReels] = useState([
    {
      id: 1,
      title: "Day in My Life",
      views: "16.4K",
      engagement: "9.3%",
      code: "DEF90GH234",
      platform: "Instagram",
      date: "Dec 25, 2025",
      category: "Lifestyle",
      thumbnail:
        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400",
    },
    {
      id: 2,
      title: "Summer Skincare",
      views: "8.2K",
      engagement: "5.1%",
      code: "ABF12GH456",
      platform: "TikTok",
      date: "Jan 10, 2026",
      category: "Skincare",
      thumbnail:
        "https://images.unsplash.com/photo-1556228720-192752815143?w=400",
    },
    {
      id: 3,
      title: "Travel Vibes",
      views: "22.1K",
      engagement: "12%",
      code: "XYZ78KL901",
      platform: "YouTube",
      date: "Jan 15, 2026",
      category: "Travel",
      thumbnail:
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400",
    },
    {
      id: 4,
      title: "Grooming 101",
      views: "5.5K",
      engagement: "3.4%",
      code: "QWE34RT567",
      platform: "Instagram",
      date: "Feb 01, 2026",
      category: "Beauty",
      thumbnail:
        "https://images.unsplash.com/photo-1595867359976-52c67da4b729?w=400",
    },
    {
      id: 5,
      title: "Outfit Check",
      views: "45K",
      engagement: "15%",
      code: "JKL56YU789",
      platform: "TikTok",
      date: "Feb 05, 2026",
      category: "Fashion",
      thumbnail:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
    },
    {
      id: 6,
      title: "Healthy Eating",
      views: "10K",
      engagement: "7.8%",
      code: "BNM09IO123",
      platform: "Instagram",
      date: "Feb 10, 2026",
      category: "Food",
      thumbnail:
        "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    },
  ]);

  // UI States
  const [selectedReel, setSelectedReel] = useState(null); // The reel object currently active
  const [viewState, setViewState] = useState("none"); // 'details', 'edit', 'delete_confirm', 'none'

  const categories = ["All", "Lifestyle", "Travel", "Beauty", "Skincare"];
  const nicheTags = [
    "Lifestyle",
    "Travel",
    "Beauty",
    "Skincare",
    "Vloggers",
    "Health",
    "Fashion",
    "Food",
  ];

  // Handlers
  const openReelDetails = (reel) => {
    setSelectedReel(reel);
    setViewState("details");
  };

  const openEditMode = () => {
    setViewState("edit");
  };

  const openDeleteConfirm = () => {
    setViewState("delete_confirm");
  };

  const handleSaveReel = (updatedReel) => {
    setReels(reels.map((r) => (r.id === updatedReel.id ? updatedReel : r)));
    setViewState("none");
    setSelectedReel(null);
  };

  const handleDeleteReel = () => {
    setReels(reels.filter((r) => r.id !== selectedReel.id));
    setViewState("none");
    setSelectedReel(null);
  };

  const closeAll = () => {
    setViewState("none");
    setSelectedReel(null);
  };

  return (
    <main className="p-5 space-y-6 pb-24 relative lg:p-8 lg:space-y-0 lg:pb-8 min-h-screen lg:bg-gray-50 lg:pt-24">
      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-12 gap-8 max-w-7xl mx-auto">
        {/* Left Column: Profile & Categories */}
        <div className="col-span-4 flex flex-col gap-6">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="p-2 cursor-pointer bg-pink-100/50 rounded-full text-pink-500 w-fit active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Profile/Bio Card */}
          <section className="rounded-2xl p-[2.5px] shadow-sm relative" style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-pink-500 p-1 mb-4 shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
                className="w-full h-full object-cover rounded-2xl"
                alt="Profile"
              />
            </div>

            <h2 className="text-lg font-black text-center text-gray-900 leading-tight">
              Ali | Men&apos;s Grooming, Skincare & Lifestyle
            </h2>

            <div className="text-center mt-3 space-y-1">
              <p className="text-[10px] font-bold text-gray-600 flex items-center justify-center gap-1">
                <span className="text-gray-400">🎬</span> Men&apos;s Lifestyle,
                Skincare & Grooming
              </p>
              <p className="text-[10px] font-bold text-gray-600">
                ✨ Making you glow better, live better, look better
              </p>
              <p className="text-[10px] font-bold text-gray-400 italic">
                💌 Collabs | PR | Creator Guidance
              </p>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap justify-center">
              <div className="flex items-center gap-1 text-[9px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
                <MapPin size={12} /> Dehradun
              </div>
              <div className="flex items-center gap-1 text-[9px] font-black text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
                <Instagram size={12} /> @alilifestyleeditor
              </div>
            </div>

            <div className="flex gap-2 w-full mt-6">
              <button className="flex-1 btn-purple font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-100 active:scale-95 transition-transform text-sm">
                Email Me <Share2 size={14} />
              </button>
              <button className="border-2 border-pink-100 rounded-xl flex items-center justify-center text-pink-500 bg-pink-50/30 active:scale-95 transition-transform p-3">
                <ExternalLink size={18} />
              </button>
            </div>
            </div>
          </section>

          {/* Engagement Metrics */}
          <section className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <Activity size={16} /> Engagement Metrics
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-gray-600">
                    Engagement Rate
                  </span>
                </div>
                <span className="text-[10px] font-black text-blue-500">
                  9.2K
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-bold text-gray-600">
                    Avg. Engagement
                  </span>
                </div>
                <span className="text-[10px] font-black text-pink-500">
                  8.5%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-[10px] font-bold text-gray-600">
                    Followers
                  </span>
                </div>
                <span className="text-[10px] font-black text-purple-500">
                  2.3K
                </span>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-gray-800 text-sm">Categories</h3>
              <button className="text-[9px] font-black cursor-pointer text-gray-400 flex items-center gap-1 border border-gray-100 px-3 py-1 rounded-full hover:bg-gray-50">
                <Edit2 size={10} /> Edit
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {nicheTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-white border border-gray-100 text-[9px] font-bold text-gray-600 rounded-full shadow-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Videos & Stats */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* Offer Videos Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
              <h3 className="font-black text-gray-800 text-lg">Offer Videos</h3>
            </div>
            <button
              onClick={onAddReel}
              className="bg-[#EC4899] cursor-pointer text-white text-[10px] font-black px-5 py-2 rounded-full flex items-center gap-1 shadow-md active:scale-95 transition-transform"
            >
              <Plus size={14} strokeWidth={3} /> Add
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-2 no-scrollbar">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${
                  idx === 0
                    ? "btn-purple shadow-md shadow-pink-100"
                    : "bg-white border border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Video Grid - 3 Columns for Desktop */}
          <div className="grid grid-cols-3 gap-4">
            {reels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => openReelDetails(reel)}
                className="relative aspect-[3/4.5] rounded-2xl overflow-hidden shadow-sm group cursor-pointer border border-gray-100"
              >
                <img
                  src={reel.thumbnail}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={reel.title}
                />
                {/* Overlay Tags */}
                <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md border border-white/40 px-3 py-1 rounded-full text-[7px] font-black text-white uppercase tracking-wider">
                  {reel.category}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openReelDetails(reel);
                  }}
                  className="absolute top-3 cursor-pointer right-3 bg-white/90 p-1.5 rounded-full text-gray-800 shadow-sm hover:bg-white transition-colors"
                >
                  <Edit2 size={10} />
                </button>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="bg-white/90 text-gray-800 text-[8px] font-black px-2 py-0.5 rounded-md inline-block mb-1">
                    {reel.code}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-white">
                    <Play size={10} fill="currentColor" /> {reel.views} views
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Performance */}
          <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-black text-gray-800 text-sm mb-4">
              Content Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-600 font-bold mb-1">
                  Lifestyle Content
                </p>
                <p className="text-2xl font-black text-gray-900">12.6M</p>
                <p className="text-[9px] text-blue-500 font-bold mt-1">views</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-[10px] text-purple-600 font-bold mb-1">
                  2 days ago
                </p>
                <p className="text-2xl font-black text-gray-900">287K</p>
                <p className="text-[9px] text-purple-500 font-bold mt-1">
                  views
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden space-y-6">
        {/* Header */}
        <button
          onClick={onBack}
          className="p-2 bg-pink-100/50 cursor-pointer rounded-full text-pink-500 mb-2 active:scale-90 transition-transform"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Profile/Bio Card (Static) */}
        <section className="rounded-[2.5rem] p-[2.5px] shadow-sm relative" style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}>
          <div className="bg-white rounded-[2.3rem] p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-pink-500 p-1 mb-4 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
              className="w-full h-full object-cover rounded-2xl"
              alt="Profile"
            />
          </div>

          <h2 className="text-xl font-black text-center text-gray-900 leading-tight">
            Ali | Men&apos;s Grooming, <br /> Skincare & Lifestyle
          </h2>

          <div className="text-center mt-3 space-y-1">
            <p className="text-[11px] font-bold text-gray-600 flex items-center justify-center gap-1">
              <span className="text-gray-400">🎬</span> Men&apos;s Lifestyle,
              Skincare & Grooming Tips
            </p>
            <p className="text-[11px] font-bold text-gray-600">
              ✨ Making you glow better, live better, look better
            </p>
            <p className="text-[11px] font-bold text-gray-400 italic">
              💌 Collabs | PR | Creator Guidance
            </p>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1 text-[10px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
              <MapPin size={12} /> Dehradun
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
              <Instagram size={12} /> @alilifestyleeditor
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 w-full mt-6">
            <button className="col-span-4 btn-purple font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-100 active:scale-95 transition-transform">
              Email Me <Share2 size={16} />
            </button>
            <button className="col-span-1 border-2 border-pink-100 rounded-2xl flex items-center justify-center text-pink-500 bg-pink-50/30 active:scale-95 transition-transform">
              <ExternalLink size={20} />
            </button>
          </div>
          </div>
        </section>

        {/* Categories */}
        <section className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-black text-gray-800 text-sm">Categories</h3>
            <button className="text-[10px] font-black cursor-pointer text-gray-400 flex items-center gap-1 border border-gray-100 px-3 py-1 rounded-full">
              <Edit2 size={10} /> Edit Profile
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {nicheTags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-white border border-gray-100 text-[10px] font-bold text-gray-600 rounded-full shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Offer Videos Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
              <h3 className="font-black text-gray-800 text-lg">Offer Videos</h3>
            </div>
            <button
              onClick={onAddReel}
              className="bg-[#EC4899] text-white text-[10px] font-black px-5 py-2 rounded-full flex items-center gap-1 shadow-md active:scale-95 transition-transform"
            >
              <Plus size={14} strokeWidth={3} /> Add
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-5 gap-2 no-scrollbar py-1">
            {categories.map((cat, idx) => (
              <button
                key={cat}
                className={`px-5 py-2 rounded-full text-[10px] font-black whitespace-nowrap transition-all ${
                  idx === 0
                    ? "btn-purple shadow-md shadow-pink-100"
                    : "bg-white border border-gray-100 text-gray-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Video Grid with Click Handlers */}
          <div className="grid grid-cols-2 gap-3">
            {reels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => openReelDetails(reel)}
                className="relative aspect-[3/4.5] rounded-[1.8rem] overflow-hidden shadow-sm group cursor-pointer"
              >
                <img
                  src={reel.thumbnail}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  alt={reel.title}
                />
                {/* Overlay Tags */}
                <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md border border-white/40 px-3 py-1 rounded-full text-[7px] font-black text-white uppercase tracking-wider">
                  {reel.category}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openReelDetails(reel);
                  }}
                  className="absolute top-3 right-3 cursor-pointer bg-white/90 p-1.5 rounded-full text-gray-800 shadow-sm hover:bg-white transition-colors"
                >
                  <Edit2 size={10} />
                </button>

                {/* Bottom Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                  <div className="bg-white/90 text-gray-800 text-[8px] font-black px-2 py-0.5 rounded-md inline-block mb-1">
                    {reel.code}
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-black text-white">
                    <Play size={10} fill="currentColor" /> {reel.views} views
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* --- MODALS RENDERED HERE --- */}
      {viewState === "details" && (
        <ReelDetailsModal
          reel={selectedReel}
          onClose={closeAll}
          onEdit={openEditMode}
        />
      )}

      {viewState === "edit" && (
        <EditReelModal
          reel={selectedReel}
          onClose={closeAll}
          onSave={handleSaveReel}
          onDeleteTrigger={openDeleteConfirm}
        />
      )}

      {viewState === "delete_confirm" && (
        <DeleteConfirmModal
          onCancel={() => setViewState("edit")} // Go back to edit
          onConfirm={handleDeleteReel}
        />
      )}
    </main>
  );
};

export default MyInformationDetail;
