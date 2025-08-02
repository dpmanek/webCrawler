const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// @desc    Test endpoint for debugging
// @route   GET /api/test
// @access  Public
router.get('/', (req, res) => {
	try {
		res.status(200).json({
			success: true,
			message: 'Test endpoint working',
			timestamp: new Date().toISOString(),
			headers: req.headers,
			cloudfront: req.headers['x-forwarded-for'] ? true : false,
			origin: req.headers.origin || 'No origin header',
			host: req.headers.host || 'No host header',
		});
	} catch (error) {
		console.error('Test endpoint error:', error);
		res.status(500).json({
			success: false,
			error: 'Test endpoint error',
			errorMessage: error.message,
		});
	}
});

// @desc    Test MongoDB connection
// @route   GET /api/test/db
// @access  Public
router.get('/db', async (req, res) => {
	try {
		console.log('Testing MongoDB connection...');

		// Check if MongoDB is connected
		if (mongoose.connection.readyState !== 1) {
			return res.status(503).json({
				success: false,
				message: 'MongoDB not connected',
				readyState: mongoose.connection.readyState,
				readyStateText: getReadyStateText(mongoose.connection.readyState),
				mongoURI: process.env.MONGODB_URI.replace(
					/\/\/([^:]+):([^@]+)@/,
					'//***:***@'
				), // Hide credentials
			});
		}

		// Get connection info
		const connectionInfo = {
			host: mongoose.connection.host,
			port: mongoose.connection.port,
			name: mongoose.connection.name,
		};

		// List collections
		const collections = await mongoose.connection.db
			.listCollections()
			.toArray();
		const collectionNames = collections.map((c) => c.name);

		// Count documents in tickets collection if it exists
		let ticketsCount = null;
		if (collectionNames.includes('tickets')) {
			ticketsCount = await mongoose.connection.db
				.collection('tickets')
				.countDocuments();
		}

		res.status(200).json({
			success: true,
			message: 'MongoDB connection test successful',
			connection: connectionInfo,
			collections: collectionNames,
			ticketsCount,
			readyState: mongoose.connection.readyState,
			readyStateText: getReadyStateText(mongoose.connection.readyState),
		});
	} catch (error) {
		console.error('MongoDB test error:', error);
		res.status(500).json({
			success: false,
			error: 'MongoDB test error',
			errorMessage: error.message,
			stack: error.stack,
		});
	}
});

// Helper function to get readable MongoDB connection state
function getReadyStateText(state) {
	switch (state) {
		case 0:
			return 'disconnected';
		case 1:
			return 'connected';
		case 2:
			return 'connecting';
		case 3:
			return 'disconnecting';
		default:
			return 'unknown';
	}
}

module.exports = router;
