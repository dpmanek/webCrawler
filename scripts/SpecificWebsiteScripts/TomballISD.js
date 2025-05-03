import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

const BASE_URL = 'https://tomballisd.bonfirehub.com';

export async function scrapeTomballISD() {
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();

	console.log('🕵️ Scraping bid list from Tomball ISD...');
	await page.goto(`${BASE_URL}/portal/?tab=openOpportunities`, {
		waitUntil: 'networkidle2',
		timeout: 60000,
	});

	// Wait for the table to load
	await page.waitForSelector('#DataTables_Table_0', { timeout: 30000 });

	const bids = await page.evaluate(() => {
		const bidItems = [];
		const rows = document.querySelectorAll('#DataTables_Table_0 tbody tr');

		rows.forEach((row) => {
			// Extract status
			const statusEl = row.querySelector('.statusTag');
			const status = statusEl ? statusEl.innerText.trim() : 'N/A';

			// Extract reference number
			const refNumberEl = row.querySelector('td:nth-child(2)');
			const bidNumber = refNumberEl ? refNumberEl.innerText.trim() : 'N/A';

			// Extract project name
			const projectNameEl = row.querySelector('td:nth-child(3) b');
			const bidTitle = projectNameEl ? projectNameEl.innerText.trim() : 'N/A';

			// Extract close date
			const closeDateEl = row.querySelector('td:nth-child(4)');
			const closeDate = closeDateEl ? closeDateEl.innerText.trim() : 'N/A';

			// Extract days left
			const daysLeftEl = row.querySelector('.badgeDaysLeft');
			const daysLeft = daysLeftEl ? daysLeftEl.innerText.trim() : 'N/A';

			// Extract project link
			const linkEl = row.querySelector('a.btn');
			const projectLink = linkEl ? linkEl.getAttribute('href') : '';

			// Extract category (default to "Procurement" since it's not explicitly shown in the table)
			const category = 'Procurement';

			bidItems.push({
				bidTitle,
				bidNumber,
				category,
				status,
				closeDate,
				daysLeft,
				projectLink,
			});
		});

		return bidItems;
	});

	// Process the links to add the base URL
	for (const bid of bids) {
		if (bid.projectLink && bid.projectLink !== 'N/A') {
			bid.projectLink = bid.projectLink.startsWith('http')
				? bid.projectLink
				: `${BASE_URL}${bid.projectLink}`;
		}
	}

	console.log(`📄 Found ${bids.length} bids. Fetching details...`);
	await enrichBidDetails(bids, browser);

	await browser.close();

	const fields = [
		'bidTitle',
		'bidNumber',
		'projectType',
		'status',
		'openDate',
		'questionsDueDate',
		'contactInfo',
		'closeDate',
		'daysLeft',
		'projectDescription',
		'importantEvents',
		'commodityCodes',
		'supportingDocumentation',
		'requestedInformation',
		'projectLink',
	];

	saveToCSV(bids, 'tomballisd_bids.csv', false, fields);
	console.log(`✅ Saved ${bids.length} bids to output/tomballisd_bids.csv`);
}

// async function enrichBidDetails(bids, browser) {
// 	const page = await browser.newPage();

// 	for (const bid of bids) {
// 		try {
// 			if (bid.projectLink === 'N/A') {
// 				continue;
// 			}

// 			console.log(`🔎 Scraping details for: ${bid.bidTitle}`);
// 			await page.goto(bid.projectLink, {
// 				waitUntil: 'networkidle2',
// 				timeout: 60000,
// 			});

// 			// Wait for the page to load
// 			await page.waitForSelector('body', { timeout: 30000 });

// 			const detail = await page.evaluate(() => {
// 				// Initialize default values
// 				let projectType = 'N/A';
// 				let openDate = 'N/A';
// 				let questionsDueDate = 'N/A';
// 				let contactInfo = 'N/A';
// 				let closeDate = 'N/A';
// 				let daysLeft = 'N/A';
// 				let projectDescription = 'N/A';
// 				let importantEvents = [];
// 				let commodityCodes = [];
// 				let supportingDocumentation = [];
// 				let requestedInformation = [];

