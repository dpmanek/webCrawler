import { scrapeSanAntonio } from './SpecificWebsiteScripts/SanAntonio.js';
import { scrapeTexasCity } from './SpecificWebsiteScripts/TexasCity.js';
import { scrapeAlvinTexas } from './SpecificWebsiteScripts/AlvinTexas.js';
import { scrapeLeagueCityTexas } from './SpecificWebsiteScripts/LeagueCity.js';
import { scrapeTomballISD } from './SpecificWebsiteScripts/TomballISD.js';
import { scrapeDaytonTexas } from './SpecificWebsiteScripts/DaytonTexas.js';
import { scrapeMontBelvieu } from './SpecificWebsiteScripts/MontBelvieu.js';
import { scrapeLakeJackson } from './SpecificWebsiteScripts/LakeJackson.js';
import { scrapeGalvestonTexas } from './SpecificWebsiteScripts/GalvestonTexas.js';
import { scrapeHuntsvilleTexas } from './SpecificWebsiteScripts/HuntsvilleTexas.js';
import { scrapeBrazosValley } from './SpecificWebsiteScripts/BrazosValley.js';
import { scrapeAnderson } from './SpecificWebsiteScripts/Anderson.js';
import { scrapeCleveland } from './SpecificWebsiteScripts/Cleveland.js';
import { scrapeWallerCounty } from './SpecificWebsiteScripts/WallerCounty.js';
import { scrapeBeltonTexas } from './SpecificWebsiteScripts/BeltonTexas.js';

export async function scrapeData2() {
	console.log('🔍 Starting all scrapers...');

	const allScrapers = [
		{ name: 'SanAntonio', scraper: scrapeSanAntonio },
		{ name: 'TexasCity', scraper: scrapeTexasCity },
		{ name: 'AlvinTexas', scraper: scrapeAlvinTexas },
		{ name: 'LeagueCity', scraper: scrapeLeagueCityTexas },
		{ name: 'TomballISD', scraper: scrapeTomballISD },
		{ name: 'DaytonTexas', scraper: scrapeDaytonTexas },
		{ name: 'MontBelvieu', scraper: scrapeMontBelvieu },
		{ name: 'LakeJackson', scraper: scrapeLakeJackson },
		{ name: 'GalvestonTexas', scraper: scrapeGalvestonTexas },
		{ name: 'HuntsvilleTexas', scraper: scrapeHuntsvilleTexas },
		{ name: 'BrazosValley', scraper: scrapeBrazosValley },
		{ name: 'Anderson', scraper: scrapeAnderson },
		{ name: 'Cleveland', scraper: scrapeCleveland },
		{ name: 'WallerCounty', scraper: scrapeWallerCounty },
		{ name: 'BeltonTexas', scraper: scrapeBeltonTexas },
	];

	for (const { name, scraper } of allScrapers) {
		try {
			console.log(`\n=== ${name} ===`);
			await scraper();
		} catch (err) {
			console.error(`Error scraping ${name}:`, err);
		}
	}

	console.log('\n All scraping done.');
}
