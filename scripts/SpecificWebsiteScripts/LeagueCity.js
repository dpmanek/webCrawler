// import puppeteer from 'puppeteer';
// import { saveToCSV } from '../utils/saveToCSV.js';

// const BASE_URL = 'https://www.leaguecitytx.gov';

// export async function scrapeLeagueCityTexas() {
// 	const browser = await puppeteer.launch({ headless: true });
// 	const page = await browser.newPage();

// 	console.log('🕵️ Scraping bid list from League City, Texas...');
// 	await page.goto(`${BASE_URL}/Bids.aspx`, {
// 		waitUntil: 'networkidle2',
// 		timeout: 60000,
// 	});

// 	const bids = await page.evaluate(() => {
// 		const bidRows = document.querySelectorAll('.listItemsRow');
// 		const bidItems = [];

// 		bidRows.forEach((row) => {
// 			const titleEl = row.querySelector('.bidTitle a');
// 			const bidTitle = titleEl?.innerText.trim() || 'N/A';
// 			const projectLink = titleEl?.getAttribute('href') || '';
// 			const bidNumberEl = row.querySelector('.bidTitle span[style*="0.75em"]');
// 			const bidNumber =
// 				bidNumberEl?.innerText.replace('Bid No.', '').trim() || 'N/A';
// 			const descriptionSnippetEl = row.querySelector(
// 				'.bidTitle span:nth-of-type(3)'
// 			);
// 			const descriptionSnippet =
// 				descriptionSnippetEl?.innerText.trim() || 'N/A';
// 			const status =
// 				row.querySelector('.bidStatus span')?.innerText.trim() || 'N/A';
// 			const closeDate =
// 				row.querySelector('.bidStatus span:nth-child(2)')?.innerText.trim() ||
// 				'N/A';

// 			bidItems.push({
// 				bidTitle,
// 				bidNumber,
// 				category: 'Purchasing Dept Bids',
// 				descriptionSnippet,
// 				status,
// 				closeDate,
// 				projectLink: projectLink.startsWith('http')
// 					? projectLink
// 					: `${window.location.origin}/${projectLink}`,
// 			});
// 		});

// 		return bidItems;
// 	});

// 	console.log(`📄 Found ${bids.length} bids. Fetching details...`);
// 	await enrichBidDetails(bids, browser);

// 	await browser.close();

// 	const fields = [
// 		'bidTitle',
// 		'bidNumber',
// 		'category',
// 		'status',
// 		'closeDate',
// 		'publicationDate',
// 		'closingDate',
// 		'bidOpeningInfo',
// 		'contactPerson',
// 		'descriptionFull',
// 		'qualifications',
// 		'relatedDocuments',
// 		'projectLink',
// 	];

// 	saveToCSV(bids, 'leaguecity_bids.csv', false, fields);
// 	console.log(`✅ Saved ${bids.length} bids to output/leaguecity_bids.csv`);
// }

// async function enrichBidDetails(bids, browser) {
// 	const page = await browser.newPage();

// 	for (const bid of bids) {
// 		try {
// 			console.log(`🔎 Scraping details for: ${bid.bidTitle || 'Unknown bid'}`);
// 			await page.goto(bid.projectLink, {
// 				waitUntil: 'networkidle2',
// 				timeout: 60000,
// 			});

// 			const detail = await page.evaluate(() => {
// 				const descriptionSection = document.querySelector('.fr-view');
// 				let descriptionFull = 'N/A';
// 				if (descriptionSection) {
// 					const descriptionText = descriptionSection.innerText;
// 					const publicationIndex = descriptionText.indexOf(
// 						'Publication Date/Time:'
// 					);
// 					if (publicationIndex > 0) {
// 						descriptionFull = descriptionText
// 							.substring(0, publicationIndex)
// 							.trim();
// 					} else {
// 						descriptionFull = descriptionText.trim();
// 					}
// 				}

// 				const extractSection = (sectionName) => {
// 					const rows = document.querySelectorAll('table tr');
// 					for (let row of rows) {
// 						const headerCell = row.querySelector('td:first-child');
// 						if (headerCell && headerCell.innerText.includes(sectionName)) {
// 							const valueCell = row.querySelector('td:nth-child(2)');
// 							return valueCell?.innerText.trim() || 'N/A';
// 						}
// 					}
// 					return 'N/A';
// 				};

// 				const publicationDate = extractSection('Publication Date/Time');
// 				const closingDate = extractSection('Closing Date/Time');
// 				const bidOpeningInfo = 'N/A';
// 				const contactPerson = 'purchasing@leaguecitytx.gov';
// 				const qualifications = 'Bid Security of 5% is required';
// 				const relatedDocsSection = document.querySelector('#viewRelatedDocs');
// 				let relatedDocuments = 'N/A';
// 				if (relatedDocsSection) {
// 					relatedDocuments = JSON.stringify([
// 						{
// 							title: 'View Document(s)',
// 							url: relatedDocsSection.href,
// 						},
// 					]);
// 				}

// 				return {
// 					descriptionFull,
// 					publicationDate,
// 					closingDate,
// 					bidOpeningInfo,
// 					contactPerson,
// 					qualifications,
// 					relatedDocuments,
// 				};
// 			});

// 			Object.assign(bid, detail);
// 		} catch (err) {
// 			console.error(`❌ Failed to scrape ${bid.projectLink}:`, err);
// 		}
// 	}

// 	await page.close();
// }

import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

const BASE_URL = 'https://www.leaguecitytx.gov';

