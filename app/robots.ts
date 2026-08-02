import type { MetadataRoute } from "next";
import { getRequestSiteUrl } from "@/src/seo/requestSiteUrl";
import { absoluteUrl } from "@/src/seo/site";

export function createRobots(siteUrl: URL): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: absoluteUrl(siteUrl, "/sitemap.xml"),
    host: siteUrl.origin,
  };
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  return createRobots(await getRequestSiteUrl());
}
