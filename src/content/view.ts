import type { Locale, PortfolioContent, PortfolioView, TranslationMap } from "./types";

function localized<T>(translations: TranslationMap<T>, locale: Locale, fallback: Locale): T {
  return translations[locale] ?? translations[fallback] ?? Object.values(translations)[0];
}

export function createPortfolioView(content: PortfolioContent, requestedLocale?: string): PortfolioView {
  const locale = requestedLocale && content.locales.includes(requestedLocale) ? requestedLocale : content.defaultLocale;
  const profile = localized(content.profile.translations, locale, content.defaultLocale);

  return {
    locale,
    profile: { ...profile, status: content.profile.status, clearance: content.profile.clearance },
    skills: [...content.skills].sort((a, b) => a.sortOrder - b.sortOrder),
    experience: [...content.experience]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const translation = localized(item.translations, locale, content.defaultLocale);
        const localizedEnd = locale === "ru" && item.end === "CUR" ? "НАСТ" : item.end;
        return { id: item.id, range: `${item.start}—${localizedEnd}`, role: translation.role, company: translation.company };
      }),
    categories: [...content.categories]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ id: item.id, code: item.code, name: localized(item.translations, locale, content.defaultLocale).name })),
    projects: [...content.projects]
      .filter((item) => item.status === "published")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const translation = localized(item.translations, locale, content.defaultLocale);
        return {
          id: item.id,
          categoryId: item.categoryId,
          code: item.id.toUpperCase(),
          name: translation.name,
          description: translation.description ?? "",
          tags: item.technologies,
          year: item.year,
          liveUrl: item.liveUrl,
          repositoryUrl: item.repositoryUrl,
        };
      }),
    contacts: [...content.contacts].filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder),
  };
}
