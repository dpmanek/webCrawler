import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.texascitytx.gov';

export async function scrapeTexasCity() {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	console.log('🕵️ Scraping bid list from Texas City...');
	await page.goto(`${BASE_URL}/Bids.aspx`, { waitUntil: 'networkidle2' });

	const bids = await page.evaluate(() => {
		const rows = Array.from(document.querySelectorAll('.listItemsRow.bid'));
		return rows.map((row) => {
			const titleEl = row.querySelector('.bidTitle a');
			const bidTitle = titleEl?.innerText.trim() || 'N/A';
			const projectLink = titleEl?.getAttribute('href') || '';
			const bidNumber =
				row.querySelector('strong')?.nextSibling?.textContent?.trim() || 'N/A';
			const descriptionSnippet =
				row.querySelector('.bidTitle span:nth-of-type(3)')?.innerText.trim() ||
				'N/A';
			const status =
				row
					.querySelector('.bidStatus div:nth-child(2) span:nth-child(1)')
					?.innerText.trim() || 'N/A';
			const closeDate =
				row
					.querySelector('.bidStatus div:nth-child(2) span:nth-child(2)')
					?.innerText.trim() || 'N/A';

			return {
				bidTitle,
				bidNumber,
				descriptionSnippet,
				status,
				closeDate,
				projectLink: projectLink.startsWith('http')
					? projectLink
					: `https://www.texascitytx.gov/${projectLink}`,
			};
		});
	});

	// If no bids found from the list, try to get a specific bid we know exists
	if (bids.length === 0) {
		console.log('No bids found in list, trying to get a specific bid...');
		await page.goto(`${BASE_URL}/bids.aspx?bidID=64`, {
			waitUntil: 'networkidle2',
		});

		const singleBid = await page.evaluate(() => {
			// Get bid details from the table
			const getTableValue = (label) => {
				const rows = document.querySelectorAll(
					"table[summary='Bid details'] tr"
				);
				for (const row of rows) {
					const cells = row.querySelectorAll('td');
					if (cells.length >= 2 && cells[0].textContent.includes(label)) {
						return cells[1].textContent.trim();
					}
				}
				return 'N/A';
			};

			const bidTitle = getTableValue('Bid Title');
			const bidNumber = getTableValue('Bid Number');
			const status = getTableValue('Status');

			// Get description
			const descriptionEl = document.querySelector('.fr-view');
			const descriptionText = descriptionEl?.textContent.trim() || 'N/A';
			const descriptionSnippet = descriptionText; // Use full description instead of truncated

			return {
				bidTitle,
				bidNumber,
				descriptionSnippet,
				status,
				closeDate: 'N/A',
				projectLink: window.location.href,
			};
		});

		if (singleBid.bidTitle !== 'N/A') {
			bids.push(singleBid);
		}
	}

	console.log(`📄 Found ${bids.length} bids. Fetching details...`);
	await enrichBidDetails(bids, browser);

	await browser.close();

	const fields = [
		'bidTitle',
		'bidNumber',
		'descriptionSnippet',
		'status',
		'closeDate',
		'projectLink',
		'publicationDate',
		'closingDate',
		'descriptionFull',
		'relatedDocsLink',
		'contactName',
		'contactEmail',
		'deliveryAddress',
	];
	saveToCSV(bids, 'texascity_bids.csv', false, fields);
}

async function enrichBidDetails(bids, browser) {
	const page = await browser.newPage();

	for (const bid of bids) {
		try {
			console.log(`🔎 Scraping details for: ${bid.bidTitle || 'Unknown bid'}`);
			await page.goto(bid.projectLink, { waitUntil: 'networkidle2' });

			const detail = await page.evaluate(() => {
				// Get description from the fr-view section
				const descriptionEl = document.querySelector('.fr-view');
				const descriptionFull = descriptionEl
					? descriptionEl.innerText.trim()
					: 'N/A';

				// Get publication and closing dates
				let publicationDate = 'N/A';
				let closingDate = 'N/A';

				// Look for date information in tables
				const tables = document.querySelectorAll('table');
				for (const table of tables) {
					const rows = table.querySelectorAll('tr');
					for (const row of rows) {
						const cells = row.querySelectorAll('td');
						if (cells.length >= 2) {
							const label = cells[0].textContent.trim();
							if (label.includes('Publication Date')) {
								publicationDate = cells[1].textContent.trim();
							} else if (label.includes('Closing Date')) {
								closingDate = cells[1].textContent.trim();
							}
						}
					}
				}

				// Get related documents link
				const relatedDocsLink =
					document.querySelector('#viewRelatedDocs')?.href || 'N/A';

				// Extract contact information from description
				const fullText = descriptionFull;

				// Look for email addresses in the text
				const matchEmail = fullText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
				const contactEmail = matchEmail ? matchEmail[0] : 'N/A';

				// Look for contact names
				let contactName = 'N/A';
				if (fullText.includes('Coordinator')) {
					const coordinatorMatch = fullText.match(
						/([A-Z][a-z]+ [A-Z][a-z]+),? (?:Purchasing )?Coordinator/
					);
					if (coordinatorMatch) {
						contactName = coordinatorMatch[1];
					}
				} else if (fullText.includes('Attn:')) {
					const attnMatch = fullText.match(/Attn:\s+([^\n,]+)/i);
					if (attnMatch) {
						contactName = attnMatch[1].trim();
					}
				}

				// Look for delivery address
				let deliveryAddress = 'N/A';
				if (fullText.includes('located at')) {
					const addressMatch = fullText.match(
						/located at ([^,]+,[^,]+, [A-Z]{2} \d{5})/
					);
					if (addressMatch) {
						deliveryAddress = addressMatch[1].trim();
					}
				}

				return {
					descriptionFull,
					publicationDate,
					closingDate,
					relatedDocsLink,
					contactEmail,
					contactName,
					deliveryAddress,
				};
			});

			Object.assign(bid, detail);
		} catch (err) {
			console.error(`❌ Failed to scrape ${bid.projectLink}:`, err);
		}
	}

	await page.close();
}
