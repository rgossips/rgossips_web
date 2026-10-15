"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";

// Heavy and only needed when a banner is picked — lazy-load like the
// profile-logo cropper does.
const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });
import { Drawer, DrawerContent, DrawerClose, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Upload, Loader2, Trash2, Image as ImageIcon, Check, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useTranslations } from "next-intl";
import { INDIAN_CITIES_SORTED } from "@/utils/indianCities";

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
  // Catch-all for local trades and professional services — shopkeepers,
  // doctors, lawyers, salons. They technically fit "Entrepreneurship &
  // Business", but nobody self-describes that way when posting a campaign.
  "Services (Local & Professional)",
  "Sustainable & Eco-conscious Living",
  "Pet Care & Animals",
];

const PLATFORMS = ["Instagram"];

// Quick-pick row only — NOT the set of targetable cities. Every city in
// INDIAN_CITIES is now reachable through the search box below the chips.
// This list used to be the only option, which meant Dehradun — the launch
// city — could not be targeted at all.
// True when a yyyy-mm-dd date is before today. End-of-day semantics: today
// is NOT past, matching _shared/campaign-dates.ts on the server.
function isPastDay(value) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

const CITIES = ["Dehradun", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore", "Bhopal", "Kochi", "Remote"];

const LANGUAGES = ["Hindi", "English", "Tamil", "Telugu", "Marathi", "Kannada", "Bengali", "Gujarati", "Punjabi", "Malayalam"];

const GENDERS = ["Male", "Female", "Any"];

const USAGE_RIGHTS = [
  { value: "creator_only" },
  { value: "brand_repost" },
  { value: "paid_ads" },
  { value: "full_rights" },
];

const PAYMENT_TIMELINES = [
  { value: "advance" },
  { value: "on_approval" },
  { value: "7_days" },
  { value: "30_days" },
];

const KEEPUP_DURATIONS = [
  { value: "24h" },
  { value: "7d" },
  { value: "30d" },
  { value: "permanent" },
];

const EXCLUSIVITY_PERIODS = [
  { value: "0" },
  { value: "7" },
  { value: "15" },
  { value: "30" },
  { value: "60" },
  { value: "90" },
];

// Auto-fill follower ranges when tier is selected
const TIER_RANGES = {
  nano: { min: 1000, max: 10000 },
  micro: { min: 10000, max: 100000 },
  macro: { min: 100000, max: 1000000 },
  mega: { min: 1000000, max: 10000000 },
};

// Local-timezone YYYY-MM-DD for <input type="date">. toISOString would
// shift the date across the UTC boundary for IST evenings.
const todayDateInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  include_product_reimbursement: false,
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

// Browse the WHOLE canonical list, the same way the influencer profile does
// (LocationModal in MyInformationDetail.jsx). The quick-pick chips plus the
// type-ahead below technically reached every city, but only if you already
// knew the name and typed two letters of it — brands reported that the list
// "doesn't have all the cities" because nothing on screen said otherwise.
//
// Portalled to <body> on purpose: the parent is a Vaul drawer on phones, and
// a drawer animates with a transform, which makes it the containing block for
// any `fixed` child. Rendered in place, this would be trapped inside the
// drawer instead of covering the screen. z-[400] clears the parent's z-[250].
function CityPickerModal({ selected, onSave, onClose }) {
  const t = useTranslations("BrandsCreateCampaignDialog");
  const [local, setLocal] = useState([...selected]);
  const [search, setSearch] = useState("");
  const options = useMemo(() => ["Remote", ...INDIAN_CITIES_SORTED], []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [options, search]);

  const toggle = (city) =>
    setLocal((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-scroll-lock
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#E4E9F4]">
          <h3 className="text-base font-bold text-[#16224E]">{t("cityPicker.title")}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cityPicker.close")}
            className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center text-gray-400 hover:bg-gray-200 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="shrink-0 px-5 pt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("cityPicker.searchPlaceholder")}
            aria-label={t("cityPicker.searchPlaceholder")}
            className="input"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
          <ChipGroup options={filtered} selected={local} onToggle={toggle} />
          {filtered.length === 0 && (
            <p className="text-[11px] text-[#6B6785] italic">{t("cityPicker.noMatch")}</p>
          )}
        </div>

        <div className="shrink-0 p-5 border-t border-[#E4E9F4] flex items-center gap-3">
          <p className="flex-1 text-[11px] font-semibold text-[#6B6785]">
            {t("cityPicker.selectedCount", { count: local.length })}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#E4E9F4] text-xs font-bold text-gray-500 cursor-pointer"
          >
            {t("cityPicker.cancel")}
          </button>
          <button
            type="button"
            onClick={() => { onSave(local); onClose(); }}
            className="px-5 py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer"
            style={{ background: "linear-gradient(135deg, #9810fa 0%, #e60076 100%)" }}
          >
            {t("cityPicker.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Search across the full canonical city list. The quick-pick chips above
// cover the usual suspects; this is how every OTHER city becomes targetable.
// Before this, target_cities could only ever hold one of 15 hardcoded names.
function CitySearch({ selected, onToggle }) {
  const t = useTranslations("BrandsCreateCampaignDialog");
  const [q, setQ] = useState("");
  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return INDIAN_CITIES_SORTED.filter(
      (c) => c.toLowerCase().includes(needle) && !selected.includes(c),
    ).slice(0, 8);
  }, [q, selected]);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("placeholders.citySearch")}
        aria-label={t("placeholders.citySearch")}
        className="input"
      />
      {matches.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {matches.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                onToggle(c);
                setQ("");
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-[#E4E9F4] text-[#4A4568] hover:border-[#6A66C9] hover:text-[#6A66C9] cursor-pointer"
            >
              + {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      // The server returns camelCase. This read `c.offering_type` and
      // `c.service_location`, which are the DB/meta names and are never present
      // on the payload — so the inference always fell through to "product".
      offering_type:
        c.offeringType || (c.productName ? "product" : c.serviceLocation ? "service" : "product"),
      max_influencers: c.maxInfluencers ? String(c.maxInfluencers) : "",
      budget_total: c.budgetTotal ? String(c.budgetTotal) : "",
      budget_per_influencer: c.budgetPerInfluencer ? String(c.budgetPerInfluencer) : "",
      product_name: c.productName || "",
      product_value: c.productValue ? String(c.productValue) : "",
      include_product_reimbursement: !!c.includeProductReimbursement,
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
  // Render as a full page instead of a modal. Creating a campaign is a long
  // form — brief, banner, targeting, budget, deliverables, guidelines,
  // schedule — and a 720px dialog with its own inner scrollbar hid most of
  // it behind a scroll, which is how required fields got missed. The create
  // route uses this; edit and duplicate stay modal, because both are opened
  // from a campaign already on screen and prefilled from an object in
  // memory.
  asPage = false,
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
  const t = useTranslations("BrandsCreateCampaignDialog");
  const supabase = createClient();
  const isDesktop = useIsDesktop();
  const { startLoading, stopLoading } = useGlobalLoading();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState(["Instagram"]);
  const [cities, setCities] = useState([]);
  const [bannerDragOver, setBannerDragOver] = useState(false);
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
  // B2 — per-field validation errors, keyed by the data-field attribute
  // on each Field wrapper. Set together with `error`; cleared on any
  // successful validation pass.
  const [fieldErrors, setFieldErrors] = useState({});
  const [stage, setStage] = useState("");
  const bannerInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Banner cropper — every banner is cropped to the 3:1 ratio the campaign
  // card/detail actually render, so uploads can't come out stretched or
  // off-center. Output is a fixed 1536×512 JPEG.
  const BANNER_ASPECT = 3;
  const BANNER_OUT = { w: 1536, h: 512 };
  const [bannerCropSrc, setBannerCropSrc] = useState(null);
  const [bCrop, setBCrop] = useState({ x: 0, y: 0 });
  const [bZoom, setBZoom] = useState(1);
  const [bPixels, setBPixels] = useState(null);
  const applyBannerCrop = async () => {
    if (!bannerCropSrc || !bPixels) return;
    const img = new window.Image();
    img.src = bannerCropSrc;
    await new Promise((r) => (img.onload = r));
    const canvas = document.createElement("canvas");
    canvas.width = BANNER_OUT.w;
    canvas.height = BANNER_OUT.h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, bPixels.x, bPixels.y, bPixels.width, bPixels.height, 0, 0, BANNER_OUT.w, BANNER_OUT.h);
    const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.88));
    if (blob) setBannerFile(new File([blob], "banner.jpg", { type: "image/jpeg" }));
    URL.revokeObjectURL(bannerCropSrc);
    setBannerCropSrc(null);
    setBPixels(null);
  };
  const cancelBannerCrop = () => {
    URL.revokeObjectURL(bannerCropSrc);
    setBannerCropSrc(null);
    setBPixels(null);
  };
  const formScrollRef = useRef(null);

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
      // Start date defaults to today — computed at open time (not module
      // load) so a tab left overnight doesn't seed yesterday's date.
      setForm({ ...emptyForm, campaign_start_date: todayDateInput() });
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

  // "total" | "per" — which budget box the brand typed in last. See
  // applyBudget below.
  const [budgetSource, setBudgetSource] = useState("total");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleSetItem = (setter) => (item) => setter((p) => (p.includes(item) ? p.filter((x) => x !== item) : [...p, item]));
  const toggleCategory = toggleSetItem(setCategories);
  // Platforms is required and Instagram is currently the ONLY option, so
  // deselecting it cannot lead anywhere except a validation error on submit.
  // While there is a single choice it stays locked on; the moment a second
  // platform is added to PLATFORMS this reverts to a normal multi-select
  // with no further change here.
  const onlyPlatform = PLATFORMS.length === 1 ? PLATFORMS[0] : null;
  const togglePlatform = (value) => {
    if (onlyPlatform && value === onlyPlatform) return;
    toggleSetItem(setPlatforms)(value);
  };
  const toggleCity = toggleSetItem(setCities);

  // Single entry point for a picked OR dropped banner, so the size guard and
  // the 3:1 cropper apply identically to both. Non-images are ignored rather
  // than handed to the cropper, since a dropped PDF would otherwise open it.
  const acceptBannerFile = (f) => {
    if (!f) return;
    if (!String(f.type || "").startsWith("image/")) {
      setError(t("errors.bannerNotImage"));
      return;
    }
    if (f.size > MAX_SOURCE_IMAGE_BYTES) {
      setError(t("errors.bannerTooLarge"));
      return;
    }
    setBCrop({ x: 0, y: 0 });
    setBZoom(1);
    setBannerCropSrc(URL.createObjectURL(f));
  };
  const toggleGender = toggleSetItem(setGenders);
  const toggleLanguage = toggleSetItem(setLanguages);

  // Date floors for the three pickers. The browser greys out everything
  // earlier, so a past campaign cannot be assembled in the first place —
  // previously the only date rule was deadline-before-end-date, which two
  // past dates satisfy happily.
  //
  // The START floor relaxes in edit mode when the campaign already began:
  // pinning it to today would make a running campaign's own start date
  // invalid and unsavable. The deadline and end date are always floored at
  // today, because leaving either in the past is what makes a campaign
  // unreachable.
  const today = todayDateInput();
  const startDateMin =
    mode === "edit" && form.campaign_start_date && form.campaign_start_date < today
      ? form.campaign_start_date
      : today;
  // The deadline cannot precede the campaign start, so its floor is the
  // LATER of today and the start date — and it moves when the start date
  // does. Plain string compare is safe: yyyy-mm-dd sorts chronologically.
  const deadlineMin =
    form.campaign_start_date && form.campaign_start_date > today
      ? form.campaign_start_date
      : today;

  const isBarter = form.campaign_type === "barter";
  const isHybrid = form.campaign_type === "hybrid";
  const showBudget = !isBarter; // budget hidden when pure barter
  const showProductValue = isBarter || isHybrid; // product value shown when barter/hybrid
  const showBarterCompensation = isBarter || isHybrid;

  // Budget total and budget per influencer derive from each other, in BOTH
  // directions: a brand who knows their total divides it by the slots, and a
  // brand who knows the rate they want to pay multiplies it up. Whichever box
  // they typed in last is the authority, so changing the slot count after
  // that keeps their number and recomputes the other one.
  //
  // Done in the change handlers rather than an effect: deriving one piece of
  // state from another inside useEffect is what react-hooks/set-state-in-effect
  // warns about, and the old version needed a guard against its own render
  // loop for exactly that reason.
  const applyBudget = (next, source) => {
    const slots = Number(next.max_influencers) || 0;
    const total = Number(next.budget_total) || 0;
    const per = Number(next.budget_per_influencer) || 0;
    if (slots <= 0) return next;
    if (source === "per") {
      return per > 0 ? { ...next, budget_total: String(per * slots) } : next;
    }
    return total > 0 ? { ...next, budget_per_influencer: String(Math.round(total / slots)) } : next;
  };

  const updateBudgetTotal = (v) => {
    setBudgetSource("total");
    setForm((p) => applyBudget({ ...p, budget_total: v }, "total"));
  };

  const updateBudgetPerInfluencer = (v) => {
    setBudgetSource("per");
    setForm((p) => applyBudget({ ...p, budget_per_influencer: v }, "per"));
  };

  // Changing the slots recomputes whichever figure the brand did NOT type.
  const updateSlots = (v) =>
    setForm((p) => applyBudget({ ...p, max_influencers: v }, budgetSource));

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

  // Pre-compression source cap. compressImage shrinks anything to
  // ≤1920px, but createImageBitmap on an enormous source (50MB+ phone
  // panoramas) can hang mobile browsers before compression even starts.
  // Server-side upload-campaign-image enforces 10MB on the final file.
  const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;

  const compressImage = async (file, maxEdge = 1920, quality = 0.85) => {
    if (!file.type.startsWith("image/")) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
      // Re-encode anything over 3MB even if it needs no downscaling —
      // the upload functions hard-cap at 3MB.
      if (scale >= 1 && file.size <= 3 * 1024 * 1024) return file;
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
    let compressed = await compressImage(file);
    // Server hard-cap is 3MB — if the standard compression pass still
    // exceeds it (rare: huge detailed photos), squeeze harder.
    if (compressed.size > 3 * 1024 * 1024) {
      compressed = await compressImage(compressed, 1440, 0.7);
    }
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
    setFieldErrors({});

    // B2 — validate every required field at once and surface each error
    // inline, then scroll to the first failing field. A single top-level
    // message with no field context made the buttons look dead.
    //
    // Insertion order below MUST mirror the form's visual order (Title →
    // Banner → Platforms → Deliverables → Categories → Schedule) — the
    // scroll-to-first-error uses Object.keys(errs)[0], so an out-of-order
    // build jumps the user to a later section while an earlier one is
    // still failing.
    const errs = {};
    if (!form.title.trim()) errs.title = t("errors.titleRequired");
    // A published campaign must carry a banner — it's the hero image
    // creators see in every listing. Drafts can be saved without one.
    // In edit mode the existing banner counts.
    const hasAnyBanner = !!bannerFile || !!form.banner_image_url || !!existingBannerUrl;
    if (publish && !hasAnyBanner) {
      errs.banner = t("errors.bannerRequired");
    }
    if (platforms.length < 1) errs.platforms = t("errors.platformRequired");
    if (totalDeliverables < 1) errs.deliverables = t("errors.deliverableRequired");
    if (categories.length < 1) errs.categories = t("errors.categoryRequired");
    if (!form.campaign_start_date) errs.campaign_start_date = t("errors.startDateRequired");
    if (!form.application_deadline) errs.application_deadline = t("errors.deadlineRequired");
    if (!form.campaign_end_date) errs.campaign_end_date = t("errors.endDateRequired");
    // A deadline already in the past makes the campaign dead on arrival: it
    // publishes, an admin approves it, and no creator can ever apply. The
    // only date rule here was deadline-before-end-date, which a pair of past
    // dates satisfies. End-of-day, so choosing today is allowed —
    // applications close when the day does, which is what the server now
    // enforces too (_shared/campaign-dates.ts).
    if (form.application_deadline && isPastDay(form.application_deadline)) {
      errs.application_deadline = t("errors.deadlineInPast");
    }
    // min= on a date input is a hint: it greys the calendar out but a typed
    // or pasted value still submits, and Firefox will not block it. Same
    // reason the server checks too.
    if (form.campaign_end_date && isPastDay(form.campaign_end_date)) {
      errs.campaign_end_date = t("errors.endDateInPast");
    }
    // A start date already gone is only wrong for a NEW campaign; a running
    // one legitimately started last week.
    if (mode !== "edit" && form.campaign_start_date && isPastDay(form.campaign_start_date)) {
      errs.campaign_start_date = t("errors.startDateInPast");
    }
    // Applications must not close before the campaign has begun.
    if (
      form.campaign_start_date &&
      form.application_deadline &&
      form.application_deadline < form.campaign_start_date
    ) {
      errs.application_deadline = t("errors.deadlineBeforeStart");
    }
    // Strictly before, not "not after". This was `>`, so setting the
    // application deadline EQUAL to the delivery end date passed validation —
    // and that leaves a campaign where applications close on the same day the
    // content is due, so an accepted creator has zero time to deliver.
    if (
      form.application_deadline &&
      form.campaign_end_date &&
      new Date(form.application_deadline) >= new Date(form.campaign_end_date)
    ) {
      errs.application_deadline = t("errors.endBeforeDeadline");
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError(t("errors.fixHighlighted"));
      // Scroll the first failing field into view AND focus its control
      // so the user can start typing immediately. data-field attributes
      // are stamped by the Field wrapper; banner/deliverables sections
      // carry their own. preventScroll keeps focus() from fighting the
      // smooth scrollIntoView. For chip/upload sections the first
      // focusable is a button — focusing it still moves the keyboard
      // ring to the right place.
      const firstKey = Object.keys(errs)[0];
      requestAnimationFrame(() => {
        const el = formScrollRef.current?.querySelector(`[data-field="${firstKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        const control = el?.querySelector("input, textarea, select, button");
        control?.focus?.({ preventScroll: true });
      });
      return;
    }

    // B1 — the submit used to silently no-op when the auth session
    // wasn't ready ("Auth initialization timed out" in console): the
    // invoke fell back to the publishable key and the write never
    // happened. Check the session explicitly and tell the user what's
    // wrong instead of doing nothing.
    if (!brandId) return setError(t("errors.signedIn"));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      setError(t("errors.sessionNotReady"));
      return;
    }

    setSubmitting(true);
    const busyCopy = mode === "edit"
      ? t("busy.saving")
      : publish ? t("busy.publishing") : t("busy.savingDraft");
    startLoading(busyCopy);
    try {
      // Keep any existing images the brand didn't replace with a new upload.
      let bannerUrl = existingBannerUrl;
      const galleryUrls = [...existingGalleryUrls];

      if (bannerFile) {
        setStage(t("busy.uploadingBanner"));
        bannerUrl = await uploadOne(bannerFile, "banners");
      }
      if (galleryFiles.length > 0) {
        for (let i = 0; i < galleryFiles.length; i++) {
          setStage(t("busy.uploadingGallery", { index: i + 1, total: galleryFiles.length }));
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
          headers: { Authorization: `Bearer ${session.access_token}` },
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
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (err) throw new Error(err.message);
        if (data?.error) throw new Error(data.error);
        // The server decides whether a publish goes live or into the review
        // queue (auto_approve_campaigns). Hand that back so the caller can tell
        // the brand why their campaign is not visible yet.
        onCreated?.(data.campaignId, { underReview: !!data.underReview, published: !!publish });
      }
    } catch (e) {
      setError(e.message || (mode === "edit" ? t("errors.saveChangesFailed") : t("errors.createFailed")));
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
      <div ref={formScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5 space-y-6">
        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>}

        {/* Basic Info */}
        <Section title={t("sections.basicInfo")}>
          <Field label={t("fields.title")} required fieldKey="title" error={fieldErrors.title}>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder={t("placeholders.title")} className="input" />
          </Field>
          <Field label={t("fields.description")} hint={t("fields.descriptionHint")}>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} placeholder={t("descriptionTemplate")} className="input resize-none" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fields.campaignType")} required>
              <select value={form.campaign_type} onChange={(e) => update("campaign_type", e.target.value)} className="input">
                <option value="barter">{t("campaignTypeOptions.barter")}</option>
                <option value="paid">{t("campaignTypeOptions.paid")}</option>
                <option value="hybrid">{t("campaignTypeOptions.hybrid")}</option>
              </select>
            </Field>
            <Field label={t("fields.slots")} hint={t("fields.slotsHint")}>
              <input type="number" min="1" value={form.max_influencers} onChange={(e) => updateSlots(e.target.value)} placeholder="10" className="input" />
            </Field>
          </div>

          {/* Budget — only when paid or hybrid */}
          {showBudget && (
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("fields.budgetTotal")}>
                <input type="number" min="0" value={form.budget_total} onChange={(e) => updateBudgetTotal(e.target.value)} placeholder="50000" className="input" />
              </Field>
              <Field label={t("fields.budgetPerInfluencer")} hint={t("fields.budgetPerInfluencerHint")}>
                <input type="number" min="0" value={form.budget_per_influencer} onChange={(e) => updateBudgetPerInfluencer(e.target.value)} placeholder="—" className="input" />
              </Field>
            </div>
          )}

          {/* Product reimbursement — the creator buys it, the brand pays
            them back before deliverables start. */}
        <Section title={t("sections.reimbursement")}>
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.include_product_reimbursement}
              onChange={(e) => update("include_product_reimbursement", e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#6A66C9] cursor-pointer"
            />
            <span>
              <span className="block text-[13px] font-semibold text-[#16224E]">
                {t("fields.includeReimbursement")}
              </span>
              <span className="block text-[11px] text-[#9C97B8] leading-relaxed mt-0.5">
                {t("fields.includeReimbursementHint")}
              </span>
            </span>
          </label>
        </Section>

        {/* Product value — when barter or hybrid */}
          {showProductValue && (
            <Field label={t("fields.productValue")} hint={t("fields.productValueHint")}>
              <input type="number" min="0" value={form.product_value} onChange={(e) => update("product_value", e.target.value)} placeholder="3500" className="input" />
            </Field>
          )}
        </Section>

        {/* Product / Service */}
        <Section title={t("sections.productService")}>
          <Field label={t("fields.whatPromoting")} required>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => update("offering_type", "product")}
                className={`py-2 rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
                  form.offering_type === "product" ? "bg-[#F3ECFB] border-[#6A66C9] text-[#6A66C9]" : "bg-gray-50 border-[#E4E9F4] text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t("offeringOptions.product")}
              </button>
              <button
                type="button"
                onClick={() => update("offering_type", "service")}
                className={`py-2 rounded-xl text-[12px] font-bold border transition-colors cursor-pointer ${
                  form.offering_type === "service" ? "bg-[#F3ECFB] border-[#6A66C9] text-[#6A66C9]" : "bg-gray-50 border-[#E4E9F4] text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t("offeringOptions.service")}
              </button>
            </div>
            <input
              value={form.product_name}
              onChange={(e) => update("product_name", e.target.value)}
              placeholder={form.offering_type === "product" ? t("placeholders.productNameProduct") : t("placeholders.productNameService")}
              className="input"
            />
          </Field>

          {/* Product-only fields */}
          {form.offering_type === "product" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label={t("fields.willShip")}>
                <select value={form.shipping_required} onChange={(e) => update("shipping_required", e.target.value)} className="input">
                  <option value="no">{t("shippingOptions.no")}</option>
                  <option value="yes">{t("shippingOptions.yes")}</option>
                  <option value="pickup">{t("shippingOptions.pickup")}</option>
                </select>
              </Field>
              {form.shipping_required === "yes" && (
                <Field label={t("fields.shippingTimeline")}>
                  <input type="number" min="1" value={form.shipping_timeline_days} onChange={(e) => update("shipping_timeline_days", e.target.value)} placeholder="3" className="input" />
                </Field>
              )}
            </div>
          )}

          {/* Service-only fields */}
          {form.offering_type === "service" && (
            <Field label={t("fields.serviceLocation")} hint={t("fields.serviceLocationHint")}>
              <input value={form.service_location} onChange={(e) => update("service_location", e.target.value)} placeholder={t("placeholders.serviceLocation")} className="input" />
            </Field>
          )}

          {showBarterCompensation && (
            <Field label={t("fields.compensationDetails")}>
              <textarea
                value={form.barter_compensation}
                onChange={(e) => update("barter_compensation", e.target.value)}
                rows={2}
                placeholder={form.offering_type === "product" ? t("placeholders.compensationProduct") : t("placeholders.compensationService")}
                className="input resize-none"
              />
            </Field>
          )}
        </Section>

        {/* Banner */}
        <Section title={t("sections.bannerImage")} fieldKey="banner" error={fieldErrors.banner}>
          {bannerFile ? (
            <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100">
              <img src={URL.createObjectURL(bannerFile)} alt={t("banner.previewAlt")} className="w-full h-full object-cover" />
              <button type="button" onClick={() => setBannerFile(null)} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 cursor-pointer shadow">
                <Trash2 size={16} />
              </button>
            </div>
          ) : existingBannerUrl ? (
            // Pre-existing banner in edit mode. Trash removes it entirely
            // (falls back to the upload prompt), or the brand can click
            // the image to swap in a new one via the file picker.
            <div className="relative rounded-2xl overflow-hidden h-40 bg-gray-100">
              <img src={existingBannerUrl} alt={t("banner.alt")} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="absolute bottom-2 left-2 px-3 py-1.5 bg-white/90 rounded-full text-xs font-bold text-[#6A66C9] cursor-pointer shadow"
              >
                {t("banner.replace")}
              </button>
              <button type="button" onClick={() => setExistingBannerUrl("")} className="absolute top-2 right-2 p-2 bg-white/90 rounded-full text-red-500 cursor-pointer shadow">
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              // Drag-and-drop. onDragOver must preventDefault or the browser
              // treats the drop as a navigation and opens the image instead.
              onDragOver={(e) => {
                e.preventDefault();
                if (!bannerDragOver) setBannerDragOver(true);
              }}
              onDragLeave={() => setBannerDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setBannerDragOver(false);
                acceptBannerFile(e.dataTransfer?.files?.[0]);
              }}
              className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                bannerDragOver
                  ? "border-[#6A66C9] text-[#6A66C9] bg-[#6A66C9]/5"
                  : "border-[#E4E9F4] text-[#9C97B8] hover:border-[#6A66C9] hover:text-[#6A66C9]"
              }`}
            >
              <Upload size={24} />
              <span className="text-xs font-semibold">
                {bannerDragOver ? t("banner.dropHere") : t("banner.clickOrDrag")}
              </span>
              <span className="text-[10px]">{t("banner.fileHint")}</span>
            </button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              acceptBannerFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {/* Banner crop overlay (3:1) */}
          {bannerCropSrc && (
            <div data-scroll-lock className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-sm flex flex-col">
              <div className="shrink-0 flex items-center justify-between px-5 py-4 bg-black/50">
                <button type="button" onClick={cancelBannerCrop} className="text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
                  {t("bannerCrop.cancel")}
                </button>
                <div className="text-center">
                  <h3 className="text-white text-sm font-bold">{t("bannerCrop.title")}</h3>
                  <p className="text-white/50 text-[10px] font-semibold">{t("bannerCrop.subtitle")}</p>
                </div>
                <button type="button" onClick={applyBannerCrop} disabled={!bPixels} className="text-sm font-bold px-5 py-2 rounded-xl bg-[#6A66C9] text-white disabled:opacity-50">
                  {t("bannerCrop.apply")}
                </button>
              </div>
              <div className="flex-1 min-h-0 relative">
                <Cropper
                  image={bannerCropSrc}
                  crop={bCrop}
                  zoom={bZoom}
                  aspect={BANNER_ASPECT}
                  cropShape="rect"
                  onCropChange={setBCrop}
                  onZoomChange={setBZoom}
                  onCropComplete={(_, px) => setBPixels(px)}
                />
              </div>
              <div className="shrink-0 px-8 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-black/50 flex items-center gap-4">
                <span className="text-white/60 text-xs font-bold shrink-0">{t("bannerCrop.zoom")}</span>
                <input type="range" min={1} max={3} step={0.1} value={bZoom} onChange={(e) => setBZoom(Number(e.target.value))} className="flex-1 accent-purple-500" />
              </div>
            </div>
          )}
        </Section>

        {/* Gallery */}
        <Section
          title={t("sections.gallery")}
          right={
            (existingGalleryUrls.length + galleryFiles.length) > 0 && (
              <span className="text-[10px] text-[#9C97B8]">
                {t("galleryUi.count", { count: existingGalleryUrls.length + galleryFiles.length })}
              </span>
            )
          }
        >
          {(existingGalleryUrls.length > 0 || galleryFiles.length > 0) && (
            <div className="grid grid-cols-3 gap-2">
              {existingGalleryUrls.map((url, i) => (
                <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={url} alt={t("galleryUi.imageAlt", { index: i + 1 })} className="w-full h-full object-cover" />
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
                  <img src={URL.createObjectURL(f)} alt={t("galleryUi.imageAlt", { index: i + 1 })} className="w-full h-full object-cover" />
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
            className="w-full py-4 border-2 border-dashed border-[#E4E9F4] rounded-2xl flex items-center justify-center gap-2 text-[#9C97B8] hover:border-[#6A66C9] hover:text-[#6A66C9] cursor-pointer text-xs font-semibold transition-colors"
          >
            <ImageIcon size={16} /> {t("galleryUi.addImages")}
          </button>
          <p className="text-[10px] text-[#9C97B8] mt-1.5 ml-1">{t("galleryUi.fileHint")}</p>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              const oversized = files.filter((f) => f.size > MAX_SOURCE_IMAGE_BYTES);
              if (oversized.length > 0) {
                setError(t("errors.gallerySkipped", { count: oversized.length }));
              }
              setGalleryFiles((prev) => [...prev, ...files.filter((f) => f.size <= MAX_SOURCE_IMAGE_BYTES)]);
            }}
          />
        </Section>

        {/* Platforms */}
        <Section title={t("sections.platforms")} required fieldKey="platforms" error={fieldErrors.platforms} right={platforms.length > 0 && <span className="text-[10px] text-[#9C97B8]">{t("platformsSelected", { count: platforms.length })}</span>}>
          <ChipGroup options={PLATFORMS} selected={platforms} onToggle={togglePlatform} />
          {onlyPlatform && (
            <p className="text-[10px] text-[#9C97B8]">{t("onlyPlatformNote")}</p>
          )}
        </Section>

        {/* Deliverables */}
        <Section
          title={t("sections.deliverables")}
          required
          fieldKey="deliverables"
          error={fieldErrors.deliverables}
          right={
            <span className={`text-[11px] font-bold ${totalDeliverables > 0 ? "text-[#6A66C9]" : "text-[#9C97B8]"}`}>
              {t("deliverablesCount", { count: totalDeliverables })}
            </span>
          }
        >
          <div className="grid grid-cols-5 gap-3">
            {[
              { k: "num_reels" },
              { k: "num_posts" },
              { k: "num_stories" },
              { k: "num_videos" },
              { k: "num_blogs" },
            ].map((d) => (
              <Field key={d.k} label={t(`deliverableLabels.${d.k}`)}>
                <input type="number" min="0" value={form[d.k]} onChange={(e) => update(d.k, e.target.value)} placeholder="0" className="input text-center" />
              </Field>
            ))}
          </div>
        </Section>

        {/* Categories */}
        <Section
          title={t("sections.categories")}
          required
          fieldKey="categories"
          error={fieldErrors.categories}
          right={
            <span className={`text-[11px] font-bold ${categories.length > 0 ? "text-[#6A66C9]" : "text-[#9C97B8]"}`}>
              {t("categoriesSelected", { count: categories.length, total: CATEGORIES.length })}
            </span>
          }
        >
          <ChipGroup options={CATEGORIES} selected={categories} onToggle={toggleCategory} />
        </Section>

        {/* Influencer Requirements */}
        <Section title={t("sections.influencerRequirements")}>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fields.influencerTier")} hint={t("fields.influencerTierHint")}>
              <select value={form.target_influencer_tier} onChange={(e) => update("target_influencer_tier", e.target.value)} className="input">
                <option value="all">{t("tierOptions.all")}</option>
                <option value="nano">{t("tierOptions.nano")}</option>
                <option value="micro">{t("tierOptions.micro")}</option>
                <option value="macro">{t("tierOptions.macro")}</option>
                <option value="mega">{t("tierOptions.mega")}</option>
              </select>
            </Field>
            <Field label={t("fields.minEngagement")}>
              <input type="number" min="0" step="0.1" value={form.min_engagement_rate} onChange={(e) => update("min_engagement_rate", e.target.value)} placeholder="2.5" className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fields.minFollowers")}>
              <input type="number" min="0" value={form.target_follower_min} onChange={(e) => update("target_follower_min", e.target.value)} placeholder="1000" className="input" />
            </Field>
            <Field label={t("fields.maxFollowers")}>
              <input type="number" min="0" value={form.target_follower_max} onChange={(e) => update("target_follower_max", e.target.value)} placeholder="100000" className="input" />
            </Field>
          </div>
        </Section>

        {/* Cities */}
        <Section
          title={t("sections.locations")}
          right={
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={allIndia} onChange={(e) => setAllIndia(e.target.checked)} className="w-3.5 h-3.5 accent-[#6A66C9]" />
              {t("allIndia")}
            </label>
          }
        >
          {!allIndia && (
            <div className="space-y-2">
              <ChipGroup options={CITIES} selected={cities} onToggle={toggleCity} />
              {/* Anything already selected that is not in the quick-pick row —
                  otherwise a city chosen via search would vanish from view. */}
              {cities.filter((c) => !CITIES.includes(c)).length > 0 && (
                <ChipGroup
                  options={cities.filter((c) => !CITIES.includes(c))}
                  selected={cities}
                  onToggle={toggleCity}
                />
              )}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <CitySearch selected={cities} onToggle={toggleCity} />
                </div>
                {/* The chips are a shortcut, not the list. Without this the
                    other ~600 cities are only findable by guessing a name. */}
                <button
                  type="button"
                  onClick={() => setCityPickerOpen(true)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E9F4] bg-white text-[11px] font-bold text-[#6A66C9] hover:bg-[#F3ECFB] transition-colors cursor-pointer"
                >
                  <Plus size={13} /> {t("cityPicker.browseAll")}
                </button>
              </div>
              {cityPickerOpen && (
                <CityPickerModal
                  selected={cities}
                  onSave={setCities}
                  onClose={() => setCityPickerOpen(false)}
                />
              )}
            </div>
          )}
          {allIndia && <p className="text-[11px] text-[#6B6785] italic">{t("allIndiaNote")}</p>}
        </Section>

        {/* Audience preferences */}
        <Section title={t("sections.audiencePreferences")}>
          <Field label={t("fields.preferredGender")}>
            <ChipGroup options={GENDERS} selected={genders} onToggle={toggleGender} />
          </Field>
          <Field label={t("fields.preferredLanguages")}>
            <ChipGroup options={LANGUAGES} selected={languages} onToggle={toggleLanguage} />
          </Field>
        </Section>

        {/* Content Guidelines */}
        <Section title={t("sections.contentGuidelines")}>
          <Field label={t("fields.mustInclude")} hint={t("fields.mustIncludeHint")}>
            <textarea
              value={form.content_dos}
              onChange={(e) => update("content_dos", e.target.value)}
              rows={2}
              placeholder={t("placeholders.contentDos")}
              className="input resize-none"
            />
          </Field>
          <Field label={t("fields.mustAvoid")} hint={t("fields.mustAvoidHint")}>
            <textarea
              value={form.content_donts}
              onChange={(e) => update("content_donts", e.target.value)}
              rows={2}
              placeholder={t("placeholders.contentDonts")}
              className="input resize-none"
            />
          </Field>
          <Field label={t("fields.requiredHashtags")}>
            <input value={form.required_hashtags} onChange={(e) => update("required_hashtags", e.target.value)} placeholder={t("placeholders.requiredHashtags")} className="input" />
          </Field>
          <Field label={t("fields.brandHandles")}>
            <input value={form.brand_handles_to_tag} onChange={(e) => update("brand_handles_to_tag", e.target.value)} placeholder={t("placeholders.brandHandles")} className="input" />
          </Field>
        </Section>

        {/* Terms */}
        <Section title={t("sections.termsRights")}>
          <Field label={t("fields.usageRightsLabel")}>
            <select value={form.usage_rights} onChange={(e) => update("usage_rights", e.target.value)} className="input">
              {USAGE_RIGHTS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(`usageRights.${o.value}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("fields.keepupLabel")}>
            <select value={form.keepup_duration} onChange={(e) => update("keepup_duration", e.target.value)} className="input">
              {KEEPUP_DURATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(`keepupDurations.${o.value}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("fields.exclusivityLabel")}>
            <select value={form.exclusivity_days} onChange={(e) => update("exclusivity_days", e.target.value)} className="input">
              {EXCLUSIVITY_PERIODS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(`exclusivityPeriods.${o.value}`)}
                </option>
              ))}
            </select>
          </Field>
          {!isBarter && (
            <Field label={t("fields.paymentTimelineLabel")}>
              <select value={form.payment_timeline} onChange={(e) => update("payment_timeline", e.target.value)} className="input">
                {PAYMENT_TIMELINES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(`paymentTimelines.${o.value}`)}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </Section>

        {/* Schedule — labels kept short so all 3 inputs line up across columns */}
        <Section title={t("sections.schedule")}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={t("fields.startDate")} required fieldKey="campaign_start_date" error={fieldErrors.campaign_start_date}>
              <input type="date" min={startDateMin} value={form.campaign_start_date} onChange={(e) => update("campaign_start_date", e.target.value)} className="input" />
            </Field>
            <Field label={t("fields.applicationDeadline")} required fieldKey="application_deadline" error={fieldErrors.application_deadline}>
              <input type="date" min={deadlineMin} value={form.application_deadline} onChange={(e) => update("application_deadline", e.target.value)} className="input" />
            </Field>
            <Field label={t("fields.campaignEndDate")} required fieldKey="campaign_end_date" error={fieldErrors.campaign_end_date}>
              <input type="date" min={today} value={form.campaign_end_date} onChange={(e) => update("campaign_end_date", e.target.value)} className="input" />
            </Field>
          </div>
          <p className="text-[10px] text-[#9C97B8]">{t("scheduleNote")}</p>
        </Section>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 10px 14px;
            border-radius: 12px;
            background: #F3F5FA;
            border: 1px solid transparent;
            font-size: 13px;
            outline: none;
            transition: border-color 0.15s;
          }
          .input:focus {
            border-color: #6A66C9;
            background: #fff;
          }
        `}</style>
      </div>

      {/* Footer */}
      <div className={`shrink-0 grid ${mode === "edit" ? "grid-cols-2" : "grid-cols-3"} gap-2 p-4 border-t border-[#E4E9F4] bg-white`}>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-gray-700 border border-[#E4E9F4] hover:bg-gray-50 cursor-pointer disabled:opacity-50"
        >
          {t("footer.cancel")}
        </button>
        {mode === "edit" ? (
          // Edit mode never touches status — pause / publish are
          // separate actions on the campaign detail page. The single
          // Save Changes button keeps the surface honest.
          <button
            type="button"
            onClick={() => submitForm(false)}
            disabled={submitting}
            className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-[#6A66C9] hover:bg-[#4742c4] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            {submitting && stage ? stage.split(" ")[0] : t("footer.saveChanges")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => submitForm(false)}
              disabled={submitting}
              className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-[#6A66C9] bg-[#F3ECFB] hover:bg-[#e0ddfd] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && stage.startsWith("Saving draft") ? <Loader2 size={14} className="animate-spin" /> : null}
              {t("footer.saveDraft")}
            </button>
            <button
              type="button"
              onClick={() => submitForm(true)}
              disabled={submitting}
              className="py-3 rounded-2xl font-bold text-xs sm:text-sm text-white bg-[#6A66C9] hover:bg-[#4742c4] shadow-lg shadow-purple-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && !stage.startsWith("Saving draft") ? <Loader2 size={14} className="animate-spin" /> : null}
              {submitting && stage ? stage.split(" ")[0] : t("footer.publish")}
            </button>
          </>
        )}
      </div>
    </form>
  );

  const titleText = mode === "edit" ? t("title.edit") : t("title.create");
  const subheadText = mode === "edit"
    ? t("subhead.edit")
    : t("subhead.create");

  // Header is rendered twice — once inside DialogContent, once inside
  // DrawerContent — because Radix requires Title/Description components
  // to be descendants of the matching root. Using a shared plain <h2>
  // triggers the "DialogContent requires a DialogTitle" accessibility
  // warning on desktop.
  const renderHeader = (variant) => (
    <div className="flex items-center justify-between border-b border-[#E4E9F4] px-6 py-4 shrink-0">
      <div>
        {variant === "dialog" ? (
          <>
            <DialogTitle className="text-lg font-bold text-[#16224E]">{titleText}</DialogTitle>
            <DialogDescription className="text-[11px] text-[#9C97B8]">{subheadText}</DialogDescription>
          </>
        ) : (
          <>
            <DrawerTitle className="text-lg font-bold text-[#16224E]">{titleText}</DrawerTitle>
            <DrawerDescription className="text-[11px] text-[#9C97B8]">{subheadText}</DrawerDescription>
          </>
        )}
      </div>
      {variant === "dialog" ? (
        <DialogClose asChild>
          <button type="button" className="p-2 -mr-2 cursor-pointer">
            <X size={20} className="text-[#9C97B8]" />
          </button>
        </DialogClose>
      ) : (
        <DrawerClose asChild>
          <button type="button" className="p-2 -mr-2 cursor-pointer">
            <X size={20} className="text-[#9C97B8]" />
          </button>
        </DrawerClose>
      )}
    </div>
  );

  if (asPage) {
    // No Dialog/Drawer: a plain document-flow page. min-h-0 on the form's
    // scroll container is pointless here — the PAGE scrolls, so the inner
    // overflow is released and the whole brief is one continuous column.
    return (
      <div className="bg-white min-h-screen pb-24 lg:pb-10 [&_form]:min-h-0 [&_form>div:first-child]:overflow-visible [&_form>div:first-child]:max-h-none">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-[#E4E9F4]">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#16224E]">{titleText}</h2>
              <p className="text-[11px] text-[#9C97B8]">{subheadText}</p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={t("footer.cancel")}
              className="p-2 -mr-2 cursor-pointer"
            >
              <X size={20} className="text-[#9C97B8]" />
            </button>
          </div>
        </div>
        <div className="max-w-4xl mx-auto">{content}</div>
      </div>
    );
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/* A stray click on the backdrop must not discard a half-filled
            campaign. This form is long — banner upload, targeting, budget,
            deliverables, guidelines — and none of it is drafted anywhere, so
            an accidental dismissal loses the lot. Closing stays deliberate:
            the X, Cancel, and Escape. */}
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          className="mt-[30px] sm:max-w-[720px] h-[87dvh] max-h-[87dvh] p-0 flex flex-col overflow-hidden rounded-2xl"
        >
          {renderHeader("dialog")}
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // dismissible={false} is the mobile half of the same guard: it blocks both
  // the tap-outside and the swipe-down, either of which would throw away the
  // whole form. The header's close button still works.
  return (
    <Drawer open={open} onOpenChange={onOpenChange} dismissible={false}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/40 z-[250]" />
        <DrawerContent className="fixed inset-x-0 bottom-0 z-[250] h-[92dvh] data-[vaul-drawer-direction=bottom]:max-h-[92dvh] rounded-t-[32px] bg-white border-none flex flex-col focus:outline-none pb-[env(safe-area-inset-bottom)]">
          {renderHeader("drawer")}
          {content}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}

function Section({ title, required, right, children, error, fieldKey }) {
  return (
    <section className="space-y-3" data-field={fieldKey || undefined}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase text-[#9C97B8] tracking-wider">
          {title}
          {required && <span className="text-red-400 ml-1">*</span>}
        </h3>
        {right}
      </div>
      {children}
      {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}
    </section>
  );
}

function Field({ label, required, hint, children, error, fieldKey }) {
  return (
    <div className="flex flex-col" data-field={fieldKey || undefined}>
      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {/* Hint sits BELOW the control — when it sat between label and
          input, a hinted field's input dropped lower than its hint-less
          grid neighbours and rows looked misaligned. */}
      {hint && <p className="text-[10px] font-medium text-[#9C97B8] mt-1 leading-tight">{hint}</p>}
      {/* B2 — inline per-field validation error. Rendered under the
          control so the brand can see exactly what's blocking submit
          instead of a dead-looking button. */}
      {error && <p className="text-[10px] font-bold text-red-500 mt-1">{error}</p>}
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
              on ? "bg-[#F3ECFB] border-[#6A66C9] text-[#6A66C9]" : "bg-gray-50 border-[#E4E9F4] text-gray-600 hover:bg-gray-100"
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
