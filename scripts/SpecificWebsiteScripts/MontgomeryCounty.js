import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

/**
 * Scrapes bid opportunities from Montgomery County, Texas
 * URL: https://www.mctx.org/departments/departments_l_-_p/purchasing/bid_proposal_opening_date.php
 */
export async function scrapeMontgomeryCounty() {
	console.log('🕵️ Scraping bid list from Montgomery County, Texas...');

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	try {
		const page = await browser.newPage();
		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		// Navigate to the bids page
		await page.goto(
			'https://www.mctx.org/departments/departments_l_-_p/purchasing/bid_proposal_opening_date.php',
			{
				waitUntil: 'networkidle2',
				timeout: 30000,
			}
		);

		// Wait for content to load
		await page.waitForSelector('table', { timeout: 10000 });

		// Extract bid data from the table
		const bids = await page.evaluate(() => {
			const bidData = [];

			// Find the main bid table
			const tables = document.querySelectorAll('table');
			let bidTable = null;

			// Look for the table that contains bid information
			for (const table of tables) {
				const tableText = table.textContent || '';
				if (
					tableText.includes('PROJECT') &&
					tableText.includes('DEADLINE') &&
					tableText.includes('LINKS')
				) {
					bidTable = table;
					break;
				}
			}

			if (!bidTable) {
				console.log('No bid table found');
				return [];
			}

			const rows = bidTable.querySelectorAll('tr');

			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				const cells = row.querySelectorAll('td');

				// Skip header rows and empty rows
				if (cells.length < 5) continue;

				// Extract project information from the first cell
				const projectCell = cells[0];
				const projectText = projectCell.textContent?.trim() || '';

				// Skip empty project cells or separator rows
				if (
					!projectText ||
					projectText.includes('---') ||
					projectText.length < 5
				) {
					continue;
				}

				// Extract deadline from the third cell (index 2)
				const deadlineCell = cells[2];
				const deadlineText = deadlineCell.textContent?.trim() || '';

				// Extract buyer from the last cell
				const buyerCell = cells[cells.length - 1];
				const buyerText = buyerCell.textContent?.trim() || '';

				// Find the LINKS cell (usually around index 8)
				let linksCell = null;
				for (let j = 0; j < cells.length; j++) {
					const cellText = cells[j].textContent?.trim() || '';
					const links = cells[j].querySelectorAll('a[href]');
					if (links.length > 0) {
						linksCell = cells[j];
						break;
					}
				}

				if (!linksCell) continue;

				// Extract all links from the LINKS cell
				const allLinks = linksCell.querySelectorAll('a[href]');

				allLinks.forEach((link) => {
					const href = link.href;
					const linkText = link.textContent?.trim() || '';

					// Skip empty links or navigation links
					if (
						!href ||
						href === '#' ||
						href === window.location.href ||
						!linkText
					) {
						return;
					}

					// Extract filename from URL
					const urlParts = href.split('/');
					const filename = urlParts[urlParts.length - 1];
					let cleanFilename = filename;

					if (filename && filename.includes('.')) {
						cleanFilename = filename
							.replace(/\.(pdf|doc|docx|html)$/i, '')
							.replace(/[_%20]/g, ' ')
							.replace(/\s+/g, ' ')
							.trim();
					}

					// Create project title from project text
					let projectTitle = projectText;
					let description = linkText;

					// Clean up the project title
					projectTitle = projectTitle.replace(/\s+/g, ' ').trim();
					description = description.replace(/\s+/g, ' ').trim();

					// Create bid info object
					const bidInfo = {
						projectTitle: projectTitle,
						description: description,
						fileName: cleanFilename,
						clickHereLink: href,
						deadline: deadlineText,
						buyer: buyerText,
					};

					bidData.push(bidInfo);
				});
			}

			return bidData;
		});

		console.log(`📄 Found ${bids.length} bid documents. Processing details...`);

		// Save to CSV
		const filename = 'montgomery_county_bids.csv';
		const outputPath = await saveToCSV(bids, filename);
		console.log(`✅ Saved: ${outputPath}`);
		console.log(`✅ Saved ${bids.length} bid documents to ${filename}`);

		// Log summary
		console.log('\n📊 Scraping Results:');
		console.log(`Total bid documents found: ${bids.length}`);

		if (bids.length > 0) {
			console.log('\n📋 Sample bid data:');
			console.log('First bid:', JSON.stringify(bids[0], null, 2));

			console.log('\n🕒 Recent bids:');
			bids.slice(0, 5).forEach((bid, index) => {
				console.log(`${index + 1}. ${bid.projectTitle || 'Unknown'}`);
				console.log(`   Description: ${bid.description || 'N/A'}`);
				console.log(`   Deadline: ${bid.deadline || 'N/A'}`);
				console.log(`   Buyer: ${bid.buyer || 'N/A'}`);
				console.log(`   Link: ${bid.clickHereLink ? 'Yes' : 'No'}`);
				console.log('');
			});
		}

		return bids;
	} catch (error) {
		console.error('❌ Error scraping Montgomery County bids:', error);
		throw error;
	} finally {
		await browser.close();
	}
}

// Export for use in other modules
export default scrapeMontgomeryCounty;
