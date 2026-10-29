// A campaign's gender brief, and who it excludes.
//
// MIRRORS supabase/functions/_shared/gender-match.ts — that one runs in Deno
// as an edge function and cannot be imported from the browser bundle, so the
// two are hand-synced, the same arrangement as plans.js against
// _shared/plan.ts. rsgossips_admin/src/lib/gender-target.ts is the third
// copy. Change one, change all three, or the brand app will rank a creator
// the consumer app refuses to let apply.
//
// Shapes, measured live rather than assumed:
//
//   campaigns.description trailer -> target_gender: string[]
//     ["Any"] 23 · ["Male","Female","Any"] 3 · ["Female"] 6 · ["Male"] 3
//     absent 40.  Only 9 of 75 campaigns restrict anything.
//
//   influencer_profiles.gender -> null 245 · female 216 · male 29 ·
//     non_binary 2

/**
 * A brief restricts only when it names exactly one of male/female. "Any"
 * anywhere, both named, or nothing at all means everyone is welcome.
 * @returns {"male"|"female"|null}
 */
export function requiredGender(targetGender) {
  if (!Array.isArray(targetGender) || targetGender.length === 0) return null;
  const low = targetGender.map((v) => String(v ?? "").trim().toLowerCase()).filter(Boolean);
  if (low.length === 0) return null;
  if (low.includes("any") || low.includes("all")) return null;
  const wantsMale = low.includes("male");
  const wantsFemale = low.includes("female");
  if (wantsMale && wantsFemale) return null;
  if (wantsMale) return "male";
  if (wantsFemale) return "female";
  return null;
}

export function normalizeGender(gender) {
  const v = String(gender ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!v) return null;
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  return v;
}

/**
 * True only for a KNOWN, opposite gender. An unset field, non_binary and
 * prefer_not_to_say are never an exclusion — that is the rule apply-campaign
 * itself enforces, and half the registered base has no gender on file.
 */
export function genderExcludes(required, candidateGender) {
  if (!required) return false;
  const theirs = normalizeGender(candidateGender);
  if (!theirs) return false;
  if (theirs === required) return false;
  return theirs === "male" || theirs === "female";
}

export const GENDER_LABEL = {
  male: "Male",
  female: "Female",
  non_binary: "Non-binary",
  prefer_not_to_say: "Not stated",
};

export function genderLabel(gender) {
  const v = normalizeGender(gender);
  if (!v) return null;
  return GENDER_LABEL[v] || v;
}
