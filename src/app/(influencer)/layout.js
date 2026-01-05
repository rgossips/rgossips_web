import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function DashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <ScrollToTop />
      </main>
      <Footer />
    </>
  );
}
