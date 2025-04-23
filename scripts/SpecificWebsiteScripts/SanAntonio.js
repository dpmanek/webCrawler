// scrapers/civcast.js
import puppeteer from "puppeteer";
import { saveToCSV } from "../utils/saveToCSV.js";

export async function scrapeSanAntonio() {
  console.log("Scraping CivCast...");

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    "https://www.civcastusa.com/bids?page=1&projectName=wastewater&timeInfo=0&state=TX&isReversed=true&orderBy=BidDate",
    { waitUntil: "networkidle2" }
  );

  const bids = await page.evaluate(() => {
    const bidElements = document.querySelectorAll(
      '.list-group-item[ng-repeat="project in projects track by $index"]'
    );
    let results = [];

    bidElements.forEach((bid) => {
      const bidDateElement = bid.querySelector(".col-12.col-lg-2");
      const bidDate =
        bidDateElement?.querySelector("span:nth-child(2)")?.innerText.trim() ||
        "N/A";
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

  console.log(`Found ${bids.length} bids.`);

  await page.close();
  await enrichWithBidDetails(bids, browser);
  await browser.close();

  const detailedFields = [
    "county",
    "state",
    "bidDate",
    "projectName",
    "projectLink",
    "bidID",
    "estimate",
    "type",
    "owner",
    "location",
    "scope",
    "preBidDate",
    "preBidTime",
    "preBidLocation",
    "bidTime",
    "bidLocation",
    "contactName",
    "contactPhone",
    "contactEmail",
  ];
  saveToCSV(bids, "output/civcast_detailed_bids.csv", false, detailedFields);

  return bids;
}

// Helper to scrape additional data from detail pages
async function enrichWithBidDetails(bids, browser) {
  const page = await browser.newPage();

  for (let bid of bids) {
    try {
      console.log(`Scraping details for: ${bid.projectLink}`);
      await page.goto(bid.projectLink, { waitUntil: "networkidle2" });

      const bidDetails = await page.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.innerText.trim() || "N/A";

        return {
          bidID: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"),
          estimate: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"),
          type: getText(".col-8.col-md-7.col-xl-8:nth-child(6)"),
          owner: getText(".col-8.col-md-7.col-xl-8:nth-child(8)"),
          location: getText(".col-12.col-lg-6 .col-12"),
          scope:
            document
              .querySelector('[ng-bind-html="project.Scope"]')
              ?.innerText.trim() || "N/A",
          preBidDate: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"),
          preBidTime: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"),
          preBidLocation: getText(".col-8.col-md-7.col-xl-8:nth-child(6)"),
          bidTime: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"),
          bidLocation: getText(".col-8.col-md-7.col-xl-8:nth-child(6)"),
          contactName: getText(".col-8.col-md-7.col-xl-8:nth-child(2)"),
          contactPhone: getText(".col-8.col-md-7.col-xl-8:nth-child(4)"),
          contactEmail: getText(".col-8.col-md-7.col-xl-8:nth-child(8)"),
        };
      });

      Object.assign(bid, bidDetails);
    } catch (err) {
      console.error(`❌ Failed to scrape ${bid.projectLink}`, err);
    }
  }

  await page.close();
}
