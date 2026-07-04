"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Drawer, DrawerContent, DrawerClose, DrawerOverlay, DrawerPortal } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { X, Upload, Loader2, Trash2, Image as ImageIcon, Check, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useGlobalLoading } from "@/context/LoadingContext";

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

const PLATFORMS = ["Instagram"];

const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Bhopal", "Kochi", "Remote"];

const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Marathi", "Kannada", "Bengali", "Gujarati", "Punjabi", "Malayalam"];

const GENDERS = ["Male", "Female", "Any"];

const USAGE_RIGHTS = [
  { value: "creator_only", label: "Influencer's page only" },
  { value: "brand_repost", label: "Brand can repost" },
  { value: "paid_ads", label: "Brand can use in paid ads" },
  { value: "full_rights", label: "Full rights transfer" },
];

const PAYMENT_TIMELINES = [
  { value: "advance", label: "Advance" },
  { value: "on_approval", label: "On content approval" },
  { value: "7_days", label: "Within 7 days of posting" },
  { value: "30_days", label: "Within 30 days" },
];

const KEEPUP_DURATIONS = [
  { value: "24h", label: "24 hours (stories)" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "permanent", label: "Permanent" },
];

const EXCLUSIVITY_PERIODS = [
  { value: "0", label: "No exclusivity" },
  { value: "7", label: "7 days" },
  { value: "15", label: "15 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

// Auto-fill follower ranges when tier is selected
const TIER_RANGES = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  macro: { min: 100000, max: 1000000 },
  mega: { min: 1000000, max: 10000000 },
};

const emptyForm = {
  title: "",
  description: "",
  campaign_type: "barter",
  offering_type: "product", // "product" | "service"
  max_influencers: "",
  budget_total: "",
  budget_per_influencer: "",
  product_name: "",
  product_value: "",
  shipping_required: "no",
  shipping_timeline_days: "",
  service_location: "",
  barter_compensation: "",
  num_reels: "",
  num_posts: "",
  num_stories: "",
  num_videos: "",
  num_blogs: "",
  target_follower_min: "",
  target_follower_max: "",
  target_influencer_tier: "all",
  min_engagement_rate: "",
  content_dos: "",
  content_donts: "",
  required_hashtags: "",
  brand_handles_to_tag: "",
  usage_rights: "creator_only",
  keepup_duration: "permanent",
  exclusivity_days: "0",
  payment_timeline: "on_approval",
  campaign_start_date: "",
  application_deadline: "",
  campaign_end_date: "",
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

const DESCRIPTION_TEMPLATE = "What is this campaign about?\n\nWhat do you want the influencer to highlight?\n\nAny specific messaging or hashtags?";

// Trim a server-returned ISO date to YYYY-MM-DD for <input type="date">.
// Postgres DATE columns already arrive as YYYY-MM-DD strings; DATETIME
// columns come as full ISO — either way, first 10 chars is what the
// input expects.
const isoToDateInput = (v) => (typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : "");

// Server returns content_types_required as strings like "reels:2" —
// unpack into the num_reels / num_posts / etc. form fields.
const parseContentTypes = (arr) => {
  const out = { num_reels: "", num_posts: "", num_stories: "", num_videos: "", num_blogs: "" };
  for (const item of Array.isArray(arr) ? arr : []) {
    const [k, n] = String(item).split(":");
    if (!k) continue;
    if (k in { reels: 1, posts: 1, stories: 1, videos: 1, blogs: 1 }) {
      out[`num_${k}`] = String(Number(n) || 0);
    }
  }
  return out;
};

// Map a server-returned campaign row (from brand-campaigns.get, all
// camelCase + metadata already merged) back into the snake_case form
// shape used by this dialog. Used only in edit mode.
function campaignToForm(c) {
  if (!c) return { form: emptyForm, categories: [], platforms: ["Instagram"], cities: [], allIndia: false, genders: [], languages: [], bannerUrl: "", galleryUrls: [] };
  const content = parseContentTypes(c.contentTypesRequired);
  const targetCities = Array.isArray(c.targetCities) ? c.targetCities : [];
  const allIndia = targetCities.length === 1 && targetCities[0] === "All India";
  return {
    form: {
      ...emptyForm,
      title: c.title || "",
      description: c.description || "",
      campaign_type: c.campaignType || "barter",
      offering_type: c.offering_type || (c.productName ? "product" : c.service_location ? "service" : "product"),
      max_influencers: c.maxInfluencers ? String(c.maxInfluencers) : "",
      budget_total: c.budgetTotal ? String(c.budgetTotal) : "",
      budget_per_influencer: c.budgetPerInfluencer ? String(c.budgetPerInfluencer) : "",
      product_name: c.productName || "",
      product_value: c.productValue ? String(c.productValue) : "",
      shipping_required: c.shippingRequired || "no",
      shipping_timeline_days: c.shippingTimelineDays ? String(c.shippingTimelineDays) : "",
      service_location: c.serviceLocation || "",
      barter_compensation: c.barterCompensation || "",
      ...content,
      target_follower_min: c.targetFollowerMin ? String(c.targetFollowerMin) : "",
      target_follower_max: c.targetFollowerMax ? String(c.targetFollowerMax) : "",
      target_influencer_tier: c.targetInfluencerTier || "all",
      min_engagement_rate: c.minEngagementRate ? String(c.minEngagementRate) : "",
      content_dos: c.contentDos || "",
      content_donts: c.contentDonts || "",
      required_hashtags: c.requiredHashtags || "",
      brand_handles_to_tag: c.brandHandlesToTag || "",
      usage_rights: c.usageRights || "creator_only",
      keepup_duration: c.keepupDuration || "permanent",
      exclusivity_days: c.exclusivityDays || "0",
      payment_timeline: c.paymentTimeline || "on_approval",
      campaign_start_date: isoToDateInput(c.startDate),
      application_deadline: isoToDateInput(c.applicationDeadline),
      campaign_end_date: isoToDateInput(c.endDate),
    },
    categories: Array.isArray(c.categories) ? c.categories : [],
    platforms: Array.isArray(c.platforms) && c.platforms.length ? c.platforms : ["Instagram"],
    cities: allIndia ? [] : targetCities,
    allIndia,
    genders: Array.isArray(c.targetGender) ? c.targetGender : [],
    languages: Array.isArray(c.targetLanguages) ? c.targetLanguages : [],
    bannerUrl: c.bannerImage || "",
    galleryUrls: Array.isArray(c.galleryImages) ? c.galleryImages : [],
  };
}

export function CreateCampaignDialog({
  open,
  onOpenChange,
  brandId,
  onCreated,
  // Optional edit mode — parent passes the full campaign object it
  // already fetched via brand-campaigns(get). When undefined we're in
  // create mode (default behaviour).
  mode = "create",
  campaignId = null,
  initialCampaign = null,
  // Fired when the server refuses an update because the campaign
  // already has applications. Parent typically closes the form and
  // opens a "not editable" guard modal.
  onEditBlocked,
  // Fired on a successful update (edit mode). Parent typically refreshes
  // the campaign detail page and closes the dialog.
  onUpdated,
}) {
  const supabase = createClient();
  const isDesktop = useIsDesktop();
  const { startLoading, stopLoading } = useGlobalLoading();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState(["Instagram"]);
  const [cities, setCities] = useState([]);
  const [allIndia, setAllIndia] = useState(false);
  const [genders, setGenders] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  // In edit mode we start with the pre-existing image URLs — the form
  // treats them the same as "already uploaded, no re-upload needed"
  // unless the brand picks a new file to replace them.
  const [existingBannerUrl, setExistingBannerUrl] = useState("");
  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState("");
  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Prefill on open. Two shapes:
  //   - mode==="edit" + initialCampaign → prefill with existing values;
  //     submit updates the source row.
  //   - mode==="create" + initialCampaign → prefill from an existing
  //     campaign but treat it as a new draft (duplicate flow). Submit
  //     inserts a fresh row; the source is untouched. Title override
  //     from initialCampaign.title (parent typically prepends "Copy of").
  //   - mode==="create" without initialCampaign → clean slate.
  // Reset on close so the next open starts from the right baseline.
  useEffect(() => {
    if (!open) return;
    if (initialCampaign) {
      const preset = campaignToForm(initialCampaign);
      setForm(preset.form);
      setCategories(preset.categories);
      setPlatforms(preset.platforms);
      setCities(preset.cities);
      setAllIndia(preset.allIndia);
      setGenders(preset.genders);
      setLanguages(preset.languages);
      setExistingBannerUrl(preset.bannerUrl);
      setExistingGalleryUrls(preset.galleryUrls);
      setBannerFile(null);
      setGalleryFiles([]);
      setError("");
    } else {
      setForm(emptyForm);
      setCategories([]);
      setPlatforms(["Instagram"]);
      setCities([]);
      setAllIndia(false);
      setGenders([]);
      setLanguages([]);
      setExistingBannerUrl("");
      setExistingGalleryUrls([]);
      setBannerFile(null);
      setGalleryFiles([]);
      setError("");
    }
    // We intentionally don't depend on the individual state setters —
    // they're stable — nor on initialCampaign identity beyond open. If
    // the parent hands us a new campaign object mid-flight, they should
    // close+reopen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleSetItem = (setter) => (item) => setter((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));
  const toggleCategory = toggleSetItem(setCategories);
  const togglePlatform = toggleSetItem(setPlatforms);
  const toggleCity = toggleSetItem(setCities);
  const toggleGender = toggleSetItem(setGenders);
  const toggleLanguage = toggleSetItem(setLanguages);

  const isBarter = form.campaign_type === "barter";
  const isHybrid = form.campaign_type === "hybrid";
  const showBudget = !isBarter; // budget hidden when pure barter
  const showProductValue = isBarter || isHybrid; // product value shown when barter/hybrid
  const showBarterCompensation = isBarter || isHybrid;

  // Auto-calc Budget / Influencer = Budget Total / Slots
  useEffect(() => {
    const total = Number(form.budget_total) || 0;
    const slots = Number(form.max_influencers) || 0;
    if (total > 0 && slots > 0) {
      const perInf = Math.round(total / slots);
      // Only update if different to avoid render loop
      if (String(perInf) !== form.budget_per_influencer) {
        setForm((p) => ({ ...p, budget_per_influencer: String(perInf) }));
      }
    }
  }, [form.budget_total, form.max_influencers, form.budget_per_influencer]);

  // Auto-fill follower min/max when tier changes
  useEffect(() => {
    const range = TIER_RANGES[form.target_influencer_tier];
    if (range) {
      setForm((p) => ({
        ...p,
        target_follower_min: String(range.min),
        target_follower_max: String(range.max),
      }));
    }
  }, [form.target_influencer_tier]);

  // Live total deliverables
  const totalDeliverables = useMemo(() => {
    return ["num_reels", "num_posts", "num_stories", "num_videos", "num_blogs"].reduce((s, k) => s + (Number(form[k]) || 0), 0);
  }, [form.num_reels, form.num_posts, form.num_stories, form.num_videos, form.num_blogs]);

  const compressImage = async (file, maxEdge = 1920, quality = 0.85) => {
    if (!file.type.startsWith("image/")) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      if (scale >= 1 && file.size <= 5 * 1024 * 1024) return file;
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", quality));
      bitmap.close?.();
      if (!blob) return file;
      return blob.size < file.size ? new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }) : file;
    } catch {
      return file;
    }
  };

  const uploadOne = async (file, folder) => {
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append("file", compressed);
    fd.append("folder", folder);
    const { data, error: err } = await supabase.functions.invoke("upload-campaign-image", { body: fd });
    if (err) throw new Error(err.message);
    if (data?.error) throw new Error(data.error);
    return data.url;
  };

  const submitForm = async (publish) => {
    setError("");

    // Validation
    if (!brandId) return setError("You must be signed in");
    if (!form.title.trim()) return setError("Title is required");
    if (!form.campaign_start_date) return setError("Start date is required");
    if (!form.application_deadline) return setError("Application deadline is required");
    if (!form.campaign_end_date) return setError("Campaign end date is required");
    if (form.application_deadline && form.campaign_end_date && new Date(form.application_deadline) > new Date(form.campaign_end_date)) {
      return setError("Application deadline must be on or before the campaign end date");
    }
    if (totalDeliverables < 1) return setError("Add at least 1 deliverable (reels, posts, stories, videos or blogs)");
    if (categories.length < 1) return setError("Select at least 1 category");
    if (platforms.length < 1) return setError("Select at least 1 platform");
    // A published campaign must carry a banner — it's the hero image
    // creators see in every listing. Drafts can be saved without one.
    // In edit mode the existing banner counts.
    const hasAnyBanner = !!bannerFile || !!form.banner_image_url || !!existingBannerUrl;
    if (publish && !hasAnyBanner) {
      return setError("Add a campaign banner before publishing — it's the cover image creators see.");
    }

    setSubmitting(true);
    const busyCopy = mode === "edit"
      ? "Saving changes..."
      : publish ? "Publishing campaign..." : "Saving draft...";
    startLoading(busyCopy);
    try {
      // Keep any existing images the brand didn't replace with a new upload.
      let bannerUrl = existingBannerUrl;
      const galleryUrls = [...existingGalleryUrls];

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

      setStage(busyCopy);
      const campaignPayload = {
        ...form,
        target_categories: categories,
        target_cities: allIndia ? ["All India"] : cities,
        banner_image_url: bannerUrl,
        gallery_image_urls: galleryUrls,
        platforms,
        target_gender: genders,
        target_languages: languages,
      };

      if (mode === "edit") {
        // Update never touches status — the caller uses updateStatus for
        // pause / publish. Publish button is hidden in edit mode below.
        const { data, error: err } = await supabase.functions.invoke("brand-campaigns", {
          body: {
            action: "update",
            brandId,
            campaignId,
            campaign: campaignPayload,
          },
        });
        if (err) throw new Error(err.message);
        if (data?.error === "has_applications") {
          // Race — someone applied between the client-side check and
          // this submit. Bail out cleanly, let the parent open the
          // "not editable" guard modal.
          onEditBlocked?.();
          onOpenChange?.(false);
          return;
        }
        if (data?.error) throw new Error(data.error);
        onUpdated?.(campaignId);
      } else {
        const { data, error: err } = await supabase.functions.invoke("brand-campaigns", {
          body: {
            action: "create",
            brandId,
            campaign: {
              ...campaignPayload,
              status: publish ? "active" : "draft",
            },
          },
        });
        if (err) throw new Error(err.message);
        if (data?.error) throw new Error(data.error);
        onCreated?.(data.campaignId);
      }
    } catch (e) {
      setError(e.message || (mode === "edit" ? "Failed to save changes" : "Failed to create campaign"));
      setSubmitting(false);
      setStage("");
    } finally {
      stopLoading();
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    submitForm(false);
  };

  const content = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        {/* Basic Info */}
        <Section title="Basic info">
          <Field label="Title" required>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Summer Fashion 2026" className="input" />
          </Field>
          <Field label="Description" hint="Helps creators understand what you need">
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} placeholder={DESCRIPTION_TEMPLATE} className="input resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Campaign Type" required>
              <select value={form.campaign_type} onChange={(e) => update("campaign_type", e.target.value)} className="input">
                <option value="barter">Barter</option>
                <option value="paid">Paid</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </Field>
            <Field label="Slots" hint="Number of creators">
              <input type="number" min="1" value={form.max_influencers} onChange={(e) => update("max_influencers", e.target.value)} placeholder="10" className="input" />
            </Field>
          </div>

          {/* Budget — only when paid or hybrid */}
          {showBudget && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget (Total)">
                <input type="number" min="0" value={form.budget_total} onChange={(e) => update("budget_total", e.target.value)} placeholder="50000" className="input" />
              </Field>
              <Field label="Budget / Influencer" hint="Auto-calculated">
                <input type="number" min="0" value={form.budget_per_influencer} readOnly placeholder="—" className="input bg-gray-100 cursor-not-allowed" />
              </Field>
            </div>
          )}

          {/* Product value — when barter or hybrid */}
          {showProductValue && (
            <Field label="Product value (approx.)" hint="Helps creators evaluate the offer">
              <input type="number" min="0" value={form.product_value} onChange={(e) => update("product_value", e.target.value)} placeholder="3500" className="input" />
            </Field>
          )}
        </Section>

        {/* Product / Service */}
        <Section title="Product / service">
          <Field label="What are you promoting?" required>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => update("offering_type", "product")}
                className={`py-2 rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
                  form.offering_type === "product" ? "bg-[#EBE9FE] border-[#5851DB] text-[#5851DB]" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                📦 Product
              </button>
              <button
                type="button"
                onClick={() => update("offering_type", "service")}
                className={`py-2 rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
                  form.offering_type === "service" ? "bg-[#EBE9FE] border-[#5851DB] text-[#5851DB]" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                🛎️ Service / Experience
              </button>
            </div>
            <input
              value={form.product_name}
              onChange={(e) => update("product_name", e.target.value)}
              placeholder={form.offering_type === "product" ? 'e.g. "Moisturizing cream — 50ml tube"' : 'e.g. "Weekend stay at our Mussoorie resort"'}
              className="input"
            />
          </Field>

          {/* Product-only fields */}
          {form.offering_type === "product" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Will product be shipped?">
                <select value={form.shipping_required} onChange={(e) => update("shipping_required", e.target.value)} className="input">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                  <option value="pickup">Pickup required</option>
                </select>
              </Field>
              {form.shipping_required === "yes" && (
                <Field label="Shipping timeline (days)">
                  <input type="number" min="1" value={form.shipping_timeline_days} onChange={(e) => update("shipping_timeline_days", e.target.value)} placeholder="3" className="input" />
                </Field>
              )}
            </div>
          )}

          {/* Service-only fields */}
          {form.offering_type === "service" && (
            <Field label="Service location" hint="Where the influencer experiences the service">
              <input value={form.service_location} onChange={(e) => update("service_location", e.target.value)} placeholder='e.g. "Mussoorie, India" or "Online / virtual"' className="input" />
            </Field>
          )}

          {showBarterCompensation && (
            <Field label="What does the influencer get? (compensation details)">
              <textarea
                value={form.barter_compensation}
                onChange={(e) => update("barter_compensation", e.target.value)}
                rows={2}
                placeholder={form.offering_type === "product" ? 'e.g. "Full skincare kit worth ₹3,500"' : 'e.g. "Free 2-night stay + meals + spa session"'}
                className="input resize-none"
              />
            </Field>
          )}
        </Section>

        {/* Banner */}
        <Section title="Banner image">
          {bannerFile ? (
            <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100">
              <img src={URL.createObjectURL(bannerFile)} alt="Banner preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setBannerFile(null)} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 cursor-pointer shadow">
                <Trash2 size={16} />
              </button>
            </div>
          ) : existingBannerUrl ? (
            // Pre-existing banner in edit mode. Trash removes it entirely
            // (falls back to the upload prompt), or the brand can click
            // the image to swap in a new one via the file picker.
            <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100">
              <img src={existingBannerUrl} alt="Banner" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-2 left-2 px-3 py-1.5 bg-white/90 rounded-full text-xs font-bold text-[#5851DB] cursor-pointer shadow"
              >
                Replace
              </button>
              <button type="button" onClick={() => setExistingBannerUrl("")} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 cursor-pointer shadow">
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
              <span className="text-[10px]">PNG, JPG, WebP up to 10MB</span>
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
        </Section>

        {/* Gallery */}
        <Section
          title="Gallery"
          right={
            (existingGalleryUrls.length + galleryFiles.length) > 0 && (
              <span className="text-[10px] text-gray-400">
                {existingGalleryUrls.length + galleryFiles.length} image
                {existingGalleryUrls.length + galleryFiles.length > 1 ? "s" : ""}
              </span>
            )
          }
        >
          {(existingGalleryUrls.length > 0 || galleryFiles.length > 0) && (
            <div className="grid grid-cols-3 gap-2">
              {existingGalleryUrls.map((url, i) => (
                <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setExistingGalleryUrls((prev) => prev.filter((_, x) => x !== i))}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-white/90 rounded-full text-red-500 cursor-pointer shadow"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {galleryFiles.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={URL.createObjectURL(f)} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setGalleryFiles((prev) => prev.filter((_, x) => x !== i))}
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
        </Section>

        {/* Platforms */}
        <Section title="Platforms" required right={platforms.length > 0 && <span className="text-[10px] text-gray-400">{platforms.length} selected</span>}>
          <ChipGroup options={PLATFORMS} selected={platforms} onToggle={togglePlatform} />
        </Section>

        {/* Deliverables */}
        <Section
          title="Content deliverables[per Creator]"
          required
          right={
            <span className={`text-[11px] font-bold ${totalDeliverables > 0 ? "text-[#5851DB]" : "text-gray-400"}`}>
              {totalDeliverables} piece{totalDeliverables !== 1 ? "s" : ""}
            </span>
          }
        >
          <div className="grid grid-cols-5 gap-3">
            {[
              { k: "num_reels", label: "Reels" },
              { k: "num_posts", label: "Posts" },
              { k: "num_stories", label: "Stories" },
              { k: "num_videos", label: "Videos" },
              { k: "num_blogs", label: "Blogs" },
            ].map((d) => (
              <Field key={d.k} label={d.label}>
                <input type="number" min="0" value={form[d.k]} onChange={(e) => update(d.k, e.target.value)} placeholder="0" className="input text-center" />
              </Field>
            ))}
          </div>
        </Section>

        {/* Categories */}
        <Section
          title="Categories"
          required
          right={
            <span className={`text-[11px] font-bold ${categories.length > 0 ? "text-[#5851DB]" : "text-gray-400"}`}>
              {categories.length} of {CATEGORIES.length} selected
            </span>
          }
        >
          <ChipGroup options={CATEGORIES} selected={categories} onToggle={toggleCategory} />
        </Section>

        {/* Influencer Requirements */}
        <Section title="Influencer requirements">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Influencer Tier" hint="Auto-fills follower range">
              <select value={form.target_influencer_tier} onChange={(e) => update("target_influencer_tier", e.target.value)} className="input">
                <option value="all">All Tiers</option>
                <option value="nano">Nano (1K-10K)</option>
                <option value="micro">Micro (10K-100K)</option>
                <option value="macro">Macro (100K-1M)</option>
                <option value="mega">Mega (1M+)</option>
              </select>
            </Field>
            <Field label="Min. Engagement Rate (%)">
              <input type="number" min="0" step="0.1" value={form.min_engagement_rate} onChange={(e) => update("min_engagement_rate", e.target.value)} placeholder="2.5" className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Min. Followers">
              <input type="number" min="0" value={form.target_follower_min} onChange={(e) => update("target_follower_min", e.target.value)} placeholder="1000" className="input" />
            </Field>
            <Field label="Max. Followers">
              <input type="number" min="0" value={form.target_follower_max} onChange={(e) => update("target_follower_max", e.target.value)} placeholder="100000" className="input" />
            </Field>
          </div>
        </Section>

        {/* Cities */}
        <Section
          title="Locations"
          right={
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={allIndia} onChange={(e) => setAllIndia(e.target.checked)} className="w-3.5 h-3.5 accent-[#5851DB]" />
              All India
            </label>
          }
        >
          {!allIndia && <ChipGroup options={CITIES} selected={cities} onToggle={toggleCity} />}
          {allIndia && <p className="text-[11px] text-gray-500 italic">Open to all creators across India.</p>}
        </Section>

        {/* Audience preferences */}
        <Section title="Audience preferences">
          <Field label="Preferred gender">
            <ChipGroup options={GENDERS} selected={genders} onToggle={toggleGender} />
          </Field>
          <Field label="Preferred languages">
            <ChipGroup options={LANGUAGES} selected={languages} onToggle={toggleLanguage} />
          </Field>
        </Section>

        {/* Content Guidelines */}
        <Section title="Content guidelines">
          <Field label="Must include (Do's)" hint="What every creator must show or mention">
            <textarea
              value={form.content_dos}
              onChange={(e) => update("content_dos", e.target.value)}
              rows={2}
              placeholder='e.g. "Show product packaging, mention discount code SAVE20"'
              className="input resize-none"
            />
          </Field>
          <Field label="Must avoid (Don'ts)" hint="Eliminates 80% of revisions">
            <textarea
              value={form.content_donts}
              onChange={(e) => update("content_donts", e.target.value)}
              rows={2}
              placeholder='e.g. "Don&apos;t show competitor products, no copyrighted music"'
              className="input resize-none"
            />
          </Field>
          <Field label="Required hashtags">
            <input value={form.required_hashtags} onChange={(e) => update("required_hashtags", e.target.value)} placeholder="#RGossips #Ad #Paidpartnership" className="input" />
          </Field>
          <Field label="Brand handle(s) to tag">
            <input value={form.brand_handles_to_tag} onChange={(e) => update("brand_handles_to_tag", e.target.value)} placeholder="@yourbrand" className="input" />
          </Field>
        </Section>

        {/* Terms */}
        <Section title="Terms & rights">
          <Field label="Content usage rights">
            <select value={form.usage_rights} onChange={(e) => update("usage_rights", e.target.value)} className="input">
              {USAGE_RIGHTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Content keep-up duration">
            <select value={form.keepup_duration} onChange={(e) => update("keepup_duration", e.target.value)} className="input">
              {KEEPUP_DURATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Exclusivity (no competing brands)">
            <select value={form.exclusivity_days} onChange={(e) => update("exclusivity_days", e.target.value)} className="input">
              {EXCLUSIVITY_PERIODS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          {!isBarter && (
            <Field label="Payment timeline">
              <select value={form.payment_timeline} onChange={(e) => update("payment_timeline", e.target.value)} className="input">
                {PAYMENT_TIMELINES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </Section>

        {/* Schedule — labels kept short so all 3 inputs line up across columns */}
        <Section title="Schedule">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Start Date" required>
              <input type="date" value={form.campaign_start_date} onChange={(e) => update("campaign_start_date", e.target.value)} className="input" />
            </Field>
            <Field label="Application Deadline" required>
              <input type="date" value={form.application_deadline} onChange={(e) => update("application_deadline", e.target.value)} className="input" />
            </Field>
            <Field label="Campaign End Date" required>
              <input type="date" value={form.campaign_end_date} onChange={(e) => update("campaign_end_date", e.target.value)} className="input" />
            </Field>
          </div>
          <p className="text-[10px] text-gray-400">Application deadline is the last day to apply. Campaign end date is when all content must be delivered.</p>
        </Section>

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
      <div className={`shrink-0 grid ${mode === "edit" ? "grid-cols-2" : "grid-cols-3"} gap-2 p-4 border-t border-gray-100 bg-white`}>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        {mode === "edit" ? (
          // Edit mode never touches status — pause / publish are
          // separate actions on the campaign detail page. The single
          // Save Changes button keeps the surface honest.
          <button
            type="button"
            onClick={() => submitForm(false)}
            disabled={submitting}
            className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-[#5851DB] hover:bg-[#4742c4] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {submitting && stage ? stage.split(" ")[0] : "Save Changes"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => submitForm(false)}
              disabled={submitting}
              className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-[#5851DB] bg-[#EBE9FE] hover:bg-[#e0ddfd] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && stage.startsWith("Saving draft") ? <Loader2 size={14} className="animate-spin" /> : null}
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => submitForm(true)}
              disabled={submitting}
              className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-[#5851DB] hover:bg-[#4742c4] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && !stage.startsWith("Saving draft") ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitting && stage ? stage.split(" ")[0] : "Publish"}
            </button>
          </>
        )}
      </div>
    </form>
  );

  const header = (
    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          {mode === "edit" ? "Edit Campaign" : "New Campaign"}
        </h2>
        <p className="text-[11px] text-gray-400">
          {mode === "edit"
            ? "Saved changes go live immediately unless the campaign is paused"
            : "Will be saved as a draft unless you publish"}
        </p>
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
        <DialogContent showCloseButton={false} className="mt-[30px] sm:max-w-[720px] h-[87vh] max-h-[87vh] p-0 flex flex-col overflow-hidden rounded-2xl">
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

function Section({ title, required, right, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">
          {title}
          {required && <span className="text-red-400 ml-1">*</span>}
        </h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col">
      <label className="block text-[11px] font-bold text-gray-700">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {hint ? <p className="text-[10px] font-medium text-gray-400 mt-0.5 mb-1.5 leading-tight">{hint}</p> : <div className="mb-1.5" />}
      {children}
    </div>
  );
}

function ChipGroup({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
              on ? "bg-[#EBE9FE] border-[#5851DB] text-[#5851DB]" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {on && <Check size={12} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
