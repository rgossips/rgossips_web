import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { consentHtml } from "@/lib/consent-influencer";

export const metadata = {
  title: "Influencer Consent Policy · RGossips",
};

// Public route — no auth required. The role-scoped path
// /influencer/consent-policy still works via a server-side redirect for
// historic bookmarks, but new links should point at /consent/influencer.
export default function InfluencerConsentPolicyRoute() {
  return (
    <ConsentPolicyPage
      title="Influencer Consent Policy"
      subtitle="Recent Gossips — Influencer Marketing Portal · operated by RUDE LABS Private Limited"
      html={consentHtml}
    />
  );
}
