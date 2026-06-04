import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { privacyHtml } from "@/lib/privacy";

export const metadata = {
  title: "Privacy & Cookie Policy · RGossips",
};

// Public route — no auth required. Linked from the footer alongside the
// influencer / brand consent policies; the URL lives under /consent/ so
// it sits inside the existing public-route allowlist in ProtectedRoute.
export default function PrivacyPolicyRoute() {
  return (
    <ConsentPolicyPage
      title="Privacy & Cookie Policy"
      subtitle="Recent Gossips — Influencer Marketing Platform · operated by RUDE LABS Private Limited"
      html={privacyHtml}
    />
  );
}
