import { Router } from 'express';
import { EventController } from './event.controller';
import { validate } from '../../middleware/validate';
import { createEventSchema, updateEventSchema, createCommentSchema } from './event.schema';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get all events (public)
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title, description, or location
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events from this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events up to this date
 *       - in: query
 *         name: priceMin
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: priceMax
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: List of events
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
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', EventController.getAll);

/**
 * @swagger
 * /events/categories:
 *   get:
 *     summary: Get all event categories
 *     tags: [Events]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', EventController.getCategories);

/**
 * @swagger
 * /events/bookmarks:
 *   get:
 *     summary: Get user's bookmarked events
 *     tags: [Events]
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
 *         description: List of bookmarked events
 */
router.get('/bookmarks', authenticate, EventController.getBookmarkedEvents);

/**
 * @swagger
 * /events/bookmarks/ids:
 *   get:
 *     summary: Get IDs of all bookmarked events for the current user
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of event IDs
 */
router.get('/bookmarks/ids', authenticate, EventController.getBookmarkIds);

/**
 * @swagger
 * /events/waitlists:
 *   get:
 *     summary: Get current user's waitlist entries
 *     tags: [Events]
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
 *         description: List of waitlist entries
 */
router.get('/waitlists', authenticate, EventController.getUserWaitlists);

/**
 * @swagger
 * /events/my-events:
 *   get:
 *     summary: Get events created by the authenticated creator
 *     tags: [Events]
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
 *         description: Creator's events
 */
router.get('/my-events', authenticate, authorize('CREATOR'), EventController.getCreatorEvents);

/**
 * @swagger
 * /events/attending:
 *   get:
 *     summary: Get events the authenticated eventee is attending
 *     tags: [Events]
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
 *         description: Events user is attending
 */
router.get('/attending', authenticate, authorize('EVENTEE'), EventController.getEventeeEvents);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:id', EventController.getById);

/**
 * @swagger
 * /events/{id}/attendees:
 *   get:
 *     summary: Get attendees for a specific event (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by attendee name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, USED, CANCELLED]
 *         description: Filter by ticket status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, date, status, scannedAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of attendees with stats
 *       403:
 *         description: Forbidden
 */
router.get(
  '/:id/attendees',
  authenticate,
  authorize('CREATOR'),
  EventController.getEventAttendees
);

/**
 * @swagger
 * /events/{id}/share:
 *   get:
 *     summary: Get social media share links for an event
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Share links
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
 *                     twitter:
 *                       type: string
 *                     facebook:
 *                       type: string
 *                     linkedin:
 *                       type: string
 *                     whatsapp:
 *                       type: string
 *                     email:
 *                       type: string
 */
router.get('/:id/share', EventController.getShareLinks);

/**
 * @swagger
 * /events/{id}/check-in:
 *   post:
 *     summary: Manually check in an attendee (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ticketId]
 *             properties:
 *               ticketId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Attendee checked in
 *       403:
 *         description: Forbidden
 */
router.post('/:id/check-in', authenticate, authorize('CREATOR'), EventController.manualCheckIn);

/**
 * @swagger
 * /events/{id}/comments:
 *   get:
 *     summary: Get comments/reviews for an event (public)
 *     tags: [Events]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *         description: List of comments with average rating
 */
router.get('/:id/comments', EventController.getComments);

/**
 * @swagger
 * /events/{id}/comments:
 *   post:
 *     summary: Add a review to a past event (requires ticket)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, rating]
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 10
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Review submitted
 *       400:
 *         description: Event not past or already reviewed
 *       403:
 *         description: No ticket for this event
 */
router.post('/:id/comments', authenticate, validate(createCommentSchema), EventController.createComment);

/**
 * @swagger
 * /events/{id}/comments/{commentId}:
 *   delete:
 *     summary: Delete a review (author or event creator)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: Not authorized
 */
router.delete('/:id/comments/:commentId', authenticate, EventController.deleteComment);

/**
 * @swagger
 * /events/{id}/waitlist:
 *   get:
 *     summary: Get waitlist status for the current user on an event
 *     tags: [Events]
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
 *         description: Waitlist status
 */
router.get('/:id/waitlist', authenticate, EventController.getWaitlistStatus);

/**
 * @swagger
 * /events/{id}/waitlist:
 *   post:
 *     summary: Join the waitlist for a sold-out event
 *     tags: [Events]
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
 *         description: Added to waitlist
 *       400:
 *         description: Event not sold out or already on waitlist
 */
router.post('/:id/waitlist', authenticate, EventController.joinWaitlist);

/**
 * @swagger
 * /events/{id}/waitlist:
 *   delete:
 *     summary: Leave the waitlist for an event
 *     tags: [Events]
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
 *         description: Removed from waitlist
 *       404:
 *         description: Not on waitlist
 */
router.delete('/:id/waitlist', authenticate, EventController.leaveWaitlist);

/**
 * @swagger
 * /events/{id}/bookmark:
 *   post:
 *     summary: Toggle bookmark on an event
 *     tags: [Events]
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
 *         description: Bookmark toggled
 */
router.post('/:id/bookmark', authenticate, EventController.toggleBookmark);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event (Creator only)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, date, location, price, capacity]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Music Festival 2026
 *               description:
 *                 type: string
 *                 example: An amazing music festival
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-06-15T18:00:00.000Z"
 *               location:
 *                 type: string
 *                 example: Lagos, Nigeria
 *               price:
 *                 type: number
 *                 example: 5000
 *               capacity:
 *                 type: integer
 *                 example: 500
 *               imageUrl:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               category:
 *                 type: string
 *                 example: Music
 *               defaultReminderValue:
 *                 type: integer
 *                 example: 1
 *               defaultReminderUnit:
 *                 type: string
 *                 enum: [MINUTES, HOURS, DAYS, WEEKS]
 *                 example: DAYS
 *     responses:
 *       201:
 *         description: Event created
 *       403:
 *         description: Only creators can create events
 */
router.post(
  '/',
  authenticate,
  authorize('CREATOR'),
  validate(createEventSchema),
  EventController.create
);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event (Creator only, own events)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Can only update own events
 *       404:
 *         description: Event not found
 */
router.put(
  '/:id',
  authenticate,
  authorize('CREATOR'),
  validate(updateEventSchema),
  EventController.update
);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event (Creator only, own events)
 *     tags: [Events]
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
 *         description: Event deleted
 *       403:
 *         description: Can only delete own events
 *       404:
 *         description: Event not found
 */
router.delete('/:id', authenticate, authorize('CREATOR'), EventController.delete);

export default router;