// 				// Extract project title and reference number from the header
// 				const projectTitleEl = document.querySelector('#publicTitle h1');
// 				if (projectTitleEl) {
// 					const titleText = projectTitleEl.innerText.trim();
// 					// Title format is typically "990-25/27 - Athletic Equipment & Supplies"
// 					const titleParts = titleText.split(' - ');
// 					if (titleParts.length > 1) {
// 						// bidNumber = titleParts[0].trim();
// 						// bidTitle = titleParts[1].trim();
// 					}
// 				}

// 				// Extract organization name
// 				const organizationEl = document.querySelector('#publicTitle p b');
// 				const organizationName = organizationEl
// 					? organizationEl.innerText.trim()
// 					: 'N/A';

// 				// Extract project type from the project object in the script
// 				try {
// 					// Get all script elements
// 					const scripts = document.querySelectorAll('script');
// 					let projectObj = null;

// 					// Find the script that contains the project data
// 					for (const script of scripts) {
// 						const scriptText = script.innerText || script.textContent;
// 						if (scriptText && scriptText.includes('var project =')) {
// 							const projectMatch = scriptText.match(/var project = (.*?);/s);
// 							if (projectMatch && projectMatch[1]) {
// 								projectObj = JSON.parse(projectMatch[1]);
// 								break;
// 							}
// 						}
// 					}

// 					if (projectObj) {
// 						projectType = projectObj.ProjectType || 'N/A';
// 						openDate = projectObj.DateOpen
// 							? new Date(projectObj.DateOpen).toLocaleString()
// 							: 'N/A';
// 						questionsDueDate = projectObj.DateQuestionsDue
// 							? new Date(projectObj.DateQuestionsDue).toLocaleString()
// 							: 'N/A';
// 						closeDate = projectObj.DateClose
// 							? new Date(projectObj.DateClose).toLocaleString()
// 							: 'N/A';
// 						contactInfo = projectObj.ContactInfo || 'N/A';
// 						projectDescription = projectObj.StatementOfWork || 'N/A';
// 					}
// 				} catch (e) {
// 					console.error('Error parsing project data:', e);
// 				}

// 				// Extract project details from the modal sections
// 				const detailSections = document.querySelectorAll(
// 					'.modalSection.projectDetailSection'
// 				);
// 				for (const section of detailSections) {
// 					const labelEl = section.querySelector('b');
// 					if (!labelEl) continue;

// 					const label = labelEl.innerText.trim();
// 					const valueEl = labelEl.nextElementSibling;
// 					const value = valueEl ? valueEl.innerText.trim() : 'N/A';

// 					if (label.includes('Type:')) {
// 						projectType = value;
// 					} else if (label.includes('Open Date:')) {
// 						openDate = value;
// 					} else if (label.includes('Questions Due Date:')) {
// 						questionsDueDate = value;
// 					} else if (label.includes('Contact Information:')) {
// 						contactInfo = value;
// 					} else if (label.includes('Close Date:')) {
// 						closeDate = value;
// 					} else if (label.includes('Days Left:')) {
// 						daysLeft = value;
// 					}
// 				}

// 				// Extract project description
// 				const descriptionEl = document.querySelector('.bfMarkdown');
// 				if (descriptionEl) {
// 					projectDescription = descriptionEl.innerText.trim();
// 				}

// 				// Extract important events
// 				const eventRows = document.querySelectorAll('#events-table tbody tr');
// 				if (eventRows.length > 0) {
// 					importantEvents = Array.from(eventRows).map((row) => {
// 						const statusEl = row.querySelector('td:nth-child(1) div');
// 						const nameEl = row.querySelector('td:nth-child(2)');
// 						const locationEl = row.querySelector('td:nth-child(3)');
// 						const descriptionEl = row.querySelector('td:nth-child(4)');
// 						const dateEl = row.querySelector('td:nth-child(5)');
// 						const mandatoryEl = row.querySelector('td:nth-child(6)');

