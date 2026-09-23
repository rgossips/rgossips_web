// Brand profile helpers — GST/PAN validation and profile completion.
//
// THE TRUST SCORE IS NOT HERE ANY MORE. It lives in exactly one place,
// supabase/functions/_shared/brand-trust.ts, and both callers read it from
// there: brand-campaigns `{ action: "trustScore" }` for the brand's own
// dashboard (via useBrandTrustScore) and list-brands for the creator-facing
// brand cards. There used to be four implementations that disagreed with
// each other; do not start a fifth by porting the maths back into the client.
//
// What is left below is pure UI: no scoring, no network, no weights.
// `getProfileCompletion` is duplicated in brand-trust.ts because P5 needs
// it server-side — keep the two field lists in step if either changes.
//
// Band labels, for reference by the colour maps that render them:
// 800+ Elite · 740+ Trusted · 670+ Established · 580+ Emerging ·
// below that Building Trust. (Renamed in 2026-07 from Excellent / Very
// Good / Good / Fair / Poor — same cutoffs, non-punitive wording.)

const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function isValidGstOrPan(value) {
  if (!value) return false;
  const v = String(value).toUpperCase().trim();
  return PAN_RE.test(v) || GSTIN_RE.test(v);
}

export function classifyGstPan(value) {
  if (!value) return { kind: "empty", valid: false };
  const v = String(value).toUpperCase().trim();
  if (PAN_RE.test(v)) return { kind: "pan", valid: true };
  if (GSTIN_RE.test(v)) return { kind: "gst", valid: true };
  if (v.length === 10) return { kind: "pan", valid: false };
  if (v.length === 15) return { kind: "gst", valid: false };
  return { kind: "unknown", valid: false };
}

// Profile completeness fields. Must stay in step with the identical list in
// supabase/functions/_shared/brand-trust.ts, which is what actually feeds the
// completion card and the P5 pillar — this copy is here for any client that
// wants the same answer without a round-trip.
const PROFILE_FIELDS = [
  { key: "categories",    label: "Categories",       test: (p) => Array.isArray(p?.categories) && p.categories.length > 0 },
  // Column names must match brand_profiles: about lives in full_description
  // (short_description as fallback), website in website_url — the old tests
  // read non-existent columns so these two never counted as filled.
  { key: "about",         label: "About the brand",  test: (p) => !!(p?.full_description || p?.short_description) },
  { key: "logo",          label: "Logo",             test: (p) => !!p?.logo_url },
  { key: "website",       label: "Website",          test: (p) => !!p?.website_url },
  { key: "contactEmail",  label: "Contact email",    test: (p) => !!p?.contact_email },
  { key: "contactPhone",  label: "Contact phone",    test: (p) => !!p?.contact_phone },
  // brand_profiles has instagram_username / instagram_url and nothing else;
  // the facebook/linkedin/twitter columns this used to test do not exist.
  { key: "socials",       label: "Social links",     test: (p) => !!(p?.instagram_username || p?.instagram_url) },
];

export function getProfileCompletion(profile) {
  if (!profile) return { percent: 0, missing: PROFILE_FIELDS.map((f) => f.label), filled: [] };
  const filled = [];
  const missing = [];
  for (const f of PROFILE_FIELDS) {
    if (f.test(profile)) filled.push(f.label);
    else missing.push(f.label);
  }
  const percent = Math.round((filled.length / PROFILE_FIELDS.length) * 100);
  return { percent, missing, filled };
}
