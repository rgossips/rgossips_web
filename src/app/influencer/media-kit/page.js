"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import MediaKitLayout from "@/components/MediaKitLayout";
import { Share2, Copy, Check, Loader2, Lock, Crown, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { MEDIA_KIT_TEMPLATES, profileCanUseMediaKitTemplate, getEffectivePlan, getProfileTemplateChangeUsage } from "@/lib/plans";

export default function MediaKitPage() {
  const t = useTranslations("InfluencerMediaKit");
  const { profile, user, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [published, setPublished] = useState(!!profile?.media_kit_published);
  const [publishing, setPublishing] = useState(false);
  // The saved template lives on the profile; `previewTemplate` is a local
  // override so the creator can flip through layouts before committing.
  const savedTemplate = profile?.media_kit_template || "classic";
  const [previewTemplate, setPreviewTemplate] = useState(savedTemplate);
  const [savingTemplate, setSavingTemplate] = useState(null);
  const [templateError, setTemplateError] = useState("");

  useEffect(() => {
    // If the profile refreshes (e.g. after a save) sync the local preview
    // to whatever the DB now says is current.
    setPreviewTemplate(savedTemplate);
  }, [savedTemplate]);

  const handleTemplateSave = useCallback(
    async (templateId) => {
      if (!user?.id) return;
      setSavingTemplate(templateId);
      setTemplateError("");
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
            mediaKitTemplate: templateId,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.error) {
          // Server enforced the plan / change-cap limit. Surface the message
          // so the user understands why the save was refused.
          setTemplateError(data.error);
        } else {
          await refreshProfile?.();
        }
      } catch (err) {
        console.error("Failed to save template:", err);
        setTemplateError(t("errors.saveFailed"));
      } finally {
        setSavingTemplate(null);
      }
    },
    [user, refreshProfile, t],
  );

  const handleBioSave = useCallback(
    async (newBio) => {
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
    },
    [user],
  );

  const handleTopReelsSave = useCallback(
    async (newReels) => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
        const headers = { "Content-Type": "application/json", apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

        // Resolve thumbnails from Instagram API
        const links = newReels.map((r) => r.permalink).filter(Boolean);
        let resolvedReels = newReels;

        if (links.length > 0) {
          try {
            const resolveRes = await fetch(`${supabaseUrl}/functions/v1/resolve-reel-thumbnails`, {
              method: "POST",
              headers,
              body: JSON.stringify({ userId: user.id, reelLinks: links }),
            });
            const resolveData = await resolveRes.json();
            if (resolveData?.reels) {
              resolvedReels = resolveData.reels;
            }
          } catch (e) {
            console.error("Failed to resolve thumbnails:", e);
          }
        }

        await fetch(`${supabaseUrl}/functions/v1/update-profile`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId: user.id,
            table: "influencer_profiles",
            topReels: resolvedReels,
          }),
        });
      } catch (err) {
        console.error("Failed to save top reels:", err);
      }
    },
    [user],
  );

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
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/kit/${kitSlug}` : "";

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
      url: `https://wa.me/?text=${encodeURIComponent(t("share.message", { url: shareUrl }))}`,
    },
    {
      name: "Twitter",
      color: "bg-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(t("share.messageShort"))}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "LinkedIn",
      color: "bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "Email",
      color: "bg-slate-600",
      url: `mailto:?subject=${encodeURIComponent(t("share.emailSubject", { name: profile?.full_name || "" }))}&body=${encodeURIComponent(t("share.message", { url: shareUrl }))}`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7FB] pb-20 lg:pb-0">
      {/* Media Kit Preview */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10 py-[120px]">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Main Preview */}
          <div className="flex-1">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <MediaKitLayout profile={{ ...profile, bio }} onBioSave={handleBioSave} onTopReelsSave={handleTopReelsSave} editable templateOverride={previewTemplate} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4 lg:sticky lg:self-start">
            <TemplatePicker
              profile={profile}
              previewTemplate={previewTemplate}
              savedTemplate={savedTemplate}
              savingTemplate={savingTemplate}
              templateError={templateError}
              onPreview={(id) => { setTemplateError(""); setPreviewTemplate(id); }}
              onSave={handleTemplateSave}
            />
            {published ? (
              <>
                {/* Share Card — only after publish */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                  <h3 className="text-sm font-bold text-slate-900">{t("share.cardTitle")}</h3>
                  <p className="text-xs text-slate-500">{t("share.cardDescription")}</p>

                  {/* Copy Link */}
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="flex-1 text-xs text-slate-600 truncate font-mono">{shareUrl}</p>
                    <button onClick={handleCopyLink} className="p-2 hover:bg-slate-200 rounded-lg transition-colors shrink-0">
                      {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-slate-400" />}
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
                <h3 className="text-sm font-bold text-slate-900">{t("publish.title")}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {t.rich("publish.description", { b: (c) => <strong>{c}</strong> })}
                </p>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
                >
                  {publishing ? <Loader2 size={16} className="animate-spin" /> : null}
                  {publishing ? t("publish.publishing") : t("publish.cta")}
                </button>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">{t("tips.title")}</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  {t("tips.item1")}
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  {t("tips.item2")}
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="text-purple-500 mt-0.5">&#10003;</span>
                  {t("tips.item3")}
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
              <h3 className="text-lg font-bold text-slate-900">{t("share.modalTitle")}</h3>
              <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                ✕
              </button>
            </div>

            {/* Copy Link */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border">
              <p className="flex-1 text-xs text-slate-600 truncate font-mono">{shareUrl}</p>
              <button onClick={handleCopyLink} className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg">
                {copied ? t("share.copied") : t("share.copy")}
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

// Lets the creator preview + adopt one of the five media-kit templates.
// Plan-locked options are visible (so the upsell is obvious) but the
// user can't even preview them — clicking does nothing, the card is
// dimmed + has a "not-allowed" cursor. The persistent upgrade nudge at
// the bottom is the only path to action for a locked tier.
function TemplatePicker({ profile, previewTemplate, savedTemplate, savingTemplate, templateError, onPreview, onSave }) {
  const t = useTranslations("InfluencerMediaKit");
  const effectivePlan = getEffectivePlan(profile);
  const hasUnsavedPreview = previewTemplate !== savedTemplate;
  const previewMeta = MEDIA_KIT_TEMPLATES.find((tpl) => tpl.id === previewTemplate);
  const canUsePreview = profileCanUseMediaKitTemplate(profile, previewTemplate);
  const usage = getProfileTemplateChangeUsage(profile);
  const isUnlimited = !isFinite(usage.limit);
  const isCapped = !isUnlimited && usage.remaining <= 0;
  // Re-picking the live template is a no-op server-side, so it doesn't count
  // against the cap and stays allowed even when the user is at the limit.
  const previewIsLive = previewTemplate === savedTemplate;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate size={16} className="text-purple-500" />
        <h3 className="text-sm font-bold text-slate-900">{t("templates.title")}</h3>
        <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">{effectivePlan}</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-snug">{t("templates.hint")}</p>

      <div className="space-y-2">
        {MEDIA_KIT_TEMPLATES.map((tpl) => {
          // "Locked" still means the plan can't *save* this template, but we
          // let every plan preview every template so the upgrade upsell is
          // tangible — you see the design you'd be paying for before paying.
          const locked = !profileCanUseMediaKitTemplate(profile, tpl.id);
          const isSaved = savedTemplate === tpl.id;
          const isPreviewing = previewTemplate === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => !locked && onPreview(tpl.id)}
              disabled={locked}
              aria-disabled={locked}
              title={locked ? t("templates.lockedTitle", { plan: tpl.minPlan }) : undefined}
              className={`w-full text-left rounded-xl border p-2.5 flex items-center gap-3 transition-all ${
                locked
                  ? "border-slate-100 bg-slate-50/60 opacity-60 cursor-not-allowed"
                  : isPreviewing
                    ? "border-purple-400 ring-2 ring-purple-100 bg-purple-50/40 cursor-pointer"
                    : "border-slate-100 hover:border-slate-200 cursor-pointer"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-lg shrink-0 border border-slate-100 ${locked ? "grayscale" : ""}`}
                style={{ background: tpl.preview }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold truncate ${locked ? "text-slate-500" : "text-slate-800"}`}>{tpl.label}</p>
                  {isSaved && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 uppercase tracking-wider">{t("templates.live")}</span>}
                </div>
                <p className="text-[10px] text-slate-400 truncate">{tpl.description}</p>
              </div>
              {locked ? (
                <span className="flex items-center gap-1 shrink-0 text-[9px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  <Lock size={9} /> {tpl.minPlan}
                </span>
              ) : isPreviewing ? (
                <Check size={14} className="text-purple-500 shrink-0" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Save / status footer.
          Three states for the action row:
            1. Previewing a template the plan can't save → upgrade CTA
            2. Previewing a save-able template that differs from Live → Use button
               (disabled when Pro has hit the 3-change cap, unless re-saving Live)
            3. Preview matches Live → "X is your live template." copy */}
      {hasUnsavedPreview && !canUsePreview && (
        <Link
          href="/influencer/pricing"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #e60076 100%)" }}
        >
          <Crown size={12} /> {t("templates.upgradeToUse", { plan: previewMeta?.minPlan || "", label: previewMeta?.label || "" })}
        </Link>
      )}
      {hasUnsavedPreview && canUsePreview && (
        <button
          onClick={() => onSave(previewTemplate)}
          disabled={savingTemplate === previewTemplate || (isCapped && !previewIsLive)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
        >
          {savingTemplate === previewTemplate ? <Loader2 size={14} className="animate-spin" /> : null}
          {savingTemplate === previewTemplate ? t("templates.saving") : t("templates.useTemplate", { label: previewMeta?.label || t("templates.thisTemplate") })}
        </button>
      )}
      {!hasUnsavedPreview && <p className="text-[10px] text-slate-400 text-center">{t("templates.liveTemplate", { label: previewMeta?.label || "" })}</p>}

      {/* Surface the server's reason (plan lock or change-cap exhausted) */}
      {templateError && (
        <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 leading-snug">
          {templateError}
        </p>
      )}

      {/* Lifetime change cap — only meaningful for plans whose cap is finite
          and non-zero (i.e. Pro). Starter (cap 0) shouldn't see a "0 of 0
          changes" line; the upgrade CTAs already tell that story. */}
      {!isUnlimited && usage.limit > 0 && (
        <div className={`rounded-lg px-3 py-2 border text-[11px] font-bold leading-snug ${isCapped ? "border-rose-100 bg-rose-50 text-rose-600" : "border-slate-100 bg-slate-50 text-slate-600"}`}>
          {isCapped
            ? t("templates.capReached", { count: usage.limit })
            : t("templates.remaining", { remaining: usage.remaining, count: usage.limit, plan: effectivePlan })}
        </div>
      )}
      {isUnlimited && effectivePlan === "elite" && (
        <p className="text-[10px] text-emerald-600 font-bold text-center">{t("templates.unlimited")}</p>
      )}

      {/* Upgrade nudge if any template above is locked OR the cap is hit */}
      {(MEDIA_KIT_TEMPLATES.some((tpl) => !profileCanUseMediaKitTemplate(profile, tpl.id)) || isCapped) && (
        <Link
          href="/influencer/pricing"
          className="block w-full text-center py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition-colors"
        >
          <Crown size={12} className="inline -translate-y-px mr-1" /> {isCapped ? t("templates.upgradeUnlimited") : t("templates.upgradeUnlock")}
        </Link>
      )}

      <p className="text-[10px] text-slate-400 leading-snug text-center pt-1">
        {t.rich("templates.editHint", {
          editBio: (c) => <span className="font-bold text-purple-500">{c}</span>,
          editReels: (c) => <span className="font-bold text-purple-500">{c}</span>,
        })}
      </p>
    </div>
  );
}
