import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { defaultLocale, isSupportedLocale, localeHeaderName } from "@/src/i18n/config";
import { getRequestSiteUrl } from "@/src/seo/requestSiteUrl";
import { siteConfig } from "@/src/seo/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["cyrillic", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["cyrillic", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: await getRequestSiteUrl(),
    applicationName: siteConfig.name,
    title: {
      default: siteConfig.name,
      template: "%s // " + siteConfig.shortName,
    },
    description: "Holographic full-stack developer portfolio.",
    keywords: [
      "Nickraspy",
      "full-stack developer",
      "TypeScript",
      "React",
      "Next.js",
      "WebGL",
    ],
    authors: [{ name: siteConfig.authorName, url: "/en" }],
    creator: siteConfig.authorName,
    publisher: siteConfig.authorName,
    category: "technology",
    referrer: "origin-when-cross-origin",
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
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestedLocale = (await headers()).get(localeHeaderName);
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
