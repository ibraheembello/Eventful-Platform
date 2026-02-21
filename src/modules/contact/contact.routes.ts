import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { authLimiter } from '../../middleware/rateLimiter';
import { contactSchema } from './contact.schema';
import { submitContact, getRecentMessages, markMessageRead } from './contact.controller';

const router = Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/', authLimiter, validate(contactSchema), submitContact);

/**
 * @swagger
 * /api/contact/messages:
 *   get:
 *     summary: Get recent contact messages (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent contact messages
 */
router.get('/messages', authenticate, authorize('ADMIN'), getRecentMessages);

/**
 * @swagger
 * /api/contact/messages/{id}/read:
 *   put:
 *     summary: Mark a contact message as read (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 */
router.put('/messages/:id/read', authenticate, authorize('ADMIN'), markMessageRead);

export default router;
