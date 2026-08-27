// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — Root Layout
//  Provides: SessionProvider, ThemeProvider, fonts, metadata.
//  All child layouts inherit from this.
// ═══════════════════════════════════════════════════════════

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";

export const metadata: Metadata = {
  title: {
    default: "বারাকাহ ফাইন্যান্স | Barakah Finance",
    template: "%s | বারাকাহ ফাইন্যান্স",
  },
  description:
    "সুদমুক্ত লেনদেনে সমৃদ্ধি সবার — শরিয়াহ সম্মত আর্থিক প্রতিষ্ঠান",
  keywords: [
    "Barakah Finance",
    "বারাকাহ ফাইন্যান্স",
    "ইসলামিক ফাইন্যান্স",
    "সুদমুক্ত",
    "কিস্তি",
    "করজে হাসানা",
    "সঞ্চয়",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "bn_BD",
    alternateLocale: "en_US",
    siteName: "বারাকাহ ফাইন্যান্স",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5D061" },
    { media: "(prefers-color-scheme: dark)",  color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Bengali fonts — preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] antialiased">
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
