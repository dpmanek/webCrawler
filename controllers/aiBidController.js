import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Anthropic for Claude (following reference pattern)
const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY,
});

// @desc    Analyze bid data with AI
// @route   POST /api/ai-chat
// @access  Public
export const analyzeBidData = async (req, res) => {
	try {
		const { message } = req.body;

		if (!message || typeof message !== 'string') {
			return res.status(400).json({ error: 'Message is required' });
		}

		// Load and process bid data
		const bidData = await loadBidData();

		// Generate AI response using Claude
		const response = await processWithClaude(bidData, message);

		res.json({
			success: true,
			response: response,
		});
	} catch (error) {
		console.error('Error in AI chat:', error);
		res.status(500).json({
			error: 'Failed to generate AI response',
			details: error.message,
		});
	}
};

// Function to load bid data from CSV files
async function loadBidData() {
	try {
		const outputDir = path.join(__dirname, '../output');
		const files = fs
			.readdirSync(outputDir)
			.filter((file) => file.endsWith('.csv'));

		let allBidData = [];

		for (const file of files) {
			const filePath = path.join(outputDir, file);
			const csvContent = fs.readFileSync(filePath, 'utf8');
			const lines = csvContent.split('\n');

			if (lines.length > 1) {
				const headers = lines[0]
					.split(',')
					.map((h) => h.replace(/"/g, '').trim());
				const cityName = file.replace('_bids.csv', '').replace(/[_-]/g, ' ');

				for (let i = 1; i < lines.length; i++) {
					if (lines[i].trim()) {
						const values = parseCSVLine(lines[i]);
						if (values.length >= headers.length) {
							const bidEntry = { city: cityName };
							headers.forEach((header, index) => {
								bidEntry[header] = values[index] || '';
							});
							allBidData.push(bidEntry);
						}
					}
				}
			}
		}

		console.log(
			`Loaded ${allBidData.length} bid entries from ${files.length} cities`
		);
		return allBidData;
	} catch (error) {
		console.error('Error loading bid data:', error);
		return [];
	}
}

// Simple CSV parser that handles quoted fields
function parseCSVLine(line) {
	const result = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];

		if (char === '"') {
			inQuotes = !inQuotes;
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}

	result.push(current.trim());
	return result.map((field) => field.replace(/^"|"$/g, ''));
}

// Function to process with Claude (following reference pattern)
async function processWithClaude(bidData, userMessage) {
	try {
		console.log('🔍 Claude function called for bid analysis');

		// Prepare complete dataset as structured JSON
		const completeDataset = prepareCompleteDataset(bidData);

		const systemPrompt = `You are an expert AI assistant specialized in analyzing government bid opportunities for contractors and businesses. You have access to complete real-time bid data from multiple Texas cities.

Your expertise includes:
- Analyzing bid values, deadlines, and project types
- Identifying opportunities based on company size and capabilities
- Spotting trends and patterns across different cities
- Providing strategic recommendations for bidding decisions
- Comparing opportunities and highlighting competitive advantages

Guidelines for responses:
- Always base answers on the actual data provided in the JSON dataset
- Use specific numbers, dates, and city names when relevant
- Format responses clearly with **bold** headings and bullet points
- Provide actionable insights and recommendations
- If asked about specific projects, include key details like value and deadline
- Help users prioritize opportunities based on their questions
- When analyzing deadlines, look for date patterns in various fields

Be conversational but professional, and focus on helping users make informed business decisions.`;

		const userContent = `${userMessage}

COMPLETE BID DATASET (JSON):
${JSON.stringify(completeDataset, null, 2)}`;

		const message = await anthropic.messages.create({
			model: 'claude-3-5-sonnet-20241022',
			max_tokens: 2000,
			temperature: 0.7,
			system: systemPrompt,
			messages: [
				{
					role: 'user',
					content: userContent,
				},
			],
		});

		console.log('✅ Claude response received successfully');
		return message.content[0].text;
	} catch (error) {
		console.error('❌ Error processing with Claude:', error);

		if (error.status === 401) {
			return 'AI analysis is not configured. Please add your Anthropic API key to the environment variables.';
		} else if (error.status === 429) {
			return "I'm currently experiencing high demand. Please try again in a moment.";
		} else if (error.status === 400) {
			return 'I had trouble understanding your question. Could you please rephrase it?';
		} else {
			return "I'm having trouble analyzing the bid data right now. Please try again in a moment.";
		}
	}
}

// Prepare complete dataset as structured JSON for Claude
function prepareCompleteDataset(bidData) {
	if (!bidData || bidData.length === 0) {
		return {
			error:
				'No bid data currently available. Please run some crawlers first to generate data.',
		};
	}

	const cities = [...new Set(bidData.map((bid) => bid.city))];
	const totalBids = bidData.length;

	// Get complete bid data with all fields preserved
	const completeBidData = bidData.map((bid, index) => {
		return {
			id: index + 1,
			city: bid.city,
			...bid, // Include all original fields from CSV
		};
	});

	// Get statistics
	const cityCounts = {};
	bidData.forEach((bid) => {
		cityCounts[bid.city] = (cityCounts[bid.city] || 0) + 1;
	});

	return {
		metadata: {
			totalBids: totalBids,
			citiesCount: cities.length,
			cities: cities,
			cityCounts: cityCounts,
			dataLastUpdated: new Date().toISOString(),
			note: 'Complete dataset of all bid opportunities from Texas municipalities',
		},
		bids: completeBidData,
	};
}

// Create a detailed summary of the bid data for AI context
function createDataSummary(bidData) {
	if (!bidData || bidData.length === 0) {
		return 'No bid data currently available. Please run some crawlers first to generate data.';
	}

	const cities = [...new Set(bidData.map((bid) => bid.city))];
	const totalBids = bidData.length;

	// Get sample data with better field detection
	const sampleBids = bidData
		.slice(0, 15)
		.map((bid) => {
			// Try to find common field names for title/description
			const title =
				bid.title ||
				bid.description ||
				bid.project ||
				bid.name ||
				bid['Project Title'] ||
				bid['Description'] ||
				'Untitled Project';

			// Try to find value/amount fields
			const value =
				bid.value ||
				bid.amount ||
				bid.estimate ||
				bid.budget ||
				bid['Estimated Value'] ||
				bid['Project Value'] ||
				'Not specified';

			// Try to find deadline fields
			const deadline =
				bid.deadline ||
				bid.due_date ||
				bid.closing_date ||
				bid['Due Date'] ||
				bid['Closing Date'] ||
				bid.date ||
				'Not specified';

			return `${bid.city}: ${title.substring(0, 80)}${
				title.length > 80 ? '...' : ''
			} | Value: ${value} | Due: ${deadline}`;
		})
		.join('\n');

	// Get some basic statistics
	const cityCounts = {};
	bidData.forEach((bid) => {
		cityCounts[bid.city] = (cityCounts[bid.city] || 0) + 1;
	});

	const topCities = Object.entries(cityCounts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([city, count]) => `${city}: ${count} bids`)
		.join(', ');

	return `DATASET OVERVIEW:
Total Opportunities: ${totalBids}
Cities Covered: ${cities.length} (${cities.join(', ')})
Top Cities by Volume: ${topCities}

SAMPLE RECENT OPPORTUNITIES:
${sampleBids}

Data Last Updated: ${new Date().toLocaleString()}

Note: This data includes various project types like construction, services, supplies, and professional services across Texas municipalities.`;
}
