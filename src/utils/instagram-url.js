// instagram-url: dumb, robust parser for the URLs influencers paste when
// submitting deliverables. We use it for two things:
//   1. Show the user what kind of link they pasted ("Reel detected") so the
//      mismatch with a "Story" deliverable is obvious before submit.
//   2. Normalise URLs for the duplicate check so https://www.instagram.com/reel/Cxyz/
//      and instagram.com/reel/Cxyz match.

// Returns one of: 'reel' | 'post' | 'story' | 'igtv' | 'tv' | 'unknown'
export const detectInstagramLinkType = (raw) => {
  if (!raw) return "unknown";
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return "unknown";
  }
  const host = url.hostname.toLowerCase();
  if (!host.includes("instagram.com")) return "unknown";
  const path = url.pathname.toLowerCase();
  if (path.includes("/reel/") || path.includes("/reels/")) return "reel";
  if (path.includes("/stories/")) return "story";
  if (path.includes("/tv/")) return "igtv";
  if (path.includes("/p/")) return "post";
  return "unknown";
};

// Friendly label for UI hints. Matches the casing used in our deliverable
// type strings (lowercase).
export const labelForLinkType = (type) => {
  switch (type) {
    case "reel": return "Reel";
    case "post": return "Post";
    case "story": return "Story";
    case "igtv":
    case "tv": return "IGTV";
    default: return "Link";
  }
};

// Returns the type the deliverable name implies. Deliverable types come
// through as e.g. "reels", "stories", "posts", "carousel", "igtv".
export const expectedLinkType = (deliverableType) => {
  if (!deliverableType) return null;
  const t = deliverableType.toLowerCase();
  if (t.startsWith("reel")) return "reel";
  if (t.startsWith("stor")) return "story";
  if (t.startsWith("post") || t.startsWith("carousel") || t.startsWith("static")) return "post";
  if (t === "igtv" || t === "tv") return "igtv";
  return null;
};
// URL identity lives in ONE place, imported by BOTH this app and the edge
// functions: supabase/functions/_shared/submission-url.js. It used to be
// duplicated here and in submit-deliverables, and the copies drifted into the
// same bug twice — fixing the client only moved the refusal to the server.
//
// `normaliseInstagramUrl` keeps its old name because that is what the
// deliverables form imports; it normalises ANY submission link, which is why
// `isInstagramUrl` exists separately.
export {
  isInstagramUrl,
  normaliseSubmissionUrl,
  normaliseSubmissionUrl as normaliseInstagramUrl,
} from "../../supabase/functions/_shared/submission-url.js";
