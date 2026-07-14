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
      {/* Fonts used by the redesigned landing (Baloo 2 for display, Manrope
          for body). Loaded here so the family names resolve site-wide on the
          marketing surface; Next hoists these <link>s into <head>. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <Header />
      <main className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <ScrollToTop />
      </main>
      <Footer />
    </>
  );
}
