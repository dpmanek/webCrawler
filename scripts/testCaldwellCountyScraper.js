import { scrapeCaldwellCounty } from './SpecificWebsiteScripts/CaldwellCounty.js';

async function testCaldwellCountyScraper() {
	console.log('🚀 Starting Caldwell County bid scraper test...');

	try {
		const bids = await scrapeCaldwellCounty();
		console.log('✅ Caldwell County scraper test completed successfully!');
		return bids;
	} catch (error) {
		console.error('❌ Caldwell County scraper test failed:', error);
		throw error;
	}
}

// Run the test
testCaldwellCountyScraper()
	.then(() => {
		console.log('🎉 Test completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Test failed:', error);
		process.exit(1);
	});
