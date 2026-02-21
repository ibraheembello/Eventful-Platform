import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get personalized dashboard data for the authenticated user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with ticket stats, upcoming events, and role-specific info
 */
router.get('/', authenticate, DashboardController.getDashboard);

export default router;
