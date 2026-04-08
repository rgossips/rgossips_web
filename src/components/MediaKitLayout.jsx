"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Pencil, Check, X as XIcon } from "lucide-react";
import {
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  MapPin,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Play,
} from "lucide-react";
import logoIcon from "@/assets/logoIcon.png";
import logo from "@/assets/logo2.png";

const formatCount = (n) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

export default function MediaKitLayout({ profile, isPublic = false, editable = false, onBioSave, onTopReelsSave }) {
  // Support both snake_case (AuthContext) and camelCase (public endpoint)
  const name = profile?.full_name || profile?.fullName || "Creator";
  const handle = profile?.username || profile?.instagram_handle || profile?.instagramHandle || "creator";
  const photo = profile?.profile_photo_url || profile?.profilePhotoUrl;
  const categories = profile?.categories || [];
  const bio = profile?.bio || "Passionate content creator helping brands connect with audiences through authentic storytelling and creative content.";

  const followers = profile?.followers_count || profile?.followersCount || 0;
  const following = profile?.follows_count || profile?.followsCount || 0;
  const posts = profile?.media_count || profile?.mediaCount || 0;
  const services = profile?.services || [];
  const serviceRates = profile?.service_rates || profile?.serviceRates || {};
  const engagementRate = profile?.engagement_rate || profile?.engagementRate || 0;
  const avgLikes = profile?.avg_likes || profile?.avgLikes || 0;
  const avgComments = profile?.avg_comments || profile?.avgComments || 0;
  const totalImpressions = profile?.total_impressions || profile?.totalImpressions || 0;
  const totalReach = profile?.total_reach || profile?.totalReach || 0;
  const topReels = profile?.top_reels || profile?.topReels || [];

  const SERVICE_LABELS = {
    reels: "Reels",
    stories: "Stories",
    shorts: "youTube Shorts",
    posts: "Static Posts",
    ugc: "UGC Videos",
  };

  const toServiceLabel = (id) => SERVICE_LABELS[id] || id;

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="w-full">
      {/* ===== TOP SECTION: Gradient Header + Photo ===== */}
      <div className="relative">
        {/* Gradient Background */}
        <div
          className="h-36 sm:h-48 lg:h-56 w-full"
          style={{
            background: "linear-gradient(135deg, #c4b5fd 0%, #f9a8d4 50%, #93c5fd 100%)",
          }}
        />

        {/* Profile Photo — diamond/rotated style */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-12 sm:-bottom-16 lg:-bottom-20">
          <div
            className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-3xl rotate-45 overflow-hidden border-4 border-white shadow-xl"
          >
            {photo ? (
              <Image
                src={photo}
                alt={name}
                width={160}
                height={160}
                className="w-full h-full object-cover -rotate-45 scale-[1.42]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center -rotate-45">
                <span className="text-white text-3xl font-bold">{initials}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== NAME + NICHE ===== */}
      <div className="pt-16 sm:pt-20 lg:pt-24 pb-4 sm:pb-6 text-center px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-tight">
          {name}
        </h1>
      </div>

      {/* ===== MAIN CONTENT: Two Column Layout ===== */}
      <div className="flex flex-col lg:flex-row gap-0">
        {/* LEFT COLUMN */}
        <div className="lg:w-[42%] bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* About Me */}
          <EditableAboutMe
            bio={bio}
            editable={editable}
            onSave={onBioSave}
          />

          {/* Categories / Partnerships */}
          <section>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              Expertise
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-full"
                  >
                    {cat}
                  </span>
                ))
              ) : (
                <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-full">
                  Content Creation
                </span>
              )}
            </div>
          </section>

          {/* Services & Rates */}
          {services.length > 0 && (
            <section>
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                Services & Rates
              </h2>
              <div className="space-y-2">
                {services.map((svcId, i) => {
                  const rate = serviceRates[svcId];
                  return (
                    <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2.5">
                      <span className="text-sm font-semibold text-slate-700">{toServiceLabel(svcId)}</span>
                      {rate ? (
                        <span className="text-sm font-black text-green-600">₹{Number(rate).toLocaleString("en-IN")}</span>
                      ) : (
                        <span className="text-xs text-slate-400">On request</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Contact */}
          <section>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              Contact
            </h2>
            <div className="space-y-2.5">
              {(profile?.instagram_handle || profile?.instagramHandle) && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Instagram size={16} className="text-pink-500 shrink-0" />
                  <span>@{profile.instagram_handle || profile.instagramHandle}</span>
                </div>
              )}
              {profile?.email && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400 shrink-0" />
                  <span>{profile.email}</span>
                </div>
              )}
              {(profile?.location || profile?.address) && (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <MapPin size={16} className="text-pink-500 shrink-0 mt-0.5" />
                  <span>{[profile.location, profile.address].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:w-[58%] p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
          {/* Social Media Stats */}
          <section>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              Social Media
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                icon={<Instagram size={18} className="text-pink-500" />}
                label="Instagram"
                sublabel="Followers"
                value={formatCount(followers)}
              />
              <StatBox
                icon={<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.14z"/></svg>}
                label="TikTok"
                sublabel="Followers"
                value="—"
              />
              <StatBox
                icon={<Youtube size={18} className="text-red-500" />}
                label="YouTube"
                sublabel="Subscribers"
                value="—"
              />
              <StatBox
                icon={<Facebook size={18} className="text-blue-600" />}
                label="Facebook"
                sublabel="Followers"
                value="—"
              />
            </div>
          </section>

          {/* Key Metrics */}
          <section>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              Key Metrics
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <MetricCircle label="Posts" value={formatCount(posts)} color="from-purple-400 to-purple-600" />
              <MetricCircle label="Followers" value={formatCount(followers)} color="from-pink-400 to-pink-600" />
              <MetricCircle label="Engagement" value={engagementRate ? `${engagementRate}%` : "—"} color="from-green-400 to-green-600" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{avgLikes ? formatCount(avgLikes) : "—"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Likes</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{avgComments ? formatCount(avgComments) : "—"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Comments</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{totalImpressions ? formatCount(totalImpressions) : "—"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Impressions</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-slate-900">{totalReach ? formatCount(totalReach) : "—"}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reach</p>
              </div>
            </div>
          </section>

          {/* Demographic placeholder */}
          <section>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              Audience Demographics
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <DemographicCard label="Female" value="—" sub="Audience" />
              <DemographicCard label="Male" value="—" sub="Audience" />
              <DemographicCard label="India" value="—" sub="Top Country" />
              <DemographicCard label="18-34" value="—" sub="Age Group" />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic">
              Connect more platforms to unlock detailed demographics
            </p>
          </section>

          {/* Top Reels */}
          {(topReels.length > 0 || editable) && (
            <EditableTopContent
              reels={topReels}
              editable={editable}
              onSave={onTopReelsSave}
            />
          )}

          {/* Previous Collaborations */}
          <section>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              Open for Collaborations
            </h2>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Interested in working together?
              </p>
              <p className="text-xs text-slate-500">
                Reach out via Instagram or through the RGossips platform
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-6 lg:px-8 py-4 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Image src={logoIcon} alt="RGossips" width={20} height={20} className="rounded" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Generated on RGossips
          </p>
        </div>
        <Image src={logo} alt="recentgossips" width={100} height={24} className="h-4 w-auto opacity-40" />
      </div>
    </div>
  );
}

function EditableAboutMe({ bio, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const textareaRef = useRef(null);

  const defaultBio = "Passionate content creator helping brands connect with audiences through authentic storytelling and creative content.";
  const displayBio = bio || defaultBio;

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = draft.trim();
    onSave?.(trimmed);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(bio || "");
    setEditing(false);
  };

  const handleInput = (e) => {
    setDraft(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  return (
    <section>
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
        <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        About Me
        {editable && !editing && (
          <button
            onClick={() => { setDraft(bio || ""); setEditing(true); }}
            className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"
            title="Edit bio"
          >
            <Pencil size={13} className="text-slate-400 group-hover:text-purple-500" />
          </button>
        )}
      </h2>

      {editing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={handleInput}
            placeholder="Write something about yourself..."
            maxLength={500}
            className="w-full text-sm text-slate-700 leading-relaxed bg-white border border-purple-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">{draft.length}/500</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XIcon size={14} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
              >
                <Check size={14} />
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p
          className={`text-sm text-slate-600 leading-relaxed ${editable ? "cursor-pointer hover:bg-slate-100 rounded-lg p-2 -m-2 transition-colors" : ""}`}
          onClick={editable ? () => { setDraft(bio || ""); setEditing(true); } : undefined}
        >
          {displayBio}
        </p>
      )}
    </section>
  );
}

function StatBox({ icon, label, sublabel, value }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase">{label}</p>
        <p className="text-[10px] text-slate-400">{sublabel}</p>
      </div>
      <p className="text-lg font-black text-slate-800">{value}</p>
    </div>
  );
}

function MetricCircle({ label, value, color }) {
  return (
    <div className="flex flex-col items-center p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl">
      <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-2 shadow-lg`}>
        <span className="text-white text-[11px] sm:text-sm lg:text-base font-black">{value}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function DemographicCard({ label, value, sub }) {
  return (
    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-center">
      <p className="text-2xl font-black text-slate-800">{value}</p>
      <p className="text-xs font-bold text-slate-700 mt-0.5">{label}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

function ReelCard({ reel, index }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);
  const isVideo = reel.mediaType === "VIDEO";
  const mediaUrl = reel.mediaUrl || "";
  const thumbnailUrl = reel.thumbnailUrl || reel.thumbnail || "";

  const togglePlay = (e) => {
    e.preventDefault();
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <a
      href={reel.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-slate-100 bg-slate-900 block"
    >
      {isVideo && mediaUrl ? (
        <>
          <video
            ref={videoRef}
            src={mediaUrl}
            poster={thumbnailUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
          <button
            onClick={togglePlay}
            className={`absolute inset-0 flex items-center justify-center transition-opacity ${playing ? "opacity-0 hover:opacity-100" : "opacity-100"}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform group-hover:scale-110 ${playing ? "bg-black/40 backdrop-blur-sm" : "bg-white/90"}`}>
              {playing ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-5 bg-white rounded-full" />
                  <div className="w-1.5 h-5 bg-white rounded-full" />
                </div>
              ) : (
                <Play size={22} className="text-slate-900 ml-1" fill="currentColor" />
              )}
            </div>
          </button>
        </>
      ) : thumbnailUrl ? (
        <img src={thumbnailUrl} alt={reel.caption || "Post"} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
          <Instagram size={32} className="text-purple-300" />
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {reel.caption && (
          <p className="text-[10px] text-white/80 font-semibold mb-1.5 line-clamp-2">{reel.caption}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[10px] font-black text-white">
            <span>❤ {reel.likes?.toLocaleString() || 0}</span>
            <span>💬 {reel.comments?.toLocaleString() || 0}</span>
          </div>
          <ExternalLink size={12} className="text-white/60" />
        </div>
      </div>

      {/* Type badge */}
      {isVideo && (
        <div className="absolute top-2.5 left-2.5 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <span className="text-[8px] font-black text-white uppercase tracking-wider">Reel</span>
        </div>
      )}
    </a>
  );
}

function EditableTopContent({ reels, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [links, setLinks] = useState(() =>
    reels.map((r) => r.permalink || "")
  );

  const handleAdd = () => setLinks((prev) => [...prev, ""]);
  const handleRemove = (i) => setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const handleChange = (i, val) => setLinks((prev) => prev.map((l, idx) => (idx === i ? val : l)));

  const handleSave = () => {
    const validLinks = links.filter((l) => l.trim());
    const newReels = validLinks.map((url, i) => ({
      id: `custom_${i}`,
      permalink: url,
      thumbnail: "",
      mediaType: "VIDEO",
      likes: 0,
      comments: 0,
      caption: "",
    }));
    onSave?.(newReels);
    setEditing(false);
  };

  const handleCancel = () => {
    setLinks(reels.map((r) => r.permalink || ""));
    setEditing(false);
  };

  return (
    <section>
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <div className="w-6 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        Top Content
        {editable && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="ml-auto p-1.5 hover:bg-slate-100 rounded-lg transition-colors group"
            title="Edit reels"
          >
            <Pencil size={13} className="text-slate-400 group-hover:text-purple-500" />
          </button>
        )}
      </h2>

      {editing ? (
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => handleChange(i, e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="flex-1 py-2.5 px-3 bg-white border border-slate-200 focus:border-purple-300 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all"
              />
              <button
                onClick={() => handleRemove(i)}
                className="w-9 h-9 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors shrink-0 mt-0.5"
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={handleAdd}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-purple-300 hover:text-purple-500 transition-colors"
          >
            + Add Reel Link
          </button>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCancel} className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
            >
              Save
            </button>
          </div>
        </div>
      ) : reels.length > 0 ? (
        <div className="space-y-2.5">
          {reels.map((reel, i) => (
            <a
              key={reel.id || i}
              href={reel.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-pink-200 hover:bg-pink-50/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FCAF45] via-[#E1306C] to-[#833AB4] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Instagram size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 truncate">{reel.permalink}</p>
              </div>
              <ExternalLink size={14} className="text-slate-300 group-hover:text-pink-500 transition-colors shrink-0" />
            </a>
          ))}
        </div>
      ) : editable ? (
        <button
          onClick={() => { setLinks([""]); setEditing(true); }}
          className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-purple-300 hover:text-purple-500 transition-colors"
        >
          + Add your top content links
        </button>
      ) : null}
    </section>
  );
}
