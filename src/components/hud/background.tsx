import type { SupportedLocale } from "@/src/i18n/config";
import { locales } from "@/src/i18n/config";
import SpaceBackground from "../spaceBackground";

type HudBackgroundProps = {
  locale: SupportedLocale;
  languageSwitcherLabel: string;
  languageLabels: Record<SupportedLocale, string>;
};

export default function HudBackground({
  locale,
  languageSwitcherLabel,
  languageLabels,
}: HudBackgroundProps) {
  return (
    <>
      <SpaceBackground />
      <div className="scanlines" aria-hidden="true" />
      <div className="reticle reticle-a" aria-hidden="true" />
      <div className="reticle reticle-b" aria-hidden="true" />
      <nav className="language-switcher" aria-label={languageSwitcherLabel}>
        {locales.map((nextLocale) => (
          <a
            key={nextLocale}
            className={locale === nextLocale ? "active" : ""}
            href={`/${nextLocale}?setLocale=${nextLocale}`}
            hrefLang={nextLocale}
            lang={nextLocale}
            aria-label={languageLabels[nextLocale]}
            aria-current={locale === nextLocale ? "page" : undefined}
          >
            {nextLocale.toUpperCase()}
          </a>
        ))}
      </nav>
    </>
  );
}
