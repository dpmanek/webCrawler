import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

const BASE_URL = 'https://www.lakejackson-tx.gov';

export async function scrapeLakeJackson() {
	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});
	const page = await browser.newPage();

	// Set a realistic user agent and headers
	await page.setUserAgent(
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
	);
	await page.setExtraHTTPHeaders({
		Accept:
			'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.5',
		'Accept-Encoding': 'gzip, deflate',
		DNT: '1',
		Connection: 'keep-alive',
		'Upgrade-Insecure-Requests': '1',
	});

	console.log('🕵️ Scraping bid list from Lake Jackson, Texas...');
	await page.goto(
		`${BASE_URL}/Bids.aspx?CatID=All&txtSort=Category&showAllBids=&Status=`,
		{
			waitUntil: 'networkidle2',
			timeout: 30000,
		}
	);

	// Wait a bit more for dynamic content to load
	await new Promise((resolve) => setTimeout(resolve, 3000));

	const allBids = await page.evaluate(() => {
		const bidRows = [];

		// Look for bid items in the structure we see in the HTML
		const bidItems = document.querySelectorAll('.listItemsRow.bid');

		bidItems.forEach((bidItem) => {
			const titleElement = bidItem.querySelector('.bidTitle a');
			const bidNumberElement = bidItem.querySelector('.bidTitle');
			const statusElements = bidItem.querySelectorAll(
				'.bidStatus div:last-child span'
			);

			if (titleElement) {
				const bidTitle = titleElement.innerText.trim();
				const bidLink = titleElement.getAttribute('href');

				// Extract bid number from the description
				let bidNumber = 'N/A';
				if (bidNumberElement) {
					const bidText = bidNumberElement.innerText;
					const bidMatch = bidText.match(/Bid No\.\s*([^\s]+)/);
					if (bidMatch) {
						bidNumber = bidMatch[1];
					}
				}

				// Extract description (everything after the link)
				let description = 'N/A';
				if (bidNumberElement) {
					const fullText = bidNumberElement.innerText;
					const lines = fullText.split('\n');
					if (lines.length > 2) {
						description = lines.slice(2).join(' ').trim();
					}
				}

				// Extract status and closing date
				let status = 'Unknown';
				let closingDate = 'N/A';

				if (statusElements && statusElements.length >= 2) {
					status = statusElements[0].innerText.trim();
					closingDate = statusElements[1].innerText.trim();
				}

				bidRows.push({
					bidNumber,
					bidTitle,
					description,
					status,
					closingDate,
					bidLink: bidLink.startsWith('http')
						? bidLink
						: `${window.location.origin}/${bidLink}`,
				});
			}
		});

		return bidRows;
	});

	console.log(`📄 Found ${allBids.length} total bids.`);

	// Filter for open bids only
	const openBids = allBids.filter((bid) =>
		bid.status.toLowerCase().includes('open')
	);

	console.log(`📄 Found ${openBids.length} open bids. Fetching details...`);

	const results = [];

	for (const bid of openBids) {
		console.log(`🔎 Scraping details for: ${bid.bidTitle}`);

		try {
			await page.goto(bid.bidLink, {
				waitUntil: 'networkidle2',
				timeout: 30000,
			});

			const details = await page.evaluate(() => {
				// Helper function to clean text
				const cleanText = (text) => {
					return text
						.replace(/\n/g, ' ')
						.replace(/\r/g, ' ')
						.replace(/\t/g, ' ')
						.replace(/\s+/g, ' ')
						.replace(/"/g, "'")
						.trim();
				};

				// Initialize variables
				let bidNumber = 'N/A';
				let bidTitle = 'N/A';
				let category = 'N/A';
				let status = 'N/A';
				let publicationDate = 'N/A';
				let closingDate = 'N/A';
				let businessHours = 'N/A';
				let description = 'N/A';
				let relatedDocuments = 'N/A';

				// Look for the first table with basic bid info
				const firstTable = document.querySelector(
					'table[summary="Bid details"]'
				);
				if (firstTable) {
					const rows = firstTable.querySelectorAll('tr');

					rows.forEach((row) => {
						const cells = row.querySelectorAll('td');
						if (cells.length >= 2) {
							const labelElement = cells[0].querySelector('.BidDetail strong');
							const valueElement = cells[1].querySelector('.BidDetailSpec');

							if (labelElement && valueElement) {
								const label = labelElement.innerText.trim().replace(':', '');
								const value = valueElement.innerText.trim();

								// Match the exact labels from the HTML
								if (label === 'Bid Number') bidNumber = value;
								else if (label === 'Bid Title') bidTitle = value;
								else if (label === 'Category') category = value;
								else if (label === 'Status') status = value;
							}
						}
					});
				}

				// Look for the second table with detailed information
				const detailTable = document.querySelector(
					'table[summary="Bid Details"]'
				);
				if (detailTable) {
					const rows = detailTable.querySelectorAll('tr');

					for (let i = 0; i < rows.length; i++) {
						const row = rows[i];
						const headerCell = row.querySelector('td .BidListHeader');

						if (headerCell) {
							const headerText = headerCell.innerText.trim().replace(':', '');
							const nextRow = rows[i + 1];

							if (nextRow) {
								const contentCell = nextRow.querySelector('td .BidDetail');
								if (contentCell) {
									const content = contentCell.innerText.trim();

									if (headerText === 'Description') {
										description = content;
									} else if (headerText === 'Publication Date/Time') {
										publicationDate = content;
									} else if (headerText === 'Closing Date/Time') {
										closingDate = content;
									} else if (headerText === 'Business Hours') {
										businessHours = content;
									} else if (headerText === 'Related Documents') {
										// Extract document links
										const docLinks = [];
										const links = contentCell.querySelectorAll('a');
										links.forEach((link) => {
											const href = link.getAttribute('href');
											const text = link.innerText.trim();
											if (href && text) {
												const fullUrl = href.startsWith('http')
													? href
													: `${window.location.origin}${href}`;
												docLinks.push(`${text}: ${fullUrl}`);
											}
										});
										relatedDocuments = docLinks.length
											? docLinks.join('; ')
											: content;
									}
								}
							}
						}
					}
				}

				// Extract contact information from the full page content
				const fullText = document.body.innerText;
				const emailMatch = fullText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g);
				const contactEmail = emailMatch ? emailMatch.join(', ') : 'N/A';

				// Extract address patterns specific to Lake Jackson
				const addressPatterns = [
					/25\s+Oak\s+Drive[^,]*Lake\s+Jackson[^,]*Texas\s*\d{5}/gi,
					/P\.?O\.?\s+Box\s+\d+[^,]*Lake\s+Jackson[^,]*Texas\s*\d{5}/gi,
				];
				let contactAddress = 'N/A';
				for (const pattern of addressPatterns) {
					const match = fullText.match(pattern);
					if (match) {
						contactAddress = match[0].trim();
						break;
					}
				}

				// Look for download links in the page
				const downloadLinks = [];
				const links = document.querySelectorAll('a');
				links.forEach((link) => {
					const href = link.getAttribute('href');
					const text = link.innerText.toLowerCase();
					if (
						href &&
						(text.includes('civcastusa') ||
							text.includes('download') ||
							text.includes('document') ||
							href.includes('.pdf') ||
							href.includes('/DocumentCenter/'))
					) {
						const fullUrl = href.startsWith('http')
							? href
							: `${window.location.origin}${href}`;
						downloadLinks.push(fullUrl);
					}
				});

				return {
					bidNumber: cleanText(bidNumber),
					bidTitle: cleanText(bidTitle),
					category: cleanText(category),
					status: cleanText(status),
					publicationDate: cleanText(publicationDate),
					closingDate: cleanText(closingDate),
					businessHours: cleanText(businessHours),
					description: cleanText(description),
					relatedDocuments: cleanText(relatedDocuments),
					contactEmail: cleanText(contactEmail),
					contactAddress: cleanText(contactAddress),
					downloadLink: downloadLinks.length ? downloadLinks.join(', ') : 'N/A',
				};
			});

			// Combine bid info with details
			results.push({
				...bid,
				...details,
			});
		} catch (err) {
			console.error(`❌ Failed to scrape ${bid.bidLink}:`, err.message);
			// Add the bid with basic info even if detail scraping fails
			results.push({
				...bid,
				category: 'N/A',
				publicationDate: 'N/A',
				businessHours: 'N/A',
				relatedDocuments: 'N/A',
				contactEmail: 'N/A',
				contactAddress: 'N/A',
				downloadLink: 'N/A',
			});
		}
	}

	await browser.close();

	const fields = [
		'bidNumber',
		'bidTitle',
		'description',
		'status',
		'closingDate',
		'category',
		'publicationDate',
		'businessHours',
		'relatedDocuments',
		'contactEmail',
		'contactAddress',
		'downloadLink',
		'bidLink',
	];

	// Ensure all bids have all fields
	for (const bid of results) {
		for (const field of fields) {
			if (bid[field] === undefined) {
				bid[field] = 'N/A';
			}
		}
	}

	saveToCSV(results, 'lake_jackson_bids.csv', false, fields);

	console.log(
		`✅ Successfully scraped ${results.length} bids from Lake Jackson, Texas`
	);
	return results;
}
