const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const Ticket = require('../models/Ticket');
const ScrapedTicket = require('../models/ScrapedTicket');

// Use stealth plugin
puppeteerExtra.use(StealthPlugin());

// @desc    Scrape a ticket page
// @route   POST /api/scrape/:id
// @access  Public
exports.scrapeTicket = async (req, res) => {
	try {
		const simbaId = req.params.id;

		// Construct the URL to scrape - use the deployed frontend URL
		// const frontendUrl = 'https://d1v9dmgp4scf60.cloudfront.net';
		// For local development:
		const frontendUrl = 'http://localhost:5173';
		const ticketUrl = `${frontendUrl}/tickets/${simbaId}`;

		// Launch the browser
		const browser = await puppeteerExtra.launch({
			headless: 'new',
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		try {
			const page = await browser.newPage();

			// Set viewport size to ensure all elements are visible
			await page.setViewport({ width: 1280, height: 800 });

			// Navigate to the ticket page and wait for it to be fully loaded
			await page.goto(ticketUrl, {
				waitUntil: 'networkidle2',
				timeout: 30000,
			});

			// Wait for critical elements to be available
			await page
				.waitForSelector('.ticket-content', { timeout: 10000 })
				.catch((e) => console.log('Warning: .ticket-content not found'));

			// Wait for the Requester Information section specifically
			await page
				.waitForSelector('.detail-value.ticket-first-name', { timeout: 10000 })
				.catch((e) => console.log('Warning: .ticket-first-name not found'));

			// Wait an additional 3 seconds for all content to render
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Actually scrape the data from the page using Puppeteer with exact selectors
			const scrapedData = await page.evaluate(() => {
				// Helper function to safely get text content
				const getText = (selector) => {
					const element = document.querySelector(selector);
					return element ? element.textContent.trim() : '';
				};

				// Debug: Log all elements with ticket-related classes
				console.log('=== DEBUG: All elements with ticket classes ===');
				const allTicketElements =
					document.querySelectorAll('[class*="ticket-"]');
				console.log(
					'Found',
					allTicketElements.length,
					'elements with ticket classes'
				);
				for (let i = 0; i < allTicketElements.length; i++) {
					const el = allTicketElements[i];
					console.log(
						`Element ${i}:`,
						el.className,
						'=',
						el.textContent.trim()
					);
				}

				// Debug: Log the entire Requester Information section
				console.log('=== DEBUG: Requester Information Section ===');
				const requesterSections = document.querySelectorAll('.ticket-section');
				for (const section of requesterSections) {
					const heading = section.querySelector('h3');
					if (
						heading &&
						heading.textContent.includes('Requester Information')
					) {
						console.log('Found Requester Information section');
						console.log('Section HTML:', section.innerHTML);
						break;
					}
				}

				// Extract data using the exact structure from the TicketDetail.jsx component
				// SIMBA ID is in a span with class 'ticket-id' inside an h2 element
				const simbaId = getText('h2 .ticket-id');

				// Title is in a p with class 'ticket-title'
				const title = getText('p.ticket-title');

				// Description is in a p with class 'ticket-description'
				const description = getText('p.ticket-description');

				// Priority is in a span with classes 'priority-badge' and 'ticket-priority'
				const priority =
					getText('span.priority-badge.ticket-priority') || 'Medium';

				// SIMBA Status is in a span with classes 'status-badge' and 'ticket-status'
				const simba_status =
					getText('span.status-badge.ticket-status') || 'InProgress';

				// User information fields - use multiple approaches
				let firstName = '';
				let lastName = '';
				let user_id = '';

				// Approach 1: Direct selectors
				firstName = getText('.detail-value.ticket-first-name');
				lastName = getText('.detail-value.ticket-last-name');
				user_id = getText('.detail-value.ticket-user-id');

				console.log('Direct selector results:');
				console.log('firstName:', firstName);
				console.log('lastName:', lastName);
				console.log('user_id:', user_id);

				// Debug: Check if elements exist but are empty
				const firstNameEl = document.querySelector(
					'.detail-value.ticket-first-name'
				);
				const lastNameEl = document.querySelector(
					'.detail-value.ticket-last-name'
				);
				const userIdEl = document.querySelector('.detail-value.ticket-user-id');

				console.log('Element existence check:');
				console.log(
					'firstNameEl exists:',
					!!firstNameEl,
					firstNameEl ? firstNameEl.textContent : 'null'
				);
				console.log(
					'lastNameEl exists:',
					!!lastNameEl,
					lastNameEl ? lastNameEl.textContent : 'null'
				);
				console.log(
					'userIdEl exists:',
					!!userIdEl,
					userIdEl ? userIdEl.textContent : 'null'
				);

				// Approach 2: If direct selectors fail, use HTML regex
				if (!firstName || !lastName || !user_id) {
					console.log('Direct selectors failed, trying HTML regex...');
					const pageHTML = document.documentElement.outerHTML;

					if (!firstName) {
						const firstNameMatch = pageHTML.match(
							/<span[^>]*class="[^"]*ticket-first-name[^"]*"[^>]*>([^<]+)<\/span>/
						);
						if (firstNameMatch) {
							firstName = firstNameMatch[1].trim();
							console.log('Found firstName via regex:', firstName);
						}
					}

					if (!lastName) {
						const lastNameMatch = pageHTML.match(
							/<span[^>]*class="[^"]*ticket-last-name[^"]*"[^>]*>([^<]+)<\/span>/
						);
						if (lastNameMatch) {
							lastName = lastNameMatch[1].trim();
							console.log('Found lastName via regex:', lastName);
						}
					}

					if (!user_id) {
						const userIdMatch = pageHTML.match(
							/<span[^>]*class="[^"]*ticket-user-id[^"]*"[^>]*>([^<]+)<\/span>/
						);
						if (userIdMatch) {
							user_id = userIdMatch[1].trim();
							console.log('Found user_id via regex:', user_id);
						}
					}
				}

				// Approach 3: Hardcoded extraction based on known HTML structure
				if (!firstName || !lastName || !user_id) {
					console.log('Regex failed, trying hardcoded extraction...');

					// Look for the exact pattern we know exists
					const requesterSections =
						document.querySelectorAll('.ticket-section');
					for (const section of requesterSections) {
						const heading = section.querySelector('h3');
						if (
							heading &&
							heading.textContent.includes('Requester Information')
						) {
							const detailItems = section.querySelectorAll('.detail-item');
							for (const item of detailItems) {
								const label = item.querySelector('.detail-label');
								const value = item.querySelector('.detail-value');
								if (label && value) {
									const labelText = label.textContent.trim();
									const valueText = value.textContent.trim();

									if (labelText === 'First Name:' && !firstName) {
										firstName = valueText;
										console.log('Hardcoded extraction - firstName:', firstName);
									} else if (labelText === 'Last Name:' && !lastName) {
										lastName = valueText;
										console.log('Hardcoded extraction - lastName:', lastName);
									} else if (labelText === 'User ID:' && !user_id) {
										user_id = valueText;
										console.log('Hardcoded extraction - user_id:', user_id);
									}
								}
							}
						}
					}
				}

				// Approach 4: Final fallback - extract from known positions
				if (!firstName || !lastName || !user_id) {
					console.log('All approaches failed, using final fallback...');

					// Based on the HTML structure provided, extract directly
					const allSpans = document.querySelectorAll('span');
					for (const span of allSpans) {
						const className = span.className;
						const text = span.textContent.trim();

						if (className.includes('ticket-first-name') && !firstName) {
							firstName = text;
							console.log('Final fallback - firstName:', firstName);
						} else if (className.includes('ticket-last-name') && !lastName) {
							lastName = text;
							console.log('Final fallback - lastName:', lastName);
						} else if (className.includes('ticket-user-id') && !user_id) {
							user_id = text;
							console.log('Final fallback - user_id:', user_id);
						}
					}
				}

				// Log final results
				console.log('Final scraped values:');
				console.log('firstName:', firstName);
				console.log('lastName:', lastName);
				console.log('user_id:', user_id);

				// Created date is in a span with class 'detail-value ticket-created-at'
				const createdAtText = getText('.detail-value.ticket-created-at');

				// Updated date is in a span with class 'detail-value ticket-updated-at'
				const updatedAtText = getText('.detail-value.ticket-updated-at');

				// Convert date strings to Date objects
				const createdAt = createdAtText
					? new Date(createdAtText).toISOString()
					: new Date().toISOString();
				const updatedAt = updatedAtText
					? new Date(updatedAtText).toISOString()
					: new Date().toISOString();

				// Ticket category field - get the raw value, not the formatted display value
				let ticket_category =
					getText('.detail-value.ticket-ticket-category') || '';

				// Convert display name back to code if needed
				if (ticket_category === 'HR Onboarding') {
					ticket_category = 'REQ-HR-ONBOARD';
				} else if (ticket_category === 'Developer Repository') {
					ticket_category = 'REQ-DEV-REPO';
				} else if (ticket_category === 'Marketing CRM') {
					ticket_category = 'REQ-MARKETING-CRM';
				} else if (ticket_category === 'Finance Application') {
					ticket_category = 'REQ-FIN-APP';
				}
				const requested_resource =
					getText('.detail-value.ticket-requested-resource') || '';
				const access_level =
					getText('.detail-value.ticket-access-level') || 'Read';
				const current_status =
					getText('.detail-value.ticket-current-status') || 'Pending Approval';

				// System fields - these might not be visible on the frontend
				const simba_id = getText('.detail-value.ticket-simba-id') || simbaId;
				const simba_status_from_system =
					getText('.detail-value.ticket-simba-status') || simba_status;
				// Don't generate an ART ID when scraping, use the existing one if available
				const art_id = getText('.detail-value.ticket-art-id') || null;
				const art_status = getText('.detail-value.ticket-art-status') || null;
				const provisioning_outcome =
					getText('.detail-value.ticket-provisioning-outcome') || 'None';
				const remediation_needed =
					getText('.detail-value.ticket-remediation-needed') || 'None';

				// For complex fields, we'll use defaults if not found
				// These would typically be handled by backend logic
				const error_details = {
					code: getText('.detail-value.ticket-error-code') || 'NO_ERROR',
					message: getText('.detail-value.ticket-error-message') || 'No error',
				};

				const approver = {
					approver_id:
						getText('.detail-value.ticket-approver-id') || 'approver-001',
					first_name:
						getText('.detail-value.ticket-approver-first-name') ||
						firstName ||
						'Unknown',
					last_name:
						getText('.detail-value.ticket-approver-last-name') ||
						lastName ||
						'User',
					approval_for: 'Simba',
				};

				// Workflow state - use default if not found
				const workflow_state = [
					{
						current_node:
							getText('.detail-value.ticket-workflow-current-node') ||
							'submission',
						steps_completed: ['validate_request', 'log_ticket'],
					},
					{
						current_node: 'approval',
						steps_completed: [],
					},
				];

				// Timestamps
				const created_timestamp = createdAt;
				const last_updated_timestamp = updatedAt;

				return {
					simbaId,
					title,
					description,
					priority,
					firstName: firstName,
					lastName: lastName,
					user_id: user_id,
					createdAt,
					updatedAt,
					// New fields
					ticket_category,
					requested_resource,
					access_level,
					current_status,
					simba_id,
					simba_status: simba_status_from_system,
					art_id,
					art_status,
					provisioning_outcome,
					remediation_needed,
					error_details,
					approver,
					workflow_state,
					created_timestamp,
					last_updated_timestamp,
				};
			});

			// Save the scraped data to the database
			const scrapedTicket = await ScrapedTicket.create({
				originalSimbaId: simbaId,
				scrapedData,
				sourceUrl: ticketUrl,
			});

			// Return both the scraped data and the database record
			res.status(200).json({
				success: true,
				data: {
					scrapedTicket,
					scrapedData,
				},
			});
		} finally {
			// Close the browser
			await browser.close();
		}
	} catch (error) {
		console.error('Error scraping ticket:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};

// Removed unused functions for getting scraped tickets
