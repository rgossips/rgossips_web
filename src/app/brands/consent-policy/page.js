import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { consentHtml } from "@/lib/consent-brand";

export const metadata = {
  title: "Brand Consent Policy · RGossips",
};

export default function BrandConsentPolicyRoute() {
  return (
    <ConsentPolicyPage
      title="Brand Consent Policy"
      subtitle="Recent Gossips — Brand Portal · operated by RUDE LABS Private Limited"
      html={consentHtml}
    />
  );
}
