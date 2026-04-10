"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Pencil, Check, X as XIcon } from "lucide-react";
import {
  Instagram,
  Youtube,
  Facebook,
  MapPin,
  ExternalLink,
  Heart,
  MessageCircle,
  Camera,
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
  const name = profile?.full_name || profile?.fullName || "Creator";
  const handle = profile?.username || profile?.instagram_handle || profile?.instagramHandle || "creator";
  const photo = profile?.custom_profile_photo_url || profile?.customProfilePhotoUrl || profile?.profile_photo_url || profile?.profilePhotoUrl;
  const categories = profile?.categories || [];
  const bio = profile?.bio || "Passionate content creator helping brands connect with audiences through authentic storytelling and creative content.";
  const location = profile?.location || "";

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
  const demographics = profile?.audience_demographics || profile?.audienceDemographics || {};

  const SERVICE_LABELS = { reels: "Reels", stories: "Stories", shorts: "YouTube Shorts", posts: "Static Posts", ugc: "UGC Videos" };
  const toServiceLabel = (id) => SERVICE_LABELS[id] || id;

  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const primaryCategory = categories.slice(0, 2).join(" & ") || "Creator";

  return (
    <div className="w-full">
      {/* ===== HEADER ===== */}
      <div className="relative" style={{ background: "linear-gradient(120deg, #9810FA 0%, #E60076 50%, #f472b6 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 flex items-center gap-4 sm:gap-6">
          {/* Profile Photo */}
          <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-2xl shrink-0">
            {photo ? (
              <Image src={photo} alt={name} width={128} height={128} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-white truncate">{name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {primaryCategory && (
                <span className="flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-bold text-slate-700">
                  <Camera size={12} className="text-slate-500" /> {primaryCategory}
                </span>
              )}
              {location && (
                <span className="flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-bold text-slate-700">
                  <MapPin size={12} className="text-pink-500" /> {location}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:w-[38%] space-y-4 sm:space-y-6">
            {/* About Me */}
            <SectionCard title="About Me">
              <EditableAboutMe bio={bio} editable={editable} onSave={onBioSave} />
            </SectionCard>

            {/* Expertise */}
            <SectionCard title="Expertise">
              <div className="flex flex-wrap gap-2">
                {categories.length > 0 ? categories.map((cat) => (
                  <span key={cat} className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-full">{cat}</span>
                )) : (
                  <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-full">Content Creation</span>
                )}
              </div>
            </SectionCard>

            {/* Services & Rates */}
            {services.length > 0 && (
              <SectionCard title="Services & Rates">
                <div className="space-y-2">
                  {services.map((svcId, i) => {
                    const rate = serviceRates[svcId];
                    return (
                      <div key={i} className="flex items-center justify-between py-2 sm:py-2.5 px-2.5 sm:px-3 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">{toServiceLabel(svcId)}</span>
                        <span className="text-sm font-black text-slate-500">{rate ? `₹${Number(rate).toLocaleString("en-IN")}` : "On request"}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Who's Watching */}
            <SectionCard title="Who's Watching">
              <div className="space-y-5">
                {/* Top Cities */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-3">Top Cities</h4>
                  <div className="space-y-2.5">
                    {(demographics?.topCities?.length > 0 ? demographics.topCities : [
                      { name: location || "—", pct: 0 },
                    ]).map((c) => (
                      <div key={c.name} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 w-20 truncate">{c.name}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(c.pct, 100)}%`, background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-10 text-right">{c.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age + Gender */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-3">Age + Gender</h4>
                  <div className="space-y-2.5">
                    {(demographics?.ageRanges?.length > 0 ? demographics.ageRanges : [
                      { range: "18-24", pct: 0 }, { range: "25-34", pct: 0 }, { range: "35-44", pct: 0 }, { range: "45+", pct: 0 },
                    ]).map((a) => (
                      <div key={a.range} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-600 w-12">{a.range}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(a.pct, 100)}%`, background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-10 text-right">{a.pct}%</span>
                      </div>
                    ))}
                  </div>
                  {/* Gender breakdown */}
                  {(() => {
                    const g = demographics?.gender || { male: 0, female: 0, other: 0 };
                    const hasData = g.male > 0 || g.female > 0;
                    return (
                      <div className="flex items-center gap-4 mt-4">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="transparent" stroke="#e2e8f0" strokeWidth="5" />
                            {hasData && <circle cx="18" cy="18" r="15" fill="transparent" stroke="#a855f7" strokeWidth="5" strokeDasharray={`${g.female * 0.942} ${94.2 - g.female * 0.942}`} />}
                            {hasData && <circle cx="18" cy="18" r="15" fill="transparent" stroke="#ec4899" strokeWidth="5" strokeDasharray={`${g.male * 0.942} ${94.2 - g.male * 0.942}`} strokeDashoffset={`-${g.female * 0.942}`} />}
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-purple-500" /><span className="text-[11px] font-bold text-slate-600">Female {g.female}%</span></div>
                          <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-pink-500" /><span className="text-[11px] font-bold text-slate-600">Male {g.male}%</span></div>
                          {g.other > 0 && <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[11px] font-bold text-slate-600">Other {g.other}%</span></div>}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Top Countries */}
                {demographics?.topCountries?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-3">Top Countries</h4>
                    <div className="space-y-2.5">
                      {demographics.topCountries.map((c) => (
                        <div key={c.name} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-600 w-12 truncate">{c.name}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${Math.min(c.pct, 100)}%`, background: "linear-gradient(90deg, #8b5cf6, #ec4899)" }} />
                          </div>
                          <span className="text-xs font-bold text-slate-500 w-10 text-right">{c.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!demographics?.topCities?.length && (
                  <p className="text-[10px] text-slate-400 italic">Demographics data will appear after Instagram data refresh</p>
                )}
              </div>
            </SectionCard>

            {/* Open for Collaborations */}
            <SectionCard title="Open for Collaborations">
              <div className="text-center py-2">
                <p className="text-sm font-semibold text-slate-700 mb-1">Interested in working together?</p>
                <p className="text-xs text-slate-500">Reach out via Instagram or through the RGossips platform</p>
              </div>
            </SectionCard>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:w-[62%] space-y-4 sm:space-y-6">
            {/* Social Media */}
            <SectionCard title="Social Media">
              <div className="grid grid-cols-2 gap-3">
                <SocialStat icon={<Instagram size={18} className="text-pink-500" />} label="Instagram" sublabel="Followers" value={formatCount(followers)} />
                <SocialStat icon={<svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.5v-3.4a4.85 4.85 0 01-1-.14z"/></svg>} label="TikTok" sublabel="Followers" value="—" />
                <SocialStat icon={<Youtube size={18} className="text-red-500" />} label="YouTube" sublabel="Subscribers" value="—" />
                <SocialStat icon={<Facebook size={18} className="text-blue-600" />} label="Facebook" sublabel="Followers" value="—" />
              </div>
            </SectionCard>

            {/* Performance */}
            <SectionCard title="Performance">
              <p className="text-xl sm:text-2xl font-black text-slate-900 mb-4">The <span className="text-pink-500">NUMBER</span> That Matters</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reels and Post Views</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">{totalImpressions ? formatCount(totalImpressions) : formatCount(followers * 2)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">↑ {engagementRate}% / 30 Days</p>
                </div>
                <div className="rounded-xl sm:rounded-2xl p-3 sm:p-4 text-white" style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">Engagement Rate</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black">{engagementRate || 0}%</p>
                  <p className="text-[10px] text-white/70 mt-1">vs 1.9% category avg</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Non-Follower Reach</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">{totalReach ? Math.round(totalReach / (followers || 1) * 100) : 62}%</p>
                  <p className="text-[10px] text-slate-400 mt-1">organic discovery</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interactions</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900">{formatCount(avgLikes + avgComments)}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{avgComments ? Math.round(avgComments / (avgLikes + avgComments || 1) * 100) : 4.7}% from ads</p>
                </div>
              </div>
            </SectionCard>

            {/* Top Content */}
            {(topReels.length > 0 || editable) && (
              <EditableTopContent reels={topReels} editable={editable} onSave={onTopReelsSave} />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Image src={logoIcon} alt="RGossips" width={20} height={20} className="rounded" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generated on RGossips</p>
        </div>
        <Image src={logo} alt="recentgossips" width={100} height={24} className="h-4 w-auto opacity-40" />
      </div>
    </div>
  );
}

/* ─── Section Card ─── */
function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm">
      <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
        <div className="w-5 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ─── Social Stat Box ─── */
function SocialStat({ icon, label, sublabel, value }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 border border-slate-100 rounded-xl">
      <div className="p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-100 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">{label}</p>
        <p className="text-[9px] sm:text-[10px] text-slate-400">{sublabel}</p>
      </div>
      <p className="text-base sm:text-lg font-black text-slate-800 shrink-0">{value}</p>
    </div>
  );
}

/* ─── Editable About Me ─── */
function EditableAboutMe({ bio, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const textareaRef = useRef(null);
  const displayBio = bio || "Passionate content creator helping brands connect with audiences through authentic storytelling and creative content.";

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editing]);

  const handleSave = () => { onSave?.(draft.trim()); setEditing(false); };
  const handleCancel = () => { setDraft(bio || ""); setEditing(false); };

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea ref={textareaRef} value={draft} onChange={(e) => { setDraft(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} placeholder="Write something about yourself..." maxLength={500} className="w-full text-sm text-slate-700 leading-relaxed bg-white border border-purple-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all" rows={3} />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{draft.length}/500</span>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><XIcon size={14} />Cancel</button>
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}><Check size={14} />Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {editable && (
        <button onClick={() => { setDraft(bio || ""); setEditing(true); }} className="absolute top-0 right-0 p-1.5 hover:bg-slate-100 rounded-lg transition-colors group" title="Edit bio">
          <Pencil size={13} className="text-slate-400 group-hover:text-purple-500" />
        </button>
      )}
      <p className={`text-sm text-slate-600 leading-relaxed ${editable ? "cursor-pointer pr-8" : ""}`} onClick={editable ? () => { setDraft(bio || ""); setEditing(true); } : undefined}>
        {displayBio}
      </p>
    </div>
  );
}

/* ─── Editable Top Content ─── */
function EditableTopContent({ reels, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [links, setLinks] = useState(() => reels.map((r) => r.permalink || ""));

  const handleAdd = () => setLinks((prev) => [...prev, ""]);
  const handleRemove = (i) => setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const handleChange = (i, val) => setLinks((prev) => prev.map((l, idx) => (idx === i ? val : l)));

  const handleSave = () => {
    const validLinks = links.filter((l) => l.trim());
    const newReels = validLinks.map((url, i) => ({ id: `custom_${i}`, permalink: url, thumbnail: "", mediaType: "VIDEO", likes: 0, comments: 0, caption: "" }));
    onSave?.(newReels);
    setEditing(false);
  };

  const handleCancel = () => { setLinks(reels.map((r) => r.permalink || "")); setEditing(false); };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 p-3.5 sm:p-5 shadow-sm relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] flex items-center gap-2">
          <div className="w-5 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
          Top Content
        </h2>
        {editable && !editing && (
          <button onClick={() => { if (reels.length === 0) { setLinks([""]); } setEditing(true); }} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors group cursor-pointer" title="Edit reels">
            <Pencil size={13} className="text-slate-400 group-hover:text-purple-500" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input type="url" value={link} onChange={(e) => handleChange(i, e.target.value)} placeholder="https://www.instagram.com/reel/..." className="flex-1 py-2.5 px-3 bg-slate-50 border border-slate-200 focus:border-purple-300 focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all" />
              <button onClick={() => handleRemove(i)} className="w-9 h-9 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-colors shrink-0 mt-0.5 cursor-pointer"><XIcon size={14} /></button>
            </div>
          ))}
          <button onClick={handleAdd} className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-purple-300 hover:text-purple-500 transition-colors cursor-pointer">+ Add Reel Link</button>
          <div className="flex gap-2 pt-1">
            <button onClick={handleCancel} className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2 text-xs font-bold text-white rounded-lg transition-all hover:opacity-90 cursor-pointer" style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}>Save</button>
          </div>
        </div>
      ) : reels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {reels.map((reel, i) => {
            const thumb = reel.thumbnail || reel.thumbnailUrl || reel.mediaUrl;
            return (
              <a key={reel.id || i} href={reel.permalink} target="_blank" rel="noopener noreferrer" className="relative rounded-xl overflow-hidden border border-slate-100 bg-slate-900 block group">
                {thumb ? (
                  <img src={thumb} alt={reel.caption || "Reel"} className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full aspect-[4/5] bg-gradient-to-br from-purple-100 to-pink-100 flex flex-col items-center justify-center gap-2">
                    <Instagram size={28} className="text-purple-300" />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                  {reel.caption && <p className="text-[8px] sm:text-[9px] text-white/90 font-semibold mb-1 line-clamp-2 leading-snug">{reel.caption}</p>}
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-white"><Heart size={9} className="fill-white" />{reel.likes || 0}</span>
                    <span className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold text-white"><MessageCircle size={9} />{reel.comments || 0}</span>
                    <ExternalLink size={9} className="text-white/50 ml-auto" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      ) : editable ? (
        <button onClick={() => { setLinks([""]); setEditing(true); }} className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-purple-300 hover:text-purple-500 transition-colors cursor-pointer">+ Add your top content links</button>
      ) : null}
    </div>
  );
}
