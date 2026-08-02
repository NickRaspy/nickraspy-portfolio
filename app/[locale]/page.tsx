import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HudPortfolio from "@/src/components/hudPortfolio";
import { getPortfolioView } from "@/src/content/data";
import { isSupportedLocale, locales, type SupportedLocale } from "@/src/i18n/config";
import { messages } from "@/src/i18n/messages";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

function requireLocale(locale: string): SupportedLocale {
  if (!isSupportedLocale(locale)) notFound();
  return locale;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocalePageProps): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  const localizedMetadata = messages[locale].metadata;

  return {
    title: localizedMetadata.title,
    description: localizedMetadata.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { en: "/en", ru: "/ru", "x-default": "/" },
    },
    openGraph: {
      title: localizedMetadata.title,
      description: localizedMetadata.description,
      locale: locale === "ru" ? "ru_RU" : "en_US",
      alternateLocale: locale === "ru" ? ["en_US"] : ["ru_RU"],
      type: "website",
    },
  };
}

export default async function LocaleHome({ params }: LocalePageProps) {
  const locale = requireLocale((await params).locale);
  const data = await getPortfolioView(locale);

  return (
    <main id="main-content" className="portfolio-shell">
      <HudPortfolio data={data} locale={locale} />
    </main>
  );
}
