import { unstable_cache } from "next/cache";
import { getPublishedContent } from "./repository";
import { createPortfolioView } from "./view";

const getCachedContent = unstable_cache(getPublishedContent, ["portfolio-content"], {
  tags: ["portfolio-data"],
  revalidate: 3600,
});

export async function getPortfolioView(locale?: string) {
  return createPortfolioView(await getCachedContent(), locale);
}
