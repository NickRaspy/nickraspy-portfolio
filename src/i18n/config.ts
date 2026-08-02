export const locales = ["en", "ru"] as const;

export type SupportedLocale = (typeof locales)[number];

export const defaultLocale: SupportedLocale = "en";
export const localeCookieName = "portfolio-locale";
export const localeHeaderName = "x-portfolio-locale";

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return locales.includes(value as SupportedLocale);
}

export function detectPreferredLocale(acceptLanguage: string | null | undefined): SupportedLocale {
  if (!acceptLanguage) return defaultLocale;

  const preferences = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [languageTag = "", ...parameters] = part.trim().toLowerCase().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
      return { languageTag, quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const preference of preferences) {
    if (preference.quality <= 0) continue;
    const language = preference.languageTag.split("-")[0];
    if (isSupportedLocale(language)) return language;
  }

  return defaultLocale;
}