// 						return {
// 							status: statusEl ? statusEl.innerText.trim() : 'N/A',
// 							name: nameEl ? nameEl.innerText.trim() : 'N/A',
// 							location: locationEl ? locationEl.innerText.trim() : 'N/A',
// 							description: descriptionEl
// 								? descriptionEl.innerText.trim()
// 								: 'N/A',
// 							date: dateEl ? dateEl.innerText.trim() : 'N/A',
// 							mandatory: mandatoryEl ? mandatoryEl.innerText.trim() : 'N/A',
// 						};
// 					});
// 				}

// 				// Extract commodity codes
// 				const commodityCodeDivs =
// 					document.querySelectorAll('.modalSection div');
// 				for (const div of commodityCodeDivs) {
// 					const badgeEl = div.querySelector('.commodityCodeBadge');
// 					const descriptionEl = div.querySelector('strong');

// 					if (badgeEl && descriptionEl) {
// 						commodityCodes.push({
// 							code: badgeEl.innerText.trim(),
// 							description: descriptionEl.innerText.trim(),
// 						});
// 					}
// 				}

// 				// Extract supporting documentation
// 				const documentRows = document.querySelectorAll(
// 					'#publicProjectDocumentsTable tbody tr'
// 				);
// 				if (documentRows.length > 0) {
// 					supportingDocumentation = Array.from(documentRows).map((row) => {
// 						const fileNameEl = row.querySelector('td:nth-child(1) strong');
// 						const typeEl = row.querySelector('td:nth-child(2)');
// 						const dateCreatedEl = row.querySelector('td:nth-child(4)');

// 						return {
// 							fileName: fileNameEl ? fileNameEl.innerText.trim() : 'N/A',
// 							type: typeEl ? typeEl.innerText.trim() : 'N/A',
// 							dateCreated: dateCreatedEl
// 								? dateCreatedEl.innerText.trim()
// 								: 'N/A',
// 						};
// 					});
// 				}

// 				// Extract requested information
// 				const requestedInfoRows = document.querySelectorAll(
// 					'#portalRequestedInformationTable-no-group tbody tr, [id^="portalRequestedInformationTable"] tbody tr'
// 				);
// 				if (requestedInfoRows.length > 0) {
// 					requestedInformation = Array.from(requestedInfoRows).map((row) => {
// 						const nameEl = row.querySelector('td:nth-child(1) b');
// 						const typeEl = row.querySelector('td:nth-child(2)');
// 						const filesEl = row.querySelector('td:nth-child(3)');
// 						const requirementEl = row.querySelector(
// 							'td:nth-child(4) span.badge'
// 						);

// 						return {
// 							name: nameEl ? nameEl.innerText.trim() : 'N/A',
// 							type: typeEl ? typeEl.innerText.trim() : 'N/A',
// 							files: filesEl ? filesEl.innerText.trim() : 'N/A',
// 							requirement: requirementEl
// 								? requirementEl.innerText.trim()
// 								: 'N/A',
// 						};
// 					});
// 				}

// 				return {
// 					projectType,
// 					openDate,
// 					questionsDueDate,
// 					contactInfo,
// 					closeDate,
// 					daysLeft,
// 					projectDescription,
// 					importantEvents: JSON.stringify(importantEvents),
// 					commodityCodes: JSON.stringify(commodityCodes),
// 					supportingDocumentation: JSON.stringify(supportingDocumentation),
// 					requestedInformation: JSON.stringify(requestedInformation),
// 				};
// 			});

// 			Object.assign(bid, detail);
// 		} catch (err) {
// 			console.error(`❌ Failed to scrape ${bid.projectLink}:`, err);
// 		}
// 	}

// 	await page.close();
// }

