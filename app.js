import dotenv from "dotenv";
import { scrapeData } from "./scripts/index.js";

// Load environment variables
dotenv.config();

// Runnnig test script to scrape data from the website
await scrapeData();
