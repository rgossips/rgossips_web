import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

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
