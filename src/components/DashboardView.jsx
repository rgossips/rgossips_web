import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Cropper from "react-easy-crop";
import {
  Settings,
  Edit2,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  BarChart3,
  FileText,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  HelpCircle,
  Clock,
  Award,
  Crown,
  Zap,
  X,
  Hourglass,
  Briefcase,
  Gift,
} from "lucide-react";
import AlertPopup from "./AlertPopup";
import { StatCard } from "./StatCard";
import { HubCard } from "./HubCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useProfileCompletion } from "./CompleteProfileCard";
import { useTranslations } from "next-intl";

const TRIAL_DAYS = 30;

const ACTIVE_APP_STATUSES = new Set([
  "pending",
  "approved",
  "accepted",
  "submitted",
  "live_submitted",
  "revision_needed",
  "payment",
]);

const parseBudgetINR = (s) => {
  if (typeof s === "number") return s;
  if (!s) return 0;
  const digits = String(s).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
};

// What a campaign actually earns/will earn = the negotiated rate
// (finalAgreedRate stamped at escrow, else the brand's offered rate) — NOT
// the campaign's listed budget, which can differ from what was negotiated +
// paid. Falls back to the listed budget only when no rate exists yet.
const earnedAmountINR = (c) => {
  const final = Number(c?.finalAgreedRate) || 0;
  if (final > 0) return final;
  const offered = Number(c?.brandOfferedRate) || 0;
  if (offered > 0) return offered;
  return parseBudgetINR(c?.budget);
};

// COMMITTED amount for "expected earnings" — only money the creator is
// actually in line to receive: a negotiated/agreed rate. NO listed-budget
// fallback, so a still-pending application (applied, no accepted offer) does
// NOT inflate expected earnings. Completed campaigns are excluded upstream.
const committedAmountINR = (c) =>
  Number(c?.finalAgreedRate) || Number(c?.brandOfferedRate) || 0;

const formatINRCompact = (n) => {
  if (!Number.isFinite(n) || n <= 0) return "₹0";
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n >= 10_00_000 ? 1 : 2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

function getTrialInfo(profile) {
  const createdAt = profile?.created_at || profile?.updated_at;
  if (!createdAt) return { daysLeft: TRIAL_DAYS, progress: 0, expired: false };
  const start = new Date(createdAt);
  const now = new Date();
  const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - elapsed);
  const progress = Math.min(100, Math.round(((TRIAL_DAYS - daysLeft) / TRIAL_DAYS) * 100));
  return { daysLeft, progress, expired: daysLeft === 0 };
}

