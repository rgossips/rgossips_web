import { getTranslations } from "next-intl/server";
import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { refundHtml } from "@/lib/refund";

export async function generateMetadata() {
  const t = await getTranslations("HomeConsentRefund");
  return {
    title: t("metaTitle"),
  };
}

// Public route — no auth required. Linked from the footer alongside
// the privacy and consent policies; lives under /consent/ so the
// publicPrefixes allow-list in ProtectedRoute already covers it.
export default async function RefundPolicyRoute() {
  const t = await getTranslations("HomeConsentRefund");
  return (
    <ConsentPolicyPage
      title={t("title")}
      subtitle={t("subtitle")}
      html={refundHtml}
    />
  );
}
