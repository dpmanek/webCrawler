import puppeteer from 'puppeteer';

async function debugBeltonScraper() {
	console.log('🔍 Debug mode: Analyzing Belton Texas website structure...');

	const browser = await puppeteer.launch({
		headless: false,
		slowMo: 1000, // Slow down for debugging
	});
	const page = await browser.newPage();

	try {
		console.log('📍 Navigating to Belton construction page...');
		await page.goto(
			'https://www.beltontexas.gov/government/city_clerk/construction.php',
			{
				waitUntil: 'networkidle2',
				timeout: 60000,
			}
		);

		// Wait a bit for the page to fully load
		await page.waitForTimeout(3000);

		console.log('🔎 Analyzing page structure...');

		const pageInfo = await page.evaluate(() => {
			// Get all tables
			const tables = document.querySelectorAll('table');
			console.log(`Found ${tables.length} tables`);

			let tableInfo = [];
			tables.forEach((table, index) => {
				const rows = table.querySelectorAll('tr');
				const firstRowText = rows[0]
					? rows[0].innerText.substring(0, 100)
					: 'No rows';
				tableInfo.push({
					index,
					rowCount: rows.length,
					firstRowText,
					hasRpfbidsClass: table.classList.contains('rpfbids'),
				});
			});

			// Look for the specific table structure from the HTML
			const rpfbidsTable = document.querySelector('table.rpfbids');
			let rpfbidsInfo = null;

			if (rpfbidsTable) {
				const rows = rpfbidsTable.querySelectorAll('tr');
				rpfbidsInfo = {
					found: true,
					rowCount: rows.length,
					sampleRowHTML: rows[1]
						? rows[1].outerHTML.substring(0, 500)
						: 'No second row',
				};
			}

			// Look for nested tables
			const nestedTables = document.querySelectorAll('table table');
			let nestedTableInfo = [];
			nestedTables.forEach((table, index) => {
				const rows = table.querySelectorAll('tr');
				const links = table.querySelectorAll('a');
				nestedTableInfo.push({
					index,
					rowCount: rows.length,
					linkCount: links.length,
					firstLinkText: links[0] ? links[0].innerText.trim() : 'No links',
					firstLinkHref: links[0] ? links[0].href : 'No href',
				});
			});

			return {
				tableInfo,
				rpfbidsInfo,
				nestedTableInfo,
				totalLinks: document.querySelectorAll('a').length,
			};
		});

		console.log('📊 Page Analysis Results:');
		console.log('Tables found:', pageInfo.tableInfo);
		console.log('RPFBIDS table:', pageInfo.rpfbidsInfo);
		console.log('Nested tables:', pageInfo.nestedTableInfo);
		console.log('Total links on page:', pageInfo.totalLinks);

		// Wait for user to see the browser
		console.log(
			'🔍 Browser is open for inspection. Press any key to continue...'
		);
		await new Promise((resolve) => {
			process.stdin.once('data', resolve);
		});
	} catch (error) {
		console.error('❌ Error during debugging:', error);
	} finally {
		await browser.close();
	}
}

debugBeltonScraper();
