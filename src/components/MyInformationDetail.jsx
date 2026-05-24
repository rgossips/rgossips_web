import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Cropper from "react-easy-crop";
import {
  ArrowLeft,
  Share2,
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
  Camera,
  Mail,
  Phone,
  Save,
  Loader2,
  Check,
  ChevronDown,
  Video,
  Smartphone,
  Youtube,
  Image as ImageIcon,
  Clapperboard,
  Home,
  IndianRupee,
  Globe,
} from "lucide-react";
import EditReelModal from "./EditReelModal";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// One card per submitted live link, keyed by URL + campaign. We render a
// list (not a grid) so the brand context — name, logo, status pill — has
// room to read. Desktop and mobile share the same shape.
const STATUS_BADGE = {
  live_submitted: { label: "Pending review", cls: "bg-amber-50 text-amber-700" },
  completed: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
};

const renderCampaignSubmissions = (links, loading, isDesktop) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm font-semibold text-gray-400 gap-2">
        <span className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-500 animate-spin" />
        Loading submissions…
      </div>
    );
  }
  if (links.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-sm font-bold text-gray-500">No live links submitted yet.</p>
        <p className="text-[11px] text-gray-400 mt-1">
          When a brand approves your application and you post the live content, it'll show up here with the brand details.
        </p>
      </div>
    );
  }
  return (
    <div className={isDesktop ? "grid grid-cols-2 gap-4" : "space-y-3"}>
      {links.map((l, i) => {
        const status = STATUS_BADGE[l.applicationStatus];
        return (
          <a
            key={`${l.campaignId}-${l.url}-${i}`}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
          >
            {l.brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={l.brandLogo}
                alt={l.brandName}
                className="w-12 h-12 rounded-2xl object-cover border border-gray-100 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-black flex items-center justify-center shrink-0">
                {(l.brandName || "?").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-black text-gray-900 truncate">{l.brandName}</p>
                {status && (
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${status.cls}`}>
                    {status.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">{l.campaignTitle}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">
                  {l.label}
                </span>
                <span className="text-[10px] text-gray-400 truncate font-medium max-w-full">
                  {l.url}
                </span>
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
};

// --- View Details Modal ---
const ReelDetailsModal = ({ reel, onClose, onEdit }) => {
  if (!reel) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="relative h-64 w-full">
          <img src={reel.thumbnail} alt="Reel" className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
            <X size={20} />
          </button>
          <div className="absolute top-4 left-4 bg-pink-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">{reel.category}</div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900">{reel.title}</h2>
            <p className="text-xs text-gray-500 mt-1">Follow me through a typical day.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Eye size={14} /> <span className="text-[10px] font-bold">Views</span>
              </div>
              <p className="text-lg font-black text-gray-900">{reel.views}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-2xl">
              <div className="flex items-center gap-2 text-pink-600 mb-1">
                <Activity size={14} /> <span className="text-[10px] font-bold">Engagement</span>
              </div>
              <p className="text-lg font-black text-gray-900">{reel.engagement}</p>
            </div>
          </div>
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
          <button onClick={onEdit} className="w-full py-4 cursor-pointer bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Edit2 size={16} /> Edit Reel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Delete Confirmation Modal ---
const DeleteConfirmModal = ({ onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
    <div className="bg-white w-full max-w-xs rounded-[2rem] p-6 text-center animate-in zoom-in duration-200">
      <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trash2 size={24} />
      </div>
      <h3 className="text-lg font-black text-gray-900 mb-2">Delete Reel?</h3>
      <p className="text-xs text-gray-500 mb-6">This action cannot be undone.</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="py-3 rounded-xl border border-gray-200 font-bold text-gray-600 text-xs">
          Cancel
        </button>
        <button onClick={onConfirm} className="py-3 rounded-xl bg-red-500 font-bold text-white text-xs shadow-lg shadow-red-200">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// --- Category Selection Modal ---
import { CATEGORIES as CATEGORY_OPTIONS } from "@/utils/categories";

const CategoryModal = ({ selected, onSave, onClose }) => {
  const [localSelected, setLocalSelected] = useState([...selected]);
  const [search, setSearch] = useState("");

  const toggle = (cat) => {
    setLocalSelected((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const filtered = CATEGORY_OPTIONS.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900">Select Categories</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full p-3 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-xl text-sm font-bold text-gray-700 outline-none transition-all"
          />
        </div>

        {/* Category Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            {filtered.map((cat) => {
              const isSelected = localSelected.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggle(cat)}
                  className={`px-4 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border ${
                    isSelected ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-200" : "bg-white text-gray-600 border-gray-200 hover:border-purple-200 hover:bg-purple-50"
                  }`}
                >
                  {isSelected && <span className="mr-1">✓</span>}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Selected count */}
          {localSelected.length > 0 && <p className="text-[10px] font-bold text-gray-400 mt-4">{localSelected.length} selected</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-500 active:scale-95 transition-all">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(localSelected);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-lg"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Save Categories
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Service Options (same as signup) ---
const SERVICE_OPTIONS = [
  { id: "reels", label: "Reels", icon: <Video size={20} /> },
  { id: "stories", label: "Stories", icon: <Smartphone size={20} /> },
  { id: "shorts", label: "YouTube Shorts", icon: <Youtube size={20} /> },
  { id: "posts", label: "Static Posts", icon: <ImageIcon size={20} /> },
  { id: "ugc", label: "UGC Videos", icon: <Clapperboard size={20} /> },
];

// --- Services & Rates Modal ---
const ServicesRatesModal = ({ services, rates, onSave, onClose }) => {
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
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom sm:zoom-in duration-200 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-900">Services & Rates</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
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
          <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-sm font-black text-gray-500 active:scale-95 transition-all">
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(localServices, localRates);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl text-white text-sm font-black active:scale-95 transition-all shadow-lg"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Input ---
const InputGroup = ({ label, value, onChange, placeholder, icon, disabled }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{label}</label>
    <div className="relative flex items-center">
      {icon && <div className="absolute left-4">{icon}</div>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-4 ${icon ? "pl-12" : "pl-5"} bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-2xl text-sm font-bold text-gray-700 outline-none transition-all ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </div>
  </div>
);

// --- Main Component ---
const MyInformationDetail = ({ onBack }) => {
  const { profile, user, refreshProfile } = useAuth();

  // Editable fields initialized from profile
  const [name, setName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [email, setEmail] = useState(profile?.email || user?.email || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [tiktok, setTiktok] = useState(profile?.tiktok_url || "");
  const [youtubeUrl, setYoutubeUrl] = useState(profile?.youtube_url || "");
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url || "");
  const [editCategories, setEditCategories] = useState(profile?.categories || []);
  const [editServices, setEditServices] = useState(profile?.services || []);
  const [serviceRates, setServiceRates] = useState(profile?.service_rates || {});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Live links the user has submitted on accepted campaigns. Pulled from
  // list-campaigns which already joins through to brand info so we don't
  // have to chase brand_profiles / brand_invitations here.
  const [campaignSubmissions, setCampaignSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
          body: JSON.stringify({ influencerId: user.id }),
        });
        const data = await res.json();
        if (cancelled) return;
        setCampaignSubmissions(Array.isArray(data?.campaigns) ? data.campaigns : []);
      } catch (e) {
        console.error("Failed to fetch campaign submissions:", e);
      } finally {
        if (!cancelled) setSubmissionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Flatten campaigns into one card per submitted live link, keeping the
  // brand context attached. Status is `live_submitted` (waiting for brand
  // approval) or `completed` (paid out). Anything earlier hasn't gone live.
  const submittedLiveLinks = useMemo(() => {
    const items = [];
    for (const c of campaignSubmissions) {
      const isLive = c.applicationStatus === "live_submitted" || c.applicationStatus === "completed";
      if (!isLive) continue;
      const links = Array.isArray(c.submissionLinks) ? c.submissionLinks : [];
      for (const l of links) {
        if (!l?.url) continue;
        items.push({
          url: l.url,
          type: l.type || "link",
          label: l.label || "Live post",
          campaignId: c.id,
          campaignTitle: c.title || "Campaign",
          brandName: c.brandName || "Brand",
          brandLogo: c.brandLogo || "",
          brandInstagram: c.brandInstagram || "",
          applicationStatus: c.applicationStatus,
        });
      }
    }
    return items;
  }, [campaignSubmissions]);

  // Photo state
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [customPhoto, setCustomPhoto] = useState(profile?.custom_profile_photo_url || null);
  const fileInputRef = useRef(null);

  const userPhoto = customPhoto || profile?.custom_profile_photo_url || profile?.profile_photo_url;
  const userHandle = profile?.username || profile?.instagram_handle || "";
  const hasCustomPhoto = !!(customPhoto || profile?.custom_profile_photo_url);

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  // Photo handlers
  const handleEditPhoto = () => fileInputRef.current?.click();

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setShowCropper(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImg = async (src, pixelCrop) => {
    const image = new window.Image();
    image.src = src;
    await new Promise((resolve) => {
      image.onload = resolve;
    });
    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !imageSrc || uploading) return;
    setUploading(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("file", blob, "profile.jpg");
      const res = await fetch(`${supabaseUrl}/functions/v1/upload-profile-photo`, {
        method: "POST",
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      setCustomPhoto(data.url);
      setShowCropper(false);
      setImageSrc(null);
    } catch (err) {
      console.error("Failed to upload photo:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCustomPhoto = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ userId: user.id, table: "influencer_profiles", customProfilePhotoUrl: "" }),
      });
      setCustomPhoto(null);
    } catch (err) {
      console.error("Failed to remove photo:", err);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({
          userId: user.id,
          table: "influencer_profiles",
          name,
          bio,
          location,
          email,
          address,
          tiktokUrl: tiktok,
          youtubeUrl,
          facebookUrl,
          categories: editCategories,
          services: editServices,
          serviceRates,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setShowEditModal(false);
      }, 1200);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Reel state
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
      thumbnail: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400",
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
      thumbnail: "https://images.unsplash.com/photo-1619451427882-6aaaded0cc61?w=400",
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
      thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400",
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
      thumbnail: "https://images.unsplash.com/photo-1646376235675-e74224635744?w=400",
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
      thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
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
      thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    },
  ]);

  const [selectedReel, setSelectedReel] = useState(null);
  const [viewState, setViewState] = useState("none");

  const openReelDetails = (reel) => {
    setSelectedReel(reel);
    setViewState("details");
  };
  const openEditMode = () => setViewState("edit");
  const openDeleteConfirm = () => setViewState("delete_confirm");
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

  // Hidden file input
  const fileInput = <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />;

  // Profile card (shared between desktop & mobile)
  const profileCard = (isMobile) => (
    <section className={`rounded-2xl p-[2.5px] shadow-sm relative ${isMobile ? "rounded-[2.5rem]" : "h-full"}`} style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}>
      <div className={`bg-white ${isMobile ? "rounded-[2.3rem]" : "rounded-[calc(1rem-1px)] h-full"} p-6 flex flex-col items-center`}>
        {/* Profile Photo */}
        <div className="relative mb-4">
          {userPhoto ? (
            <div className="relative">
              <Image src={userPhoto} alt={name || "Profile"} width={96} height={96} className="w-24 h-24 rounded-3xl object-cover border-4 border-pink-500 p-1 shadow-lg" />
              <div onClick={handleEditPhoto} className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                <Camera size={12} className="text-white" />
              </div>
              {hasCustomPhoto && (
                <div onClick={handleRemoveCustomPhoto} className="absolute -top-1 -left-1 bg-red-500 p-1 rounded-full border-2 border-white cursor-pointer shadow-md" title="Remove custom photo">
                  <X size={8} className="text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#FF2D78] to-[#FF6BA1] flex items-center justify-center text-white text-2xl font-bold border-4 border-pink-500 p-1 shadow-lg">
              {(name || "U")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
              <div onClick={handleEditPhoto} className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                <Camera size={12} className="text-white" />
              </div>
            </div>
          )}
        </div>

        <h2 className={`${isMobile ? "text-xl" : "text-lg"} font-black text-center text-gray-900 leading-tight`}>{name || "Your Name"}</h2>

        {userHandle && <p className="text-xs text-gray-400 font-bold mt-1">@{userHandle}</p>}

        {bio && <p className="text-[11px] font-bold text-gray-500 text-center mt-2 leading-relaxed max-w-xs">{bio}</p>}

        <div className="flex gap-2 mt-3 flex-wrap justify-center">
          {location && (
            <div className="flex items-center gap-1 text-[9px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full">
              <MapPin size={12} /> {location}
            </div>
          )}
          {userHandle && (
            <div className="flex items-center gap-1 text-[9px] font-black text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
              <Instagram size={12} /> @{userHandle}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="w-full mt-5 pt-4 border-t border-gray-100 flex justify-around items-center px-2">
          <div className="flex flex-col items-center">
            <span className="font-black text-gray-900 text-sm">{formatCount(profile?.media_count)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Posts</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="flex flex-col items-center">
            <span className="font-black text-gray-900 text-sm">{formatCount(profile?.followers_count)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Followers</span>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="flex flex-col items-center">
            <span className="font-black text-gray-900 text-sm">{formatCount(profile?.follows_count)}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Following</span>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => setShowEditModal(true)}
          className="w-full mt-4 py-3 rounded-xl text-white text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
          style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
        >
          <Edit2 size={14} /> Edit Profile
        </button>
      </div>
    </section>
  );

  // Edit form (shared)
  const editForm = (isMobile) => (
    <div className="space-y-5">
      {/* Basic Information */}
      <section className={`bg-white ${isMobile ? "p-6 rounded-[2.5rem]" : "p-6 rounded-2xl"} border border-gray-100 shadow-sm space-y-5`}>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Basic Information</h3>
        <InputGroup label="Display Name" value={name} onChange={setName} placeholder="Your full name" />
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="w-full p-4 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-2xl text-sm font-bold text-gray-700 min-h-[100px] outline-none transition-all"
          />
        </div>
      </section>

      {/* Contact Information */}
      <section className={`bg-white ${isMobile ? "p-6 rounded-[2.5rem]" : "p-6 rounded-2xl"} border border-gray-100 shadow-sm space-y-5`}>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Information</h3>
        <InputGroup label="Location" value={location} onChange={setLocation} placeholder="Your city" icon={<MapPin size={16} className="text-pink-500" />} />
        <InputGroup label="Email Address" value={email} onChange={setEmail} placeholder="you@email.com" icon={<Mail size={16} className="text-pink-500" />} />
        <InputGroup label="Phone Number" value={user?.phone || profile?.phone || ""} onChange={() => {}} placeholder="Not available" icon={<Phone size={16} className="text-pink-500" />} disabled />
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Address</label>
          <div className="relative flex items-start">
            <div className="absolute left-4 top-4">
              <Home size={16} className="text-pink-500" />
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Your full address..."
              className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 focus:border-purple-300 focus:bg-white rounded-2xl text-sm font-bold text-gray-700 min-h-[80px] outline-none transition-all resize-none"
            />
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className={`bg-white ${isMobile ? "p-6 rounded-[2.5rem]" : "p-6 rounded-2xl"} border border-gray-100 shadow-sm space-y-5`}>
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Social Media</h3>
        <InputGroup label="Instagram Handle" value={userHandle ? `@${userHandle}` : ""} onChange={() => {}} placeholder="@username" icon={<Instagram size={16} className="text-pink-500" />} disabled />
        <p className="text-[9px] font-bold text-gray-400 ml-1">Instagram handle is synced from your connected account</p>
        <InputGroup label="TikTok" value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@username" icon={<Video size={16} className="text-pink-500" />} />
        <InputGroup label="YouTube" value={youtubeUrl} onChange={setYoutubeUrl} placeholder="https://youtube.com/@channel" icon={<Youtube size={16} className="text-pink-500" />} />
        <InputGroup label="Facebook" value={facebookUrl} onChange={setFacebookUrl} placeholder="https://facebook.com/page" icon={<Globe size={16} className="text-pink-500" />} />
      </section>

      {/* Categories */}
      <section className={`bg-white ${isMobile ? "p-6 rounded-[2.5rem]" : "p-6 rounded-2xl"} border border-gray-100 shadow-sm space-y-4`}>
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categories</h3>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="text-[10px] font-black text-purple-500 flex items-center gap-1 border border-purple-100 px-3 py-1 rounded-full hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <Edit2 size={10} /> Edit
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editCategories.length > 0 ? (
            editCategories.map((tag) => (
              <span key={tag} className="px-4 py-2 bg-purple-50 border border-purple-100 text-[10px] font-bold text-purple-700 rounded-full">
                {tag}
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-400 font-bold">No categories selected. Tap Edit to add.</p>
          )}
        </div>
      </section>

      {/* Services & Rates */}
      <section className={`bg-white ${isMobile ? "p-6 rounded-[2.5rem]" : "p-6 rounded-2xl"} border border-gray-100 shadow-sm space-y-4`}>
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Services & Rates</h3>
          <button
            onClick={() => setShowServicesModal(true)}
            className="text-[10px] font-black text-purple-500 flex items-center gap-1 border border-purple-100 px-3 py-1 rounded-full hover:bg-purple-50 transition-colors cursor-pointer"
          >
            <Edit2 size={10} /> Edit
          </button>
        </div>
        {editServices.length > 0 ? (
          <div className="space-y-2.5">
            {editServices.map((svcId) => {
              const svc = SERVICE_OPTIONS.find((s) => s.id === svcId);
              if (!svc) return null;
              const rate = serviceRates[svcId];
              return (
                <div key={svcId} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-purple-500 shrink-0">{svc.icon}</div>
                  <span className="text-xs font-bold text-gray-700 flex-1">{svc.label}</span>
                  {rate ? (
                    <span className="text-xs font-black text-green-600 flex items-center gap-0.5">
                      <IndianRupee size={11} />
                      {Number(rate).toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400">No rate set</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-400 font-bold">No services selected. Tap Edit to add.</p>
        )}
      </section>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white text-sm font-black transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-lg"
        style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
      </button>
    </div>
  );

  // Video card (reusable)
  const videoCard = (reel, isDesktop) => (
    <div
      key={reel.id}
      onClick={() => openReelDetails(reel)}
      className={`relative overflow-hidden shadow-sm group cursor-pointer border border-gray-100 ${isDesktop ? "aspect-[3/4] rounded-2xl" : "aspect-[3/4.5] rounded-[1.8rem]"}`}
    >
      <img src={reel.thumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={reel.title} />
      <div className="absolute top-3 left-3 bg-white/30 backdrop-blur-md border border-white/40 px-3 py-1 rounded-full text-[7px] font-black text-white uppercase tracking-wider">{reel.category}</div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <p className="text-[10px] font-bold text-white/80 mb-0.5">{reel.title}</p>
        <div className="flex items-center gap-1 text-[9px] font-black text-white">
          <Play size={10} fill="currentColor" /> {reel.views} views
        </div>
      </div>
    </div>
  );

  return (
    <main className="p-5 space-y-6 pb-24 relative lg:p-8 lg:space-y-0 lg:pb-8 min-h-screen lg:bg-gray-50 lg:pt-24">
      {fileInput}

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-7xl mx-auto space-y-8">
        {/* Top Row: Back + Profile Card (full width) */}
        <div className="flex items-start gap-6">
          <button onClick={onBack} className="p-2 cursor-pointer bg-pink-100/50 rounded-full text-pink-500 mt-1 shrink-0 active:scale-90 transition-transform">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="grid grid-cols-12 gap-6 items-stretch">
              {/* Profile Card */}
              <div className="col-span-4">{profileCard(false)}</div>

              {/* Engagement Metrics */}
              <div className="col-span-4">
                <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full flex flex-col">
                  <h3 className="font-black text-gray-800 text-base flex items-center gap-2 mb-4">
                    <Activity size={18} /> Engagement Metrics
                  </h3>
                  <div className="space-y-3 flex-1 flex flex-col justify-evenly">
                    {[
                      { label: "Engagement Rate", value: profile?.engagement_rate ? `${profile.engagement_rate}%` : "—", color: "blue" },
                      { label: "Followers", value: formatCount(profile?.followers_count), color: "purple" },
                      { label: "Avg Likes", value: profile?.avg_likes ? formatCount(profile.avg_likes) : "—", color: "pink" },
                      { label: "Avg Comments", value: profile?.avg_comments ? formatCount(profile.avg_comments) : "—", color: "green" },
                      { label: "Impressions", value: profile?.total_impressions ? formatCount(profile.total_impressions) : "—", color: "amber" },
                      { label: "Reach", value: profile?.total_reach ? formatCount(profile.total_reach) : "—", color: "red" },
                    ].map((m) => (
                      <div key={m.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${m.color}-500`} />
                          <span className="text-sm font-bold text-gray-600">{m.label}</span>
                        </div>
                        <span className={`text-sm font-black text-${m.color}-500`}>{m.value}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Growth Chart */}
              <div className="col-span-4">
                <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={18} className="text-purple-500" />
                    <h3 className="font-black text-gray-800 text-base">Growth Overview</h3>
                  </div>
                  <div className="flex-1 flex items-center">
                    <Line
                      data={{
                        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                        datasets: [
                          {
                            fill: true,
                            label: "Followers",
                            data: [
                              Math.round((profile?.followers_count || 5000) * 0.6),
                              Math.round((profile?.followers_count || 5000) * 0.7),
                              Math.round((profile?.followers_count || 5000) * 0.78),
                              Math.round((profile?.followers_count || 5000) * 0.85),
                              Math.round((profile?.followers_count || 5000) * 0.93),
                              profile?.followers_count || 5000,
                            ],
                            borderColor: "#9810FA",
                            borderWidth: 2.5,
                            backgroundColor: (context) => {
                              const ctx = context.chart.ctx;
                              const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                              gradient.addColorStop(0, "rgba(152, 16, 250, 0.2)");
                              gradient.addColorStop(1, "rgba(152, 16, 250, 0)");
                              return gradient;
                            },
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: "#9810FA",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 2,
                          },
                          {
                            fill: true,
                            label: "Engagement",
                            data: [3.2, 4.1, 3.8, 5.0, 4.6, profile?.engagement_rate || 5.2],
                            borderColor: "#E60076",
                            borderWidth: 2.5,
                            backgroundColor: (context) => {
                              const ctx = context.chart.ctx;
                              const gradient = ctx.createLinearGradient(0, 0, 0, 180);
                              gradient.addColorStop(0, "rgba(230, 0, 118, 0.15)");
                              gradient.addColorStop(1, "rgba(230, 0, 118, 0)");
                              return gradient;
                            },
                            tension: 0.4,
                            pointRadius: 3,
                            pointBackgroundColor: "#E60076",
                            pointBorderColor: "#fff",
                            pointBorderWidth: 2,
                            yAxisID: "y1",
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { intersect: false, mode: "index" },
                        plugins: {
                          legend: { display: false },
                          tooltip: { backgroundColor: "#1a1a1a", titleFont: { size: 11, weight: "bold" }, bodyFont: { size: 11 }, padding: 10, cornerRadius: 10 },
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { font: { size: 10, weight: "bold" }, color: "#9ca3af" } },
                          y: { position: "left", grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 9 }, color: "#9ca3af", callback: (v) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v) } },
                          y1: { position: "right", grid: { display: false }, ticks: { font: { size: 9 }, color: "#9ca3af", callback: (v) => v + "%" }, min: 0, max: 10 },
                        },
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-5 mt-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#9810FA]" />
                      <span className="text-[10px] font-bold text-gray-500">Followers</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#E60076]" />
                      <span className="text-[10px] font-bold text-gray-500">Engagement %</span>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Submissions — live links posted on accepted campaigns */}
        <div className="ml-12 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            <h3 className="font-black text-gray-800 text-lg">Campaign Submissions</h3>
            <span className="text-xs font-bold text-gray-400 ml-2">
              {submittedLiveLinks.length} live link{submittedLiveLinks.length === 1 ? "" : "s"}
            </span>
          </div>
          {renderCampaignSubmissions(submittedLiveLinks, submissionsLoading, true)}
        </div>

        {/* Full Video Grid */}
        <div className="ml-12 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
            <h3 className="font-black text-gray-800 text-lg">My Work</h3>
            <span className="text-xs font-bold text-gray-400 ml-2">{reels.length} videos</span>
          </div>
          <div className="grid grid-cols-4 gap-4">{reels.map((reel) => videoCard(reel, true))}</div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden space-y-6">
        <button onClick={onBack} className="p-2 bg-pink-100/50 cursor-pointer rounded-full text-pink-500 mb-2 active:scale-90 transition-transform">
          <ArrowLeft size={20} />
        </button>

        {profileCard(true)}

        {/* Engagement Metrics — Mobile */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="font-black text-gray-800 text-base flex items-center gap-2">
            <Activity size={18} /> Engagement Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Engagement", value: profile?.engagement_rate ? `${profile.engagement_rate}%` : "—", color: "blue" },
              { label: "Followers", value: formatCount(profile?.followers_count), color: "purple" },
              { label: "Avg Likes", value: profile?.avg_likes ? formatCount(profile.avg_likes) : "—", color: "pink" },
              { label: "Avg Comments", value: profile?.avg_comments ? formatCount(profile.avg_comments) : "—", color: "green" },
              { label: "Impressions", value: profile?.total_impressions ? formatCount(profile.total_impressions) : "—", color: "amber" },
              { label: "Reach", value: profile?.total_reach ? formatCount(profile.total_reach) : "—", color: "cyan" },
            ].map((m) => (
              <div key={m.label} className="bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[9px] font-black text-gray-400 uppercase">{m.label}</p>
                <p className={`text-base font-black text-${m.color}-500 mt-0.5`}>{m.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Campaign Submissions — Mobile */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            <h3 className="font-black text-gray-800 text-lg">Campaign Submissions</h3>
            <span className="text-xs font-bold text-gray-400 ml-1">{submittedLiveLinks.length}</span>
          </div>
          {renderCampaignSubmissions(submittedLiveLinks, submissionsLoading, false)}
        </section>

        {/* My Work — Mobile */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-pink-500 rounded-full" />
            <h3 className="font-black text-gray-800 text-lg">My Work</h3>
            <span className="text-xs font-bold text-gray-400 ml-1">{reels.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">{reels.map((reel) => videoCard(reel, false))}</div>
        </section>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="fixed inset-0 z-[60] lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[95%] lg:max-w-xl lg:max-h-[90vh] lg:rounded-2xl bg-white flex flex-col overflow-hidden lg:shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base lg:text-lg font-black text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-6">{editForm(false)}</div>
          </div>
        </>
      )}

      {/* Crop Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 bg-black/50">
            <button
              onClick={() => {
                setShowCropper(false);
                setImageSrc(null);
              }}
              className="text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <h3 className="text-white text-sm font-bold">Crop Photo</h3>
            <button
              onClick={handleCropSave}
              disabled={uploading}
              className="text-sm font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)", color: "white" }}
            >
              {uploading ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="flex-1 relative">
            <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={1} cropShape="rect" onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div className="px-8 py-5 bg-black/50 flex items-center gap-4">
            <span className="text-white/60 text-xs font-bold shrink-0">Zoom</span>
            <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-purple-500" />
          </div>
        </div>
      )}

      {/* Reel Modals */}
      {viewState === "details" && <ReelDetailsModal reel={selectedReel} onClose={closeAll} onEdit={openEditMode} />}
      {viewState === "edit" && <EditReelModal reel={selectedReel} onClose={closeAll} onSave={handleSaveReel} onDeleteTrigger={openDeleteConfirm} />}
      {viewState === "delete_confirm" && <DeleteConfirmModal onCancel={() => setViewState("edit")} onConfirm={handleDeleteReel} />}
      {showCategoryModal && <CategoryModal selected={editCategories} onSave={setEditCategories} onClose={() => setShowCategoryModal(false)} />}
      {showServicesModal && (
        <ServicesRatesModal
          services={editServices}
          rates={serviceRates}
          onSave={(svcs, rates) => {
            setEditServices(svcs);
            setServiceRates(rates);
          }}
          onClose={() => setShowServicesModal(false)}
        />
      )}
    </main>
  );
};

export default MyInformationDetail;
