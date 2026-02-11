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
        <div className="flex-1 mb-20 lg:mb-0">{children}</div>
        <ScrollToTop />
      </main>
      <BottomNav />
      {/* <Footer /> */}
    </>
  );
}
