"use client";

// Floating edit toolbar + modals used by every media-kit template. Each
// template renders its own visual styling read-only, and this overlay
// provides a uniform Bio + Top Reels editing flow on top of it.

import React, { useEffect, useRef, useState } from "react";
import { Pencil, Loader2, X as XIcon, Check } from "lucide-react";

const INSTAGRAM_LINK_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels)\//;

export default function MediaKitEditOverlay({ bio, reels, onBioSave, onTopReelsSave }) {
  const [open, setOpen] = useState(null); // "bio" | "reels" | null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 items-end">
        <EditPill onClick={() => setOpen("bio")} label="Edit Bio" />
        <EditPill onClick={() => setOpen("reels")} label="Edit Top Reels" />
      </div>

      {open === "bio" && (
        <BioModal
          initial={bio || ""}
          onClose={() => setOpen(null)}
          onSave={async (next) => {
            await onBioSave?.(next);
            setOpen(null);
          }}
        />
      )}
      {open === "reels" && (
        <ReelsModal
          initial={reels || []}
          onClose={() => setOpen(null)}
          onSave={async (next) => {
            await onTopReelsSave?.(next);
            setOpen(null);
          }}
        />
      )}
    </>
  );
}

function EditPill({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-bold shadow-lg shadow-purple-300/40 hover:opacity-90 cursor-pointer"
      style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
    >
      <Pencil size={12} />
      {label}
    </button>
  );
}

function ModalShell({ title, subtitle, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1.5 hover:bg-slate-100 rounded-lg cursor-pointer" aria-label="Close">
            <XIcon size={16} className="text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-100 p-4 bg-slate-50">{footer}</div>}
      </div>
    </div>
  );
}

function BioModal({ initial, onClose, onSave }) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft.trim()); } finally { setSaving(false); }
  };

  return (
    <ModalShell
      title="Edit your bio"
      subtitle="Shown across every media-kit template"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400 font-semibold">{draft.length}/500</span>
          <div className="flex gap-2">
            <button onClick={onClose} disabled={saving} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl hover:opacity-90 cursor-pointer disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      }
    >
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        placeholder="Write something about yourself…"
        maxLength={500}
        rows={5}
        className="w-full text-sm text-slate-700 leading-relaxed bg-slate-50 border border-slate-200 focus:bg-white focus:border-purple-300 rounded-2xl p-3.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all"
      />
    </ModalShell>
  );
}

function ReelsModal({ initial, onClose, onSave }) {
  const [links, setLinks] = useState(() =>
    initial?.length > 0 ? initial.map((r) => r.permalink || "") : [""]
  );
  const [saving, setSaving] = useState(false);

  const handleAdd = () => setLinks((prev) => [...prev, ""]);
  const handleRemove = (i) => setLinks((prev) => prev.filter((_, idx) => idx !== i));
  const handleChange = (i, val) => setLinks((prev) => prev.map((l, idx) => (idx === i ? val : l)));

  const invalid = links.some((l) => l.trim() && !INSTAGRAM_LINK_RE.test(l.trim()));

  const handleSave = async () => {
    setSaving(true);
    try {
      const valid = links.filter((l) => l.trim());
      const next = valid.map((url, i) => ({
        id: `custom_${i}`,
        permalink: url,
        thumbnail: "",
        mediaType: "VIDEO",
        likes: 0,
        comments: 0,
        caption: "",
      }));
      await onSave(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Edit your top reels"
      subtitle="Instagram post or reel links — thumbnails resolve automatically"
      onClose={onClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || invalid}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl hover:opacity-90 cursor-pointer disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        {links.map((link, i) => {
          const isValid = !link.trim() || INSTAGRAM_LINK_RE.test(link.trim());
          return (
            <div key={i}>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={link}
                  onChange={(e) => handleChange(i, e.target.value)}
                  placeholder="https://www.instagram.com/reel/…"
                  className={`flex-1 py-2.5 px-3 bg-slate-50 border focus:bg-white rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-all ${!isValid ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-purple-300"}`}
                />
                <button onClick={() => handleRemove(i)} disabled={links.length === 1} className="w-9 h-9 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center cursor-pointer disabled:opacity-40">
                  <XIcon size={14} />
                </button>
              </div>
              {!isValid && <p className="text-[10px] text-red-500 mt-1 ml-1">Only Instagram post / reel links are allowed.</p>}
            </div>
          );
        })}
        <button
          onClick={handleAdd}
          className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-purple-300 hover:text-purple-500 cursor-pointer"
        >
          + Add reel link
        </button>
      </div>
    </ModalShell>
  );
}
