import type { MetadataRoute } from "next";
import { locales } from "@/src/i18n/config";
import { languageAlternates, localizedUrl } from "@/src/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const alternates = languageAlternates();

  return locales.map((locale) => ({
    url: localizedUrl(locale),
    changeFrequency: "monthly",
    priority: 1,
    alternates: { languages: alternates },
  }));
}
