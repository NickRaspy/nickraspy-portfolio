import { defaultLocale, locales, type SupportedLocale } from "@/src/i18n/config";

type SiteEnvironment = Partial<
  Record<
    "SITE_URL" | "VERCEL_PROJECT_PRODUCTION_URL",
    string
  >
>;

export function resolveSiteUrl(
  environment: SiteEnvironment = process.env as SiteEnvironment,
): URL {
  const vercelOrigin = environment.VERCEL_PROJECT_PRODUCTION_URL
    ? "https://" + environment.VERCEL_PROJECT_PRODUCTION_URL
    : undefined;
  const candidate =
    environment.SITE_URL?.trim() ||
    vercelOrigin;

  if (!candidate) {
    throw new Error(
      "A canonical site origin is required. Set SITE_URL or provide VERCEL_PROJECT_PRODUCTION_URL.",
    );
  }

  const parsed = new URL(candidate);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("SITE_URL must use http:// or https://.");
  }

  return new URL(parsed.origin);
}

export const siteConfig = {
  name: "Aetheris // Nickraspy Portfolio",
  shortName: "Nickraspy",
  authorName: "Nickraspy",
  defaultLocale,
  locales,
  get url(): URL {
    return resolveSiteUrl();
  },
} as const;

export function absoluteUrl(pathname = "/"): string {
  return new URL(pathname, siteConfig.url).toString();
}

export function localizedPath(locale: SupportedLocale): string {
  return "/" + locale;
}

export function localizedUrl(locale: SupportedLocale): string {
  return absoluteUrl(localizedPath(locale));
}

export function languageAlternates(): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedPath(locale)])),
    "x-default": "/",
  };
}
