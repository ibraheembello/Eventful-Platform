import { Router } from 'express';
import { InAppNotificationController } from './in-app-notification.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @swagger
 * /notifications/in-app:
 *   get:
 *     summary: Get in-app notifications for the current user
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
 *         description: List of notifications
 */
router.get('/in-app', authenticate, InAppNotificationController.getNotifications);

/**
 * @swagger
 * /notifications/in-app/unread:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 */
router.get('/in-app/unread', authenticate, InAppNotificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/in-app/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/in-app/read-all', authenticate, InAppNotificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/in-app/{id}/read:
 *   put:
 *     summary: Mark a single notification as read
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
 *         description: Notification marked as read
 */
router.put('/in-app/:id/read', authenticate, InAppNotificationController.markAsRead);

export default router;
