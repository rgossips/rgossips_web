import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

// Home page metadata. Lives in the layout (not the page) because the
// home page is a Client Component and Client Components can't export
// `metadata`. Title/description here override the root layout's
// defaults for the marketing surface.
export const metadata = {
  title: "Find verified Instagram creators for paid + barter campaigns",
  description:
    "India's escrow-backed influencer marketing platform. Brands fund verified campaigns, creators get paid only when work is approved. 14k+ creators, 2800+ agencies onboarded.",
  alternates: {
    canonical: "https://rgossips.com",
  },
};

export default function MarketingLayout({ children }) {
  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <ScrollToTop />
      </main>
      <Footer />
    </>
  );
}
