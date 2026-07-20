"use client";

import { Card } from "@/components/ui/card";
import { ArrowRight, Users, TrendingUp, Eye, Sparkles, Globe } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export function AiMediaKitCard() {
  const t = useTranslations("MediaKitCard");
  const { profile } = useAuth();
  const router = useRouter();

  const formatCount = (n) => {
    if (!n) return "0";
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return String(n);
  };

  const userName = profile?.full_name || t("creatorFallback");
  const userHandle = profile?.username || profile?.instagram_handle || "creator";
  const userPhoto = profile?.profile_photo_url;
  const languages = Array.isArray(profile?.content_languages) ? profile.content_languages.filter(Boolean) : [];

  const stats = [
    { icon: <Users size={18} />, label: t("stats.followers"), value: formatCount(profile?.followers_count) },
    { icon: <TrendingUp size={18} />, label: t("stats.posts"), value: formatCount(profile?.media_count) },
    { icon: <Eye size={18} />, label: t("stats.following"), value: formatCount(profile?.follows_count) },
  ];

  return (
    <div className="w-full h-full flex justify-center">
      <Card className="w-full h-full flex flex-col p-6 lg:p-8 rounded-[32px] border-slate-200 border shadow-sm bg-white overflow-hidden">
        {/* 1. Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {t("title")}
              <Sparkles size={20} className="text-blue-500 fill-blue-500/10" />
            </h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">
              {t("subtitle")}
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 font-black border border-blue-100">
            {t("preview")}
          </span>
        </div>

        {/* 2. Middle Section */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 lg:py-12">
          <div className="relative mb-6">
            <div className="p-[3px] rounded-full bg-gradient-to-tr from-[#9810fa] to-[#ff8ba7] shadow-lg">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-white p-1 overflow-hidden">
                {userPhoto ? (
                  <Image
                    src={userPhoto}
                    alt={userName}
                    width={96}
                    height={96}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                    {userName.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h4 className="text-xl font-black text-slate-800 leading-tight">
              {userName}
            </h4>
            <p className="text-sm font-bold text-slate-400 tracking-wide">
              @{userHandle}
            </p>
            {languages.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                {languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1 text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-full"
                  >
                    <Globe size={10} /> {lang}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 w-full">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="flex flex-col items-center bg-slate-50/50 border border-slate-100 rounded-3xl py-4 transition-all hover:bg-slate-50 hover:border-slate-200"
              >
                <div className="text-slate-300 mb-2">{stat.icon}</div>
                <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400 mb-1">
                  {stat.label}
                </span>
                <span className="text-base lg:text-lg font-black text-slate-800">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CTA Button — swap copy once the kit has been published so the
            card stops nagging users to "generate" something that already
            exists. */}
        <button
          onClick={() => router.push("/influencer/media-kit")}
          className="group relative w-full py-4 px-6 rounded-2xl font-black text-white cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed] to-[#ec4899] transition-opacity group-hover:opacity-90" />
          <span className="relative flex items-center justify-center gap-2 text-sm uppercase tracking-widest">
            {profile?.media_kit_published ? t("view") : t("generate")}
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </button>
      </Card>
    </div>
  );
}
