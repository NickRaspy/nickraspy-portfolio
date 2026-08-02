import type { Metadata } from "next";
import type { SupportedLocale } from "@/src/i18n/config";
import { messages } from "@/src/i18n/messages";
import { languageAlternates, localizedPath, siteConfig } from "./site";

const socialImageAlt = "Nickraspy full-stack developer portfolio";

export function createLocaleMetadata(locale: SupportedLocale): Metadata {
  const localizedMetadata = messages[locale].metadata;
  const canonical = localizedPath(locale);
  const openGraphLocale = locale === "ru" ? "ru_RU" : "en_US";

  return {
    title: { absolute: localizedMetadata.title },
    description: localizedMetadata.description,
    alternates: {
      canonical,
      languages: languageAlternates(),
    },
    openGraph: {
      title: localizedMetadata.title,
      description: localizedMetadata.description,
      url: canonical,
      siteName: siteConfig.name,
      locale: openGraphLocale,
      alternateLocale: locale === "ru" ? ["en_US"] : ["ru_RU"],
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: socialImageAlt,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedMetadata.title,
      description: localizedMetadata.description,
      images: [
        {
          url: "/twitter-image",
          width: 1200,
          height: 630,
          alt: socialImageAlt,
        },
      ],
    },
  };
}