const DashboardView = ({
  onOpenInfo,
  onOpenAnalytics,
  onOpenServiceRequests,
  onNotificationClick,
  onPrivacyClick,
  onPaymentClick,
  onhelpSupportClick,
}) => {
  const t = useTranslations("DashboardView");
  const router = useRouter();
  const { profile, user, signOut } = useAuth();
  const completion = useProfileCompletion(profile);
  const [myCampaigns, setMyCampaigns] = useState([]);

  // Pull this user's campaigns once for the stat cards. list-campaigns is
  // already what other influencer pages use, so the cache stays warm.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/list-campaigns`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ influencerId: user.id }),
        });
        const data = await res.json();
        if (!cancelled && Array.isArray(data?.campaigns)) {
          setMyCampaigns(data.campaigns.filter((c) => c.applicationStatus));
        }
      } catch (e) {
        console.error("Stat campaign fetch failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const campaignStats = useMemo(() => {
    const completed = myCampaigns.filter((c) => c.applicationStatus === "completed");
    const active = myCampaigns.filter((c) => ACTIVE_APP_STATUSES.has(c.applicationStatus));
    const totalEarnings = completed.reduce((s, c) => s + earnedAmountINR(c), 0);
    // Expected = money still to be received (in-flight campaigns), counting
    // ONLY committed amounts — never completed (excluded here) and never a
    // pending application's listed budget.
    const expectedEarnings = active.reduce((s, c) => s + committedAmountINR(c), 0);
    return {
      totalEarnings,
      expectedEarnings,
      activeCount: active.length,
      completedCount: completed.length,
    };
  }, [myCampaigns]);

  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [popup, setPopup] = useState(null); // compact popup replacing window.alert()
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [customPhoto, setCustomPhoto] = useState(profile?.custom_profile_photo_url || null);
  const fileInputRef = useRef(null);

  const userName = profile?.full_name || t("profile.defaultName");
  const userHandle = profile?.username || profile?.instagram_handle || "";
  const userPhoto = customPhoto || profile?.custom_profile_photo_url || profile?.profile_photo_url;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.push("/");
    } finally {
      setLoggingOut(false);
      setShowLogout(false);
    }
  };

  const handleEditPhoto = () => {
    fileInputRef.current?.click();
  };

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

  // Letterbox support: objectFit="cover" keeps the image BIG (crop box =
  // container min dimension) while restrictPosition off + sub-1 zoom lets the
  // whole photo sit inside the square with white space. "Fit full photo"
  // jumps straight to that letterboxed view.
  const cropContainerRef = useRef(null);
  const [fitZoom, setFitZoom] = useState(null);
  const onMediaLoaded = useCallback((mediaSize) => {
    const rect = cropContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const boxSide = Math.min(rect.width, rect.height);
    setFitZoom(boxSide / Math.max(mediaSize.width, mediaSize.height));
  }, []);
  const minZoom = Math.min(0.3, fitZoom || 1);
  const fitWholeImage = () => {
    if (!fitZoom) return;
    setZoom(fitZoom);
    setCrop({ x: 0, y: 0 });
  };

  const getCroppedImg = async (src, pixelCrop) => {
    const image = new window.Image();
    image.src = src;
    await new Promise((resolve) => { image.onload = resolve; });

    // Crop box can extend past the image (letterboxed view): white-fill, draw
    // at offset, cap the output edge.
    const MAX_OUT = 1600;
    const scale = Math.min(1, MAX_OUT / Math.max(pixelCrop.width, pixelCrop.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(pixelCrop.width * scale);
    canvas.height = Math.round(pixelCrop.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, -pixelCrop.x * scale, -pixelCrop.y * scale, image.width * scale, image.height * scale);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
  };

  const uploadPhotoBlob = async (blob) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    const formData = new FormData();
    formData.append("userId", user.id);
    formData.append("file", blob, "profile.jpg");
    const res = await fetch(`${supabaseUrl}/functions/v1/upload-profile-photo`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Upload failed");
    return data.url;
  };

  const handleCropSave = async () => {
    if (!croppedAreaPixels || !imageSrc || uploading) return;
    setUploading(true);

    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const url = await uploadPhotoBlob(blob);
      setCustomPhoto(url);
      setShowCropper(false);
      setImageSrc(null);
    } catch (err) {
      console.error("Failed to upload photo:", err);
      setPopup(t("errors.uploadPhoto"));
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
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          table: "influencer_profiles",
          customProfilePhotoUrl: "",
        }),
      });

      setCustomPhoto(null);
    } catch (err) {
      console.error("Failed to remove photo:", err);
    }
  };

  const hasCustomPhoto = !!(customPhoto || profile?.custom_profile_photo_url);

  return (
    <main className="px-5 pt-6 space-y-6 lg:space-y-0 lg:px-8 lg:pt-32 lg:pb-8 min-h-screen lg:bg-gray-50">
      {/* Desktop Layout */}
      <div className="hidden lg:grid grid-cols-9 gap-8 max-w-7xl mx-auto">
        {/* Left Column: Profile & Support */}
        <div className="col-span-3 flex flex-col gap-6">
          {/* Page Header */}
          <header>
            <h1 className="text-2xl font-black text-[#1A1A1A]">{t("header.title")}</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {t("header.subtitle")}
            </p>
          </header>

          {/* Profile Card */}
          <section className="bg-white p-5 rounded-xl shadow border border-gray-100 flex flex-col items-center">
            <div className="relative mb-4">
              {userPhoto ? (
                <div className="relative">
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-xl object-cover shadow-lg shadow-pink-200"
                  />
                  <div onClick={handleEditPhoto} className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                    <Edit2 size={10} className="text-white" />
                  </div>
                  {hasCustomPhoto && (
                    <div onClick={handleRemoveCustomPhoto} className="absolute -top-1 -left-1 bg-red-500 p-1 rounded-full border-2 border-white cursor-pointer shadow-md" title={t("profile.removeCustomPhoto")}>
                      <X size={8} className="text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-[#FF2D78] via-[#FF3B8D] to-[#FF6BA1] rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-pink-200">
                  {initials}
                  <div onClick={handleEditPhoto} className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                    <Edit2 size={10} className="text-white" />
                  </div>
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#22C55E] border-[3px] border-white rounded-full shadow-sm" />
            </div>
            <div className="text-center space-y-1 w-full">
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-base font-extrabold text-[#1A1A1A]">
                  {userName}
                </h2>
                <div className="bg-[#3B82F6] rounded-full p-0.5">
                  <CheckCircle2
                    size={10}
                    className="text-white fill-white stroke-[#3B82F6]"
                  />
                </div>
              </div>
              {userHandle && (
                <p className="text-gray-400 text-xs font-medium italic">
                  @{userHandle}
                </p>
              )}
              <div className="flex gap-1.5 justify-center pt-2 flex-wrap">
                {profile?.categories?.length > 0 ? (
                  profile.categories.map((cat) => (
                    <span key={cat} className="px-3 py-1 bg-[#F3F4F9] text-[#374151] text-[9px] font-bold rounded-full">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-[#F3F4F9] text-[#374151] text-[9px] font-bold rounded-full">
                    {t("profile.creator")}
                  </span>
                )}
              </div>
            </div>
            <div className="w-full mt-4 pt-3 border-t border-gray-100 flex justify-around items-center px-2">
              <div className="flex flex-col items-center">
                <span className="font-black text-[#1A1A1A] text-sm">{formatCount(profile?.media_count)}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t("stats.posts")}</span>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="font-black text-[#1A1A1A] text-sm">{formatCount(profile?.followers_count)}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t("stats.followers")}</span>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="font-black text-[#1A1A1A] text-sm">{formatCount(profile?.follows_count)}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t("stats.following")}</span>
              </div>
            </div>
          </section>

          {/* Media Kit — shown only after the user has published a kit. */}
          {profile?.media_kit_published && (
            <Link
              href="/influencer/media-kit"
              className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1A1A1A]">{t("mediaKit.title")}</p>
                <p className="text-[11px] text-gray-400 font-semibold">
                  {t("mediaKit.subtitle")}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          )}

          {/* Reward Credits — above Profile Completion */}
          <RewardCreditsCard />

          {/* Profile Completion */}
          <ProfileCompletionCard completion={completion} onOpenInfo={onOpenInfo} />

          {/* Current Plan Card */}
          <PlanCard profile={profile} />

          {/* Support Section */}
          <section className="bg-white rounded-xl shadow border border-gray-100 p-0 overflow-hidden">
            <div
              onClick={onhelpSupportClick}
              className="p-4 border-b border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-[#6366F1] rounded-xl flex items-center justify-center text-white">
                <HelpCircle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-[#1A1A1A]">
                  {t("support.title")}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  {t("support.subtitleDesktop")}
                </p>
              </div>
            </div>
            <button
              className="w-full py-2.5 bg-white border-t border-gray-100 text-[#FF2D78] font-black text-xs flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-[0.98] transition-all"
              onClick={() => setShowLogout(true)}
            >
              <LogOut size={16} /> {t("logout.button")}
            </button>
          </section>
        </div>

        {/* Center Column: Stats, Hub, Settings */}
        <div className="col-span-6 flex flex-col gap-6">
          {/* Stats Grid - 4 columns */}
          <section className="grid grid-cols-4 gap-3">
            <StatCard
              title={t("stats.totalEarnings")}
              value={formatINRCompact(campaignStats.totalEarnings)}
              icon={CreditCard}
              color="text-emerald-500"
              bgColor="bg-gradient-to-br from-emerald-50 to-emerald-100"
            />
            <StatCard
              title={t("stats.activeCampaigns")}
              value={String(campaignStats.activeCount)}
              icon={Clock}
              color="text-blue-500"
              bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
            />
            <StatCard
              title={t("stats.completed")}
              value={String(campaignStats.completedCount)}
              icon={Award}
              color="text-emerald-500"
              bgColor="bg-gradient-to-br from-green-50 to-green-100"
            />
            <StatCard
              title={t("stats.expectedEarnings")}
              value={formatINRCompact(campaignStats.expectedEarnings)}
              icon={Hourglass}
              color="text-purple-500"
              bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
            />
          </section>

          {/* Creator Hub */}
          <section className="bg-white rounded-xl shadow border border-gray-100 p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-6 pt-5 pb-2">
              <span className="text-[#8B5CF6] text-lg">✦</span>
              <h3 className="font-black text-[#2D2D2D]">{t("hub.title")}</h3>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <HubCard
                title={t("hub.myProfile.title")}
                sub={t("hub.myProfile.sub")}
                bgColor="bg-[#EFECFF]"
                icon={FileText}
                iconGradient="from-[#8B5CF6] to-[#6366F1]"
                onClick={onOpenInfo}
              >
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1.5 px-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase">
                      {t("hub.profileComplete")}
                    </span>
                    <span className="text-[9px] font-black text-[#10B981]">
                      80%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-white/40">
                    <div className="h-full bg-[#10B981] rounded-full w-[80%]" />
                  </div>
                </div>
              </HubCard>

              <HubCard
                onClick={onOpenAnalytics}
                title={t("hub.analytics.title")}
                sub={t("hub.analytics.sub")}
                bgColor="bg-[#F0F9FF]"
                icon={BarChart3}
                iconGradient="from-[#3B82F6] to-[#60A5FA]"
              >
                <div className="mt-3 bg-white/60 p-2 rounded-xl border border-white/80 flex items-end justify-between shadow-sm">
                  <div>
                    <p className="text-[8px] text-gray-400 font-black uppercase">
                      {t("hub.analytics.last7Days")}
                    </p>
                    <p className="text-xs font-black text-gray-800">+2.4K</p>
                  </div>
                  <div className="flex items-end gap-0.5 h-6">
                    {[30, 50, 40, 70, 55, 90, 80].map((h, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[#3B82F6] rounded-full"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </HubCard>

              <HubCard
                onClick={onOpenServiceRequests}
                title={t("hub.serviceRequests.title")}
                sub={t("hub.serviceRequests.sub")}
                bgColor="bg-[#FEF3F2]"
                icon={Briefcase}
                iconGradient="from-[#F43F5E] to-[#FB7185]"
              >
                <div className="mt-3 bg-white/60 p-2 rounded-xl border border-white/80 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[8px] text-gray-400 font-black uppercase">{t("hub.serviceRequests.activeOrders")}</p>
                    <p className="text-xs font-black text-gray-800 mt-0.5">{t("hub.serviceRequests.viewAll")}</p>
                  </div>
                  <ChevronRight size={14} className="text-rose-400" />
                </div>
              </HubCard>
            </div>
          </section>

          {/* Settings */}
          <section className="bg-white rounded-xl shadow border border-gray-100 p-0 overflow-hidden">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] px-6 pt-5 pb-2">
              {t("settings.heading")}
            </h3>
            <div className="flex flex-col gap-0 p-4">
              <SettingsItem
                icon={Bell}
                onClick={onNotificationClick}
                title={t("settings.notifications.title")}
                sub={t("settings.notifications.sub")}
                color="bg-[#8B5CF6]"
              />
              <SettingsItem
                onClick={onPrivacyClick}
                icon={Lock}
                title={t("settings.privacy.title")}
                sub={t("settings.privacy.sub")}
                color="bg-[#10B981]"
              />
              <SettingsItem
                icon={CreditCard}
                onClick={onPaymentClick}
                title={t("settings.payment.title")}
                sub={t("settings.payment.sub")}
                color="bg-[#F97316]"
              />
              {/* Persistent Refer & Earn entry — the home wallet tile
                  self-hides at 0 RC, so without this row a fresh
                  subscriber had no way to find the page. Mirrors the
                  mobile app's DashboardView row. */}
              <SettingsItem
                icon={Gift}
                onClick={() => router.push("/influencer/refer")}
                title={t("settings.refer.title")}
                sub={t("settings.refer.sub")}
                color="bg-[#E60076]"
              />
            </div>
          </section>

        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden space-y-6">
        {/* Page Header */}
        <header className="flex justify-between items-center mb-2 px-1">
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">{t("header.title")}</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {t("header.subtitle")}
            </p>
          </div>
          <button className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-50 text-gray-400">
            <Settings size={20} />
          </button>
        </header>

        {/* Identity Card */}
        <section className="bg-white p-6 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              {userPhoto ? (
                <div className="relative">
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-xl object-cover shadow-lg shadow-pink-200"
                  />
                  <div onClick={handleEditPhoto} className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                    <Edit2 size={12} className="text-white" />
                  </div>
                  {hasCustomPhoto && (
                    <div onClick={handleRemoveCustomPhoto} className="absolute -top-1 -left-1 bg-red-500 p-1.5 rounded-full border-2 border-white cursor-pointer shadow-md" title={t("profile.removeCustomPhoto")}>
                      <X size={10} className="text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-[#FF2D78] via-[#FF3B8D] to-[#FF6BA1] rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-pink-200">
                  {initials}
                  <div onClick={handleEditPhoto} className="absolute -bottom-1 -right-1 bg-[#1A1A1A] p-2 rounded-xl border-2 border-white cursor-pointer shadow-md">
                    <Edit2 size={12} className="text-white" />
                  </div>
                </div>
              )}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#22C55E] border-[3.5px] border-white rounded-full shadow-sm" />
            </div>

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-xl font-extrabold text-[#1A1A1A]">
                  {userName}
                </h2>
                <div className="bg-[#3B82F6] rounded-full p-0.5">
                  <CheckCircle2
                    size={12}
                    className="text-white fill-white stroke-[#3B82F6]"
                  />
                </div>
              </div>
              {userHandle && (
                <p className="text-gray-400 text-sm font-medium italic">
                  @{userHandle}
                </p>
              )}
              <div className="flex gap-2 justify-center pt-2 flex-wrap">
                {profile?.categories?.length > 0 ? (
                  profile.categories.map((cat) => (
                    <span key={cat} className="px-4 py-1.5 bg-[#F3F4F9] text-[#374151] text-[10px] font-bold rounded-full">
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="px-4 py-1.5 bg-[#F3F4F9] text-[#374151] text-[10px] font-bold rounded-full">
                    {t("profile.creator")}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full mt-6 pt-5 border-t border-gray-100 flex justify-around items-center px-2">
              <div className="flex flex-col items-center">
                <span className="font-black text-[#1A1A1A] text-base">{formatCount(profile?.media_count)}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t("stats.posts")}</span>
              </div>
              <div className="w-px h-9 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="font-black text-[#1A1A1A] text-base">{formatCount(profile?.followers_count)}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t("stats.followers")}</span>
              </div>
              <div className="w-px h-9 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="font-black text-[#1A1A1A] text-base">{formatCount(profile?.follows_count)}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t("stats.following")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Media Kit — shown only after the user has published a kit. */}
        {profile?.media_kit_published && (
          <Link
            href="/influencer/media-kit"
            className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="p-2 bg-purple-50 rounded-lg text-purple-500">
              <FileText size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A1A1A]">{t("mediaKit.title")}</p>
              <p className="text-[11px] text-gray-400 font-semibold">
                {t("mediaKit.subtitle")}
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        )}

        {/* Reward Credits — above Profile Completion */}
        <RewardCreditsCard />

        {/* Profile Completion */}
        <ProfileCompletionCard completion={completion} onOpenInfo={onOpenInfo} />

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <StatCard
            title={t("stats.totalEarnings")}
            value={formatINRCompact(campaignStats.totalEarnings)}
            icon={CreditCard}
            color="text-emerald-500"
            bgColor="bg-gradient-to-br from-[#FFFBF5] to-[#FFFFFF]"
          />
          <StatCard
            title={t("stats.activeCampaigns")}
            value={String(campaignStats.activeCount)}
            icon={Clock}
            color="text-blue-500"
            bgColor="bg-gradient-to-br from-[#F0F9FF] to-[#FFFFFF]"
          />
          <StatCard
            title={t("stats.completed")}
            value={String(campaignStats.completedCount)}
            icon={Award}
            color="text-emerald-500"
            bgColor="bg-gradient-to-br from-green-50 to-[#FFFFFF]"
          />
          <StatCard
            title={t("stats.expectedEarnings")}
            value={formatINRCompact(campaignStats.expectedEarnings)}
            icon={Hourglass}
            color="text-purple-500"
            bgColor="bg-gradient-to-br from-[#FAF5FF] to-[#FFFFFF]"
          />
        </section>

        {/* Creator Hub Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[#8B5CF6] text-xl">✦</span>
            <h3 className="font-black text-[#2D2D2D] text-lg">{t("hub.title")}</h3>
          </div>
          <div className="p-4 rounded-xl border border-[#FFF0F3] bg-white/50 space-y-4 shadow-sm">
            <HubCard
              title={t("hub.myProfile.title")}
              sub={t("hub.myProfile.sub")}
              bgColor="bg-[#EFECFF]"
              icon={FileText}
              iconGradient="from-[#8B5CF6] to-[#6366F1]"
              onClick={onOpenInfo}
            >
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase">
                    {t("hub.profileComplete")}
                  </span>
                  <span className="text-[10px] font-black text-[#10B981]">
                    80%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden border border-white/40">
                  <div className="h-full bg-[#10B981] rounded-full w-[80%] shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                </div>
              </div>
            </HubCard>

            <HubCard
              onClick={onOpenAnalytics}
              title={t("hub.analytics.title")}
              sub={t("hub.analytics.sub")}
              bgColor="bg-[#F0F9FF]"
              icon={BarChart3}
              iconGradient="from-[#3B82F6] to-[#60A5FA]"
            >
              <div className="mt-4 bg-white/60 p-3 rounded-xl border border-white/80 flex items-end justify-between shadow-sm">
                <div>
                  <p className="text-[8px] text-gray-400 font-black uppercase">
                    {t("hub.analytics.last7Days")}
                  </p>
                  <p className="text-sm font-black text-gray-800">+2.4K</p>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {[30, 50, 40, 70, 55, 90, 80].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-[#3B82F6] rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </HubCard>

            <HubCard
              onClick={onOpenServiceRequests}
              title={t("hub.serviceRequests.title")}
              sub={t("hub.serviceRequests.sub")}
              bgColor="bg-[#FEF3F2]"
              icon={Briefcase}
              iconGradient="from-[#F43F5E] to-[#FB7185]"
            >
              <div className="mt-4 bg-white/60 p-3 rounded-xl border border-white/80 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[8px] text-gray-400 font-black uppercase">
                    {t("hub.serviceRequests.activeOrders")}
                  </p>
                  <p className="text-sm font-black text-gray-800">{t("hub.serviceRequests.viewAll")}</p>
                </div>
                <ChevronRight size={16} className="text-rose-400" />
              </div>
            </HubCard>
          </div>
        </section>

        {/* Settings Section */}
        <section className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
            {t("settings.heading")}
          </h3>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-50">
            <SettingsItem
              icon={Bell}
              onClick={onNotificationClick}
              title={t("settings.notifications.title")}
              sub={t("settings.notifications.sub")}
              color="bg-[#8B5CF6]"
            />
            <SettingsItem
              onClick={onPrivacyClick}
              icon={Lock}
              title={t("settings.privacy.title")}
              sub={t("settings.privacy.sub")}
              color="bg-[#10B981]"
            />
            <SettingsItem
              icon={CreditCard}
              title={t("settings.payment.title")}
              sub={t("settings.payment.sub")}
              color="bg-[#F97316]"
            />
            <SettingsItem
              icon={Gift}
              onClick={() => router.push("/influencer/refer")}
              title={t("settings.refer.title")}
              sub={t("settings.refer.sub")}
              color="bg-[#E60076]"
            />
          </div>
        </section>

        {/* Current Plan Card */}
        <PlanCard profile={profile} />

        {/* Support & Logout */}
        <section className="space-y-4 pt-2 pb-24 lg:pb-6">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] ml-2">
            {t("support.heading")}
          </h3>
          <div
            onClick={onhelpSupportClick}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-50 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-[#6366F1] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <HelpCircle size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-[#1A1A1A]">
                {t("support.title")}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium">
                {t("support.subtitleMobile")}
              </p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </div>

          <button
            className="w-full py-4 bg-white border-2 border-rose-50 rounded-xl text-[#FF2D78] font-black text-sm flex items-center justify-center gap-2 hover:bg-rose-50 active:scale-[0.98] transition-all"
            onClick={() => setShowLogout(true)}
          >
            <LogOut size={18} /> {t("logout.button")}
          </button>

          <p className="text-center text-[10px] font-bold text-gray-300">
            {t("footerTagline")}
          </p>
        </section>
      </div>

      {/* Logout Modal */}
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Crop Modal */}
      {showCropper && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 bg-black/50">
            <button
              onClick={() => { setShowCropper(false); setImageSrc(null); }}
              className="text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              {t("crop.cancel")}
            </button>
            <h3 className="text-white text-sm font-bold">{t("crop.title")}</h3>
            <button
              onClick={handleCropSave}
              disabled={uploading}
              className="text-sm font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)", color: "white" }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
              {uploading ? t("crop.saving") : t("crop.save")}
            </button>
          </div>

          <div ref={cropContainerRef} className="flex-1 relative">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              objectFit="cover"
              minZoom={minZoom}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={onMediaLoaded}
            />
          </div>

          <div className="px-8 py-5 bg-black/50 flex items-center gap-4">
            <span className="text-white/60 text-xs font-bold shrink-0">{t("crop.zoom")}</span>
            <input
              type="range"
              min={minZoom}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-purple-500"
            />
            <button
              type="button"
              onClick={fitWholeImage}
              className="shrink-0 px-3 py-1.5 rounded-full border border-white/30 text-white/80 text-xs font-bold hover:bg-white/10 transition-colors"
            >
              {t("crop.fit")}
            </button>
          </div>
        </div>
      )}

      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-[90vw] max-w-xs flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-xl flex items-center justify-center mb-4">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">{t("logoutModal.title")}</h3>
            <p className="text-xs text-gray-500 mb-6 text-center">
              {t("logoutModal.message")}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 py-3 rounded-xl border border-gray-100 font-bold text-gray-600 text-xs bg-white"
              >
                {t("logoutModal.cancel")}
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 font-bold text-white text-xs shadow-lg shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loggingOut ? <Loader2 size={14} className="animate-spin" /> : null}
                {loggingOut ? t("logoutModal.loggingOut") : t("logoutModal.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertPopup popup={popup} onClose={() => setPopup(null)} />
    </main>
  );
};

// Plan Card
function PlanCard({ profile }) {
  const t = useTranslations("DashboardView");
  const currentPlan = profile?.subscription_plan || "free";
  const hasPaidPlan = currentPlan !== "free";
  const { daysLeft, progress, expired } = getTrialInfo(profile);

  const planLabel = hasPaidPlan
    ? currentPlan.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : expired
    ? t("plan.free")
    : t("plan.starterTrial");

  return (
    <section className="bg-white rounded-xl shadow border border-gray-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Crown size={20} className="text-purple-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1A1A1A]">{planLabel}</h4>
            <p className="text-[10px] text-gray-400 font-medium">
              {hasPaidPlan
                ? t("plan.activeSubscription")
                : expired
                ? t("plan.trialExpired")
                : t("plan.daysLeft", { days: daysLeft })}
            </p>
          </div>
        </div>
        {hasPaidPlan && (
          <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-green-50 text-green-600">
            {t("plan.activeBadge")}
          </span>
        )}
      </div>

      {!hasPaidPlan && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className={expired ? "text-red-400" : "text-purple-500 fill-purple-500"} />
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {expired ? t("plan.expired") : t("plan.trialProgress")}
              </span>
            </div>
            <span className={`text-[10px] font-black ${expired ? "text-red-400" : "text-purple-600"}`}>
              {t("plan.daysCount", { days: daysLeft, total: TRIAL_DAYS })}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${expired ? "bg-red-400" : "bg-gradient-to-r from-[#9810fa] to-[#e60076]"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <Link
        href="/influencer/pricing"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
      >
        <Crown size={16} />
        {hasPaidPlan ? t("plan.managePlan") : t("plan.upgradeNow")}
      </Link>
    </section>
  );
}

// Internal Helper for Settings Rows
const SettingsItem = ({ icon: Icon, title, sub, color, onClick }) => (
  <div
    className="flex items-center gap-4 p-5 border-b border-gray-50 last:border-none active:bg-gray-50 transition-colors cursor-pointer"
    onClick={onClick}
  >
    <div
      className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shadow-sm`}
    >
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <h4 className="font-bold text-sm text-[#1A1A1A]">{title}</h4>
      <p className="text-[11px] text-gray-400 font-medium">{sub}</p>
    </div>
    <ChevronRight size={18} className="text-gray-300" />
  </div>
);

// Reward Credits summary on the profile dashboard (above Profile Completion).
// Unlike the home wallet strip it stays visible even when the balance is
// only the still-locked welcome bonus, so the creator can always see their RC.
function RewardCreditsCard() {
  const t = useTranslations("DashboardView");
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [avail, setAvail] = useState(0);
  const [locked, setLocked] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("v_reward_credits_available_balance")
          .select("available_balance, locked_balance")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        setAvail(data?.available_balance || 0);
        setLocked(data?.locked_balance || 0);
      } catch { /* silent */ } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, supabase]);

  // Nothing to show until we know the balance, and skip entirely if the user
  // genuinely has zero RC (no bonus, no earnings).
  if (!loaded || (avail <= 0 && locked <= 0)) return null;

  return (
    <button
      onClick={() => router.push("/influencer/refer")}
      className="w-full text-left flex items-center gap-3 rounded-2xl p-4 border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #9810FA 0%, #E60076 100%)" }}
      >
        <Gift size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("rewardCredits.title")}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-xl font-black text-slate-900">
            {avail} <span className="text-xs text-slate-400 font-bold">{t("rewardCredits.available")}</span>
          </p>
          {locked > 0 && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              {t("rewardCredits.locked", { count: locked })}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300 shrink-0" />
    </button>
  );
}

function ProfileCompletionCard({ completion, onOpenInfo }) {
  const t = useTranslations("DashboardView");
  const router = useRouter();
  const { percent, completed, total, hasInstagram, hasMediaKit, hasRates } = completion;
  const isDone = percent === 100;

  // Per task spec: Instagram + Rates land in My Info (same surface that owns
  // both fields), Media Kit lands in /influencer/media-kit (its own page).
  // Account-created is always done so it has no click target.
  const goToInfo = () => onOpenInfo?.();
  const goToMediaKit = () => router.push("/influencer/media-kit");

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="24" fill="transparent" stroke="currentColor" strokeWidth="5" className="text-slate-100" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="transparent"
              stroke="url(#completionGradient)"
              strokeWidth="5"
              strokeDasharray="150.8"
              strokeDashoffset={150.8 - 150.8 * (percent / 100)}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9810fa" />
                <stop offset="100%" stopColor="#e60076" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-black text-slate-800">{percent}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-[#1A1A1A]">
            {isDone ? t("completion.done") : t("completion.title")}
          </h3>
          <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
            {isDone
              ? t("completion.discoverable")
              : t("completion.stepsDone", { completed, total })}
          </p>
        </div>
      </div>

      {!isDone && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] font-semibold">
          <ChecklistItem done label={t("completion.accountCreated")} />
          <ChecklistItem done={hasInstagram} label={t("completion.instagramConnected")} onClick={goToInfo} />
          <ChecklistItem done={hasMediaKit} label={t("completion.mediaKitPublished")} onClick={goToMediaKit} />
          <ChecklistItem done={hasRates} label={t("completion.rateCardSet")} onClick={goToInfo} />
        </div>
      )}
    </section>
  );
}

// Done items aren't clickable (no target — they're already done). Pending
// items become buttons that jump to the relevant edit surface.
function ChecklistItem({ done, label, onClick }) {
  const baseCls = `flex items-center gap-2 px-2 py-1.5 rounded-lg text-left ${
    done ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-500"
  }`;
  const interactiveCls = !done && onClick ? "cursor-pointer hover:bg-gray-100 active:scale-[0.98] transition" : "";
  const Inner = (
    <>
      <span
        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
          done ? "bg-emerald-500 text-white" : "border-2 border-gray-300"
        }`}
      >
        {done && <CheckCircle2 size={10} className="fill-emerald-500 text-white" />}
      </span>
      <span className="truncate">{label}</span>
    </>
  );
  if (!done && onClick) {
    return (
      <button onClick={onClick} className={`${baseCls} ${interactiveCls}`} type="button">
        {Inner}
      </button>
    );
  }
  return <div className={baseCls}>{Inner}</div>;
}

export default DashboardView;
