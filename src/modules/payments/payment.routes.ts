import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { validate } from '../../middleware/validate';
import { initializePaymentSchema } from './payment.schema';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { paymentLimiter } from '../../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialize a payment for an event (Eventee only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the event to pay for
 *     responses:
 *       200:
 *         description: Payment initialized
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
 *                     payment:
 *                       $ref: '#/components/schemas/Payment'
 *                     authorizationUrl:
 *                       type: string
 *                       description: Paystack payment URL to redirect user to
 *                     accessCode:
 *                       type: string
 *                     reference:
 *                       type: string
 *       400:
 *         description: Event sold out
 *       409:
 *         description: Already have a ticket
 */
router.post(
  '/initialize',
  authenticate,
  authorize('EVENTEE'),
  paymentLimiter,
  validate(initializePaymentSchema),
  PaymentController.initializePayment
);

/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Verify a payment by reference
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified, ticket and QR code created
 *       400:
 *         description: Payment verification failed
 *       404:
 *         description: Payment not found
 */
router.get('/verify/:reference', authenticate, PaymentController.verifyPayment);

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Payments]
 *     security: []
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/webhook', PaymentController.webhook);

/**
 * @swagger
 * /payments/creator:
 *   get:
 *     summary: Get all payments for creator's events (Creator only)
 *     tags: [Payments]
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
 *         description: Creator's payment details
 */
router.get(
  '/creator',
  authenticate,
  authorize('CREATOR'),
  PaymentController.getCreatorPayments
);

/**
 * @swagger
 * /payments/{reference}:
 *   get:
 *     summary: Get payment details by reference
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment details
 *       404:
 *         description: Payment not found
 */
router.get('/:reference', authenticate, PaymentController.getPaymentByReference);

export default router;
