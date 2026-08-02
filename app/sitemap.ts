import type { MetadataRoute } from "next";
import { locales } from "@/src/i18n/config";
import { getRequestSiteUrl } from "@/src/seo/requestSiteUrl";
import { languageAlternates, localizedUrl } from "@/src/seo/site";

export function createSitemap(siteUrl: URL): MetadataRoute.Sitemap {
  const alternates = languageAlternates();

  return locales.map((locale) => ({
    url: localizedUrl(siteUrl, locale),
    changeFrequency: "monthly",
    priority: 1,
    alternates: { languages: alternates },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return createSitemap(await getRequestSiteUrl());
}
