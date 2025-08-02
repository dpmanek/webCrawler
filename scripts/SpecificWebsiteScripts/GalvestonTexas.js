import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

export async function scrapeGalvestonTexas() {
	console.log('🔍 Starting Galveston Texas bid scraping...');

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	const allBids = [];

	try {
		// Navigate to the main bids page
		const mainUrl =
			'https://www.galvestontx.gov/Bids.aspx?CatID=All&txtSort=Category&showAllBids=&Status=';
		console.log(`📄 Navigating to: ${mainUrl}`);

		await page.goto(mainUrl, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for the bid items to load
		await page.waitForSelector('.listItemsRow.bid', { timeout: 10000 });

		// Extract bid links and basic info from the listing page
		const bidItems = await page.evaluate(() => {
			const items = [];
			const bidRows = document.querySelectorAll('.listItemsRow.bid');

			bidRows.forEach((row) => {
				const titleElement = row.querySelector('.bidTitle a');
				const bidNumberElement = row.querySelector('.bidTitle strong');
				const statusElements = row.querySelectorAll('.bidStatus span');

				if (titleElement) {
					// Get the title and clean it up
					let title = titleElement.textContent.trim();
					const href = titleElement.getAttribute('href');

					// Extract bid number from the strong element that comes after the link
					let bidNumber = '';
					if (bidNumberElement) {
						const bidText = bidNumberElement.textContent.trim();
						const match = bidText.match(/Bid No\.\s*(.+)/);
						if (match) {
							bidNumber = match[1].trim();
						}
					}

					// Clean up title by removing bid number if it's concatenated
					if (bidNumber && title.includes(bidNumber)) {
						title = title.replace(`Bid No. ${bidNumber}`, '').trim();
					}

					// Extract status and closing date
					let status = '';
					let closingDate = '';
					if (statusElements.length >= 4) {
						status = statusElements[2]?.textContent.trim() || '';
						closingDate = statusElements[3]?.textContent.trim() || '';
					}

					items.push({
						title,
						bidNumber,
						status,
						closingDate,
						detailUrl: href,
					});
				}
			});

			return items;
		});

		console.log(`📋 Found ${bidItems.length} bids on the listing page`);

		// Process each bid to get detailed information
		for (const [index, bidItem] of bidItems.entries()) {
			try {
				console.log(
					`📖 Processing bid ${index + 1}/${bidItems.length}: ${bidItem.title}`
				);

				// Navigate to the detail page
				const detailUrl = `https://www.galvestontx.gov/${bidItem.detailUrl}`;
				await page.goto(detailUrl, {
					waitUntil: 'networkidle2',
					timeout: 30000,
				});

				// Wait for the detail content to load
				await page.waitForSelector('.BidDetail', { timeout: 10000 });

				// Extract detailed information
				const detailInfo = await page.evaluate(() => {
					const result = {
						bidNumber: '',
						bidTitle: '',
						category: '',
						status: '',
						description: '',
						publicationDate: '',
						closingDate: '',
						relatedDocuments: '',
						contactInfo: '',
					};

					// Extract information from the basic detail table (first table)
					const basicTableRows = document.querySelectorAll('table tr');
					basicTableRows.forEach((row) => {
						const cells = row.querySelectorAll('td');
						if (cells.length >= 2) {
							const labelElement = cells[0].querySelector('.BidDetail strong');
							const valueElement = cells[1].querySelector('.BidDetailSpec');

							if (labelElement && valueElement) {
								const label = labelElement.textContent.trim().replace(':', '');
								const value = valueElement.textContent.trim();

								switch (label) {
									case 'Bid Number':
										result.bidNumber = value;
										break;
									case 'Bid Title':
										result.bidTitle = value;
										break;
									case 'Category':
										result.category = value;
										break;
									case 'Status':
										result.status = value;
										break;
								}
							}
						}
					});

					// Extract detailed information from the second table
					const detailTableRows = document.querySelectorAll(
						'table[summary="Bid Details"] tr'
					);
					for (let i = 0; i < detailTableRows.length; i++) {
						const row = detailTableRows[i];
						const headerCell = row.querySelector('td .BidListHeader');

						if (headerCell) {
							const headerText = headerCell.textContent.trim().replace(':', '');
							const nextRow = detailTableRows[i + 1];

							if (nextRow) {
								const valueCell = nextRow.querySelector('td .BidDetail');
								if (valueCell) {
									switch (headerText) {
										case 'Description':
											// Extract description text, cleaning up HTML formatting
											let descText = valueCell.textContent.trim();
											// Clean up extra whitespace and line breaks, but preserve sentence breaks
											descText = descText
												.replace(/\s+/g, ' ')
												.replace(/([.!?])\s*([A-Z])/g, '$1 $2')
												.replace(/([a-z])([A-Z])/g, '$1 $2')
												.trim();
											result.description = descText;
											break;
										case 'Publication Date/Time':
											result.publicationDate = valueCell.textContent.trim();
											break;
										case 'Closing Date/Time':
											result.closingDate = valueCell.textContent.trim();
											break;
										case 'Related Documents':
											// Extract document links
											const docLinks = valueCell.querySelectorAll(
												'.relatedDocuments a'
											);
											const docs = Array.from(docLinks).map((link) => {
												const fullUrl = link.href.startsWith('http')
													? link.href
													: `https://www.galvestontx.gov${link.href}`;
												return `${link.textContent.trim()}: ${fullUrl}`;
											});
											result.relatedDocuments = docs.join('; ');
											break;
									}
								}
							}
						}
					}

					// Try alternative extraction for publication date and related documents
					if (!result.publicationDate) {
						// Look for publication date in any span with BidDetail class
						const pubDateSpans = document.querySelectorAll('.BidDetail');
						pubDateSpans.forEach((span) => {
							const text = span.textContent.trim();
							// Look for publication date pattern (6/10/2025 format)
							if (
								text.match(/^6\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/) ||
								(text.match(
									/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/
								) &&
									!result.publicationDate)
							) {
								// Only set if it's not the closing date
								if (!result.closingDate || text !== result.closingDate) {
									result.publicationDate = text;
								}
							}
						});
					}

					// Try alternative extraction for related documents
					if (!result.relatedDocuments) {
						// Look for any links in the relatedDocuments div
						const docDiv = document.querySelector('.relatedDocuments');
						if (docDiv) {
							const docLinks = docDiv.querySelectorAll('a');
							const docs = Array.from(docLinks).map((link) => {
								const fullUrl = link.href.startsWith('http')
									? link.href
									: `https://www.galvestontx.gov${link.href}`;
								return `${link.textContent.trim()}: ${fullUrl}`;
							});
							result.relatedDocuments = docs.join('; ');
						}
					}

					// If description is still empty, try alternative extraction methods
					if (!result.description) {
						// Try to find description in the fr-view div
						const frViewDiv = document.querySelector('.fr-view .BidDetail');
						if (frViewDiv) {
							let descText = frViewDiv.textContent.trim();
							descText = descText.replace(/\s+/g, ' ').trim();
							result.description = descText;
						}
					}

					// If still no description, try to find it in the responsiveEditor
					if (!result.description) {
						const responsiveEditor = document.querySelector(
							'.responsiveEditor .BidDetail'
						);
						if (responsiveEditor) {
							let descText = responsiveEditor.textContent.trim();
							descText = descText.replace(/\s+/g, ' ').trim();
							result.description = descText;
						}
					}

					// Extract contact information from description if available
					const descText = result.description.toLowerCase();
					if (descText.includes('purchasing') || descText.includes('finance')) {
						result.contactInfo =
							'City of Galveston - Department of Finance - Purchasing Division';
					}

					return result;
				});

				// Combine the information
				const bidData = {
					bidNumber: detailInfo.bidNumber || bidItem.bidNumber,
					bidTitle: detailInfo.bidTitle || bidItem.title,
					description: detailInfo.description,
					status: detailInfo.status || bidItem.status,
					closingDate: detailInfo.closingDate || bidItem.closingDate,
					category: detailInfo.category,
					publicationDate: detailInfo.publicationDate,
					businessHours: '', // Not available in this format
					relatedDocuments: detailInfo.relatedDocuments,
					contactEmail: '', // Not directly available
					contactAddress: detailInfo.contactInfo,
					downloadLink: detailInfo.relatedDocuments
						? detailInfo.relatedDocuments.split(': ')[1]?.split(';')[0] || ''
						: '',
					bidLink: detailUrl,
				};

				allBids.push(bidData);
				console.log(`✅ Successfully processed: ${bidData.bidTitle}`);
			} catch (error) {
				console.error(
					`❌ Error processing bid ${bidItem.title}:`,
					error.message
				);
				// Continue with the next bid
			}
		}

		// Save to CSV
		if (allBids.length > 0) {
			const filename = 'galveston_texas_bids.csv';
			await saveToCSV(allBids, filename);
			console.log(`💾 Saved ${allBids.length} bids to ${filename}`);
		} else {
			console.log('⚠️ No bids found to save');
		}
	} catch (error) {
		console.error('❌ Error during Galveston Texas scraping:', error);
		throw error;
	} finally {
		await browser.close();
		console.log('🔍 Galveston Texas scraping completed');
	}

	return allBids;
}
