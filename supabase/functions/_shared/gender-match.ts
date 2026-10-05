// Does this creator match a campaign's gender brief?
//
// Single owner for the rule, because it is enforced in two places that must
// agree: list-campaigns decides whether the campaign is VISIBLE, and
// apply-campaign decides whether an application is ACCEPTED. If those two
// disagree, a creator either sees a campaign they cannot apply to or applies
// to one they should never have seen.
//
// Shapes, measured against the live database rather than assumed:
//
//   campaigns.description trailer -> target_gender: string[]
//     ["Any"]                      23 campaigns   no restriction
//     ["Male","Female","Any"]        3 campaigns   no restriction
//     ["Female"]                     6 campaigns   female only
//     ["Male"]                       3 campaigns   male only
//     absent                        40 campaigns   no restriction
//
//   influencer_profiles.gender    -> "male" | "female" | "non_binary" |
//                                    "prefer_not_to_say" | null
//     null                        245 of 492 creators
//     female                      216
//     male                         29
//     non_binary                    2
//
// Only 9 of 75 campaigns are genuinely restricted, and HALF the creator base
// has no gender on file. That second number drives the whole design: a rule
// that hides a restricted campaign from everyone who is not a confirmed
// match would silently remove those 9 campaigns from 245 creators who simply
// never filled the field in. So the rule only ever excludes a KNOWN
// mismatch.

export type GenderDecision = "allowed" | "blocked" | "unknown_creator";

// A brief restricts only when it names exactly one of male/female. "Any"
// anywhere, both named, or nothing at all means everyone is welcome.
export function requiredGender(targetGender: unknown): "male" | "female" | null {
  if (!Array.isArray(targetGender) || targetGender.length === 0) return null;
  const low = targetGender.map((v) => String(v ?? "").trim().toLowerCase()).filter(Boolean);
  if (low.length === 0) return null;
  if (low.includes("any") || low.includes("all")) return null;
  const wantsMale = low.includes("male");
  const wantsFemale = low.includes("female");
  // Both named is the same as no preference, and is how three live campaigns
  // are stored.
  if (wantsMale && wantsFemale) return null;
  if (wantsMale) return "male";
  if (wantsFemale) return "female";
  // Some other word entirely — treat as unrestricted rather than guessing.
  return null;
}

// "Male", "MALE", "male " all land on "male"; everything else keeps its
// stored form so the caller can tell non_binary from an unset field.
function normalizeCreatorGender(gender: unknown): string | null {
  const v = String(gender ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!v) return null;
  if (v === "m" || v === "male") return "male";
  if (v === "f" || v === "female") return "female";
  return v;
}

// The decision for one creator against one campaign.
//
//   allowed         — no restriction, or the creator is the named gender, or
//                     the creator is non-binary / declined to say (a brief
//                     the UI labels "preferred" should not erase them, and
//                     there are two such creators in the whole base)
//   unknown_creator — the creator has no gender on file. Treated as allowed
//                     for VISIBILITY, because the alternative is hiding
//                     work from half the base with no explanation; apply
//                     already demands the field before it accepts anything,
//                     so this resolves itself the moment they try.
//   blocked         — a known, opposite gender. The only exclusion.
export function genderDecision(targetGender: unknown, creatorGender: unknown): GenderDecision {
  const required = requiredGender(targetGender);
  if (!required) return "allowed";

  const theirs = normalizeCreatorGender(creatorGender);
  if (!theirs) return "unknown_creator";
  if (theirs === required) return "allowed";
  // The only two values that can contradict a brief are the other binary
  // gender. non_binary and prefer_not_to_say are not a contradiction.
  if (theirs === "male" || theirs === "female") return "blocked";
  return "allowed";
}

// Visibility: hide only a known mismatch.
export function genderAllowsVisibility(targetGender: unknown, creatorGender: unknown): boolean {
  return genderDecision(targetGender, creatorGender) !== "blocked";
}

// What to tell a creator whose application is refused. Names the brief, not
// them — the campaign asked for something they are not, which is a fact
// about the campaign.
export function genderRefusalMessage(required: "male" | "female"): string {
  return `This campaign is open to ${required} creators only. The brand set that requirement, so your application can't be submitted.`;
}
