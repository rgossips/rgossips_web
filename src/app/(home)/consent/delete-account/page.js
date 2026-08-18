import ConsentPolicyPage from "@/components/ConsentPolicyPage";
import { deleteAccountHtml } from "@/lib/delete-account";

export const metadata = {
  title: "Delete your account",
  description:
    "How to delete your RGossips account, what data is removed, and what is retained for legal and tax purposes.",
};

// Public route — no auth required, and that is the point: Google Play requires
// the Delete-account URL in Data safety to be readable by anyone, including
// someone who cannot sign in. The deletion *action* still requires sign-in,
// which Play permits and which stops anyone requesting deletion of an account
// that is not theirs.
//
// Lives under /consent/ so it falls inside the existing public-route
// allowlist in ProtectedRoute (publicPrefixes includes "/consent/").
//
// Copy is deliberately not routed through next-intl: this is a compliance
// document whose wording is cited in the Play Console submission, and it must
// not vary by locale mid-review. Revisit if the other consent pages ever gain
// real translations.
export default function DeleteAccountRoute() {
  return (
    <ConsentPolicyPage
      title="Delete your account"
      subtitle="How to delete your RGossips account, what is removed, and what we must keep"
      html={deleteAccountHtml}
    />
  );
}
