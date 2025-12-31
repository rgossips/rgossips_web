import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import BackButton from "@/components/BackButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RecentGossips | Influencer Login/Register Page",
  description: "Modern Next.js website built with Tailwind CSS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fafc] text-gray-800`}
      >
        <BackButton />
        <main className="min-h-screen flex items-center justify-center w-full">
          <div className="flex flex-col items-center justify-center w-full px-6 py-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
