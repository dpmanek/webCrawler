import { scrapeSanAntonio } from "./SpecificWebsiteScripts/SanAntonio.js";
import { scrapeTexasCity } from "./SpecificWebsiteScripts/TexasCity.js";

export async function scrapeData2() {
  console.log("🔍 Starting all scrapers...");

  const allScrapers = [
    { name: "SanAntonio", scraper: scrapeSanAntonio },
    { name: "TexasCity", scraper: scrapeTexasCity },
  ];

  for (const { name, scraper } of allScrapers) {
    try {
      console.log(`\n=== ${name} ===`);
      await scraper();
    } catch (err) {
      console.error(`Error scraping ${name}:`, err);
    }
  }

  console.log("\n✅ All scraping done.");
}
