import { scrapeBeltonTexas } from './SpecificWebsiteScripts/BeltonTexas.js';

async function testBeltonScraper() {
	console.log('🚀 Starting Belton Texas bid scraper test...');

	try {
		const bids = await scrapeBeltonTexas();

		console.log('\n📊 Scraping Results:');
		console.log(`Total bids found: ${bids.length}`);

		if (bids.length > 0) {
			console.log('\n📋 Sample bid data:');
			console.log('First bid:', JSON.stringify(bids[0], null, 2));

			// Show summary of bid types
			const pdfCount = bids.filter((bid) => bid.isPDF).length;
			const detailPageCount = bids.length - pdfCount;

			console.log(`\n📄 Bid Types:`);
			console.log(`PDF Documents: ${pdfCount}`);
			console.log(`Detail Pages: ${detailPageCount}`);

			// Show recent bids
			console.log('\n🕒 Recent bids:');
			bids.slice(0, 5).forEach((bid, index) => {
				console.log(`${index + 1}. ${bid.bidTitle}`);
				console.log(`   Opening: ${bid.openingDate}`);
				console.log(`   Closing: ${bid.closingDate}`);
				console.log(`   Type: ${bid.bidType}`);
				console.log('');
			});
		}

		console.log('✅ Belton Texas scraper test completed successfully!');
	} catch (error) {
		console.error('❌ Error running Belton Texas scraper:', error);
		process.exit(1);
	}
}

// Run the test
testBeltonScraper();