async function enrichBidDetails(bids, browser) {
	const page = await browser.newPage();

	for (const bid of bids) {
		try {
			if (bid.projectLink === 'N/A') {
				continue;
			}

			console.log(`🔎 Scraping details for: ${bid.bidTitle}`);
			await page.goto(bid.projectLink, {
				waitUntil: 'networkidle2',
				timeout: 60000,
			});

			await page.waitForSelector('body', { timeout: 30000 });

			const detail = await page.evaluate(() => {
				let projectType = 'N/A';
				let openDate = 'N/A';
				let questionsDueDate = 'N/A';
				let contactInfo = 'N/A';
				let closeDate = 'N/A';
				let daysLeft = 'N/A';
				let projectDescription = 'N/A';
				let importantEvents = [];
				let commodityCodes = [];
				let supportingDocumentation = [];
				let requestedInformation = [];

				// Parse modal section fields
				const detailSections = document.querySelectorAll(
					'.modalSection.projectDetailSection'
				);
				detailSections.forEach((section) => {
					const labelEl = section.querySelector('b');
					if (!labelEl) return;

					const label = labelEl.innerText.trim();
					const valueNode = labelEl.nextSibling;
					const value = valueNode ? valueNode.textContent.trim() : 'N/A';

					if (label.includes('Type:')) projectType = value;
					if (label.includes('Open Date:')) openDate = value;
					if (label.includes('Questions Due Date:')) questionsDueDate = value;
					if (label.includes('Contact Information:')) contactInfo = value;
					if (label.includes('Close Date:')) closeDate = value;
					if (label.includes('Days Left:')) daysLeft = value;
				});

				// Description
				const descriptionEl = document.querySelector('.bfMarkdown');
				if (descriptionEl) {
					projectDescription = descriptionEl.innerText.trim();
				}

				// Important events
				const eventRows = document.querySelectorAll('#events-table tbody tr');
				importantEvents = Array.from(eventRows).map((row) => ({
					status:
						row.querySelector('td:nth-child(1) div')?.innerText.trim() || 'N/A',
					name: row.querySelector('td:nth-child(2)')?.innerText.trim() || 'N/A',
					location:
						row.querySelector('td:nth-child(3)')?.innerText.trim() || 'N/A',
					description:
						row.querySelector('td:nth-child(4)')?.innerText.trim() || 'N/A',
					date: row.querySelector('td:nth-child(5)')?.innerText.trim() || 'N/A',
					mandatory:
						row.querySelector('td:nth-child(6)')?.innerText.trim() || 'N/A',
				}));

				// Commodity codes
				document.querySelectorAll('.commodityCodeBadge').forEach((badge) => {
					const description = badge.parentElement
						.querySelector('strong')
						?.innerText.trim();
					if (description) {
						commodityCodes.push({
							code: badge.innerText.trim(),
							description,
						});
					}
				});

				// Supporting documents
				const documentRows = document.querySelectorAll(
					'#publicProjectDocumentsTable tbody tr'
				);
				supportingDocumentation = Array.from(documentRows).map((row) => ({
					fileName:
						row.querySelector('td:nth-child(1) strong')?.innerText.trim() ||
						'N/A',
					type: row.querySelector('td:nth-child(2)')?.innerText.trim() || 'N/A',
					dateCreated:
						row.querySelector('td:nth-child(4)')?.innerText.trim() || 'N/A',
				}));

				// Requested information
				const requestedInfoRows = document.querySelectorAll(
					'#portalRequestedInformationTable-no-group tbody tr, [id^="portalRequestedInformationTable"] tbody tr'
				);
				requestedInformation = Array.from(requestedInfoRows).map((row) => ({
					name:
						row.querySelector('td:nth-child(1) b')?.innerText.trim() || 'N/A',
					type: row.querySelector('td:nth-child(2)')?.innerText.trim() || 'N/A',
					files:
						row.querySelector('td:nth-child(3)')?.innerText.trim() || 'N/A',
					requirement:
						row.querySelector('td:nth-child(4) span.badge')?.innerText.trim() ||
						'N/A',
				}));

				return {
					projectType,
					openDate,
					questionsDueDate,
					contactInfo,
					closeDate,
					daysLeft,
					projectDescription,
					importantEvents: JSON.stringify(importantEvents),
					commodityCodes: JSON.stringify(commodityCodes),
					supportingDocumentation: JSON.stringify(supportingDocumentation),
					requestedInformation: JSON.stringify(requestedInformation),
				};
			});

			Object.assign(bid, detail);
		} catch (err) {
			console.error(`❌ Failed to scrape ${bid.projectLink}:`, err);
		}
	}

	await page.close();
}
