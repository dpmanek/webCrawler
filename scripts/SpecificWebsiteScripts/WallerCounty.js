import puppeteer from 'puppeteer';
import { saveToCSV } from '../utils/saveToCSV.js';

export async function scrapeWallerCounty() {
	console.log('🔍 Starting Waller County bid scraping...');

	const browser = await puppeteer.launch({
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	});

	try {
		const page = await browser.newPage();
		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		);

		const url = 'https://www.co.waller.tx.us/page/BidsAndProposalRequests';
		console.log(`📄 Navigating to: ${url}`);

		await page.goto(url, {
			waitUntil: 'networkidle2',
			timeout: 30000,
		});

		// Wait for content to load
		await page.waitForSelector('.widgettable', { timeout: 10000 });

		console.log('📋 Extracting bid information...');

		// Extract bid information
		const bids = await page.evaluate(() => {
			const bidData = [];

			// Look for the specific bid content - focus on the main content area
			const widgetItems = document.querySelectorAll('.widgetitem .eztext_area');

			widgetItems.forEach((textArea) => {
				const links = textArea.querySelectorAll('a');
				const text = textArea.textContent.trim();

				// Skip navigation links and headers
				if (
					text.includes('HOME') ||
					text.includes('SITEMAP') ||
					text.includes('CONTACT') ||
					text.includes('TRANSLATE') ||
					text.includes('Competitive Bidding Notices') ||
					text.includes('Waller County Request for Bids:') ||
					text.length < 10
				) {
					return;
				}

				if (links.length >= 2) {
					// First link should be the main bid document (PDF)
					const mainLink = links[0];
					const pricingLink = links[1];

					const bidTitle = mainLink.textContent.trim();
					const bidHref = mainLink.getAttribute('href');
					const pricingHref = pricingLink.getAttribute('href');

					// Only process if it looks like a bid document (contains file extensions or bid numbers)
					if (
						bidTitle &&
						bidHref &&
						(bidHref.includes('.pdf') ||
							bidHref.includes('upload') ||
							bidTitle.match(/^[A-Z0-9-]+/) ||
							bidTitle.includes('Road') ||
							bidTitle.includes('Bridge') ||
							bidTitle.includes('RFP'))
					) {
						// Extract bid number
						const bidNumberMatch = bidTitle.match(/^([A-Z0-9-]+)/);
						const bidNumber = bidNumberMatch ? bidNumberMatch[1] : '';

						// Build full URLs
						const mainUrl = bidHref.startsWith('http')
							? bidHref
							: `https://www.co.waller.tx.us${bidHref}`;
						const pricingUrl = pricingHref
							? pricingHref.startsWith('http')
								? pricingHref
								: `https://www.co.waller.tx.us${pricingHref}`
							: '';

						// Create documents list
						let documents = [`Main Document (PDF): ${mainUrl}`];
						if (pricingUrl) {
							documents.push(`Pricing Form (Excel): ${pricingUrl}`);
						}

						bidData.push({
							bidTitle: bidTitle,
							bidNumber: bidNumber,
							bidType: 'Request for Bids',
							organization: 'Waller County',
							status: 'Open',
							bidLink: mainUrl,
							fileName: bidNumber || bidTitle,
							issueDate: '',
							closeDate: '',
							description: bidTitle,
							contactInfo:
								'Waller County, Texas | 425 FM 1488 | Hempstead, TX 77445 | (979) 826-7600',
							notes: `Documents available: ${documents.join('; ')}`,
							pricingFormUrl: pricingUrl,
						});
					}
				}
			});

			return bidData;
		});

		console.log(`📋 Found ${bids.length} bids`);

		// Process bids for CSV output
		const processedBids = bids.map((bid, index) => {
			console.log(
				`✅ Processing bid ${index + 1}/${bids.length}: ${bid.bidTitle}`
			);

			return {
				bidTitle: bid.bidTitle,
				bidPeriod: '',
				bidType: bid.bidType,
				organization: bid.organization,
				status: bid.status,
				bidLink: bid.bidLink,
				fileName: bid.fileName,
				issueDate: bid.issueDate,
				closeDate: bid.closeDate,
				description: bid.description,
				contactInfo: bid.contactInfo,
				notes: bid.notes,
			};
		});

		// Save to CSV
		if (processedBids.length > 0) {
			const csvPath = await saveToCSV(processedBids, 'waller_county_bids.csv');
			console.log(`✅ Saved: ${csvPath}`);
			console.log(
				`💾 Saved ${processedBids.length} bids to waller_county_bids.csv`
			);
		} else {
			console.log('⚠️ No bids found to save');
		}

		console.log('🔍 Waller County scraping completed');
		return processedBids;
	} catch (error) {
		console.error('❌ Error during Waller County scraping:', error);
		throw error;
	} finally {
		await browser.close();
	}
}
