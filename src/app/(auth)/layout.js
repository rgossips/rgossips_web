import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

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
        <main className="min-h-screen flex">
          {/* LEFT SIDE VIDEO */}
          <div className="hidden md:block w-2/3 relative overflow-hidden">
            <video
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source
                src="https://www.pexels.com/download/video/7677015/"
                type="video/mp4"
              />
            </video>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Text Overlay */}
            <div className="absolute bottom-10 left-10 text-white z-20">
              <h1 className="text-3xl font-bold">The Power of Influence</h1>
              <p className="text-sm text-gray-200 mt-2 w-3/4">
                Join our creator community and grow your audience with modern
                digital tools.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE AUTH FORMS */}
          <div className="flex-1 flex justify-center items-center px-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
