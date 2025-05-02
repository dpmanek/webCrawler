import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.alvin-tx.gov';

export async function scrapeAlvinTexas() {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	console.log('🕵️ Scraping bid list from Alvin, Texas...');
	await page.goto(
		`${BASE_URL}/Bids.aspx?CatID=showStatus&txtSort=Category&showAllBids=on&Status=open`,
		{
			waitUntil: 'networkidle2',
			timeout: 60000,
		}
	);

	const bids = await page.evaluate(() => {
		const bidItems = [];
		// Get all bid categories
		const categories = document.querySelectorAll('.bidsHeader.listHeader');

		for (let category of categories) {
			const categoryName = category
				.querySelector('span:first-child')
				.innerText.trim();

			// Get all bids in this category
			let bidElement = category.nextElementSibling;
			while (bidElement && bidElement.classList.contains('listItemsRow')) {
				const titleEl = bidElement.querySelector('.bidTitle a');
				const bidTitle = titleEl?.innerText.trim() || 'N/A';
				const projectLink = titleEl?.getAttribute('href') || '';

				// Extract bid number
				const bidNumberEl = bidElement.querySelector(
					'.bidTitle span[style*="font-size:0.75em;"]'
				);
				const bidNumberText = bidNumberEl ? bidNumberEl.innerText.trim() : '';
				const bidNumber = bidNumberText.replace('Bid No.', '').trim();

				// Extract description snippet
				const descriptionEl = bidElement.querySelector(
					'.bidTitle span:nth-of-type(3)'
				);
				const descriptionSnippet = descriptionEl
					? descriptionEl.innerText.trim()
					: 'N/A';

				// Extract status and close date
				const statusDiv = bidElement.querySelector('.bidStatus');
				const statusSpan = statusDiv?.querySelector(
					'div:nth-child(2) span:nth-child(1)'
				);
				const status = statusSpan ? statusSpan.innerText.trim() : 'N/A';

				const closeDateSpan = statusDiv?.querySelector(
					'div:nth-child(2) span:nth-child(2)'
				);
				const closeDate = closeDateSpan
					? closeDateSpan.innerText.trim()
					: 'N/A';

				bidItems.push({
					bidTitle,
					bidNumber,
					category: categoryName,
					descriptionSnippet,
					status,
					closeDate,
					projectLink: projectLink.startsWith('http')
						? projectLink
						: `${window.location.origin}/${projectLink}`,
				});

				// Move to the next bid element
				bidElement = bidElement.nextElementSibling;
			}
		}

		return bidItems;
	});

	console.log(`📄 Found ${bids.length} bids. Fetching details...`);
	await enrichBidDetails(bids, browser);

	await browser.close();

	const fields = [
		'bidTitle',
		'bidNumber',
		'category',
		'status',
		'closeDate',
		'publicationDate',
		'closingDate',
		'bidOpeningInfo',
		'contactPerson',
		'descriptionFull',
		'qualifications',
		'relatedDocuments',
		'projectLink',
	];

	saveToCSV(bids, 'alvintexas_bids.csv', false, fields);
	console.log(`✅ Saved ${bids.length} bids to output/alvintexas_bids.csv`);
}

async function enrichBidDetails(bids, browser) {
	const page = await browser.newPage();

	for (const bid of bids) {
		try {
			console.log(`🔎 Scraping details for: ${bid.bidTitle || 'Unknown bid'}`);
			await page.goto(bid.projectLink, {
				waitUntil: 'networkidle2',
				timeout: 60000,
			});

			const detail = await page.evaluate(() => {
				// Extract the main description content (only the first part)
				const descriptionSection = document.querySelector('.fr-view');
				let descriptionFull = 'N/A';
				if (descriptionSection) {
					// Get only the first part of the description before the Publication Date/Time section
					const descriptionText = descriptionSection.innerText;
					const publicationIndex = descriptionText.indexOf(
						'Publication Date/Time:'
					);
					if (publicationIndex > 0) {
						descriptionFull = descriptionText
							.substring(0, publicationIndex)
							.trim();
					} else {
						descriptionFull = descriptionText.trim();
					}
				}

				// Function to extract specific sections from the bid details
				const extractSection = (sectionName) => {
					const rows = document.querySelectorAll('table tr');
					for (let i = 0; i < rows.length; i++) {
						const row = rows[i];
						const headerCell = row.querySelector('td:first-child');
						if (headerCell && headerCell.innerText.includes(sectionName)) {
							const valueCell = row.querySelector('td:nth-child(2)');
							if (valueCell) {
								return valueCell.innerText.trim();
							}
						}
					}
					return 'N/A';
				};

				// Extract specific fields
				const publicationDate = extractSection('Publication Date/Time');
				const publicationInfo = extractSection('Publication Information');
				const closingDate = extractSection('Closing Date/Time');
				const bidOpeningInfo = extractSection('Bid Opening Information');
				const contactPerson = extractSection('Contact Person');
				const preBidMeeting = extractSection('Pre-bid Meeting');

				// Get qualifications
				let qualifications = 'N/A';
				const qualificationsHeader = Array.from(
					document.querySelectorAll('td')
				).find((td) => td.innerText.includes('Qualifications:'));
				if (qualificationsHeader && qualificationsHeader.nextElementSibling) {
					qualifications =
						qualificationsHeader.nextElementSibling.innerText.trim();
				}

				// Get related documents
				const relatedDocsSection = document.querySelector('.relatedDocuments');
				let relatedDocuments = 'N/A';
				if (relatedDocsSection) {
					const links = Array.from(relatedDocsSection.querySelectorAll('a'));
					relatedDocuments = links.map((link) => {
						return {
							title: link.innerText.trim(),
							url: link.href,
						};
					});
					relatedDocuments = JSON.stringify(relatedDocuments);
				}

				return {
					descriptionFull,
					publicationDate,
					closingDate,
					bidOpeningInfo,
					contactPerson,
					qualifications,
					relatedDocuments,
				};
			});

			Object.assign(bid, detail);
		} catch (err) {
			console.error(`❌ Failed to scrape ${bid.projectLink}:`, err);
		}
	}

	await page.close();
}
