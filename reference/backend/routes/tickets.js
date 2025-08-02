const express = require('express');
const router = express.Router();
const {
	createTicket,
	getTickets,
	getTicket,
	updateTicket,
	deleteTicket,
	submitArtForm,
	getTicketTrace,
} = require('../controllers/ticketController');

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all tickets
 *     description: Retrieve a list of all tickets
 *     tags: [Tickets]
 *     responses:
 *       200:
 *         description: A list of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new ticket
 *     description: Create a new ticket with the provided information
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, requesterName, requesterEmail]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Access Request"
 *               description:
 *                 type: string
 *                 example: "Need access to AWS account"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 example: "Medium"
 *               ticket_category:
 *                 type: string
 *                 enum: [REQ-HR-ONBOARD, REQ-DEV-REPO, REQ-MARKETING-CRM, REQ-FIN-APP]
 *                 example: "REQ-DEV-REPO"
 *               requested_resource:
 *                 type: string
 *                 example: "EC2 instance"
 *               access_level:
 *                 type: string
 *                 enum: [Read, Write, Admin, Member]
 *                 example: "Read"
 *               requesterName:
 *                 type: string
 *                 example: "John Doe"
 *               requesterEmail:
 *                 type: string
 *                 example: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/').get(getTickets).post(createTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get a ticket by ID
 *     description: Retrieve a specific ticket by its SIMBA ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIMBA ID of the ticket
 *         example: SIMBA-0001
 *     responses:
 *       200:
 *         description: Ticket found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update a ticket
 *     description: Update a specific ticket by its SIMBA ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIMBA ID of the ticket
 *         example: SIMBA-0001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               ticket_category:
 *                 type: string
 *                 enum: [REQ-HR-ONBOARD, REQ-DEV-REPO, REQ-MARKETING-CRM, REQ-FIN-APP]
 *               requested_resource:
 *                 type: string
 *               access_level:
 *                 type: string
 *                 enum: [Read, Write, Admin, Member]
 *               status:
 *                 type: string
 *                 enum: [Open, In Progress, Resolved, Closed]
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a ticket
 *     description: Delete a specific ticket by its SIMBA ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIMBA ID of the ticket
 *         example: SIMBA-0001
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   example: {}
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/:id').get(getTicket).put(updateTicket).delete(deleteTicket);

/**
 * @swagger
 * /api/tickets/{id}/art:
 *   post:
 *     summary: Submit ART form for a ticket
 *     description: Generate ART ID and update ticket with ART-related fields
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIMBA ID of the ticket
 *         example: SIMBA-0001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the ticket
 *                 example: "Access Request"
 *               firstName:
 *                 type: string
 *                 description: First name of the requester
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: Last name of the requester
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 description: Email of the requester
 *                 example: "john.doe@example.com"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *                 description: Priority level of the ticket
 *                 example: "Medium"
 *               status:
 *                 type: string
 *                 enum: [Open, In Progress, Resolved, Closed]
 *                 description: Status of the ticket
 *                 example: "Open"
 *               notes:
 *                 type: string
 *                 description: Additional notes or description
 *                 example: "Need access to AWS account"
 *               ticket_category:
 *                 type: string
 *                 enum: [REQ-HR-ONBOARD, REQ-DEV-REPO, REQ-MARKETING-CRM, REQ-FIN-APP]
 *                 description: Category of the ticket
 *                 example: "REQ-DEV-REPO"
 *               requested_resource:
 *                 type: string
 *                 description: Resource being requested
 *                 example: "EC2 instance"
 *               access_level:
 *                 type: string
 *                 enum: [Read, Write, Admin, Member]
 *                 description: Access level for the requested resource
 *                 example: "Read"
 *               simba_id:
 *                 type: string
 *                 description: SIMBA ID of the ticket
 *                 example: "SIMBA-0001"
 *     responses:
 *       200:
 *         description: ART form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     ticket:
 *                       $ref: '#/components/schemas/Ticket'
 *                     art_id:
 *                       type: string
 *                       example: ART-1234
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/:id/art').post(submitArtForm);

/**
 * @swagger
 * /api/tickets/{id}/trace:
 *   get:
 *     summary: Get trace data for a ticket
 *     description: Retrieve real-time trace data for Bedrock agent processing
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIMBA ID of the ticket
 *         example: SIMBA-0001
 *     responses:
 *       200:
 *         description: Trace data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       example: "SIMBA-0001"
 *                     currentStage:
 *                       type: string
 *                       example: "processing"
 *                     stages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "submission"
 *                           name:
 *                             type: string
 *                             example: "Ticket Submitted"
 *                           status:
 *                             type: string
 *                             enum: [pending, in_progress, completed, failed]
 *                             example: "completed"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             example: "2023-01-01T00:00:00.000Z"
 *                           message:
 *                             type: string
 *                             example: "Ticket successfully submitted"
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           stage:
 *                             type: string
 *                           status:
 *                             type: string
 *                           message:
 *                             type: string
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.route('/:id/trace').get(getTicketTrace);

module.exports = router;
