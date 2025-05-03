import { scrapeSanAntonio } from "./SpecificWebsiteScripts/SanAntonio.js";
import { scrapeTexasCity } from "./SpecificWebsiteScripts/TexasCity.js";
import { scrapeAlvinTexas } from "./SpecificWebsiteScripts/AlvinTexas.js";
import { scrapeLeagueCityTexas } from "./SpecificWebsiteScripts/LeagueCity.js";
import { scrapeBrazosValley } from "./SpecificWebsiteScripts/BrazosValley.js";
import { scrapePortArthurt } from "./SpecificWebsiteScripts/PortArthur.js";

export async function scrapeData2() {
  console.log("Starting all scrapers...");

  const allScrapers = [
    // { name: "SanAntonio", scraper: scrapeSanAntonio },
    // { name: "TexasCity", scraper: scrapeTexasCity },
    // { name: "AlvinTexas", scraper: scrapeAlvinTexas },
    // { name: "LeagueCity", scraper: scrapeLeagueCityTexas },
    // { name: "BrazosValley", scraper: scrapeBrazosValley },
    { name: "PortArthurt", scraper: scrapePortArthurt },
  ];

  for (const { name, scraper } of allScrapers) {
    try {
      console.log(`\n=== ${name} ===`);
      await scraper();
    } catch (err) {
      console.error(`Error scraping ${name}:`, err);
    }
  }

  console.log("\n All scraping done.");
}
