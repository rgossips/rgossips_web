import { redirect } from "next/navigation";

// Moved to a public route at /consent/influencer so it's accessible without
// signing in. This redirect keeps old bookmarks and the in-app links from
// the signup flow working.
export default function LegacyInfluencerConsentRedirect() {
  redirect("/consent/influencer");
}
