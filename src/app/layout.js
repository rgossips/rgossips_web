import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GlobalProvider } from "@/context/GlobalContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Recent Gossips | Global Influencer Marketing & Brand Collaboration",
  description:
    "Rgossips is a performance-driven influencer marketing platform where brands connect with verified influencers for paid and barter campaigns. Find creators by niche, location, and engagement in minutes.",
  keywords: [
    "Influencer Marketing",
    "Brand Collaborations",
    "Social Media Marketing",
    "Barter Campaigns",
  ],
  authors: [{ name: "Recent Gossips" }],
  // Icon Setup
  icons: {
    icon: "/icon.svg", // Path to your public/icon.svg
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },

  metadataBase: new URL("https://rgossips.com"),
  // Social Media / OpenGraph Setup
  openGraph: {
    title: "Recent Gossips",
    description:
      "Connect with verified influencers for paid and barter campaigns.",
    url: "https://rgossips.com", // Replace with your actual domain
    siteName: "Recent Gossips",
    images: [
      {
        url: "/icon.svg", // Create a social sharing image in your public folder
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fafc] text-gray-800`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FRL0M0KYC8"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-FRL0M0KYC8');
          `}
        </Script>

        <GlobalProvider>
          <AuthProvider>
            <ProtectedRoute>{children}</ProtectedRoute>
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
