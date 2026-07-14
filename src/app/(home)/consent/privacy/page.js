import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { privacyHtml } from "@/lib/privacy";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("HomeConsentPrivacy");
  return {
    title: t("metaTitle"),
  };
}

// Public route — no auth required. Linked from the footer alongside the
// influencer / brand consent policies; the URL lives under /consent/ so
// it sits inside the existing public-route allowlist in ProtectedRoute.
export default async function PrivacyPolicyRoute() {
  const t = await getTranslations("HomeConsentPrivacy");
  return (
    <ConsentPolicyPage
      title={t("title")}
      subtitle={t("subtitle")}
      html={privacyHtml}
    />
  );
}
