import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "@/context/GlobalContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title:
    "Recent Gossips: Global Influencer Marketing & Brand Collaboration Platform",
  description:
    "Rgossips is a performance-driven influencer marketing platform where brands connect with verified influencers for paid and barter campaigns. Find creators by niche, location, and engagement in minutes.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fafc] text-gray-800`}
      >
        <GlobalProvider>
          <AuthProvider>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
