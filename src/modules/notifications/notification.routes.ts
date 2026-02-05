import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { validate } from '../../middleware/validate';
import { createReminderSchema, updateReminderSchema } from './notification.schema';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Set a reminder for an event
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, reminderValue, reminderUnit]
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *               reminderValue:
 *                 type: integer
 *                 minimum: 1
 *                 example: 1
 *               reminderUnit:
 *                 type: string
 *                 enum: [MINUTES, HOURS, DAYS, WEEKS]
 *                 example: DAYS
 *     responses:
 *       201:
 *         description: Reminder set
 *       400:
 *         description: Reminder time must be in the future
 *       409:
 *         description: Duplicate reminder
 */
router.post(
  '/',
  authenticate,
  validate(createReminderSchema),
  NotificationController.createReminder
);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get current user's reminders
 *     tags: [Notifications]
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
 *         description: User's reminders
 */
router.get('/', authenticate, NotificationController.getUserReminders);

/**
 * @swagger
 * /notifications/{id}:
 *   put:
 *     summary: Update a reminder
 *     tags: [Notifications]
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
 *             properties:
 *               reminderValue:
 *                 type: integer
 *               reminderUnit:
 *                 type: string
 *                 enum: [MINUTES, HOURS, DAYS, WEEKS]
 *     responses:
 *       200:
 *         description: Reminder updated
 */
router.put(
  '/:id',
  authenticate,
  validate(updateReminderSchema),
  NotificationController.updateReminder
);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a reminder
 *     tags: [Notifications]
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
 *         description: Reminder deleted
 */
router.delete('/:id', authenticate, NotificationController.deleteReminder);

export default router;
