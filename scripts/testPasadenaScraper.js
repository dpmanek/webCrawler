import { scrapePasadenaTexas } from './SpecificWebsiteScripts/PasadenaTexas.js';

async function testPasadenaScraper() {
	console.log('🚀 Starting Pasadena Texas bid scraper test...');

	try {
		const bids = await scrapePasadenaTexas();
		console.log('✅ Pasadena Texas scraper test completed successfully!');
		return bids;
	} catch (error) {
		console.error('❌ Pasadena Texas scraper test failed:', error);
		throw error;
	}
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testPasadenaScraper()
		.then(() => {
			console.log('🎉 Test completed!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('💥 Test failed:', error);
			process.exit(1);
		});
}

export { testPasadenaScraper };
