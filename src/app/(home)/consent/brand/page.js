import { getTranslations } from "next-intl/server";
import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { consentHtml } from "@/lib/consent-brand";

export async function generateMetadata() {
  const t = await getTranslations("HomeConsentBrand");
  return {
    title: t("metaTitle"),
  };
}

// Public route — see /consent/influencer for the rationale.
export default async function BrandConsentPolicyRoute() {
  const t = await getTranslations("HomeConsentBrand");
  return (
    <ConsentPolicyPage
      title={t("title")}
      subtitle={t("subtitle")}
      html={consentHtml}
    />
  );
}
