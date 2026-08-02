import type { SupportedLocale } from "@/src/i18n/config";
import type { PortfolioView } from "@/src/content/types";
import { localizedUrl, siteConfig } from "./site";

type JsonLdNode = Record<string, unknown>;

function publicWebUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function createPortfolioJsonLd(
  data: PortfolioView,
  locale: SupportedLocale,
  siteUrl: URL,
) {
  const pageUrl = localizedUrl(siteUrl, locale);
  const personId = siteUrl.toString() + "#person";
  const sameAs = data.contacts
    .map((contact) => publicWebUrl(contact.url))
    .filter((url): url is string => Boolean(url));
  const email = data.contacts.find((contact) => contact.type === "email")?.value;

  const person: JsonLdNode = {
    "@type": "Person",
    "@id": personId,
    name: siteConfig.authorName,
    url: pageUrl,
    jobTitle: data.profile.role,
    description: data.profile.summary,
    knowsAbout: data.skills.map((skill) => skill.name),
    ...(sameAs.length ? { sameAs } : {}),
    ...(email ? { email } : {}),
  };

  const creativeWorks: JsonLdNode[] = data.projects.map((project) => {
    const liveUrl = publicWebUrl(project.liveUrl);
    const repositoryUrl = publicWebUrl(project.repositoryUrl);

    return {
      "@type": "CreativeWork",
      "@id": pageUrl + "#creative-work-" + encodeURIComponent(project.id),
      identifier: project.id,
      name: project.name,
      description: project.description,
      dateCreated: String(project.year),
      inLanguage: locale,
      keywords: project.tags,
      creator: { "@id": personId },
      mainEntityOfPage: pageUrl,
      ...(liveUrl ? { url: liveUrl } : {}),
      ...(repositoryUrl ? { sameAs: repositoryUrl } : {}),
    };
  });

  return {
    "@context": "https://schema.org",
    "@graph": [person, ...creativeWorks],
  };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
