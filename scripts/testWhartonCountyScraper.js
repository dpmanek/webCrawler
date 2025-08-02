import { scrapeWhartonCounty } from './SpecificWebsiteScripts/WhartonCounty.js';

async function testWhartonCountyScraper() {
	console.log('🚀 Starting Wharton County bid scraper test...');

	try {
		const bids = await scrapeWhartonCounty();
		console.log('✅ Wharton County scraper test completed successfully!');
		return bids;
	} catch (error) {
		console.error('❌ Wharton County scraper test failed:', error);
		throw error;
	}
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testWhartonCountyScraper()
		.then(() => {
			console.log('🎉 Test completed!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Test failed:', error);
			process.exit(1);
		});
}

export { testWhartonCountyScraper };
