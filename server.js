import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import { scrapeTexasCity } from './scripts/SpecificWebsiteScripts/TexasCity.js';
import { scrapeSanAntonio } from './scripts/SpecificWebsiteScripts/SanAntonio.js';
import { scrapeTomballISD } from './scripts/SpecificWebsiteScripts/TomballISD.js';
import { scrapeLeagueCityTexas } from './scripts/SpecificWebsiteScripts/LeagueCity.js';
import { scrapeAlvinTexas } from './scripts/SpecificWebsiteScripts/AlvinTexas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dashboard/dist')));

// Get list of available crawlers
app.get('/api/crawlers', (req, res) => {
	const crawlers = [
		{ id: 'texas-city', name: 'Texas City', filename: 'texascity_bids.csv' },
		{ id: 'san-antonio', name: 'San Antonio', filename: 'sanantonio_bids.csv' },
		{ id: 'tomball-isd', name: 'Tomball ISD', filename: 'tomballisd_bids.csv' },
		{ id: 'league-city', name: 'League City', filename: 'leaguecity_bids.csv' },
		{
			id: 'alvin-texas',
			name: 'Alvin Texas',
			filename: 'civcast_detailed_bids.csv',
		},
	];

	res.json(crawlers);
});

// Get list of available CSV files
app.get('/api/csv-files', (req, res) => {
	const outputDir = path.join(__dirname, 'output');

	fs.readdir(outputDir, (err, files) => {
		if (err) {
			console.error('Error reading output directory:', err);
			return res.status(500).json({ error: 'Failed to read output directory' });
		}

		const csvFiles = files
			.filter((file) => file.endsWith('.csv'))
			.map((file) => ({
				filename: file,
				path: `/api/download/${file}`,
				lastModified: fs.statSync(path.join(outputDir, file)).mtime,
			}));

		res.json(csvFiles);
	});
});

// Download a CSV file
app.get('/api/download/:filename', (req, res) => {
	const filename = req.params.filename;
	const filePath = path.join(__dirname, 'output', filename);

	if (!fs.existsSync(filePath)) {
		return res.status(404).json({ error: 'File not found' });
	}

	res.download(filePath);
});

// Run a specific crawler
app.post('/api/run-crawler/:id', async (req, res) => {
	const crawlerId = req.params.id;

	try {
		let result;

		switch (crawlerId) {
			case 'texas-city':
				result = await scrapeTexasCity();
				break;
			case 'san-antonio':
				result = await scrapeSanAntonio();
				break;
			case 'tomball-isd':
				result = await scrapeTomballISD();
				break;
			case 'league-city':
				result = await scrapeLeagueCityTexas();
				break;
			case 'alvin-texas':
				result = await scrapeAlvinTexas();
				break;
			default:
				return res.status(404).json({ error: 'Crawler not found' });
		}

		res.json({
			success: true,
			message: `${crawlerId} crawler completed successfully`,
		});
	} catch (error) {
		console.error(`Error running ${crawlerId} crawler:`, error);
		res.status(500).json({
			error: `Failed to run ${crawlerId} crawler`,
			details: error.message,
		});
	}
});

// Run all crawlers
app.post('/api/run-all-crawlers', async (req, res) => {
	try {
		// Run all crawlers in sequence
		await scrapeTexasCity();
		await scrapeSanAntonio();
		await scrapeTomballISD();
		await scrapeLeagueCityTexas();
		await scrapeAlvinTexas();

		res.json({ success: true, message: 'All crawlers completed successfully' });
	} catch (error) {
		console.error('Error running all crawlers:', error);
		res
			.status(500)
			.json({ error: 'Failed to run all crawlers', details: error.message });
	}
});

// Serve React app for any other routes
// Commenting out for now as it's causing issues with path-to-regexp
// app.get('/*', (req, res) => {
// 	res.sendFile(path.join(__dirname, 'dashboard/dist', 'index.html'));
// });

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
