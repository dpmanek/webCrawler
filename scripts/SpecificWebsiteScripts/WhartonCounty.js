import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

/**
 * Scrapes bid opportunities from Wharton County, Texas
 * URL: https://www.co.wharton.tx.us/page/wharton.Bids
 */
export async function scrapeWhartonCounty() {
	console.log('🕵️ Scraping bid list from Wharton County, Texas...');

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
		await page.goto('https://www.co.wharton.tx.us/page/wharton.Bids', {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for content to load
		await page.waitForSelector('.eztext_area', { timeout: 10000 });

		// Extract bid data from the content - Focus on main content area only
		const bids = await page.evaluate(() => {
			const bidData = [];

			// Find all eztext_area elements but focus on the main content
			const contentAreas = document.querySelectorAll('.eztext_area');

			contentAreas.forEach((area) => {
				// Find ALL links in this content area
				const allLinks = area.querySelectorAll('a[href]');

				allLinks.forEach((link, linkIndex) => {
					const href = link.href;
					const linkText = link.textContent?.trim() || '';

					// Only keep links that start with the specified URL pattern
					if (
						!href ||
						!href.startsWith('https://www.co.wharton.tx.us/upload/')
					) {
						return;
					}

					// Extract filename from URL
					const urlParts = href.split('/');
					const filename = urlParts[urlParts.length - 1];
					const cleanFilename = filename
						.replace(/\.(pdf|doc|docx|html)$/i, '')
						.replace(/[_%20]/g, ' ')
						.replace(/\s+/g, ' ')
						.trim();

					// Find the immediate text before this link (usually in a span)
					let description = '';
					let projectTitle = '';

					// Look for the text node or span immediately before this link
					let previousNode = link.previousSibling;
					while (previousNode) {
						if (previousNode.nodeType === Node.TEXT_NODE) {
							const text = previousNode.textContent?.trim();
							if (text && text.length > 5) {
								description = text;
								break;
							}
						} else if (previousNode.nodeType === Node.ELEMENT_NODE) {
							const text = previousNode.textContent?.trim();
							if (text && text.length > 5) {
								description = text;
								break;
							}
						}
						previousNode = previousNode.previousSibling;
					}

					// If no immediate text found, get the full context from parent
					if (!description) {
						const parentElement = link.closest('p, .story, div');
						if (parentElement) {
							const fullText = parentElement.textContent || '';
							const linkTextIndex = fullText.indexOf(linkText);

							if (linkTextIndex > 0) {
								// Get the full text that appears before the link text
								const beforeText = fullText.substring(0, linkTextIndex).trim();
								projectTitle = beforeText;

								// Try to extract the last meaningful sentence as description
								const sentences = beforeText
									.split(/[.!?:]/)
									.filter((s) => s.trim().length > 5);
								if (sentences.length > 0) {
									description = sentences[sentences.length - 1].trim();
								} else {
									description = beforeText;
								}
							}
						}
					}

					// Set project title to the full context if not already set
					if (!projectTitle) {
						const parentElement = link.closest('p, .story, div');
						if (parentElement) {
							const fullText = parentElement.textContent || '';
							const linkTextIndex = fullText.indexOf(linkText);
							if (linkTextIndex > 0) {
								projectTitle = fullText.substring(0, linkTextIndex).trim();
							}
						}
					}

					// Fallbacks
					if (!description || description.length < 3) {
						description = cleanFilename || 'Document';
					}
					if (!projectTitle || projectTitle.length < 3) {
						projectTitle = description;
					}

					// Basic cleanup
					projectTitle = projectTitle.replace(/\s+/g, ' ').trim();
					description = description.replace(/\s+/g, ' ').trim();

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
		const filename = 'wharton_county_bids.csv';
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
				console.log(`   Link: ${bid.clickHereLink ? 'Yes' : 'No'}`);
				console.log('');
			});
		}

		return bids;
	} catch (error) {
		console.error('❌ Error scraping Wharton County bids:', error);
		throw error;
	} finally {
		await browser.close();
	}
}

// Export for use in other modules
export default scrapeWhartonCounty;
