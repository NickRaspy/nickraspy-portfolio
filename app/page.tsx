import HudPortfolio from "@/src/components/hudPortfolio";
import { getPortfolioView } from "@/src/content/data";

export default async function Home() {
  const data = await getPortfolioView();
  return (
    <main className="portfolio-shell">
        <HudPortfolio data={data} />
    </main>
  );
}
