import { scrapeMontgomeryCounty } from './SpecificWebsiteScripts/MontgomeryCounty.js';

async function testMontgomeryCountyScraper() {
	console.log('🚀 Starting Montgomery County bid scraper test...');

	try {
		const bids = await scrapeMontgomeryCounty();
		console.log('✅ Montgomery County scraper test completed successfully!');
		return bids;
	} catch (error) {
		console.error('❌ Montgomery County scraper test failed:', error);
		throw error;
	}
}

// Run the test
testMontgomeryCountyScraper()
	.then(() => {
		console.log('🎉 Test completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('💥 Test failed:', error);
		process.exit(1);
	});
