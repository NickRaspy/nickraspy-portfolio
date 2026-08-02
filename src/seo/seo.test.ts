import assert from "node:assert/strict";
import test from "node:test";
import fallbackContent from "@/content/fallback/portfolio.json";
import { createRobots } from "@/app/robots";
import { createSitemap } from "@/app/sitemap";
import { createPortfolioView } from "@/src/content/view";
import type { PortfolioContent } from "@/src/content/types";
import { createPortfolioJsonLd, serializeJsonLd } from "./jsonLd";
import { createLocaleMetadata } from "./metadata";
import { resolveSiteUrl } from "./site";

test("resolves the canonical origin from overrides, request headers and Vercel", () => {
  assert.equal(
    resolveSiteUrl(
      { SITE_URL: "https://portfolio.example/path?preview=1" },
      new Headers({ host: "request.example", "x-forwarded-proto": "https" }),
    ).toString(),
    "https://request.example/",
  );
  assert.equal(
    resolveSiteUrl({ SITE_URL: "https://portfolio.example/path?preview=1" }).toString(),
    "https://portfolio.example/",
  );
  assert.equal(
    resolveSiteUrl({}, new Headers({ host: "localhost:3000" })).toString(),
    "http://localhost:3000/",
  );
  assert.equal(
    resolveSiteUrl(
      {},
      new Headers({
        host: "internal:3000",
        "x-forwarded-host": "portfolio.example",
        "x-forwarded-proto": "https",
      }),
    ).toString(),
    "https://portfolio.example/",
  );
  assert.equal(
    resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "portfolio.vercel.app" }).toString(),
    "https://portfolio.vercel.app/",
  );
  assert.throws(() => resolveSiteUrl({}), /canonical site origin/);
  assert.throws(() => resolveSiteUrl({ SITE_URL: "ftp://portfolio.example" }), /http/);
  assert.throws(
    () => resolveSiteUrl({}, new Headers({ host: "portfolio.example/path" })),
    /host is invalid/,
  );
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
  const siteUrl = new URL("https://portfolio.example");
  const robotsData = createRobots(siteUrl);
  const sitemapData = createSitemap(siteUrl);

  assert.deepEqual(robotsData.rules, {
    userAgent: "*",
    allow: "/",
    disallow: ["/admin", "/api"],
  });
  assert.equal(robotsData.sitemap, "https://portfolio.example/sitemap.xml");
  assert.deepEqual(
    sitemapData.map((entry) => entry.url),
    ["https://portfolio.example/en", "https://portfolio.example/ru"],
  );
});

test("builds Person and CreativeWork JSON-LD from published portfolio content", () => {
  const view = createPortfolioView(fallbackContent as PortfolioContent, "en");
  const jsonLd = createPortfolioJsonLd(view, "en", new URL("https://portfolio.example"));
  const graph = jsonLd["@graph"] as Array<Record<string, unknown>>;
  const person = graph.find((node) => node["@type"] === "Person");
  const creativeWorks = graph.filter((node) => node["@type"] === "CreativeWork");

  assert.equal(person?.name, "Nickraspy");
  assert.equal(person?.url, "https://portfolio.example/en");
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
