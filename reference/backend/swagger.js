const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Swagger configuration
const swaggerOptions = {
	swaggerDefinition: {
		openapi: '3.0.0',
		info: {
			title: 'AIScraper API',
			description: 'API Documentation for AIScraper application',
			version: '1.0.0',
			contact: {
				name: 'API Support',
				email: 'support@aiscraper.com',
			},
			license: {
				name: 'MIT',
				url: 'https://opensource.org/licenses/MIT',
			},
		},
		servers: [
			{
				url: 'https://184.72.168.62:5001',
				description: 'Production server (EC2) - HTTPS',
			},
			{
				url: 'http://184.72.168.62:5000',
				description: 'Production server (EC2) - HTTP',
			},
			{
				url: 'http://localhost:5000',
				description: 'Development server',
			},
		],
		components: {
			schemas: {
				Ticket: {
					type: 'object',
					required: ['title', 'description', 'requesterName', 'requesterEmail'],
					properties: {
						simba_id: {
							type: 'string',
							description: 'Unique identifier for the ticket',
						},
						art_id: {
							type: 'string',
							description:
								'ART identifier for the ticket, generated when ART form is submitted',
							nullable: true,
						},
						art_status: {
							type: 'string',
							enum: [
								'Submitted',
								'InProgress',
								'InReview',
								'Pending',
								'Provisioned',
								'Provisioned Failed',
								'Closed',
								null,
							],
							description: 'Current status of the ART process',
							nullable: true,
						},
						title: {
							type: 'string',
							description: 'Title of the ticket',
						},
						description: {
							type: 'string',
							description: 'Detailed description of the ticket',
						},
						priority: {
							type: 'string',
							enum: ['Low', 'Medium', 'High'],
							description: 'Priority level of the ticket',
						},
						ticket_category: {
							type: 'string',
							enum: [
								'REQ-HR-ONBOARD',
								'REQ-DEV-REPO',
								'REQ-MARKETING-CRM',
								'REQ-FIN-APP',
							],
							description: 'Category/type of the ticket request',
						},
						requested_resource: {
							type: 'string',
							description: 'Resource being requested',
						},
						access_level: {
							type: 'string',
							enum: ['Read', 'Write', 'Admin', 'Member'],
							description: 'Access level for the requested resource',
						},
						current_status: {
							type: 'string',
							enum: ['Pending Approval', 'Approved', 'Approval Rejected'],
							description: 'Current approval status of the ticket',
						},
						requesterName: {
							type: 'string',
							description: 'Name of the person requesting the ticket',
						},
						requesterEmail: {
							type: 'string',
							description: 'Email of the person requesting the ticket',
						},
						status: {
							type: 'string',
							enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
							description: 'Current status of the ticket',
						},
					},
				},
				ScrapedTicket: {
					type: 'object',
					properties: {
						originalSimbaId: {
							type: 'string',
							description: 'Reference to the original ticket ID',
							example: 'SIMBA-0001',
						},
						scrapedData: {
							type: 'object',
							description: 'Data scraped from the ticket',
							properties: {
								simba_id: {
									type: 'string',
									description: 'SIMBA ID of the ticket',
									example: 'SIMBA-0001',
								},
								title: {
									type: 'string',
									description: 'Title of the ticket',
									example: 'Access Request',
								},
								description: {
									type: 'string',
									description: 'Description of the ticket',
									example: 'Need access to AWS account',
								},
								priority: {
									type: 'string',
									description: 'Priority level of the ticket',
									example: 'Medium',
								},
								status: {
									type: 'string',
									description: 'Status of the ticket',
									example: 'Open',
								},
								ticket_category: {
									type: 'string',
									description: 'Category of the ticket',
									example: 'REQ-DEV-REPO',
								},
								requested_resource: {
									type: 'string',
									description: 'Resource being requested',
									example: 'EC2 instance',
								},
								access_level: {
									type: 'string',
									description: 'Access level for the requested resource',
									example: 'Read',
								},
								requesterName: {
									type: 'string',
									description: 'Name of the requester',
									example: 'John Doe',
								},
								requesterEmail: {
									type: 'string',
									description: 'Email of the requester',
									example: 'john.doe@example.com',
								},
								art_id: {
									type: 'string',
									description: 'ART ID of the ticket if available',
									example: 'ART-1234',
									nullable: true,
								},
								art_status: {
									type: 'string',
									description: 'ART status of the ticket if available',
									example: 'Submitted',
									nullable: true,
								},
							},
						},
						sourceUrl: {
							type: 'string',
							description: 'URL from which the data was scraped',
							example: 'http://example.com/tickets/SIMBA-0001',
						},
						timestamp: {
							type: 'string',
							format: 'date-time',
							description: 'Timestamp when the data was scraped',
							example: '2025-05-27T18:00:00Z',
						},
					},
				},
				Error: {
					type: 'object',
					properties: {
						success: {
							type: 'boolean',
							example: false,
						},
						error: {
							type: 'string',
							example: 'Error message',
						},
					},
				},
			},
		},
	},
	apis: [path.join(__dirname, './routes/*.js')], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = {
	swaggerUi,
	swaggerDocs,
};
