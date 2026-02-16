import { Router } from 'express';
import { TicketController } from './ticket.controller';
import { validate } from '../../middleware/validate';
import { verifyTicketSchema } from './ticket.schema';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Get current user's tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 */
router.get('/', authenticate, TicketController.getUserTickets);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket details with QR code
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', authenticate, TicketController.getTicketById);

/**
 * @swagger
 * /tickets/verify:
 *   post:
 *     summary: Verify a ticket via QR code (Creator only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qrToken]
 *             properties:
 *               qrToken:
 *                 type: string
 *                 description: The QR code token string scanned from the ticket
 *     responses:
 *       200:
 *         description: Ticket verified and marked as used
 *       400:
 *         description: Invalid QR code or ticket already used
 *       403:
 *         description: Can only verify tickets for own events
 */
router.post(
  '/verify',
  authenticate,
  authorize('CREATOR'),
  validate(verifyTicketSchema),
  TicketController.verifyTicket
);

/**
 * @swagger
 * /tickets/{id}/cancel:
 *   put:
 *     summary: Cancel an active ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Ticket cancelled successfully
 *       400:
 *         description: Ticket is not active
 *       403:
 *         description: Can only cancel own tickets
 *       404:
 *         description: Ticket not found
 */
router.put('/:id/cancel', authenticate, TicketController.cancelTicket);

export default router;
