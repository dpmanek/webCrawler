import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

export async function scrapeHuntsvilleTexas() {
	console.log('🔍 Starting Huntsville Texas bid scraping...');

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	const allBids = [];

	try {
		// Navigate to the main bids page
		const mainUrl =
			'https://www.huntsvilletx.gov/Bids.aspx?CatID=showStatus&txtSort=Category&showAllBids=&Status=open';
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
				const detailUrl = `https://www.huntsvilletx.gov/${bidItem.detailUrl}`;
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
						publicationDate: '',
						publicationInfo: '',
						closingDate: '',
						submittalInfo: '',
						bidOpeningInfo: '',
						contactPerson: '',
						downloadAvailable: '',
						fee: '',
						businessHours: '',
						planHoldersList: '',
						relatedDocuments: '',
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

					// Extract detailed information from the second table with BidListHeader
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
										case 'Publication Date/Time':
											result.publicationDate = valueCell.textContent.trim();
											break;
										case 'Publication Information':
											result.publicationInfo = valueCell.textContent.trim();
											break;
										case 'Closing Date/Time':
											result.closingDate = valueCell.textContent.trim();
											break;
										case 'Submittal Information':
											result.submittalInfo = valueCell.textContent.trim();
											break;
										case 'Bid Opening Information':
											result.bidOpeningInfo = valueCell.textContent.trim();
											break;
										case 'Contact Person':
											result.contactPerson = valueCell.textContent.trim();
											break;
										case 'Download Available':
											result.downloadAvailable = valueCell.textContent.trim();
											break;
										case 'Fee':
											result.fee = valueCell.textContent.trim();
											break;
										case 'Business Hours':
											result.businessHours = valueCell.textContent.trim();
											break;
										case 'Plan Holders List':
											result.planHoldersList = valueCell.textContent.trim();
											break;
										case 'Related Documents':
											// Extract document links
											const docDiv =
												valueCell.querySelector('.relatedDocuments');
											if (docDiv) {
												const docLinks = docDiv.querySelectorAll('a');
												const docs = Array.from(docLinks).map((link) => {
													const fullUrl = link.href.startsWith('http')
														? link.href
														: `https://www.huntsvilletx.gov${link.href}`;
													return `${link.textContent.trim()}: ${fullUrl}`;
												});
												result.relatedDocuments = docs.join('; ');
											}
											break;
									}
								}
							}
						}
					}

					return result;
				});

				// Create description from available information
				let description = '';
				if (detailInfo.publicationInfo) {
					description = detailInfo.publicationInfo;
				}
				if (
					detailInfo.submittalInfo &&
					detailInfo.submittalInfo !== 'Paper (Sealed Bids)'
				) {
					description += description
						? ` Submittal: ${detailInfo.submittalInfo}`
						: detailInfo.submittalInfo;
				}
				if (detailInfo.bidOpeningInfo) {
					description += description
						? ` Opening: ${detailInfo.bidOpeningInfo}`
						: detailInfo.bidOpeningInfo;
				}

				// Extract contact email from contact person field
				let contactEmail = '';
				if (detailInfo.contactPerson) {
					const emailMatch = detailInfo.contactPerson.match(
						/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
					);
					if (emailMatch) {
						contactEmail = emailMatch[1];
					}
				}

				// Extract contact address (name and address without email)
				let contactAddress = '';
				if (detailInfo.contactPerson) {
					contactAddress = detailInfo.contactPerson
						.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, '')
						.trim();
					// Clean up extra whitespace and line breaks
					contactAddress = contactAddress.replace(/\s+/g, ' ').trim();
				}

				// Combine the information
				const bidData = {
					bidNumber: detailInfo.bidNumber || bidItem.bidNumber,
					bidTitle: detailInfo.bidTitle || bidItem.title,
					description: description,
					status: detailInfo.status || bidItem.status,
					closingDate: detailInfo.closingDate || bidItem.closingDate,
					category: detailInfo.category,
					publicationDate: detailInfo.publicationDate,
					publicationInfo: detailInfo.publicationInfo,
					submittalInfo: detailInfo.submittalInfo,
					bidOpeningInfo: detailInfo.bidOpeningInfo,
					downloadAvailable: detailInfo.downloadAvailable,
					fee: detailInfo.fee,
					businessHours: detailInfo.businessHours,
					planHoldersList: detailInfo.planHoldersList,
					relatedDocuments: detailInfo.relatedDocuments,
					contactEmail: contactEmail,
					contactAddress: contactAddress,
					contactPerson: detailInfo.contactPerson,
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
			const filename = 'huntsville_texas_bids.csv';
			await saveToCSV(allBids, filename);
			console.log(`💾 Saved ${allBids.length} bids to ${filename}`);
		} else {
			console.log('⚠️ No bids found to save');
		}
	} catch (error) {
		console.error('❌ Error during Huntsville Texas scraping:', error);
		throw error;
	} finally {
		await browser.close();
		console.log('🔍 Huntsville Texas scraping completed');
	}

	return allBids;
}
