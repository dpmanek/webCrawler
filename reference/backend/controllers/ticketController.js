const Ticket = require('../models/Ticket');
const {
	processSimbaTicket,
	getTraceData,
	markTicketAsBedrockEnabled,
} = require('../utils/bedrockAgent');

// @desc    Create a new ticket
// @route   POST /api/tickets
// @access  Public
exports.createTicket = async (req, res) => {
	try {
		const {
			title,
			description,
			priority,
			firstName,
			lastName,
			user_id,
			ticket_category,
			requested_resource,
			access_level,
			current_status,
		} = req.body;

		// Generate a unique SIMBA ID
		const simbaId = await Ticket.generateSimbaId();

		// Use the provided firstName and lastName
		const firstNameToUse = firstName;
		const lastNameToUse = lastName;

		// Create the ticket with all fields
		const ticket = await Ticket.create({
			simba_id: simbaId,
			title,
			description,
			priority,
			// User information fields
			firstName: firstNameToUse,
			lastName: lastNameToUse,
			user_id: user_id,

			// New fields
			ticket_category: ticket_category || undefined,
			requested_resource: requested_resource || undefined,
			access_level: access_level || 'Read',
			current_status: current_status || 'Pending Approval',

			// System-generated fields with defaults
			created_timestamp: new Date(),
			last_updated_timestamp: new Date(),

			// Set approver with requester's name if available
			approver: {
				approver_id: 'approver-001',
				first_name: firstNameToUse || 'Jane',
				last_name: lastNameToUse || 'Smith',
				approval_for: 'Simba',
			},

			// These will use the default values from the schema
			simba_status: 'InProgress',
			// Set ART-related fields to null initially
			art_id: null, // Will be set when ART form is submitted
			art_status: null, // Will be set when ART form is submitted
			provisioning_outcome: 'None',
			remediation_needed: 'None',
			error_details: {
				code: 'NO_ERROR',
				message: 'No error',
			},
			workflow_state: undefined, // Will use the default function
		});

		// Conditionally trigger the Bedrock agent based on enableBedrock flag
		if (req.body.enableBedrock) {
			try {
				console.log(`Triggering Bedrock agent for SIMBA ID: ${simbaId}`);

				// Mark this ticket as having Bedrock enabled
				markTicketAsBedrockEnabled(simbaId);

				// Process the ticket with Bedrock agent asynchronously
				// We don't await this to avoid blocking the response
				processSimbaTicket(simbaId)
					.then((result) => {
						console.log('Bedrock agent processing completed successfully');
					})
					.catch((err) => {
						console.error('Error in Bedrock agent processing:', err.message);
					});
			} catch (bedrockError) {
				// Log the error but don't fail the ticket creation
				console.error('Error triggering Bedrock agent:', bedrockError.message);
			}
		} else {
			console.log(
				`Bedrock agent disabled for SIMBA ID: ${simbaId} - manual processing required`
			);
		}

		res.status(201).json({
			success: true,
			data: ticket,
		});
	} catch (error) {
		console.error('Error creating ticket:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Public
exports.getTickets = async (req, res) => {
	try {
		console.log('Getting tickets - starting database query');

		// Add a timeout to the query
		const tickets = await Ticket.find()
			.sort({ createdAt: -1 })
			.maxTimeMS(10000) // 10 second timeout
			.limit(100); // Limit to 100 tickets for performance

		console.log(`Found ${tickets.length} tickets`);

		res.status(200).json({
			success: true,
			count: tickets.length,
			data: tickets,
		});
	} catch (error) {
		console.error('Error getting tickets:', error);
		console.error('Error details:', error.message);

		// Check for specific MongoDB errors
		if (error.name === 'MongooseError' || error.name === 'MongoError') {
			console.error('MongoDB connection error:', error.message);
			return res.status(503).json({
				success: false,
				error: 'Database connection error',
				details: error.message,
			});
		}

		// Check for timeout errors
		if (error.message && error.message.includes('timed out')) {
			console.error('Query timed out:', error.message);
			return res.status(504).json({
				success: false,
				error: 'Database query timed out',
				details: error.message,
			});
		}

		res.status(500).json({
			success: false,
			error: 'Server Error',
			details: error.message,
		});
	}
};

// @desc    Get a single ticket
// @route   GET /api/tickets/:id
// @access  Public
exports.getTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findOne({ simba_id: req.params.id });

		if (!ticket) {
			return res.status(404).json({
				success: false,
				error: 'Ticket not found',
			});
		}

		res.status(200).json({
			success: true,
			data: ticket,
		});
	} catch (error) {
		console.error('Error getting ticket:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};

// @desc    Update a ticket
// @route   PUT /api/tickets/:id
// @access  Public
exports.updateTicket = async (req, res) => {
	try {
		let ticket = await Ticket.findOne({ simba_id: req.params.id });

		if (!ticket) {
			return res.status(404).json({
				success: false,
				error: 'Ticket not found',
			});
		}

		// Always update the last_updated_timestamp
		req.body.last_updated_timestamp = new Date();

		// Update the ticket
		ticket = await Ticket.findOneAndUpdate(
			{ simba_id: req.params.id },
			{ ...req.body, updatedAt: Date.now() },
			{ new: true, runValidators: true }
		);

		res.status(200).json({
			success: true,
			data: ticket,
		});
	} catch (error) {
		console.error('Error updating ticket:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};

// @desc    Delete a ticket
// @route   DELETE /api/tickets/:id
// @access  Public
exports.deleteTicket = async (req, res) => {
	try {
		const ticket = await Ticket.findOne({ simba_id: req.params.id });

		if (!ticket) {
			return res.status(404).json({
				success: false,
				error: 'Ticket not found',
			});
		}

		await ticket.deleteOne();

		res.status(200).json({
			success: true,
			data: {},
		});
	} catch (error) {
		console.error('Error deleting ticket:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};

// @desc    Submit ART form for a ticket
// @route   POST /api/tickets/:id/art
// @access  Public
exports.submitArtForm = async (req, res) => {
	try {
		const ticket = await Ticket.findOne({ simba_id: req.params.id });

		if (!ticket) {
			return res.status(404).json({
				success: false,
				error: 'Ticket not found',
			});
		}

		// Generate a random ART ID
		const artId = `ART-REQ-${Math.floor(Math.random() * 100000)
			.toString()
			.padStart(5, '0')}`;

		// Update the ticket with ART-related fields
		ticket.art_id = artId;
		ticket.art_status = 'InProgress';
		ticket.last_updated_timestamp = new Date();

		// Save the updated ticket
		await ticket.save();

		res.status(200).json({
			success: true,
			data: {
				ticket,
				art_id: artId,
			},
		});
	} catch (error) {
		console.error('Error submitting ART form:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};

// @desc    Get trace data for a ticket
// @route   GET /api/tickets/:id/trace
// @access  Public
exports.getTicketTrace = async (req, res) => {
	try {
		const ticket = await Ticket.findOne({ simba_id: req.params.id });

		if (!ticket) {
			return res.status(404).json({
				success: false,
				error: 'Ticket not found',
			});
		}

		// Use the SIMBA ID as session ID and pass ticket data to determine initial state
		const sessionId = req.params.id;
		const traceData = getTraceData(sessionId, ticket);

		// If no trace data (Bedrock was disabled), return appropriate response
		if (!traceData) {
			return res.status(200).json({
				success: true,
				data: null,
				message: 'Bedrock automation was disabled for this ticket',
			});
		}

		res.status(200).json({
			success: true,
			data: traceData,
		});
	} catch (error) {
		console.error('Error getting trace data:', error);
		res.status(500).json({
			success: false,
			error: 'Server Error',
		});
	}
};
