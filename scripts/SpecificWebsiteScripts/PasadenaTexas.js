import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

/**
 * Scrapes bid opportunities from Pasadena, Texas
 * URL: https://www.pasadenatx.gov/611/Bid-Opportunities
 */
export async function scrapePasadenaTexas() {
	console.log('🕵️ Scraping bid list from Pasadena, Texas...');

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	try {
		const page = await browser.newPage();
		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		// Navigate to the main bid opportunities page
		await page.goto('https://www.pasadenatx.gov/611/Bid-Opportunities', {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for the table to load
		await page.waitForSelector('table tbody tr', { timeout: 10000 });

		// Extract bid data from the table
		const bids = await page.evaluate(() => {
			const rows = document.querySelectorAll('table tbody tr');
			const bidData = [];

			rows.forEach((row) => {
				try {
					const cells = row.querySelectorAll('td');
					if (cells.length >= 4) {
						// Extract bid number (may contain links)
						const bidNumberCell = cells[0];
						let bidNumber = bidNumberCell.textContent?.trim() || '';
						let bidLink = '';

						// Check for links in bid number cell
						const link = bidNumberCell.querySelector('a');
						if (link) {
							bidLink = link.href || '';
							// If bid number is empty, try to get it from link text
							if (!bidNumber || bidNumber === '') {
								bidNumber = link.textContent?.trim() || '';
							}
						}

						// Extract bid name/description
						const bidNameCell = cells[1];
						let bidName = bidNameCell.textContent?.trim() || '';

						// Check for additional addendum information
						const addendums = bidNameCell.querySelectorAll('div');
						let addendumInfo = '';
						addendums.forEach((div) => {
							const addText = div.textContent?.trim();
							if (addText && addText.toLowerCase().includes('addendum')) {
								addendumInfo += (addendumInfo ? '; ' : '') + addText;
							}
						});

						// Extract dates
						const releaseDate = cells[2]?.textContent?.trim() || '';
						const dueDate = cells[3]?.textContent?.trim() || '';

						// Determine bid status and type
						let bidStatus = 'Open';
						if (bidNumber.toLowerCase().includes('awarded')) {
							bidStatus = 'Awarded';
						} else if (bidNumber.toLowerCase().includes('canceled')) {
							bidStatus = 'Canceled';
						} else if (bidNumber.toLowerCase().includes('under evaluation')) {
							bidStatus = 'Under Evaluation';
						}

						// Determine bid type
						let bidType = 'Unknown';
						if (bidName.toLowerCase().includes('rfp')) {
							bidType = 'RFP';
						} else if (bidName.toLowerCase().includes('ifb')) {
							bidType = 'IFB';
						} else if (bidName.toLowerCase().includes('rfq')) {
							bidType = 'RFQ';
						}

						const bidInfo = {
							bidNumber: bidNumber,
							bidTitle: bidName,
							description: bidName + (addendumInfo ? ` (${addendumInfo})` : ''),
							releaseDate: releaseDate,
							dueDate: dueDate,
							bidStatus: bidStatus,
							bidType: bidType,
							projectLink: bidLink,
							isPDF: bidLink.toLowerCase().includes('.pdf'),
							city: 'Pasadena',
							state: 'Texas',
							county: 'Harris County',
							contactInfo:
								'Contact: Purchasing Department, City of Pasadena, Texas, P.O. Box 672, Pasadena, TX 77501-0672, Phone: 713-475-5532',
							additionalDetails: bidLink
								? 'Document available for download'
								: 'No document link available',
							bidAmount: 'N/A',
							specifications: 'N/A',
						};

						bidData.push(bidInfo);
					}
				} catch (error) {
					console.error('Error processing row:', error);
				}
			});

			return bidData;
		});

		console.log(`📄 Found ${bids.length} bids. Processing details...`);

		// Save to CSV
		const filename = 'pasadena_texas_bids.csv';
		const outputPath = await saveToCSV(bids, filename);
		console.log(`✅ Saved: ${outputPath}`);
		console.log(`✅ Saved ${bids.length} bids to ${filename}`);

		// Log summary
		console.log('\n📊 Scraping Results:');
		console.log(`Total bids found: ${bids.length}`);

		if (bids.length > 0) {
			console.log('\n📋 Sample bid data:');
			console.log('First bid:', JSON.stringify(bids[0], null, 2));

			// Count by status
			const statusCounts = {};
			const typeCounts = {};
			bids.forEach((bid) => {
				statusCounts[bid.bidStatus] = (statusCounts[bid.bidStatus] || 0) + 1;
				typeCounts[bid.bidType] = (typeCounts[bid.bidType] || 0) + 1;
			});

			console.log('\n📄 Bid Status:');
			Object.entries(statusCounts).forEach(([status, count]) => {
				console.log(`${status}: ${count}`);
			});

			console.log('\n📄 Bid Types:');
			Object.entries(typeCounts).forEach(([type, count]) => {
				console.log(`${type}: ${count}`);
			});

			console.log('\n🕒 Recent bids:');
			bids.slice(0, 5).forEach((bid, index) => {
				console.log(`${index + 1}. ${bid.bidTitle || 'Unknown'}`);
				console.log(`   Release: ${bid.releaseDate}`);
				console.log(`   Due: ${bid.dueDate}`);
				console.log(`   Status: ${bid.bidStatus}`);
				console.log('');
			});
		}

		return bids;
	} catch (error) {
		console.error('❌ Error scraping Pasadena Texas bids:', error);
		throw error;
	} finally {
		await browser.close();
	}
}

// Export for use in other modules
export default scrapePasadenaTexas;
