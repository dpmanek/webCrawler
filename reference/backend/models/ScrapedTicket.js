const mongoose = require('mongoose');

// Define the Error Schema
const ErrorSchema = new mongoose.Schema(
	{
		code: { type: String, required: false, default: 'NO_ERROR' },
		message: { type: String, required: false, default: 'No error' },
	},
	{ _id: false }
);

// Define the Approver Schema
const ApproverSchema = new mongoose.Schema(
	{
		approver_id: { type: String, required: true },
		first_name: { type: String, required: true },
		last_name: { type: String, required: true },
		approval_for: { type: String, default: 'Simba' },
	},
	{ _id: false }
);

// Define the Workflow State Schema
const WorkflowStateSchema = new mongoose.Schema(
	{
		current_node: { type: String, required: true },
		steps_completed: { type: [String], default: [] },
	},
	{ _id: false }
);

// Define the scraped ticket schema
const scrapedTicketSchema = new mongoose.Schema(
	{
		originalSimbaId: {
			type: String,
			required: true,
			ref: 'Ticket', // Reference to the original ticket
		},
		scrapedData: {
			// Basic ticket info
			title: String,
			description: String,
			priority: String,
			// User information fields
			firstName: String,
			lastName: String,
			user_id: String,
			status: String,

			// New fields based on requirements
			ticket_category: String,
			requested_resource: String,
			access_level: String,
			current_status: String,

			// System fields
			simba_id: String,
			simba_status: String,
			art_id: String,
			art_status: String,
			provisioning_outcome: String,
			remediation_needed: String,

			// Complex fields
			error_details: ErrorSchema,
			approver: ApproverSchema,
			workflow_state: [WorkflowStateSchema],

			// Timestamps
			created_timestamp: Date,
			last_updated_timestamp: Date,
			createdAt: Date,
			updatedAt: Date,
		},
		scrapedAt: {
			type: Date,
			default: Date.now,
		},
		sourceUrl: {
			type: String,
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

// Create the ScrapedTicket model
const ScrapedTicket = mongoose.model('ScrapedTicket', scrapedTicketSchema);

module.exports = ScrapedTicket;
