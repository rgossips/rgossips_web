import { redirect } from "next/navigation";

// Moved to a public route at /consent/brand. See /influencer/consent-policy
// for the rationale.
export default function LegacyBrandConsentRedirect() {
  redirect("/consent/brand");
}
