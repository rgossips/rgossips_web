import { Poppins } from "next/font/google";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/brands/Sidebar";
import BottomNavBrands from "@/components/brands/BottomNavBrands";
import "./brands-theme.css";

// Poppins is the brands surface's face, from the Explore design. Scoped to
// this layout rather than the root so the influencer and landing surfaces keep
// Geist — see brands-theme.css for why the two identities stay separate.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export default function BrandsLayout({ children }) {
  return (
    <div className={`${poppins.variable} brands-surface font-[var(--font-poppins)]`}>
      <main className="min-h-screen flex flex-col">
        {/* No top bar. The Explore design puts the logo in the sidebar, so the
            72px BrandNavbar is gone and the page gets its full height back.
            BrandNavbar was `hidden lg:flex`, so this changes DESKTOP only —
            mobile never had a header and still relies on BottomNavBrands.
            What the navbar also carried has been rehomed: search back onto
            /brands/search, notifications + account into the sidebar. */}
        <div className="flex flex-1">
          {/* Desktop sidebar — 252px per the design, up from 220px. */}
          <div className="hidden lg:block fixed left-0 top-0 h-screen w-[252px] z-40">
            <Sidebar />
          </div>

          {/* pb-20 on mobile keeps content clear of the fixed bottom nav. */}
          <div className="flex-1 lg:ml-[252px] overflow-y-auto pb-20 lg:pb-0">
            {children}
          </div>
        </div>

        <ScrollToTop />
      </main>

      <BottomNavBrands />

      <div className="mb-20 lg:mb-0 lg:ml-[252px]">
        <Footer />
      </div>
    </div>
  );
}
