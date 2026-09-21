"use client";

// The "Top reels" link editor, shared by the floating EditOverlay (Glass Blue,
// Editorial Noir, Bento Sunset, Neo Brutalist) and the Classic template's
// inline editor. Each owns its own frame and Save/Cancel buttons; this owns
// the list, the checks and every message, so both say exactly the same thing.
//
// Two layers of checks:
//   1. Before saving (lib/reelLinks): not an Instagram link, a story, a share
//      link, a profile, a duplicate — caught instantly with a fix-it hint.
//   2. After the server looks the links up on Instagram: older than the
//      creator's latest 50 posts (the product rule — brands see recent work),
//      or not on their account — shown under the exact link, with the account
//      named. Instagram disconnected → one clear "reconnect" message instead
//      of blaming every link.

import { useMemo, useState } from "react";
import { Loader2, X as XIcon, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { checkReelLinks, serverProblems, TOP_REELS_POST_LIMIT } from "@/lib/reelLinks";

export function useReelLinksEditor(initialReels, onSave) {
  const [links, setLinks] = useState(() => {
    const l = (initialReels || []).map((r) => r.permalink || "").filter(Boolean);
    return l.length ? l : [""];
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const localProblems = useMemo(() => checkReelLinks(links), [links]);
  const remoteProblems = useMemo(
    () => (saveError?.kind === "unresolved" ? serverProblems(saveError.details) : new Map()),
    [saveError],
  );
  const hasLocalProblems = localProblems.some(Boolean);

  // Editing a link clears the server's verdict on it — it's a different link now.
  const handleChange = (i, val) => {
    setLinks((prev) => prev.map((l, idx) => (idx === i ? val : l)));
    if (saveError?.kind === "unresolved") {
      const was = links[i]?.trim();
      const details = saveError.details.filter((d) => String(d.url).trim() !== was);
      setSaveError(details.length ? { ...saveError, details } : null);
    }
  };
  const handleAdd = () => setLinks((prev) => [...prev, ""]);
  const handleRemove = (i) => {
    const removed = links[i]?.trim();
    setLinks((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [""];
    });
    if (saveError?.kind === "unresolved") {
      const details = saveError.details.filter((d) => String(d.url).trim() !== removed);
      setSaveError(details.length ? { ...saveError, details } : null);
    }
  };

  /** Resolves to true when saved (the caller closes the editor). */
  const handleSave = async () => {
    if (saving || hasLocalProblems) return false;
    const valid = links.map((l) => l.trim()).filter(Boolean);
    const next = valid.map((url, i) => ({
      id: `custom_${i}`,
      permalink: url,
      thumbnail: "",
      mediaType: "VIDEO",
      likes: 0,
      comments: 0,
      caption: "",
      curated: true,
    }));
    setSaving(true);
    setSaveError(null);
    try {
      const res = await onSave?.(next);
      if (res?.error) {
        setSaveError(res.error);
        return false;
      }
      return true;
    } finally {
      setSaving(false);
    }
  };

  const problemAt = (i) => localProblems[i] || remoteProblems.get(links[i]?.trim()) || null;

  return {
    links,
    saving,
    saveError,
    canSave: !saving && !hasLocalProblems,
    problemAt,
    handleAdd,
    handleRemove,
    handleChange,
    handleSave,
  };
}

export function ReelLinksFields({ editor, account }) {
  const t = useTranslations("MediaKitReels");
  const { links, saving, saveError, problemAt, handleAdd, handleRemove, handleChange } = editor;
  const shownAccount = saveError?.account || account;
  const failedCount = saveError?.kind === "unresolved" ? saveError.details.length : 0;

  const limit = saveError?.limit || TOP_REELS_POST_LIMIT;
  const problemText = (code) =>
    code === "tooOld"
      ? t("errors.tooOld", { limit, account: shownAccount || t("yourAccount") })
      : code === "notFound"
        ? t("errors.notFound", { account: shownAccount || t("yourAccount") })
        : t(`errors.${code}`);

  return (
    <div className="space-y-3">
      {/* Guidance — what to paste and how to get it. */}
      <div className="flex gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 leading-relaxed">
        <Info size={14} className="shrink-0 mt-0.5 text-purple-500" />
        <div className="space-y-1">
          <p>
            {shownAccount
              ? t("guidance.own", { account: shownAccount })
              : t("guidance.ownNoAccount")}
          </p>
          <p>{t("guidance.howTo")}</p>
          <p className="text-slate-500">{t("guidance.latestOnly", { limit: TOP_REELS_POST_LIMIT })}</p>
        </div>
      </div>

      {saving && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100 text-xs text-purple-700">
          <Loader2 size={14} className="animate-spin shrink-0" />
          {t("saving")}
        </div>
      )}

      {saveError && !saving && (
        <div role="alert" className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
          {saveError.kind === "unresolved"
            ? t("top.unresolved", { count: failedCount })
            : saveError.kind === "reconnect"
              ? t("top.reconnect")
              : t("top.failed")}
        </div>
      )}

      {links.map((link, i) => {
        const problem = link.trim() ? problemAt(i) : null;
        return (
          <div key={i}>
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => handleChange(i, e.target.value)}
                placeholder={t("placeholder")}
                aria-invalid={!!problem}
                className={`flex-1 min-w-0 py-2.5 px-3 bg-slate-50 border focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all ${problem ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-purple-300"}`}
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={t("remove")}
                className="w-9 h-9 shrink-0 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center cursor-pointer"
              >
                <XIcon size={14} />
              </button>
            </div>
            {problem && <p className="text-[11px] text-red-500 mt-1 ml-1 leading-snug">{problemText(problem)}</p>}
          </div>
        );
      })}

      <button
        type="button"
        onClick={handleAdd}
        className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-purple-300 hover:text-purple-500 cursor-pointer"
      >
        {t("addLink")}
      </button>
    </div>
  );
}
