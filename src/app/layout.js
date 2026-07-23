import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { GlobalProvider } from "@/context/GlobalContext";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingProvider } from "@/context/LoadingContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import OfflineGate from "@/components/OfflineGate";
import Script from "next/script";
import NavigationLoader from "@/components/NavigationLoader";
import ScrollReset from "@/components/ScrollReset";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://rgossips.com"),
  title: {
    default: "RGossips | India's Trusted Influencer Marketing Platform",
    template: "%s · RGossips",
  },
  description:
    "RGossips connects Indian brands with verified Instagram creators for paid and barter campaigns. Discover micro and macro influencers by niche, location, and engagement — fund campaigns through escrow, release payments only when work is approved.",
  keywords: [
    "influencer marketing India",
    "instagram influencers",
    "creator marketing platform",
    "brand collaborations",
    "micro influencers",
    "barter campaigns",
    "influencer search",
    "creator marketplace",
    "social media marketing India",
    "paid creator campaigns",
  ],
  authors: [{ name: "RUDE LABS PVT. LTD." }],
  creator: "RUDE LABS PVT. LTD.",
  publisher: "RUDE LABS PVT. LTD.",
  applicationName: "RGossips",
  category: "marketing",
  // Tell crawlers we want to be indexed + give them image preview rights.
  // Defaults are restrictive; this opens up rich snippets.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://rgossips.com",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "RGossips | India's Trusted Influencer Marketing Platform",
    description:
      "Connect with verified Indian creators for paid and barter campaigns. Escrow-backed, transparent, and built for trust.",
    url: "https://rgossips.com",
    siteName: "RGossips",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RGossips — influencer marketing platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RGossips | India's Trusted Influencer Marketing Platform",
    description:
      "Connect with verified Indian creators for paid and barter campaigns. Escrow-backed, transparent, and built for trust.",
    images: ["/og-image.png"],
  },
  verification: {
    // Google Search Console — HTML-tag method. Belt-and-braces against
    // the file-method verification (/google99c6b03955ca73e5.html). Either
    // alone is enough; both make it harder to accidentally lose
    // ownership if one source is misconfigured.
    google: "PjCPmXuxXgubOOxwaNHm6SvAD_Jg0q4rZ7hGZy9VSq8",
  },
};

// Sitewide structured data. Two schemas — Organization (who we are) +
// WebSite (sitelinks search box eligibility). Inlined into <head> as
// JSON-LD per Google's recommended approach.
const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "RGossips",
  legalName: "RUDE LABS PVT. LTD.",
  url: "https://rgossips.com",
  logo: "https://rgossips.com/icon.svg",
  description:
    "India's trusted influencer marketing platform — connecting brands with verified Instagram creators through escrow-backed paid and barter campaigns.",
  email: "info@rgossips.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Mughalsarai",
    addressRegion: "Uttar Pradesh",
    addressCountry: "IN",
  },
  sameAs: [
    "https://www.instagram.com/rgossips.agency/",
    "https://whatsapp.com/channel/0029VbBjpbKLo4hdMsZKc146",
  ],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "RGossips",
  url: "https://rgossips.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://rgossips.com/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default async function RootLayout({ children }) {
  // Locale + messages resolved from the NEXT_LOCALE cookie (see src/i18n).
  // Providing them here lets every Server and Client Component call
  // useTranslations()/getTranslations() with the same catalog.
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <head>
        {/* Structured data — JSON-LD. Renders into <head> at build time
            because it's a Server Component. Google reads this to power
            Knowledge Panel / sitelinks search box / rich results. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f8fafc] text-gray-800`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-EHKNXSHNB3"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-EHKNXSHNB3');
          `}
        </Script>

        <NavigationLoader />
        <ScrollReset />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LoadingProvider>
            <GlobalProvider>
              <AuthProvider>
                <OfflineGate />
                <ProtectedRoute>{children}</ProtectedRoute>
              </AuthProvider>
            </GlobalProvider>
          </LoadingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
