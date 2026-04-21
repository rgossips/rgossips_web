"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X, Upload, Loader2, Trash2, Image as ImageIcon, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const CATEGORIES = [
  "Beauty & Skincare",
  "Fashion & Lifestyle",
  "Food & Beverage",
  "Health, Fitness & Wellness",
  "Travel & Hospitality",
  "Technology & Gadgets",
  "Parenting & Family",
  "Home & Decor",
  "Finance & Personal Finance",
  "Education & Career",
  "Gaming & Entertainment",
  "Automobile & Mobility",
  "Entrepreneurship & Business",
  "Sustainable & Eco-conscious Living",
  "Pet Care & Animals",
];

const emptyForm = {
  title: "",
  description: "",
  campaign_type: "barter",
  max_influencers: "",
  budget_total: "",
  budget_per_influencer: "",
  num_reels: "",
  num_posts: "",
  num_stories: "",
  num_videos: "",
  target_follower_min: "",
  target_follower_max: "",
  target_influencer_tier: "all",
  min_engagement_rate: "",
  target_cities: "",
  campaign_start_date: "",
  campaign_end_date: "",
  application_deadline: "",
};

const desktopQuery = "(min-width: 1024px)";
const subscribe = (cb) => {
  const mql = window.matchMedia(desktopQuery);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const getSnapshot = () => window.matchMedia(desktopQuery).matches;
const getServerSnapshot = () => false;

function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function CreateCampaignDialog({ open, onOpenChange, brandId, onCreated }) {
  const supabase = createClient();
  const isDesktop = useIsDesktop();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleCategory = (c) =>
    setCategories((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const uploadOne = async (file, folder) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const { data, error: err } = await supabase.functions.invoke(
      "upload-campaign-image",
      { body: fd }
    );
    if (err) throw new Error(err.message);
    if (data?.error) throw new Error(data.error);
    return data.url;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");

    if (!brandId) {
      setError("You must be signed in");
      return;
    }
    if (!form.title.trim()) return setError("Title is required");
    if (!form.campaign_start_date) return setError("Start date is required");
    if (!form.campaign_end_date) return setError("End date is required");
    if (!form.application_deadline) return setError("Application deadline is required");

    setSubmitting(true);
    try {
      let bannerUrl = "";
      const galleryUrls = [];

      if (bannerFile) {
        setStage("Uploading banner...");
        bannerUrl = await uploadOne(bannerFile, "banners");
      }
      if (galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          setStage(`Uploading gallery image ${i + 1} of ${galleryFiles.length}...`);
          const url = await uploadOne(galleryFiles[i], "gallery");
          galleryUrls.push(url);
        }
      }

      setStage("Saving campaign...");
      const { data, error: err } = await supabase.functions.invoke(
        "brand-campaigns",
        {
          body: {
            action: "create",
            brandId,
            campaign: {
              ...form,
              target_categories: categories,
              banner_image_url: bannerUrl,
              gallery_image_urls: galleryUrls,
            },
          },
        }
      );

      if (err) throw new Error(err.message);
      if (data?.error) throw new Error(data.error);

      onCreated?.(data.campaignId);
    } catch (e) {
      setError(e.message || "Failed to create campaign");
      setSubmitting(false);
      setStage("");
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Basic info
          </h3>
          <Field label="Title" required>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Summer Fashion 2026"
              className="input"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              placeholder="Describe goals, expectations, brand story..."
              className="input resize-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Campaign Type" required>
              <select
                value={form.campaign_type}
                onChange={(e) => update("campaign_type", e.target.value)}
                className="input"
              >
                <option value="barter">Barter</option>
                <option value="paid">Paid</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Slots">
              <input
                type="number"
                min="1"
                value={form.max_influencers}
                onChange={(e) => update("max_influencers", e.target.value)}
                placeholder="10"
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget (Total)">
              <input
                type="number"
                min="0"
                value={form.budget_total}
                onChange={(e) => update("budget_total", e.target.value)}
                placeholder="50000"
                className="input"
              />
            </Field>
            <Field label="Budget / Influencer">
              <input
                type="number"
                min="0"
                value={form.budget_per_influencer}
                onChange={(e) => update("budget_per_influencer", e.target.value)}
                placeholder="5000"
                className="input"
              />
            </Field>
          </div>
        </section>

        {/* Banner */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Banner image
          </h3>
          {bannerFile ? (
            <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100">
              <img
                src={URL.createObjectURL(bannerFile)}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setBannerFile(null)}
                className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 cursor-pointer shadow"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#5851DB] hover:text-[#5851DB] cursor-pointer transition-colors"
            >
              <Upload size={24} />
              <span className="text-xs font-semibold">Click to upload</span>
              <span className="text-[10px]">PNG, JPG, WebP up to 5MB</span>
            </button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setBannerFile(f);
            }}
          />
        </section>

        {/* Gallery */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
              Gallery
            </h3>
            {galleryFiles.length > 0 && (
              <span className="text-[10px] text-gray-400">
                {galleryFiles.length} image{galleryFiles.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {galleryFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {galleryFiles.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={URL.createObjectURL(f)}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryFiles((prev) => prev.filter((_, x) => x !== i))
                    }
                    className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-full text-red-500 cursor-pointer shadow"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-2 text-gray-400 hover:border-[#5851DB] hover:text-[#5851DB] cursor-pointer text-xs font-semibold transition-colors"
          >
            <ImageIcon size={16} /> Add gallery images
          </button>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setGalleryFiles((prev) => [...prev, ...files]);
            }}
          />
        </section>

        {/* Deliverables */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Content deliverables
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { k: "num_reels", label: "Reels" },
              { k: "num_posts", label: "Posts" },
              { k: "num_stories", label: "Stories" },
              { k: "num_videos", label: "Videos" },
            ].map((d) => (
              <Field key={d.k} label={d.label}>
                <input
                  type="number"
                  min="0"
                  value={form[d.k]}
                  onChange={(e) => update(d.k, e.target.value)}
                  placeholder="0"
                  className="input text-center"
                />
              </Field>
            ))}
          </div>
        </section>

        {/* Requirements */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Influencer requirements
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. Followers">
              <input
                type="number"
                min="0"
                value={form.target_follower_min}
                onChange={(e) => update("target_follower_min", e.target.value)}
                placeholder="1000"
                className="input"
              />
            </Field>
            <Field label="Max. Followers">
              <input
                type="number"
                min="0"
                value={form.target_follower_max}
                onChange={(e) => update("target_follower_max", e.target.value)}
                placeholder="100000"
                className="input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Influencer Tier">
              <select
                value={form.target_influencer_tier}
                onChange={(e) => update("target_influencer_tier", e.target.value)}
                className="input"
              >
                <option value="all">All Tiers</option>
                <option value="nano">Nano (1K-10K)</option>
                <option value="micro">Micro (10K-100K)</option>
                <option value="macro">Macro (100K-1M)</option>
                <option value="mega">Mega (1M+)</option>
              </select>
            </Field>
            <Field label="Min. Engagement Rate (%)">
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.min_engagement_rate}
                onChange={(e) => update("min_engagement_rate", e.target.value)}
                placeholder="2.5"
                className="input"
              />
            </Field>
          </div>
          <Field label="Location (comma-separated)">
            <input
              type="text"
              value={form.target_cities}
              onChange={(e) => update("target_cities", e.target.value)}
              placeholder="Mumbai, Delhi, Bangalore"
              className="input"
            />
          </Field>
        </section>

        {/* Categories */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Categories
          </h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCategory(c)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
                  categories.includes(c)
                    ? "bg-[#EBE9FE] border-[#5851DB] text-[#5851DB]"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
            Schedule
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Start Date" required>
              <input
                type="date"
                value={form.campaign_start_date}
                onChange={(e) => update("campaign_start_date", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="End Date" required>
              <input
                type="date"
                value={form.campaign_end_date}
                onChange={(e) => update("campaign_end_date", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Application Deadline" required>
              <input
                type="date"
                value={form.application_deadline}
                onChange={(e) => update("application_deadline", e.target.value)}
                className="input"
              />
            </Field>
          </div>
        </section>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 12px;
            background: #f8f9fe;
            border: 1px solid transparent;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s;
          }
          .input:focus {
            border-color: #5851db;
            background: #fff;
          }
        `}</style>
      </div>

      {/* Footer */}
      <div className="shrink-0 grid grid-cols-2 gap-3 p-4 border-t border-gray-100 bg-white">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          className="py-3.5 rounded-2xl font-bold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="py-3.5 rounded-2xl font-bold text-sm text-white bg-[#5851DB] hover:bg-[#4742c4] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {stage || "Creating..."}
            </>
          ) : (
            "Create Campaign"
          )}
        </button>
      </div>
    </form>
  );

  const header = (
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
      <div>
        <h2 className="text-lg font-bold text-gray-900">New Campaign</h2>
        <p className="text-[11px] text-gray-400">Will be saved as a draft</p>
      </div>
      {isDesktop ? (
        <DialogClose asChild>
          <button type="button" className="p-2 -mr-2 cursor-pointer">
            <X size={20} className="text-gray-400" />
          </button>
        </DialogClose>
      ) : (
        <DrawerClose asChild>
          <button type="button" className="p-2 -mr-2 cursor-pointer">
            <X size={20} className="text-gray-400" />
          </button>
        </DrawerClose>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[680px] h-[92vh] max-h-[92vh] p-0 flex flex-col overflow-hidden rounded-2xl"
        >
          {header}
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/40 z-50" />
        <DrawerContent className="fixed inset-x-0 bottom-0 z-50 h-[92vh] rounded-t-[32px] bg-white border-none flex flex-col focus:outline-none pb-[env(safe-area-inset-bottom)]">
          {header}
          {content}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
