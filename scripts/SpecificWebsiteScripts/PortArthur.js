import puppeteer from "puppeteer";
import { saveToCSV } from "../utils/saveToCSV.js";

const BASE_URL = "https://www.portarthurtx.gov";

export async function scrapePortArthurt() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log("🕵️ Navigating to bid listing page...");
  await page.goto(`${BASE_URL}/bids.aspx`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  const bids = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll(".listItemsRow.bid"));
    return rows.map((row) => {
      const link = row.querySelector(".bidTitle a");
      const title = link?.innerText.trim();
      const href = link?.getAttribute("href");
      const bidNumber = row
        .querySelector(".bidTitle strong")
        ?.nextSibling?.textContent.trim();
      const status = row
        .querySelector(".bidStatus div:nth-child(2) span:first-child")
        ?.innerText.trim();
      const closeDate = row
        .querySelector(".bidStatus div:nth-child(2) span:nth-child(2)")
        ?.innerText.trim();

      return {
        title,
        bidNumber,
        status,
        closeDate,
        detailUrl: href ? new URL(href, window.location.origin).href : null,
      };
    });
  });

  console.log(`🔍 Found ${bids.length} bids. Fetching detail pages...`);

  // Visit each detail page and collect more info
  for (const bid of bids) {
    if (!bid.detailUrl) continue;

    await page.goto(bid.detailUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const detail = await page.evaluate((BASE_URL) => {
      const getText = (sel) =>
        document.querySelector(sel)?.innerText.trim() || "N/A";
      const getAllPDFs = () =>
        Array.from(document.querySelectorAll(".relatedDocuments a")).map(
          (a) => ({
            name: a.innerText.trim(),
            url: a.href.startsWith("http")
              ? a.href
              : `${BASE_URL}${a.getAttribute("href")}`,
          })
        );

      return {
        publicationDate: getText("span.BidDetail:nth-of-type(1)"),
        closingDate: getText("span.BidDetail:nth-of-type(2)"),
        contactPerson: getText("span.BidDetail:nth-of-type(4)"),
        documents: getAllPDFs(),
      };
    }, BASE_URL);

    Object.assign(bid, detail);
  }

  const flatBids = bids.map((b) => ({
    Title: b.title,
    BidNumber: b.bidNumber,
    Status: b.status,
    Closes: b.closingDate,
    PublicationDate: b.publicationDate,
    ContactPerson: b.contactPerson,
    RelatedDocs: b.documents.map((d) => `${d.name} - ${d.url}`).join(" | "),
  }));

  console.log("✅ Saving to CSV...");
  saveToCSV(flatBids, "port_arthur_bids.csv", false, [
    "Title",
    "BidNumber",
    "Status",
    "Closes",
    "PublicationDate",
    "ContactPerson",
    "RelatedDocs",
  ]);

  await browser.close();
}
