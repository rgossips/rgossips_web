import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { supportHtml } from "@/lib/support";

export const metadata = {
  title: "Support",
  description:
    "Contact RGossips support — email, WhatsApp and Instagram, response times, and answers to common account, Instagram and payout questions.",
};

// Public route — App Store Connect requires a Support URL, and a reviewer
// opens it while signed out. "/support" is registered in ProtectedRoute's
// publicPaths; without that entry this page redirects to /login and the
// store listing's support link breaks.
//
// Copy is deliberately not routed through next-intl, matching
// /consent/delete-account: this is a page cited in the store submissions and
// should not vary by locale mid-review.
export default function SupportRoute() {
  return (
    <ConsentPolicyPage
      title="Support"
      subtitle="Get help with your account, Instagram connection, campaigns and payouts"
      html={supportHtml}
    />
  );
}
