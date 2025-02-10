import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { parse } from "json2csv";

/**
 * Function to save data to a CSV file
 * @param {Array} data - Array of objects to be saved
 * @param {string} filename - Name of the CSV file
 * @param {boolean} append - Whether to append to the existing file or overwrite it
 */
export function saveToCSV(data, filename = "data.csv", append = false) {
  if (!data || data.length === 0) {
    console.log("No data provided to save.");
    return;
  }

  const filePath = path.join(process.cwd(), filename);
  const csv = parse(data, { header: !append }); // Add headers only if not appending

  try {
    if (append && fs.existsSync(filePath)) {
      fs.appendFileSync(filePath, `\n${csv}`, "utf8");
    } else {
      fs.writeFileSync(filePath, csv, "utf8");
    }

    console.log(`Data successfully saved to ${filePath}`);
  } catch (error) {
    console.error("Error saving CSV file:", error);
  }
}

// Function to scrape the data for each bid
/**
 * Function to scrape the data for each bid
 * @param {Array} bids - Array of bid objects with projectLink property
 */
export async function scrapeBidDetails(bids) {
  const browser = await puppeteer.launch({ headless: false }); // Set to false for debugging
  const page = await browser.newPage();

  for (let bid of bids) {
    const { projectLink } = bid;

    try {
      console.log(`Processing bid: ${projectLink}`);
      await page.goto(projectLink, { waitUntil: "networkidle2" });

      // Scrape additional bid details
      const bidDetails = await page.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.innerText.trim() || "N/A";

        return {
          bidID: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"), // ID
          estimate: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"), // Estimate
          type: getText(".col-8.col-md-7.col-xl-8:nth-child(6)"), // Type
          owner: getText(".col-8.col-md-7.col-xl-8:nth-child(8)"), // Owner
          location: getText(".col-12.col-lg-6 .col-12"), // County and State
          scope:
            document
              .querySelector(".card-body div[ng-bind-html='project.Scope']")
              ?.innerText.trim() || "N/A", // Scope of work
          preBidDate: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"), // Pre-Bid Date
          preBidTime: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"), // Pre-Bid Time
          preBidLocation: getText(".col-8.col-md-7.col-xl-8:nth-child(6)"), // Pre-Bid Location
          bidDate: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"), // Actual Bid Date
          bidTime: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"), // Bid Time
          bidLocation: getText(".col-8.col-md-7.col-xl-8:nth-child(6)"), // Bid Location
          contactName: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"), // Contact Name
          contactPhone: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"), // Contact Phone
          contactEmail: getText(".col-8.col-md-7.col-xl-8:nth-child(8)"), // Contact Email
        };
      });

      // Merge new details into the bid object
      Object.assign(bid, bidDetails);

      console.log(`Scraped details for ${bid.projectName}`);
    } catch (error) {
      console.error(`Failed to scrape ${projectLink}:`, error);
    }
  }

  await browser.close();

  // Save updated data to CSV
  saveToCSV(bids, "detailed_bids.csv", false);
}

/**
 * Function to scrape data from the bids page of the website
 * @description This function is used to scrape data from https://www.civcastusa.com/bids, return the data from the table and first page of the website
 */
export async function scrapeData() {
  console.log("Scraping data from the website");

  const browser = await puppeteer.launch({ headless: false }); // Change to true for headless
  const page = await browser.newPage();

  // Note: this link can be updated to include other filters since the website uses query parameters for filtering
  // currently filtering for Name: wastewater and State: TX
  await page.goto(
    "https://www.civcastusa.com/bids?page=1&projectName=wastewater&timeInfo=0&state=TX&isReversed=true&orderBy=BidDate",
    { waitUntil: "networkidle2" }
  );

  // Scrape bid data
  const bids = await page.evaluate(() => {
    const bidElements = document.querySelectorAll(
      ".list-group-item[ng-repeat='project in projects track by $index']"
    );
    let results = [];

    bidElements.forEach((bid) => {
      const bidDate =
        bid
          .querySelector(".col-12.col-lg-2 span[data-ng-if='!project.IsTBA']")
          ?.innerText.trim() || "N/A";
      const state =
        bid.querySelector(".col-12.col-lg-1")?.innerText.trim() || "N/A";
      const county =
        bid
          .querySelector(".col-12.col-lg-2 span:nth-child(2)")
          ?.innerText.trim() || "N/A";
      const projectLinkElement = bid.querySelector("a");
      const projectName = projectLinkElement?.innerText.trim() || "N/A";
      const projectLink = projectLinkElement?.href || "N/A";

      results.push({ bidDate, state, county, projectName, projectLink });
    });

    return results;
  });

  console.log("Data scraped:", bids);
  console.log("Number of bids:", bids.length);

  await browser.close();

  // Save data to CSV file
  saveToCSV(bids, "bidsPage1.csv");

  // Scrape additional details for each bid
  scrapeBidDetails(bids);
}
