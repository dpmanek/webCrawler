const express = require('express');
const router = express.Router();
const { scrapeTicket } = require('../controllers/scraperController');

/**
 * @swagger
 * /api/scrape/{id}:
 *   post:
 *     summary: Scrape ticket data
 *     description: Scrape data from a ticket by its SIMBA ID
 *     tags: [Scraper]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIMBA ID of the ticket to scrape
 *         example: SIMBA-0001
 *     responses:
 *       200:
 *         description: Ticket data scraped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ScrapedTicket'
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
router.post('/scrape/:id', scrapeTicket);

module.exports = router;
