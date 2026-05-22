import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { consentHtml } from "@/lib/consent-influencer";

export const metadata = {
  title: "Influencer Consent Policy · RGossips",
};

export default function InfluencerConsentPolicyRoute() {
  return (
    <ConsentPolicyPage
      title="Influencer Consent Policy"
      subtitle="Recent Gossips — Influencer Marketing Portal · operated by RUDE LABS Private Limited"
      html={consentHtml}
    />
  );
}
