import { defaultLocale, locales, type SupportedLocale } from "@/src/i18n/config";

type SiteEnvironment = Partial<
  Record<
    "SITE_URL" | "VERCEL_PROJECT_PRODUCTION_URL",
    string
  >
>;

type RequestHeaders = Pick<Headers, "get">;

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function requestOrigin(requestHeaders: RequestHeaders | undefined): string | undefined {
  if (!requestHeaders) return undefined;

  const host =
    firstHeaderValue(requestHeaders.get("x-forwarded-host")) ||
    firstHeaderValue(requestHeaders.get("host"));
  if (!host) return undefined;
  if (/[\\/\s@]/.test(host)) throw new Error("Request host is invalid.");

  const forwardedProtocol = firstHeaderValue(requestHeaders.get("x-forwarded-proto"));
  const protocol =
    forwardedProtocol ||
    (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host) ? "http" : "https");
  if (protocol !== "https" && protocol !== "http") {
    throw new Error("Request protocol must be http or https.");
  }

  return `${protocol}://${host}`;
}

export function resolveSiteUrl(
  environment: SiteEnvironment = process.env as SiteEnvironment,
  requestHeaders?: RequestHeaders,
): URL {
  const vercelOrigin = environment.VERCEL_PROJECT_PRODUCTION_URL
    ? "https://" + environment.VERCEL_PROJECT_PRODUCTION_URL
    : undefined;
  const candidate =
    requestOrigin(requestHeaders) ||
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
} as const;

export function absoluteUrl(siteUrl: URL, pathname = "/"): string {
  return new URL(pathname, siteUrl).toString();
}

export function localizedPath(locale: SupportedLocale): string {
  return "/" + locale;
}

export function localizedUrl(siteUrl: URL, locale: SupportedLocale): string {
  return absoluteUrl(siteUrl, localizedPath(locale));
}

export function languageAlternates(): Record<string, string> {
  return {
    ...Object.fromEntries(locales.map((locale) => [locale, localizedPath(locale)])),
    "x-default": "/",
  };
}
