import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { saveToCSV } from '../utils/saveToCSV.js';

// Use stealth plugin
puppeteer.use(StealthPlugin());

export async function scrapeAnderson() {
	console.log('🔍 Starting Anderson County bid scraping...');

	const browser = await puppeteer.launch({
		headless: 'new',
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1280, height: 800 });

	const allBids = [];

	try {
		// Navigate to the Anderson County purchasing page
		const url = 'https://www.co.anderson.tx.us/page/anderson.CA.Purchasing';
		console.log(`📄 Navigating to: ${url}`);

		await page.goto(url, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for the page content to load
		await page.waitForSelector('body', { timeout: 10000 });

		console.log('📋 Extracting bid information from the page...');

		// Extract all bid information from the page
		const bidData = await page.evaluate(() => {
			const bids = [];
			let currentPeriod = '';

			// Look for the "Bids & RFP" section
			const bidsSection = document.querySelector('[id*="lblTitle_3"]');
			if (!bidsSection || !bidsSection.textContent.includes('Bids & RFP')) {
				return bids;
			}

			// Find the content area for bids
			const contentArea = bidsSection
				.closest('.accordion-item')
				.querySelector('.accordion-item-bd');
			if (!contentArea) {
				return bids;
			}

			// Get all elements in the content area
			const elements = contentArea.querySelectorAll('p, ul, li, a');

			elements.forEach((element) => {
				const text = element.textContent.trim();

				// Check if this is a period/date header
				if (
					element.tagName === 'P' &&
					text.match(
						/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|Annual Bids|Rebid/i
					)
				) {
					currentPeriod = text;
				}

				// Check if this is a bid link
				if (
					element.tagName === 'A' &&
					element.href &&
					element.href.includes('.pdf')
				) {
					const bidTitle = text;
					const bidLink = element.href;

					// Extract additional info from the link
					const fileName = bidLink.split('/').pop();

					if (bidTitle && bidLink) {
						bids.push({
							bidTitle: bidTitle,
							bidPeriod: currentPeriod || 'Unknown',
							bidType: 'PDF Document',
							organization: 'Anderson County',
							status: 'Available',
							bidLink: bidLink,
							fileName: fileName,
							issueDate: currentPeriod || '',
							closeDate: '',
							description: `${bidTitle} - ${currentPeriod}`,
							contactInfo:
								'Anderson County Auditor Office, 703 N. Mallard St., Ste. 110, Palestine, Texas 75801',
							notes: 'PDF document available for download',
						});
					}
				}
			});

			return bids;
		});

		console.log(`📋 Found ${bidData.length} bids on the page`);

		// Add each bid to our results
		bidData.forEach((bid, index) => {
			console.log(
				`✅ Processing bid ${index + 1}/${bidData.length}: ${bid.bidTitle}`
			);
			allBids.push(bid);
		});

		// Save to CSV
		if (allBids.length > 0) {
			const filename = 'anderson_bids.csv';
			await saveToCSV(allBids, filename);
			console.log(`💾 Saved ${allBids.length} bids to ${filename}`);
		} else {
			console.log('⚠️ No bids found to save');
		}
	} catch (error) {
		console.error('❌ Error during Anderson County scraping:', error);
		throw error;
	} finally {
		await browser.close();
		console.log('🔍 Anderson County scraping completed');
	}

	return allBids;
}
