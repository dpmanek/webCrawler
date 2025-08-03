import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import XLSX from 'xlsx';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
import { scrapeTexasCity } from './scripts/SpecificWebsiteScripts/TexasCity.js';
import { scrapeSanAntonio } from './scripts/SpecificWebsiteScripts/SanAntonio.js';
import { scrapeTomballISD } from './scripts/SpecificWebsiteScripts/TomballISD.js';
import { scrapeLeagueCityTexas } from './scripts/SpecificWebsiteScripts/LeagueCity.js';
import { scrapeAlvinTexas } from './scripts/SpecificWebsiteScripts/AlvinTexas.js';
import { scrapePortArthurt } from './scripts/SpecificWebsiteScripts/PortArthur.js';
import { scrapeSanMarcos } from './scripts/SpecificWebsiteScripts/SanMarcos.js';
import { scrapeDaytonTexas } from './scripts/SpecificWebsiteScripts/DaytonTexas.js';
import { scrapeMontBelvieu } from './scripts/SpecificWebsiteScripts/MontBelvieu.js';
import { scrapeLakeJackson } from './scripts/SpecificWebsiteScripts/LakeJackson.js';
import { scrapeGalvestonTexas } from './scripts/SpecificWebsiteScripts/GalvestonTexas.js';
import { scrapeHuntsvilleTexas } from './scripts/SpecificWebsiteScripts/HuntsvilleTexas.js';
import { scrapeBrazosValley } from './scripts/SpecificWebsiteScripts/BrazosValley.js';
import { scrapeAnderson } from './scripts/SpecificWebsiteScripts/Anderson.js';
import { scrapeCleveland } from './scripts/SpecificWebsiteScripts/Cleveland.js';
import { scrapeWallerCounty } from './scripts/SpecificWebsiteScripts/WallerCounty.js';
import { scrapeBeltonTexas } from './scripts/SpecificWebsiteScripts/BeltonTexas.js';
import { scrapePasadenaTexas } from './scripts/SpecificWebsiteScripts/PasadenaTexas.js';
import { scrapeWhartonCounty } from './scripts/SpecificWebsiteScripts/WhartonCounty.js';
import { scrapeCaldwellCounty } from './scripts/SpecificWebsiteScripts/CaldwellCounty.js';
import { scrapeMontgomeryCounty } from './scripts/SpecificWebsiteScripts/MontgomeryCounty.js';
import { analyzeBidData } from './controllers/aiBidController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dashboard/dist')));

