import { Router } from 'express';
import { AdminController } from './admin.controller';
import { validate } from '../../middleware/validate';
import { changeRoleSchema, suspendUserSchema } from './admin.schema';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get platform-wide statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 */
router.get('/stats', AdminController.getStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: List all users with search and filter (Admin only)
 *     tags: [Admin]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CREATOR, EVENTEE, ADMIN]
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', AdminController.getUsers);

/**
 * @swagger
 * /admin/users/{id}/role:
 *   put:
 *     summary: Change a user's role (Admin only)
 *     tags: [Admin]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CREATOR, EVENTEE, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put('/users/:id/role', validate(changeRoleSchema), AdminController.changeUserRole);

/**
 * @swagger
 * /admin/users/{id}/suspend:
 *   put:
 *     summary: Suspend or unsuspend a user (Admin only)
 *     tags: [Admin]
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
 *             required: [suspended]
 *             properties:
 *               suspended:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Suspension status updated
 */
router.put('/users/:id/suspend', validate(suspendUserSchema), AdminController.toggleSuspend);

/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: List all events (Admin only)
 *     tags: [Admin]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated event list
 */
router.get('/events', AdminController.getEvents);

/**
 * @swagger
 * /admin/events/{id}:
 *   delete:
 *     summary: Delete any event (Admin only)
 *     tags: [Admin]
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
 */
router.delete('/events/:id', AdminController.deleteEvent);

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     summary: List all payments (Admin only)
 *     tags: [Admin]
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
 *         description: Paginated payment list
 */
router.get('/payments', AdminController.getPayments);

export default router;
