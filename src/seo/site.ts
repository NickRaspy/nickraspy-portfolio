import { defaultLocale, locales, type SupportedLocale } from "@/src/i18n/config";

const localSiteOrigin = "http://localhost:3000";

type SiteEnvironment = Partial<
  Record<
    "SITE_URL" | "VERCEL_PROJECT_PRODUCTION_URL" | "VERCEL" | "VERCEL_ENV",
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
    const isVercelProduction =
      environment.VERCEL === "1" || environment.VERCEL_ENV === "production";

    if (isVercelProduction) {
      throw new Error(
        "A production site origin is required. Set SITE_URL or enable VERCEL_PROJECT_PRODUCTION_URL.",
      );
    }

    return new URL(localSiteOrigin);
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
  url: resolveSiteUrl(),
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