// Get list of available crawlers
app.get('/api/crawlers', (req, res) => {
	const crawlers = [
		{
			id: 'texas-city',
			name: 'Texas City',
			filename: 'texascity_bids.csv',
			url: 'https://www.texascitytx.gov/Bids.aspx',
		},
		{
			id: 'san-antonio',
			name: 'San Antonio',
			filename: 'civcast_detailed_bids.csv',
			url: 'https://www.civcastusa.com/bids?page=1&projectName=wastewater&timeInfo=0&state=TX&isReversed=true&orderBy=BidDate',
		},
		{
			id: 'tomball-isd',
			name: 'Tomball ISD',
			filename: 'tomballisd_bids.csv',
			url: 'https://tomballisd.bonfirehub.com/portal/?tab=openOpportunities',
		},
		{
			id: 'league-city',
			name: 'League City',
			filename: 'leaguecity_bids.csv',
			url: 'https://www.leaguecitytx.gov/Bids.aspx?CatID=All&txtSort=BidNumberDesc&showAllBids=&Status=',
		},
		{
			id: 'alvin-texas',
			name: 'Alvin Texas',
			filename: 'alvintexas_bids.csv',
			url: 'https://www.alvin-tx.gov/Bids.aspx',
		},
		{
			id: 'port-arthur',
			name: 'Port Arthur',
			filename: 'port_arthur_bids.csv',
			url: 'https://www.portarthurtx.gov/bids.aspx',
		},
		{
			id: 'san-marcos',
			name: 'San Marcos',
			filename: 'san_marcos_bids.csv',
			url: 'https://www.sanmarcostx.gov/Bids.aspx?CatID=152&txtSort=Category&showAllBids=on&Status=open',
		},
		{
			id: 'dayton-texas',
			name: 'Dayton Texas',
			filename: 'dayton_texas_bids.csv',
			url: 'https://www.cityofdaytontx.com/business/bid-opportunities',
		},
		{
			id: 'mont-belvieu',
			name: 'Mont Belvieu',
			filename: 'mont_belvieu_bids.csv',
			url: 'https://www.montbelvieu.net/Bids.aspx?CatID=All&txtSort=Category&showAllBids=&Status=',
		},
		{
			id: 'lake-jackson',
			name: 'Lake Jackson',
			filename: 'lake_jackson_bids.csv',
			url: 'https://www.lakejackson-tx.gov/Bids.aspx?CatID=All&txtSort=Category&showAllBids=&Status=',
		},
		{
			id: 'galveston-texas',
			name: 'Galveston Texas',
			filename: 'galveston_texas_bids.csv',
			url: 'https://www.galvestontx.gov/Bids.aspx?CatID=All&txtSort=Category&showAllBids=&Status=',
		},
		{
			id: 'huntsville-texas',
			name: 'Huntsville Texas',
			filename: 'huntsville_texas_bids.csv',
			url: 'https://www.huntsvilletx.gov/Bids.aspx?CatID=showStatus&txtSort=Category&showAllBids=&Status=open',
		},
		{
			id: 'brazos-valley',
			name: 'Brazos Valley',
			filename: 'brazos_valley_bids.csv',
			url: 'https://brazosbid.ionwave.net/Login.aspx',
		},
		{
			id: 'anderson',
			name: 'Anderson',
			filename: 'anderson_bids.csv',
			url: 'https://www.co.anderson.tx.us/page/anderson.CA.Purchasing',
		},
		{
			id: 'cleveland',
			name: 'Cleveland',
			filename: 'cleveland_bids.csv',
			url: 'https://www.clevelandtexas.com/bids.aspx',
		},
		{
			id: 'waller-county',
			name: 'Waller County',
			filename: 'waller_county_bids.csv',
			url: 'https://www.co.waller.tx.us/page/BidsAndProposalRequests',
		},
		{
			id: 'belton-texas',
			name: 'Belton Texas',
			filename: 'belton_texas_bids.csv',
			url: 'https://www.beltontexas.gov/government/city_clerk/construction.php',
		},
		{
			id: 'pasadena-texas',
			name: 'Pasadena Texas',
			filename: 'pasadena_texas_bids.csv',
			url: 'https://www.pasadenatx.gov/611/Bid-Opportunities',
		},
		{
			id: 'wharton-county',
			name: 'Wharton County',
			filename: 'wharton_county_bids.csv',
			url: 'https://www.co.wharton.tx.us/page/wharton.Bids',
		},
		{
			id: 'caldwell-county',
			name: 'Caldwell County',
			filename: 'caldwell_county_bids.csv',
			url: 'https://www.co.caldwell.tx.us/page/BidRequests',
		},
		{
			id: 'montgomery-county',
			name: 'Montgomery County',
			filename: 'montgomery_county_bids.csv',
			url: 'https://www.mctx.org/departments/departments_l_-_p/purchasing/bid_proposal_opening_date.php',
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
			case 'port-arthur':
				result = await scrapePortArthurt();
				break;
			case 'san-marcos':
				result = await scrapeSanMarcos();
				break;
			case 'dayton-texas':
				result = await scrapeDaytonTexas();
				break;
			case 'mont-belvieu':
				result = await scrapeMontBelvieu();
				break;
			case 'lake-jackson':
				result = await scrapeLakeJackson();
				break;
			case 'galveston-texas':
				result = await scrapeGalvestonTexas();
				break;
			case 'huntsville-texas':
				result = await scrapeHuntsvilleTexas();
				break;
			case 'brazos-valley':
				result = await scrapeBrazosValley();
				break;
			case 'anderson':
				result = await scrapeAnderson();
				break;
			case 'cleveland':
				result = await scrapeCleveland();
				break;
			case 'waller-county':
				result = await scrapeWallerCounty();
				break;
			case 'belton-texas':
				result = await scrapeBeltonTexas();
				break;
			case 'pasadena-texas':
				result = await scrapePasadenaTexas();
				break;
			case 'wharton-county':
				result = await scrapeWhartonCounty();
				break;
			case 'caldwell-county':
				result = await scrapeCaldwellCounty();
				break;
			case 'montgomery-county':
				result = await scrapeMontgomeryCounty();
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
		await scrapePortArthurt();
		await scrapeSanMarcos();
		await scrapeDaytonTexas();
		await scrapeMontBelvieu();
		await scrapeLakeJackson();
		await scrapeGalvestonTexas();
		await scrapeHuntsvilleTexas();
		await scrapeBrazosValley();
		await scrapeAnderson();
		await scrapeCleveland();
		await scrapeWallerCounty();
		await scrapeBeltonTexas();
		await scrapePasadenaTexas();
		await scrapeWhartonCounty();
		await scrapeCaldwellCounty();
		await scrapeMontgomeryCounty();

		res.json({ success: true, message: 'All crawlers completed successfully' });
	} catch (error) {
		console.error('Error running all crawlers:', error);
		res.status(500).json({
			error: 'Failed to run all crawlers',
			details: error.message,
		});
	}
});

// AI Chat endpoint (using controller)
app.post('/api/ai-chat', analyzeBidData);

// Combine all CSV files into a single Excel file
app.post('/api/export-excel', (req, res) => {
	try {
		const outputDir = path.join(__dirname, 'output');
		const workbook = XLSX.utils.book_new();

		// Read all CSV files in the output directory
		const files = fs
			.readdirSync(outputDir)
			.filter((file) => file.endsWith('.csv'));

		if (files.length === 0) {
			return res.status(404).json({ error: 'No CSV files found to export' });
		}

		files.forEach((file) => {
			const filePath = path.join(outputDir, file);

			try {
				// Read CSV file and let XLSX handle the parsing properly
				const workbookFromCSV = XLSX.readFile(filePath);
				const sheetName = workbookFromCSV.SheetNames[0];
				const worksheet = workbookFromCSV.Sheets[sheetName];

				// Create sheet name from filename (remove .csv and clean up)
				let newSheetName = file.replace('.csv', '').replace(/_/g, ' ');

				// Truncate sheet name if too long (Excel limit is 31 characters)
				if (newSheetName.length > 31) {
					newSheetName = newSheetName.substring(0, 31);
				}

				// Add worksheet to workbook
				XLSX.utils.book_append_sheet(workbook, worksheet, newSheetName);
			} catch (fileError) {
				console.error(`Error processing file ${file}:`, fileError);
			}
		});

		// Generate Excel file buffer
		const excelBuffer = XLSX.write(workbook, {
			type: 'buffer',
			bookType: 'xlsx',
		});

		// Set response headers for file download
		const timestamp = new Date().toISOString().split('T')[0];
		const filename = `combined_bids_${timestamp}.xlsx`;

		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.setHeader(
			'Content-Type',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		);

		// Send the Excel file
		res.send(excelBuffer);
	} catch (error) {
		console.error('Error creating Excel file:', error);
		res.status(500).json({
			error: 'Failed to create Excel file',
			details: error.message,
		});
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
