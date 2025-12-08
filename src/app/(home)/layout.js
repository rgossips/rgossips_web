import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RecentGossips",
  description: "Modern Next.js website built with Tailwind CSS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fafc] text-gray-800 relative`}
      >
        {/* Header always on top */}
        <Header />

        {/* Main Content Wrapper */}
        <main className="min-h-screen flex flex-col relative">
          {/* Page Content */}
          <div className="flex-1">{children}</div>

          {/* Scroll to Top Button */}
          <ScrollToTop />
        </main>

        {/* Footer */}
        <Footer />
      </body>
    </html>
  );
}
