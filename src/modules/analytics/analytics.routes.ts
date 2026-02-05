import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     summary: Get creator's overall analytics (Creator only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics overview
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalEvents:
 *                       type: integer
 *                     totalAttendees:
 *                       type: integer
 *                       description: Total attendees (tickets scanned) across all events
 *                     totalTicketsSold:
 *                       type: integer
 *                     totalTicketsScanned:
 *                       type: integer
 *                     totalRevenue:
 *                       type: number
 */
router.get('/overview', authenticate, authorize('CREATOR'), AnalyticsController.getOverview);

/**
 * @swagger
 * /analytics/events:
 *   get:
 *     summary: Get analytics for all creator's events (Creator only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Per-event analytics list
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       capacity:
 *                         type: integer
 *                       ticketsSold:
 *                         type: integer
 *                       ticketsScanned:
 *                         type: integer
 *                       revenue:
 *                         type: number
 */
router.get('/events', authenticate, authorize('CREATOR'), AnalyticsController.getEventsAnalytics);

/**
 * @swagger
 * /analytics/events/{id}:
 *   get:
 *     summary: Get detailed analytics for a specific event (Creator only)
 *     tags: [Analytics]
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
 *         description: Detailed event analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         date:
 *                           type: string
 *                         capacity:
 *                           type: integer
 *                     ticketsSold:
 *                       type: integer
 *                     ticketsScanned:
 *                       type: integer
 *                     ticketsActive:
 *                       type: integer
 *                     ticketsCancelled:
 *                       type: integer
 *                     capacityUsed:
 *                       type: string
 *                     revenue:
 *                       type: number
 *       403:
 *         description: Can only view analytics for own events
 *       404:
 *         description: Event not found
 */
router.get(
  '/events/:id',
  authenticate,
  authorize('CREATOR'),
  AnalyticsController.getEventAnalytics
);

export default router;
