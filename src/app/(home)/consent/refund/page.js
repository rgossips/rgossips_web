import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { refundHtml } from "@/lib/refund";

export const metadata = {
  title: "Payment & Refund Policy · RGossips",
};

// Public route — no auth required. Linked from the footer alongside
// the privacy and consent policies; lives under /consent/ so the
// publicPrefixes allow-list in ProtectedRoute already covers it.
export default function RefundPolicyRoute() {
  return (
    <ConsentPolicyPage
      title="Payment & Refund Policy"
      subtitle="RGossips — operated by RUDE LABS Private Limited"
      html={refundHtml}
    />
  );
}
