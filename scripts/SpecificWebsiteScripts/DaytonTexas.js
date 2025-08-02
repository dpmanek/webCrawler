import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

const BASE_URL = 'https://www.cityofdaytontx.com';

export async function scrapeDaytonTexas() {
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

	console.log('🕵️ Scraping bid list from City of Dayton, Texas...');
	await page.goto(`${BASE_URL}/business/bid-opportunities`, {
		waitUntil: 'networkidle2',
		timeout: 30000,
	});

	// Wait a bit more for dynamic content to load
	await new Promise((resolve) => setTimeout(resolve, 3000));

	const allBids = await page.$$eval('table tbody tr', (rows) =>
		rows
			.map((row) => {
				const cells = row.querySelectorAll('td');
				if (cells.length < 5) return null;

				// Based on the table structure: RFP NUMBER, TITLE, STARTING, CLOSING, STATUS
				const rfpNumberCell = cells[0];
				const titleCell = cells[1];
				const startingCell = cells[2];
				const closingCell = cells[3];
				const statusCell = cells[4];

				const titleAnchor = titleCell.querySelector('a');
				const status = statusCell?.innerText.trim();

				return {
					rfpNumber: rfpNumberCell?.innerText.trim() || 'N/A',
					bidTitle:
						titleAnchor?.innerText.trim() ||
						titleCell?.innerText.trim() ||
						'N/A',
					startingDate: startingCell?.innerText.trim() || 'N/A',
					closingDate: closingCell?.innerText.trim() || 'N/A',
					status: status,
					projectLink: titleAnchor?.getAttribute('href') || '',
				};
			})
			.filter(Boolean)
	);

	const openBids = allBids.filter((bid) => bid.status === 'Open');

	console.log(
		`📄 Found ${allBids.length} total bids, ${openBids.length} are open. Fetching details for open bids...`
	);

	const results = [];

	for (const bid of openBids) {
		const detailPage = `${BASE_URL}${bid.projectLink}`;
		console.log(`🔎 Scraping details for: ${bid.bidTitle}`);

		try {
			await page.goto(detailPage, {
				waitUntil: 'networkidle2',
				timeout: 30000,
			});

			const details = await page.evaluate(() => {
				const content =
					document.querySelector('.content_area')?.innerText || '';

				// Extract email addresses
				const emailMatch = content.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g);
				const contactEmail = emailMatch ? emailMatch.join(', ') : 'N/A';

				// Extract address patterns specific to Dayton
				const addressPatterns = [
					/\d+\s+Cook\s+Street[^,]*Dayton[^,]*Texas\s*\d{5}/gi,
					/117\s+Cook\s+Street[^,]*Dayton[^,]*Texas\s*77535/gi,
				];
				let contactAddress = 'N/A';
				for (const pattern of addressPatterns) {
					const match = content.match(pattern);
					if (match) {
						contactAddress = match[0].trim();
						break;
					}
				}

				// Extract submission deadline
				const deadlinePatterns = [
					/must be received.*?no later than\s*([^.]+)/gi,
					/(Thursday|Friday|Monday|Tuesday|Wednesday|Saturday|Sunday)[^,]*\d{1,2}[^,]*\d{4}[^.]*\d{1,2}:\d{2}\s*[AP]\.?M\.?/gi,
				];
				let submissionDeadline = 'N/A';
				for (const pattern of deadlinePatterns) {
					const match = content.match(pattern);
					if (match) {
						submissionDeadline = match[0].trim();
						break;
					}
				}

				// Determine submission method
				let submissionMethod = 'N/A';
				if (
					content.includes('mailed or delivered') ||
					content.includes('sealed envelope')
				) {
					submissionMethod = 'Mail/Physical Delivery in Sealed Envelope';
				} else if (
					content.includes('electronic') ||
					content.includes('email')
				) {
					submissionMethod = 'Electronic';
				} else if (content.includes('printed copies')) {
					submissionMethod = 'Physical Delivery';
				}

				// Extract document links
				const anchors = Array.from(document.querySelectorAll('a'));
				const docLinks = anchors
					.filter(
						(a) =>
							/\.pdf$/i.test(a.href) ||
							/showpublisheddocument/i.test(a.href) ||
							/packet/i.test(a.textContent) ||
							/here/i.test(a.textContent.toLowerCase())
					)
					.map((a) => a.href);

				// Extract department
				const department =
					content.match(/Department:\s*([^\n]+)/i)?.[1]?.trim() || 'N/A';

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

				return {
					department: cleanText(department),
					descriptionFull: cleanText(content),
					contactEmail: cleanText(contactEmail),
					contactAddress: cleanText(contactAddress),
					submissionDeadline: cleanText(submissionDeadline),
					submissionMethod: cleanText(submissionMethod),
					documentLink: docLinks.length ? docLinks.join(', ') : 'N/A',
				};
			});

			// Combine bid info with details
			results.push({
				...bid,
				...details,
			});
		} catch (err) {
			console.error(`❌ Failed to scrape ${detailPage}:`, err.message);
			// Add the bid with basic info even if detail scraping fails
			results.push({
				...bid,
				department: 'N/A',
				descriptionFull: 'N/A',
				contactEmail: 'N/A',
				contactAddress: 'N/A',
				submissionDeadline: 'N/A',
				submissionMethod: 'N/A',
				documentLink: 'N/A',
			});
		}
	}

	await browser.close();

	const fields = [
		'rfpNumber',
		'bidTitle',
		'startingDate',
		'closingDate',
		'status',
		'projectLink',
		'department',
		'descriptionFull',
		'contactEmail',
		'contactAddress',
		'submissionDeadline',
		'submissionMethod',
		'documentLink',
	];

	// Ensure all bids have all fields
	for (const bid of results) {
		for (const field of fields) {
			if (bid[field] === undefined) {
				bid[field] = 'N/A';
			}
		}
	}

	saveToCSV(results, 'dayton_texas_bids.csv', false, fields);

	console.log(
		`✅ Successfully scraped ${results.length} bids from City of Dayton, Texas`
	);
	return results;
}
