"use client";

import React, { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import MediaKitLayout from "@/components/MediaKitLayout";
import { Share2, Copy, Check, Loader2 } from "lucide-react";

export default function MediaKitPage() {
  const { profile, user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [published, setPublished] = useState(!!profile?.media_kit_published);
  const [publishing, setPublishing] = useState(false);

  const handleBioSave = useCallback(async (newBio) => {
    setBio(newBio);
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
          bio: newBio,
        }),
      });
    } catch (err) {
      console.error("Failed to save bio:", err);
    }
  }, [user]);

  const handleTopReelsSave = useCallback(async (newReels) => {
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
          topReels: newReels,
        }),
      });
    } catch (err) {
      console.error("Failed to save top reels:", err);
    }
  }, [user]);

  const handlePublish = async () => {
    if (publishing || published) return;
    setPublishing(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          table: "influencer_profiles",
          mediaKitPublished: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublished(true);
      }
    } catch (err) {
      console.error("Failed to publish:", err);
    } finally {
      setPublishing(false);
    }
  };

  const kitSlug = profile?.username || profile?.instagram_handle || user?.id || "";
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/kit/${kitSlug}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      color: "bg-green-500",
      url: `https://wa.me/?text=${encodeURIComponent(`Check out my media kit: ${shareUrl}`)}`,
    },
    {
      name: "Twitter",
      color: "bg-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my media kit!`)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      color: "bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      color: "bg-slate-600",
      url: `mailto:?subject=${encodeURIComponent(`${profile?.full_name}'s Media Kit`)}&body=${encodeURIComponent(`Check out my media kit: ${shareUrl}`)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7FB] pb-20 lg:pb-0">

      {/* Media Kit Preview */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Main Preview */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <MediaKitLayout profile={{ ...profile, bio }} onBioSave={handleBioSave} onTopReelsSave={handleTopReelsSave} editable />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:top-44 lg:self-start">
            {published ? (
              <>
                {/* Share Card — only after publish */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">Share Your Media Kit</h3>
                  <p className="text-xs text-slate-500">
                    Share this link with brands and collaborators to showcase your profile.
                  </p>

                  {/* Copy Link */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="flex-1 text-xs text-slate-600 truncate font-mono">
                      {shareUrl}
                    </p>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                    >
                      {copied ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} className="text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${link.color} text-white text-xs font-bold py-2.5 px-3 rounded-xl text-center hover:opacity-90 transition-opacity`}
                      >
                        {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Pre-publish prompt */
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 text-center">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Share2 size={22} className="text-purple-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Publish to Share</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Review your media kit, edit your bio, then hit <strong>Publish</strong> to get a shareable link you can send to brands and post on social media.
                </p>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
                >
                  {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
                  {publishing ? "Publishing..." : "Publish Media Kit"}
                </button>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Tips to stand out</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  Keep your Instagram profile up to date
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  Add your niche categories in profile settings
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  Share your media kit link in your Instagram bio
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal (fallback for browsers without Web Share API) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Share Media Kit</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Copy Link */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border">
              <p className="flex-1 text-xs text-slate-600 truncate font-mono">
                {shareUrl}
              </p>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${link.color} text-white text-sm font-bold py-3 px-4 rounded-xl text-center hover:opacity-90 transition-opacity`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