export async function scrapeLeagueCityTexas() {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	console.log('🕵️ Scraping bid list from League City, Texas...');
	await page.goto(`${BASE_URL}/Bids.aspx`, {
		waitUntil: 'networkidle2',
		timeout: 60000,
	});

	const bids = await page.evaluate(() => {
		const bidRows = document.querySelectorAll('.listItemsRow');
		const bidItems = [];

		bidRows.forEach((row) => {
			const titleEl = row.querySelector('.bidTitle a');
			const bidTitle = titleEl?.innerText.trim() || 'N/A';
			const projectLink = titleEl?.getAttribute('href') || '';
			const bidNumberEl = row.querySelector('.bidTitle span[style*="0.75em"]');
			const bidNumber =
				bidNumberEl?.innerText.replace('Bid No.', '').trim() || 'N/A';
			const descriptionSnippetEl = row.querySelector('.bidTitle');
			const descriptionSnippet =
				descriptionSnippetEl?.innerText.split('\n')[2]?.trim() || 'N/A';
			// Extract status properly
			const statusEl = row.querySelector('.bidStatus span');
			let status = 'Open'; // Default to Open based on the HTML structure
			if (statusEl) {
				const statusText = statusEl.innerText.trim();
				if (statusText.includes('Status:')) {
					status = statusText.replace('Status:', '').trim();
					if (!status) status = 'Open'; // If empty after removing prefix, use default
				} else if (statusText) {
					status = statusText;
				}
			}

			// Extract close date properly
			const closeDateEl = row.querySelector('.bidStatus span:nth-child(2)');
			const closeDate = closeDateEl ? closeDateEl.innerText.trim() : 'N/A';

			bidItems.push({
				bidTitle,
				bidNumber,
				category: 'Purchasing Dept Bids',
				descriptionSnippet,
				status,
				closeDate,
				projectLink: projectLink.startsWith('http')
					? projectLink
					: `${window.location.origin}/${projectLink}`,
			});
		});

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

	saveToCSV(bids, 'leaguecity_bids.csv', false, fields);
	console.log(`✅ Saved ${bids.length} bids to output/leaguecity_bids.csv`);
}

async function enrichBidDetails(bids, browser) {
	const page = await browser.newPage();

	for (const bid of bids) {
		try {
			console.log(`🔎 Scraping details for: ${bid.bidTitle}`);
			await page.goto(bid.projectLink, {
				waitUntil: 'networkidle2',
				timeout: 60000,
			});

			const detail = await page.evaluate(() => {
				// Extract the main description content - clean up the description
				const descriptionSection = document.querySelector('.fr-view');
				let descriptionFull = 'N/A';
				if (descriptionSection) {
					// Get the description text
					let descriptionText = descriptionSection.innerText.trim();

					// Remove the "Description:" header if present
					if (descriptionText.startsWith('Description:')) {
						descriptionText = descriptionText
							.substring('Description:'.length)
							.trim();
					}

					// Remove everything after "Publication Date/Time:" if present
					const publicationIndex = descriptionText.indexOf(
						'Publication Date/Time:'
					);
					if (publicationIndex > 0) {
						descriptionText = descriptionText
							.substring(0, publicationIndex)
							.trim();
					}

					descriptionFull = descriptionText;
				}

				// Extract publication date and closing date from the page
				let publicationDate = 'N/A';
				let closingDate = 'N/A';

				// Try multiple approaches to find the dates
				// Approach 1: Look for spans with BidDetail class after BidListHeader
				const dateHeaders = document.querySelectorAll('span.BidListHeader');
				for (const header of dateHeaders) {
					const headerText = header.innerText.trim();
					if (headerText === 'Publication Date/Time:') {
						// Find the next BidDetail span
						const parentRow = header.closest('tr');
						if (parentRow && parentRow.nextElementSibling) {
							const detailSpan =
								parentRow.nextElementSibling.querySelector('span.BidDetail');
							if (detailSpan) {
								publicationDate = detailSpan.innerText.trim();
							}
						}
					} else if (headerText === 'Closing Date/Time:') {
						// Find the next BidDetail span
						const parentRow = header.closest('tr');
						if (parentRow && parentRow.nextElementSibling) {
							const detailSpan =
								parentRow.nextElementSibling.querySelector('span.BidDetail');
							if (detailSpan) {
								closingDate = detailSpan.innerText.trim();
							}
						}
					}
				}

				// Approach 2: Direct lookup of BidDetail spans
				if (publicationDate === 'N/A' || closingDate === 'N/A') {
					const allBidDetails = document.querySelectorAll('span.BidDetail');
					for (const detail of allBidDetails) {
						const text = detail.innerText.trim();
						// Check if this looks like a date (contains numbers and /)
						if (text.match(/\d+\/\d+\/\d+/)) {
							// Check if we can determine which date this is
							const prevElement = detail.parentElement.previousElementSibling;
							if (prevElement) {
								const headerText = prevElement.innerText.trim();
								if (headerText.includes('Publication Date/Time')) {
									publicationDate = text;
								} else if (headerText.includes('Closing Date/Time')) {
									closingDate = text;
								}
							}
						}
					}
				}
				const relatedDocBtn = document.querySelector('#viewRelatedDocs');
				const relatedDocuments = relatedDocBtn
					? JSON.stringify([
							{ title: 'View Document(s)', url: relatedDocBtn.href },
					  ])
					: 'N/A';

				return {
					descriptionFull,
					publicationDate,
					closingDate,
					bidOpeningInfo: 'N/A',
					contactPerson: 'purchasing@leaguecitytx.gov',
					qualifications: 'Bid Security of 5% is required',
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
