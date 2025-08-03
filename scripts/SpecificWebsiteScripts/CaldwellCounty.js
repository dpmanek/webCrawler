import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

/**
 * Scrapes bid opportunities from Caldwell County, Texas
 * URL: https://www.co.caldwell.tx.us/page/BidRequests
 */
export async function scrapeCaldwellCounty() {
	console.log('🕵️ Scraping bid list from Caldwell County, Texas...');

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
		await page.goto('https://www.co.caldwell.tx.us/page/BidRequests', {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for content to load
		await page.waitForSelector('.eztext_area', { timeout: 10000 });

		// Extract bid data from the content
		const bids = await page.evaluate(() => {
			const bidData = [];

			// Find all eztext_area elements that contain bid information
			const contentAreas = document.querySelectorAll('.eztext_area');

			contentAreas.forEach((area) => {
				// Find ALL links in this content area
				const allLinks = area.querySelectorAll('a[href]');

				allLinks.forEach((link) => {
					const href = link.href;
					const linkText = link.textContent?.trim() || '';

					// Skip empty links, navigation links, and non-document links
					if (
						!href ||
						href === '#' ||
						href === window.location.href ||
						href.includes('javascript:') ||
						href.includes('mailto:') ||
						linkText.toLowerCase().includes('home') ||
						linkText.toLowerCase().includes('contact') ||
						linkText.toLowerCase().includes('translate') ||
						linkText.toLowerCase().includes('sitemap')
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

					// Get project title from the link text and surrounding context
					let projectTitle = linkText;
					let description = linkText;

					// Try to get more context from the parent element
					const parentElement = link.closest('p, li, div');
					if (parentElement) {
						const fullText = parentElement.textContent || '';
						const linkTextIndex = fullText.indexOf(linkText);

						if (linkTextIndex > 0) {
							// Get text that appears before the link
							const beforeText = fullText.substring(0, linkTextIndex).trim();
							if (beforeText && beforeText.length > linkText.length) {
								projectTitle = beforeText + ' ' + linkText;
							}
						}

						// Use the full context as project title if it's more descriptive
						if (fullText.length > linkText.length && fullText.length < 200) {
							projectTitle = fullText.trim();
						}
					}

					// Clean up the project title
					projectTitle = projectTitle.replace(/\s+/g, ' ').trim();
					description = linkText.replace(/\s+/g, ' ').trim();

					// Create bid info object
					const bidInfo = {
						projectTitle: projectTitle,
						description: description,
						fileName: cleanFilename,
						clickHereLink: href,
					};

					bidData.push(bidInfo);
				});
			});

			// Remove duplicates based on URL
			const uniqueBids = [];
			const seen = new Set();

			bidData.forEach((bid) => {
				if (!seen.has(bid.clickHereLink)) {
					seen.add(bid.clickHereLink);
					uniqueBids.push(bid);
				}
			});

			return uniqueBids;
		});

		console.log(`📄 Found ${bids.length} bids. Processing details...`);

		// Save to CSV
		const filename = 'caldwell_county_bids.csv';
		const outputPath = await saveToCSV(bids, filename);
		console.log(`✅ Saved: ${outputPath}`);
		console.log(`✅ Saved ${bids.length} bids to ${filename}`);

		// Log summary
		console.log('\n📊 Scraping Results:');
		console.log(`Total bids found: ${bids.length}`);

		if (bids.length > 0) {
			console.log('\n📋 Sample bid data:');
			console.log('First bid:', JSON.stringify(bids[0], null, 2));

			console.log('\n🕒 Recent bids:');
			bids.slice(0, 5).forEach((bid, index) => {
				console.log(`${index + 1}. ${bid.projectTitle || 'Unknown'}`);
				console.log(`   Description: ${bid.description || 'N/A'}`);
				console.log(`   Link: ${bid.clickHereLink ? 'Yes' : 'No'}`);
				console.log('');
			});
		}

		return bids;
	} catch (error) {
		console.error('❌ Error scraping Caldwell County bids:', error);
		throw error;
	} finally {
		await browser.close();
	}
}

// Export for use in other modules
export default scrapeCaldwellCounty;
