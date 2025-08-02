import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.beltontexas.gov';

export async function scrapeBeltonTexas() {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	console.log('🕵️ Scraping bid list from Belton, Texas...');
	await page.goto(`${BASE_URL}/government/city_clerk/construction.php`, {
		waitUntil: 'networkidle2',
		timeout: 60000,
	});

	const bids = await page.evaluate(() => {
		const bidItems = [];

		// Look for all table rows that contain bid data
		// Based on the HTML structure, each bid is in a nested table within the main table
		const allRows = document.querySelectorAll('table tr');

		for (let row of allRows) {
			const cells = row.querySelectorAll('td');

			// Skip rows with hr elements (separators)
			if (row.querySelector('hr')) continue;

			// Look for rows with exactly 3 cells (description, opening date, closing date)
			if (cells.length === 3) {
				// Extract description and link from first cell
				const descriptionCell = cells[0];

				// Look for the actual link (not the anchor name)
				const linkElements = descriptionCell.querySelectorAll('a');
				let linkElement = null;

				// Find the link that has an href attribute (not just a name attribute)
				for (let link of linkElements) {
					if (
						link.getAttribute('href') &&
						!link.getAttribute('href').startsWith('#')
					) {
						linkElement = link;
						break;
					}
				}

				let bidTitle = 'N/A';
				let projectLink = '';
				let description = 'N/A';

				if (linkElement) {
					bidTitle = linkElement.innerText.trim();
					projectLink = linkElement.getAttribute('href') || '';

					// Make absolute URL if relative
					if (projectLink && !projectLink.startsWith('http')) {
						projectLink = projectLink.startsWith('/')
							? `${window.location.origin}${projectLink}`
							: `${window.location.origin}/${projectLink}`;
					}
				}

				// Get additional description text (usually after the link and <br> tag)
				const descriptionText = descriptionCell.innerText.trim();
				const lines = descriptionText.split('\n').filter((line) => line.trim());
				if (lines.length > 1) {
					// Skip the first line (which is the link text) and get the rest
					description = lines.slice(1).join(' ').trim();
				} else if (lines.length === 1 && !linkElement) {
					// If no link but has text, use that as description
					description = lines[0].trim();
				}

				// Extract opening date from second cell
				const openingDateCell = cells[1];
				const openingDate = openingDateCell
					? openingDateCell.innerText.trim()
					: 'N/A';

				// Extract closing date from third cell
				const closingDateCell = cells[2];
				const closingDate = closingDateCell
					? closingDateCell.innerText.trim()
					: 'N/A';

				// Determine if this is a PDF link or detail page
				const isPDF = projectLink.toLowerCase().includes('.pdf');
				const bidType = isPDF
					? 'PDF Document'
					: projectLink
					? 'Detail Page'
					: 'No Link';

				// Only add if we have meaningful data and it's not a header row
				if (
					openingDate !== 'N/A' &&
					!openingDate.includes('Opening Date') && // Skip header rows
					!openingDate.includes('font color') // Skip header rows with font styling
				) {
					bidItems.push({
						bidTitle,
						description,
						openingDate,
						closingDate,
						projectLink,
						bidType,
						isPDF,
						city: 'Belton',
						state: 'Texas',
						county: 'Bell County',
					});
				}
			}
		}

		return bidItems;
	});

	console.log(`📄 Found ${bids.length} bids. Processing details...`);

	// Add default contact info for all bids without trying to navigate to links
	bids.forEach((bid) => {
		bid.contactInfo =
			'Contact: 333 Water Street, Belton, TX 76513, 254-933-5812';
		bid.additionalDetails = bid.isPDF
			? 'PDF Document - Click link to download'
			: 'Detail page - Click link to view';
		bid.bidAmount = 'N/A';
		bid.specifications = 'N/A';
	});

	await browser.close();

	const fields = [
		'bidTitle',
		'description',
		'openingDate',
		'closingDate',
		'bidType',
		'city',
		'state',
		'county',
		'projectLink',
		'isPDF',
		'contactInfo',
		'additionalDetails',
		'bidAmount',
		'specifications',
	];

	// Save to output directory
	const outputDir = path.join(process.cwd(), 'output');
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Use just the filename since saveToCSV adds the output directory
	saveToCSV(bids, 'belton_texas_bids.csv', false, fields);
	console.log(`✅ Saved ${bids.length} bids to output/belton_texas_bids.csv`);

	return bids;
}
