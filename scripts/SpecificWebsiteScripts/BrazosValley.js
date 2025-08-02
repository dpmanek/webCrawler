import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { saveToCSV } from '../utils/saveToCSV.js';

// Use stealth plugin
puppeteer.use(StealthPlugin());

// Helper function to bypass Cloudflare protection
async function bypassCloudflare(page) {
	// Wait for potential Cloudflare challenge
	try {
		// Check if we're on a Cloudflare challenge page
		const isCloudflare = await page.evaluate(() => {
			return (
				document.body.textContent.includes(
					'Please complete the captcha below to continue'
				) ||
				document.body.textContent.includes('Cloudflare') ||
				document.title.includes('Just a moment') ||
				document.querySelector('.cf-browser-verification') !== null
			);
		});

		if (isCloudflare) {
			// Wait for the challenge to complete (usually takes 5-10 seconds)
			await page.waitForFunction(
				() => {
					return (
						!document.body.textContent.includes(
							'Please complete the captcha below to continue'
						) &&
						!document.body.textContent.includes('Checking your browser') &&
						!document.querySelector('.cf-browser-verification')
					);
				},
				{ timeout: 30000 }
			);
		}
	} catch (error) {
		// Continue silently if bypass fails
	}
}

export async function scrapeBrazosValley() {
	console.log('🔍 Starting Brazos Valley bid scraping...');

	const browser = await puppeteer.launch({
		headless: 'new',
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	const page = await browser.newPage();
	await page.setViewport({ width: 1280, height: 800 });

	const allBids = [];

	try {
		// Navigate to the main bids page
		const mainUrl =
			'https://brazosbid.ionwave.net/SourcingEvents.aspx?SourceType=1';
		console.log(`📄 Navigating to: ${mainUrl}`);

		await page.goto(mainUrl, {
			waitUntil: 'networkidle2',
			timeout: 15000,
		});

		// Try to bypass Cloudflare if present
		await bypassCloudflare(page);

		// Wait for the bid table to load
		await page.waitForSelector('.rgMasterTable', { timeout: 5000 });

		// Get all bid info from the listing page first
		const allBidInfo = await page.evaluate(() => {
			const bidRows = document.querySelectorAll(
				'.rgMasterTable tbody tr.rgRow, .rgMasterTable tbody tr.rgAltRow'
			);

			const bids = [];
			bidRows.forEach((row, index) => {
				const cells = row.querySelectorAll('td');
				if (cells.length >= 7) {
					bids.push({
						index,
						bidNumber: cells[1]?.textContent?.trim() || '',
						bidTitle: cells[2]?.textContent?.trim() || '',
						bidType: cells[3]?.textContent?.trim() || '',
						organization: cells[4]?.textContent?.trim() || '',
						issueDate: cells[5]?.textContent?.trim() || '',
						closeDateTime: cells[6]?.textContent?.trim() || '',
					});
				}
			});
			return bids;
		});

		console.log(`📋 Found ${allBidInfo.length} bids on the listing page`);

		// Process each bid by clicking on it
		for (const bidInfo of allBidInfo) {
			let detailProcessed = false;
			let retryCount = 0;
			const maxRetries = 2;

			while (!detailProcessed && retryCount <= maxRetries) {
				try {
					// Navigate back to the main page for each iteration
					await page.goto(mainUrl, {
						waitUntil: 'domcontentloaded',
						timeout: 8000,
					});

					// Only bypass Cloudflare on first attempt
					if (retryCount === 0) {
						await bypassCloudflare(page);
					}

					// Reduced wait time for table
					await page.waitForSelector('.rgMasterTable', { timeout: 2000 });

					console.log(
						`📖 Processing bid ${bidInfo.index + 1}/${allBidInfo.length}: ${
							bidInfo.bidTitle
						} (Attempt ${retryCount + 1})`
					);

					// Click on the "View Bid" span to navigate to detail page
					const linkClicked = await page.evaluate((index) => {
						const bidRows = document.querySelectorAll(
							'.rgMasterTable tbody tr.rgRow, .rgMasterTable tbody tr.rgAltRow'
						);

						if (index >= bidRows.length) return false;

						const row = bidRows[index];

						// Look for the "View Bid" span in the first column
						const viewBidSpan = row.querySelector('.flaticon-grid_View');
						if (viewBidSpan) {
							viewBidSpan.click();
							return true;
						}

						// Fallback: try clicking on the first cell
						const firstCell = row.querySelector('td:first-child');
						if (firstCell) {
							firstCell.click();
							return true;
						}

						// Last resort: try clicking the row itself
						row.click();
						return true;
					}, bidInfo.index);

					if (!linkClicked) {
						throw new Error('Could not click link');
					}

					// Wait for navigation to detail page with reduced timeout
					await page.waitForNavigation({
						waitUntil: 'domcontentloaded',
						timeout: 6000,
					});

					// Skip Cloudflare bypass on detail pages since we're already authenticated
					// No delay needed with retry logic

					// Wait a moment for the page to fully load
					await new Promise((resolve) => setTimeout(resolve, 1000));

					// Extract detailed information from the detail page
					const detailInfo = await page.evaluate(() => {
						const result = {
							type: '',
							status: '',
							number: '',
							issueDateTime: '',
							closeDateTime: '',
							questionCutoffDate: '',
							timeLeft: '',
							notes: '',
							contactInfo: '',
							bidDocuments: [],
							bidAttachments: [],
							participationActivities: [],
							estimatedAmount: '',
							description: '',
							prebidMeeting: '',
						};

						// Extract bid information from all possible table structures
						const allTables = document.querySelectorAll('table');
						allTables.forEach((table) => {
							const rows = table.querySelectorAll('tr');
							rows.forEach((row) => {
								const cells = row.querySelectorAll('td');
								if (cells.length >= 2) {
									const labelCell = cells[0];
									const valueCell = cells[1];

									if (labelCell && valueCell) {
										const label = labelCell.textContent.trim();
										const value = valueCell.textContent.trim();

										// More comprehensive field matching
										if (label.toLowerCase().includes('type')) {
											result.type = value;
										} else if (label.toLowerCase().includes('status')) {
											result.status = value;
										} else if (label.toLowerCase().includes('number')) {
											result.number = value;
										} else if (label.toLowerCase().includes('issue date')) {
											result.issueDateTime = value;
										} else if (label.toLowerCase().includes('close date')) {
											result.closeDateTime = value;
										} else if (
											label.toLowerCase().includes('question') &&
											label.toLowerCase().includes('cut')
										) {
											result.questionCutoffDate = value;
										} else if (label.toLowerCase().includes('time left')) {
											result.timeLeft = value;
										} else if (
											label.toLowerCase().includes('notes') ||
											label.toLowerCase().includes('description')
										) {
											result.notes = value;
										} else if (
											label.toLowerCase().includes('estimated') &&
											label.toLowerCase().includes('amount')
										) {
											result.estimatedAmount = value;
										}
									}
								}
							});
						});

						// Also try the original fieldLabel/fieldValue approach
						const fieldRows = document.querySelectorAll('table tr');
						fieldRows.forEach((row) => {
							const labelCell = row.querySelector('.fieldLabel');
							const valueCell = row.querySelector('.fieldValue');

							if (labelCell && valueCell) {
								const label = labelCell.textContent.trim();
								const value = valueCell.textContent.trim();

								switch (label) {
									case 'Type':
										result.type = value;
										break;
									case 'Status':
										result.status = value;
										break;
									case 'Number':
										result.number = value;
										break;
									case 'Issue Date & Time':
										result.issueDateTime = value;
										break;
									case 'Close Date & Time':
										result.closeDateTime = value;
										break;
									case 'Question Cut Off Date':
										result.questionCutoffDate = value;
										break;
									case 'Time Left':
										result.timeLeft = value;
										break;
									case 'Notes':
										result.notes = value;
										break;
								}
							}
						});

						// Extract all text content from Notes section if it's in a larger text area
						const notesSection = document.querySelector(
							'textarea, .notes, [id*="notes"], [class*="notes"]'
						);
						if (notesSection && notesSection.textContent.trim()) {
							result.notes = notesSection.textContent.trim();
						}

						// Look for description in various places
						const descriptionElements =
							document.querySelectorAll('div, p, span');
						descriptionElements.forEach((element) => {
							const text = element.textContent.trim();
							if (
								text.length > 100 &&
								(text.toLowerCase().includes('invites') ||
									text.toLowerCase().includes('project') ||
									text.toLowerCase().includes('contractor') ||
									text.toLowerCase().includes('bid'))
							) {
								if (
									!result.description ||
									text.length > result.description.length
								) {
									result.description = text;
								}
							}
						});

						// Extract contact information more thoroughly
						const contactHeaders = document.querySelectorAll(
							'h1, h2, h3, h4, h5, h6'
						);
						contactHeaders.forEach((header) => {
							if (header.textContent.toLowerCase().includes('contact')) {
								let nextElement = header.nextElementSibling;
								let contactText = '';
								while (nextElement && contactText.length < 500) {
									const text = nextElement.textContent.trim();
									if (text) {
										contactText += text + ' ';
									}
									nextElement = nextElement.nextElementSibling;
									if (
										nextElement &&
										nextElement.tagName.toLowerCase().match(/^h[1-6]$/)
									) {
										break; // Stop at next header
									}
								}
								if (contactText.trim()) {
									result.contactInfo = contactText.trim();
								}
							}
						});

						// If no contact info found, look for "No Contact Information" text
						if (!result.contactInfo) {
							const allText = document.body.textContent;
							if (allText.includes('No Contact Information')) {
								result.contactInfo = 'No Contact Information';
							}
						}

						// Extract bid documents with multiple approaches
						const docSelectors = [
							'#ctl00_mainContent_rgBidDocuments_ctl00 tbody tr',
							'[id*="BidDocuments"] tbody tr',
							'[class*="documents"] tbody tr',
							'.document-table tbody tr',
						];

						docSelectors.forEach((selector) => {
							const docRows = document.querySelectorAll(selector);
							docRows.forEach((row) => {
								const cells = row.querySelectorAll('td');
								if (cells.length >= 2) {
									const docName = cells[0]?.textContent?.trim() || '';
									const format = cells[1]?.textContent?.trim() || '';
									if (
										docName &&
										!docName.includes('items in') &&
										!docName.includes('No records')
									) {
										result.bidDocuments.push({
											name: docName,
											format: format,
										});
									}
								}
							});
						});

						// Extract bid attachments with multiple approaches
						const attachSelectors = [
							'#ctl00_mainContent_rgBidAttachments_ctl00 tbody tr',
							'[id*="BidAttachments"] tbody tr',
							'[class*="attachments"] tbody tr',
							'.attachment-table tbody tr',
						];

						attachSelectors.forEach((selector) => {
							const attachRows = document.querySelectorAll(selector);
							attachRows.forEach((row) => {
								const cells = row.querySelectorAll('td');
								if (cells.length >= 3) {
									const fileName = cells[0]?.textContent?.trim() || '';
									const description = cells[1]?.textContent?.trim() || '';
									const fileSize = cells[2]?.textContent?.trim() || '';
									if (
										fileName &&
										!fileName.includes('items in') &&
										!fileName.includes('No records')
									) {
										result.bidAttachments.push({
											fileName: fileName,
											description: description,
											fileSize: fileSize,
										});
									}
								}
							});
						});

						// Extract participation activities with multiple approaches
						const activitySelectors = [
							'#ctl00_mainContent_rgParticipationActivities_ctl00 tbody tr',
							'[id*="ParticipationActivities"] tbody tr',
							'[class*="activities"] tbody tr',
							'.activity-table tbody tr',
						];

						activitySelectors.forEach((selector) => {
							const activityRows = document.querySelectorAll(selector);
							activityRows.forEach((row) => {
								const cells = row.querySelectorAll('td');
								if (cells.length >= 4) {
									const activityDate = cells[1]?.textContent?.trim() || '';
									const activityName = cells[2]?.textContent?.trim() || '';
									const description = cells[3]?.textContent?.trim() || '';
									if (
										activityDate &&
										!activityDate.includes('items in') &&
										!activityDate.includes('No records')
									) {
										result.participationActivities.push({
											date: activityDate,
											name: activityName,
											description: description,
										});
									}
								}
							});
						});

						return result;
					});

					// Get the current URL for reference
					const currentUrl = page.url();

					// Create comprehensive bid data object
					const bidData = {
						bidNumber: detailInfo.number || bidInfo.bidNumber,
						bidTitle: bidInfo.bidTitle,
						bidType: bidInfo.bidType,
						organization: bidInfo.organization,
						status: detailInfo.status,
						type: detailInfo.type,
						issueDate: bidInfo.issueDate,
						issueDateTime: detailInfo.issueDateTime,
						closeDate: bidInfo.closeDateTime,
						closeDateTime: detailInfo.closeDateTime,
						questionCutoffDate: detailInfo.questionCutoffDate,
						timeLeft: detailInfo.timeLeft,
						estimatedAmount: detailInfo.estimatedAmount,
						notes: detailInfo.notes,
						description: detailInfo.description,
						contactInfo: detailInfo.contactInfo,
						bidDocuments: detailInfo.bidDocuments
							.map((doc) => `${doc.name} (${doc.format})`)
							.join('; '),
						bidAttachments: detailInfo.bidAttachments
							.map(
								(att) => `${att.fileName}: ${att.description} (${att.fileSize})`
							)
							.join('; '),
						participationActivities: detailInfo.participationActivities
							.map((act) => `${act.date} - ${act.name}: ${act.description}`)
							.join('; '),
						bidLink: currentUrl,
					};

					allBids.push(bidData);
					console.log(`✅ Successfully processed: ${bidData.bidTitle}`);
					detailProcessed = true;
				} catch (error) {
					retryCount++;
					console.log(
						`⚠️ Attempt ${retryCount} failed for ${bidInfo.bidTitle}: ${error.message}`
					);

					if (retryCount > maxRetries) {
						// Add basic info from listing page as fallback
						const basicBidData = {
							bidNumber: bidInfo.bidNumber,
							bidTitle: bidInfo.bidTitle,
							bidType: bidInfo.bidType,
							organization: bidInfo.organization,
							status: 'Unknown',
							type: bidInfo.bidType,
							issueDate: bidInfo.issueDate,
							issueDateTime: '',
							closeDate: bidInfo.closeDateTime,
							closeDateTime: bidInfo.closeDateTime,
							questionCutoffDate: '',
							timeLeft: '',
							notes: 'Detail page could not be accessed',
							contactInfo: '',
							bidDocuments: '',
							bidAttachments: '',
							participationActivities: '',
							bidLink: mainUrl,
						};

						allBids.push(basicBidData);
						console.log(`📝 Added basic info for: ${basicBidData.bidTitle}`);
					}
				}
			}
		}

		// Save to CSV
		if (allBids.length > 0) {
			const filename = 'brazos_valley_bids.csv';
			await saveToCSV(allBids, filename);
			console.log(`💾 Saved ${allBids.length} bids to ${filename}`);
		} else {
			console.log('⚠️ No bids found to save');
		}
	} catch (error) {
		console.error('❌ Error during Brazos Valley scraping:', error);
		throw error;
	} finally {
		await browser.close();
		console.log('🔍 Brazos Valley scraping completed');
	}

	return allBids;
}
