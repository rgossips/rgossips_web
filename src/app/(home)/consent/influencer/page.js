import { getTranslations } from "next-intl/server";
import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { consentHtml } from "@/lib/consent-influencer";

export async function generateMetadata() {
  const t = await getTranslations("HomeConsentInfluencer");
  return {
    title: t("metaTitle"),
  };
}

// Public route — no auth required. The role-scoped path
// /influencer/consent-policy still works via a server-side redirect for
// historic bookmarks, but new links should point at /consent/influencer.
export default async function InfluencerConsentPolicyRoute() {
  const t = await getTranslations("HomeConsentInfluencer");
  return (
    <ConsentPolicyPage
      title={t("title")}
      subtitle={t("subtitle")}
      html={consentHtml}
    />
  );
}
