// import dotenv from "dotenv";
// import { scrapeData } from "./scripts/index.js";
// import { scrapeTexasCity } from './scripts/SpecificWebsiteScripts/TexasCity.js';
// import { scrapeData2 } from './scripts/ScrapeBidDataMain.js';

// // Load environment variables
// dotenv.config();

// // Run all scrapers
// await scrapeData2();

// // Run only the Texas City scraper
// await scrapeTexasCity();

import dotenv from 'dotenv';
import { scrapeAlvinTexas } from './scripts/SpecificWebsiteScripts/AlvinTexas.js';

// Load environment variables
dotenv.config();

// Run only the Alvin Texas scraper
await scrapeAlvinTexas();
