import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RecentGossips | Influencer Landing Page",
  description: "Modern Next.js website built with Tailwind CSS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fafc] text-gray-800 relative`}
      >
        {/* Wrap entire app in AuthProvider */}
        <AuthProvider>
          <main className="min-h-screen flex flex-col relative">
            <Navbar />
            <div className="flex-1">{children}</div>
            <ScrollToTop />
          </main>

          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
