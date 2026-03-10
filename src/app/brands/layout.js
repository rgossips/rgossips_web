import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import BottomNav from "@/components/BottomNav";
import { DesktopNavbar } from "@/components/DeskTopNavbar";
import Sidebar from "@/components/brands/Sidebar";
import { BrandNavbar } from "@/components/brands/BrandNavbar";

export default function BrandsLayout({ children }) {
  return (
    <>
      <main className="min-h-screen flex flex-col">
        {/* Top Navbar */}
        <BrandNavbar />

        {/* Main Layout */}
        <div className="flex flex-1">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block fixed left-0 top-[72px] h-[calc(100vh-72px)] w-[220px] border-r bg-[#f5f6f8]">
            <Sidebar />
          </div>

          {/* Page Content */}
          <div className="flex-1 lg:ml-[220px] overflow-y-auto">{children}</div>
        </div>

        <ScrollToTop />
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNav />

      <div className="mb-16 lg:mb-0 lg:ml-[220px]">
        <Footer />
      </div>
    </>
  );
}
