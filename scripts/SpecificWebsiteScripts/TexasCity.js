// scrapers/texascity.js
import puppeteer from "puppeteer";
import { saveToCSV } from "../utils/saveToCSV.js";

const BASE_URL = "https://www.texascitytx.gov";

export async function scrapeTexasCity() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  console.log("🕵️ Scraping bid list from Texas City...");
  await page.goto(`${BASE_URL}/Bids.aspx`, { waitUntil: "networkidle2" });

  const bids = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".listItemsRow.bid"));
    return rows.map((row) => {
      const titleEl = row.querySelector(".bidTitle a");
      const bidTitle = titleEl?.innerText.trim() || "N/A";
      const projectLink = titleEl?.getAttribute("href") || "";
      const bidNumber =
        row.querySelector("strong")?.nextSibling?.textContent?.trim() || "N/A";
      const descriptionSnippet =
        row.querySelector(".bidTitle span:nth-of-type(3)")?.innerText.trim() ||
        "N/A";
      const status =
        row
          .querySelector(".bidStatus div:nth-child(2) span:nth-child(1)")
          ?.innerText.trim() || "N/A";
      const closeDate =
        row
          .querySelector(".bidStatus div:nth-child(2) span:nth-child(2)")
          ?.innerText.trim() || "N/A";

      return {
        bidTitle,
        bidNumber,
        descriptionSnippet,
        status,
        closeDate,
        projectLink: projectLink.startsWith("http")
          ? projectLink
          : `https://www.texascitytx.gov/${projectLink}`,
      };
    });
  });

  console.log(`📄 Found ${bids.length} bids. Fetching details...`);
  await enrichBidDetails(bids, browser);

  await browser.close();

  const fields = [
    "bidTitle",
    "bidNumber",
    "descriptionSnippet",
    "status",
    "closeDate",
    "projectLink",
    "publicationDate",
    "closingDate",
    "descriptionFull",
    "relatedDocsLink",
    "contactName",
    "contactEmail",
    "deliveryAddress",
  ];
  saveToCSV(bids, "texascity_bids.csv", false, fields);
}

async function enrichBidDetails(bids, browser) {
  const page = await browser.newPage();

  for (const bid of bids) {
    try {
      console.log(`🔎 Scraping details for: ${bid.projectTitle}`);
      await page.goto(bid.projectLink, { waitUntil: "networkidle2" });

      const detail = await page.evaluate(() => {
        const getText = (selector) =>
          document.querySelector(selector)?.innerText.trim() || "N/A";

        const descriptionFull = Array.from(
          document.querySelectorAll(".fr-view p")
        )
          .map((p) => p.innerText.trim())
          .filter(Boolean)
          .join(" ");

        const publicationDate = getText("table span.BidDetail:nth-of-type(1)");
        const closingDate =
          document
            .querySelectorAll("table span.BidDetail")[1]
            ?.innerText.trim() || "N/A";

        const relatedDocsLink =
          document.querySelector("#viewRelatedDocs")?.href || "N/A";

        const fullText = document.querySelector(".fr-view")?.innerText || "";

        const matchEmail = fullText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
        const matchName = fullText.match(/Attn:\s+([^\n]+)/i);
        const deliveryAddressMatch = fullText.match(
          /The City of Texas City Purchasing Department([\s\S]*?)MARK ENVELOPE:/i
        );

        return {
          descriptionFull,
          publicationDate,
          closingDate,
          relatedDocsLink,
          contactEmail: matchEmail?.[0] || "N/A",
          contactName: matchName?.[1] || "N/A",
          deliveryAddress:
            deliveryAddressMatch?.[1]?.replace(/\s+/g, " ").trim() || "N/A",
        };
      });

      Object.assign(bid, detail);
    } catch (err) {
      console.error(`❌ Failed to scrape ${bid.projectLink}`, err);
    }
  }

  await page.close();
}
