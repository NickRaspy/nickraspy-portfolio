import assert from "node:assert/strict";
import test from "node:test";
import fallbackContent from "@/content/fallback/portfolio.json";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { createPortfolioView } from "@/src/content/view";
import type { PortfolioContent } from "@/src/content/types";
import { createPortfolioJsonLd, serializeJsonLd } from "./jsonLd";
import { createLocaleMetadata } from "./metadata";
import { resolveSiteUrl, siteConfig } from "./site";

function withTestSiteUrl<T>(callback: () => T): T {
  const originalSiteUrl = process.env.SITE_URL;
  process.env.SITE_URL = "https://portfolio.example";

  try {
    return callback();
  } finally {
    if (originalSiteUrl === undefined) {
      delete process.env.SITE_URL;
    } else {
      process.env.SITE_URL = originalSiteUrl;
    }
  }
}

test("resolves the canonical origin from deployment configuration", () => {
  assert.equal(
    resolveSiteUrl({ SITE_URL: "https://portfolio.example/path?preview=1" }).toString(),
    "https://portfolio.example/",
  );
  assert.equal(
    resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "portfolio.vercel.app" }).toString(),
    "https://portfolio.vercel.app/",
  );
  assert.throws(() => resolveSiteUrl({}), /canonical site origin/);
  assert.throws(() => resolveSiteUrl({ SITE_URL: "ftp://portfolio.example" }), /http/);
});

test("builds localized canonical, Open Graph and Twitter metadata", () => {
  const metadata = createLocaleMetadata("ru");

  assert.equal(metadata.alternates?.canonical, "/ru");
  assert.deepEqual(metadata.alternates?.languages, {
    en: "/en",
    ru: "/ru",
    "x-default": "/",
  });
  assert(metadata.openGraph && "type" in metadata.openGraph);
  assert.equal(metadata.openGraph.type, "website");
  assert.equal(metadata.openGraph.url, "/ru");
  assert.equal(metadata.openGraph.locale, "ru_RU");
  assert(metadata.twitter && "card" in metadata.twitter);
  assert.equal(metadata.twitter.card, "summary_large_image");
});

test("publishes only public localized pages in robots and sitemap", () => {
  withTestSiteUrl(() => {
    const robotsData = robots();
    const sitemapData = sitemap();
    const siteOrigin = siteConfig.url.origin;

    assert.deepEqual(robotsData.rules, {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    });
    assert.equal(robotsData.sitemap, `${siteOrigin}/sitemap.xml`);
    assert.deepEqual(
      sitemapData.map((entry) => entry.url),
      [`${siteOrigin}/en`, `${siteOrigin}/ru`],
    );
  });
});

test("builds Person and CreativeWork JSON-LD from published portfolio content", () => {
  const view = createPortfolioView(fallbackContent as PortfolioContent, "en");
  const jsonLd = withTestSiteUrl(() => createPortfolioJsonLd(view, "en"));
  const graph = jsonLd["@graph"] as Array<Record<string, unknown>>;
  const person = graph.find((node) => node["@type"] === "Person");
  const creativeWorks = graph.filter((node) => node["@type"] === "CreativeWork");

  assert.equal(person?.name, "Nickraspy");
  assert.equal(person?.jobTitle, view.profile.role);
  assert.deepEqual(person?.knowsAbout, view.skills.map((skill) => skill.name));
  assert.equal(creativeWorks.length, view.projects.length);
  assert.deepEqual(creativeWorks[0]?.creator, { "@id": person?.["@id"] });
});

test("serializes JSON-LD without allowing a closing script tag", () => {
  const serialized = serializeJsonLd({ value: "</script><script>alert(1)</script>" });

  assert.doesNotMatch(serialized, /</);
  assert.match(serialized, /\\u003c\/script>/);
});
