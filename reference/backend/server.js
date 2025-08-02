require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Import MongoDB connection
const connectDB = require('./db');

// Import routes
const ticketRoutes = require('./routes/tickets');
const scraperRoutes = require('./routes/scraper');
const analyzerRoutes = require('./routes/analyzer');
const testRoutes = require('./routes/test');

// Import Swagger configuration
const { swaggerUi, swaggerDocs } = require('./swagger');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5001;

// Check if SSL certificates exist
let sslOptions;
try {
	sslOptions = {
		key: fs.readFileSync(path.join(__dirname, 'ssl', 'privkey.pem')),
		cert: fs.readFileSync(path.join(__dirname, 'ssl', 'fullchain.pem')),
	};
} catch (error) {
	console.warn('SSL certificates not found. HTTPS server will not start.');
	console.warn("You can generate certificates using Let's Encrypt certbot.");
	sslOptions = null;
}

// Connect to MongoDB
connectDB();

// No longer need Google AI initialization since it's in analyzerController.js

// Middleware
// Configure CORS with specific options to handle preflight requests properly
const corsOptions = {
	origin: [
		'http://localhost:5173',
		'https://d1v9dmgp4scf60.cloudfront.net',
		// Allow both with and without www
		'https://www.d1v9dmgp4scf60.cloudfront.net',
		// Allow S3 website endpoint
		'http://aiscraper-frontend.s3-website-us-east-1.amazonaws.com',
		// Allow CloudFront distribution for frontend
		'https://d1v9dmgp4scf60.cloudfront.net',
	],
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
	allowedHeaders: [
		'Content-Type',
		'Authorization',
		'X-Requested-With',
		'Accept',
	],
	credentials: true,
	preflightContinue: false,
	optionsSuccessStatus: 204,
	maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// Trust proxy headers from CloudFront
app.set('trust proxy', true);

// Add a specific handler for OPTIONS requests
app.options('*', cors(corsOptions));

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = path.join(__dirname, 'uploads');
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir);
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${file.originalname}`);
	},
});

const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		// Accept only image files
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed!'));
		}
	},
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir);
}

// Removed OCR and URL scraping endpoints - now handled by analyzer routes

// Moved all helper functions to analyzerController.js

// Removed text analysis endpoint - now handled by analyzer routes

// Set up Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Mount routes
app.use('/api/tickets', ticketRoutes);
app.use('/api', scraperRoutes);
app.use('/api', analyzerRoutes);
app.use('/api/test', testRoutes);

// Serve static files for ticket pages in production
// This will be useful when we deploy the application
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '../frontend/dist')));

	// Handle React routing, return all requests to React app
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
	});
}

// Moved all Cloudflare-related functions to analyzerController.js

// Create HTTP server
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
	console.log(`HTTP Server running on port ${HTTP_PORT}`);
});

// Create HTTPS server if SSL certificates are available
if (sslOptions) {
	// Create directory for SSL certificates if it doesn't exist
	const sslDir = path.join(__dirname, 'ssl');
	if (!fs.existsSync(sslDir)) {
		fs.mkdirSync(sslDir, { recursive: true });
	}

	const httpsServer = https.createServer(sslOptions, app);
	httpsServer.listen(HTTPS_PORT, () => {
		console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
	});
	console.log(
		`To access the HTTPS server, go to https://your-domain:${HTTPS_PORT}`
	);
} else {
	console.log('HTTPS Server not started due to missing SSL certificates');
	console.log(
		'To enable HTTPS, place SSL certificates in the "ssl" directory:'
	);
	console.log('  - privkey.pem: Private key file');
	console.log('  - fullchain.pem: Certificate file');
}
