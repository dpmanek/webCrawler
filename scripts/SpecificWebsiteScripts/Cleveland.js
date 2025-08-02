import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { saveToCSV } from '../utils/saveToCSV.js';

// Use stealth plugin
puppeteer.use(StealthPlugin());

export async function scrapeCleveland() {
	console.log('🔍 Starting Cleveland bid scraping...');

	const browser = await puppeteer.launch({
		headless: 'new',
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1280, height: 800 });

	const allBids = [];

	try {
		// Navigate to the Cleveland bids page
		const url = 'https://www.clevelandtexas.com/bids.aspx';
		console.log(`📄 Navigating to: ${url}`);

		await page.goto(url, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for the page content to load
		await page.waitForSelector('body', { timeout: 10000 });

		console.log('📋 Extracting bid information from the main page...');

		// Extract all bid links from the main page
		const bidLinks = await page.evaluate(() => {
			const bids = [];

			// Look for bid links in the bid items
			const bidRows = document.querySelectorAll('.listItemsRow.bid');

			bidRows.forEach((row) => {
				const titleElement = row.querySelector('.bidTitle a');
				const statusElements = row.querySelectorAll('.bidStatus div span');

				if (titleElement) {
					const bidTitle = titleElement.textContent.trim();
					const bidLink = titleElement.href;

					// Extract bid number from the title or link
					const bidNumberMatch =
						bidTitle.match(/RFP[^\s]*/i) ||
						bidTitle.match(/BID[^\s]*/i) ||
						bidTitle.match(/[A-Z]+-[0-9-]+/);
					const bidNumber = bidNumberMatch ? bidNumberMatch[0] : '';

					// Extract status and closing date
					let status = 'Unknown';
					let closeDate = '';

					if (statusElements.length >= 2) {
						status = statusElements[0].textContent
							.trim()
							.replace('Status:', '')
							.trim();
						closeDate = statusElements[1].textContent
							.trim()
							.replace('Closes:', '')
							.trim();
					}

					// Extract description from the bid row
					const descriptionElement = row.querySelector(
						'.bidTitle span:last-child'
					);
					let description = '';
					if (descriptionElement) {
						description = descriptionElement.textContent.trim();
						// Remove the "[Read on]" link text
						description = description
							.replace(/\[\s*Read\s*on\s*\]/i, '')
							.trim();
					}

					bids.push({
						bidTitle,
						bidNumber,
						bidLink,
						status,
						closeDate,
						description,
					});
				}
			});

			return bids;
		});

		console.log(`📋 Found ${bidLinks.length} bids on the main page`);

		// Process each bid to get detailed information
		for (let i = 0; i < bidLinks.length; i++) {
			const bid = bidLinks[i];
			console.log(
				`✅ Processing bid ${i + 1}/${bidLinks.length}: ${bid.bidTitle}`
			);

			try {
				// Navigate to the bid detail page
				await page.goto(bid.bidLink, {
					waitUntil: 'networkidle2',
					timeout: 30000,
				});

				// Wait for the detail page to load
				await page.waitForSelector('body', { timeout: 10000 });

				// Extract detailed information from the bid detail page
				const detailedInfo = await page.evaluate(() => {
					const details = {};

					// Extract bid details from the table
					const detailRows = document.querySelectorAll(
						'table[summary="Bid details"] tr'
					);
					detailRows.forEach((row) => {
						const labelElement = row.querySelector('.BidDetail strong');
						const valueElement = row.querySelector('.BidDetailSpec');

						if (labelElement && valueElement) {
							const label = labelElement.textContent.trim().replace(':', '');
							const value = valueElement.textContent.trim();

							switch (label) {
								case 'Bid Number':
									details.bidNumber = value;
									break;
								case 'Bid Title':
									details.bidTitle = value;
									break;
								case 'Category':
									details.category = value;
									break;
								case 'Status':
									details.status = value;
									break;
								case 'Bid Recipient':
									details.recipient = value;
									break;
							}
						}
					});

					// Extract description, dates, and submittal info from the detailed table
					const detailTable = document.querySelector(
						'table[summary="Bid Details"]'
					);
					if (detailTable) {
						const rows = detailTable.querySelectorAll('tr');
						let currentSection = '';

						rows.forEach((row) => {
							const headerElement = row.querySelector('.BidListHeader');
							const detailElement = row.querySelector('.BidDetail');

							if (headerElement) {
								currentSection = headerElement.textContent
									.trim()
									.replace(':', '');
							} else if (detailElement && currentSection) {
								const content = detailElement.textContent.trim();

								switch (currentSection) {
									case 'Description':
										details.description = content;
										// Also look for PDF links in the description
										const pdfLinks = detailElement.querySelectorAll(
											'a[href*=".pdf"], a[href*="DocumentCenter"]'
										);
										if (pdfLinks.length > 0) {
											details.pdfLinks = Array.from(pdfLinks).map((link) => ({
												text: link.textContent.trim(),
												url: link.href,
											}));
										}
										break;
									case 'Publication Date/Time':
										details.publicationDate = content;
										break;
									case 'Closing Date/Time':
										details.closingDate = content;
										break;
									case 'Submittal Information':
										details.submittalInfo = content;
										break;
								}
							}
						});
					}

					return details;
				});

				// Combine the information
				const combinedBid = {
					bidTitle: detailedInfo.bidTitle || bid.bidTitle,
					bidPeriod: detailedInfo.publicationDate || '',
					bidType: detailedInfo.category || '',
					organization: detailedInfo.recipient || '',
					status: detailedInfo.status || bid.status,
					bidLink: bid.bidLink,
					fileName: detailedInfo.bidNumber || bid.bidNumber || '',
					issueDate: detailedInfo.publicationDate || '',
					closeDate: detailedInfo.closingDate || bid.closeDate,
					description: detailedInfo.description || bid.description,
					contactInfo: detailedInfo.submittalInfo || '',
					notes: detailedInfo.pdfLinks
						? `PDF documents available: ${detailedInfo.pdfLinks
								.map((link) => link.text)
								.join(', ')}`
						: '',
				};

				allBids.push(combinedBid);
			} catch (error) {
				console.error(
					`❌ Error processing bid ${bid.bidTitle}:`,
					error.message
				);

				// Add basic information even if detail extraction fails
				const basicBid = {
					bidTitle: bid.bidTitle,
					bidPeriod: '',
					bidType: '',
					organization: '',
					status: bid.status,
					bidLink: bid.bidLink,
					fileName: bid.bidNumber || '',
					issueDate: '',
					closeDate: bid.closeDate,
					description: bid.description,
					contactInfo: '',
					notes: 'Error retrieving detailed information',
				};

				allBids.push(basicBid);
			}
		}

		// Save to CSV
		if (allBids.length > 0) {
			const outputPath = await saveToCSV(allBids, 'cleveland_bids.csv');
			console.log(`✅ Saved: ${outputPath}`);
			console.log(`💾 Saved ${allBids.length} bids to cleveland_bids.csv`);
		} else {
			console.log('⚠️ No bids found to save');
		}
	} catch (error) {
		console.error('❌ Error during Cleveland scraping:', error);
		throw error;
	} finally {
		await browser.close();
		console.log('🔍 Cleveland scraping completed');
	}

	return allBids;
}
