import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HudPortfolio from "@/src/components/hudPortfolio";
import { getPortfolioView } from "@/src/content/data";
import { isSupportedLocale, locales, type SupportedLocale } from "@/src/i18n/config";
import { createPortfolioJsonLd, serializeJsonLd } from "@/src/seo/jsonLd";
import { createLocaleMetadata } from "@/src/seo/metadata";

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
  return createLocaleMetadata(locale);
}

export default async function LocaleHome({ params }: LocalePageProps) {
  const locale = requireLocale((await params).locale);
  const data = await getPortfolioView(locale);
  const jsonLd = createPortfolioJsonLd(data, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <main id="main-content" className="portfolio-shell">
        <HudPortfolio data={data} locale={locale} />
      </main>
    </>
  );
}
