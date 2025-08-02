const mongoose = require('mongoose');

// MongoDB connection function
const connectDB = async () => {
	try {
		// Get MongoDB URI from environment variables
		const mongoURI = process.env.MONGODB_URI;

		if (!mongoURI) {
			console.error('MongoDB URI is not defined in environment variables');
			process.exit(1);
		}

		// Connection options with longer timeout and retry logic
		const options = {
			serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
			socketTimeoutMS: 45000, // Socket timeout
			connectTimeoutMS: 30000, // Connection timeout
			retryWrites: true,
			retryReads: true,
			maxPoolSize: 10, // Maintain up to 10 socket connections
			minPoolSize: 5, // Maintain at least 5 socket connections
			family: 4, // Use IPv4, skip trying IPv6
		};

		// Connect to MongoDB with options
		const conn = await mongoose.connect(mongoURI, options);

		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error connecting to MongoDB: ${error.message}`);
		console.error(
			'Please check your MongoDB Atlas connection settings and network.'
		);
		process.exit(1);
	}
};

module.exports = connectDB;
