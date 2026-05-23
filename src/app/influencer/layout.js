import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import BottomNav from "@/components/BottomNav";
import { DesktopNavbar } from "@/components/DeskTopNavbar";

export default function DashboardLayout({ children }) {
  return (
    <>
      {/* <Navbar /> */}
      <main className="min-h-screen flex flex-col">
        <DesktopNavbar />
        {/* All influencer pages share the same max-width container so layouts
            stay consistent. Individual pages provide their own padding. */}
        <div className="flex-1 mb-20 lg:mb-0 w-full max-w-7xl mx-auto">{children}</div>
        <ScrollToTop />
      </main>
      <BottomNav />
      <div className="mb-16 lg:mb-0">
        <Footer />
      </div>
    </>
  );
}
