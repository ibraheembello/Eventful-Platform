import { Router } from 'express';
import { PromoCodeController } from './promo-code.controller';
import { validate } from '../../middleware/validate';
import { createPromoCodeSchema, updatePromoCodeSchema, applyPromoCodeSchema } from './promo-code.schema';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /promo-codes:
 *   post:
 *     summary: Create a promo code (Creator only)
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, discountType, discountValue]
 *             properties:
 *               code:
 *                 type: string
 *                 example: EARLY20
 *               discountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               discountValue:
 *                 type: number
 *                 example: 20
 *               maxUses:
 *                 type: integer
 *                 example: 50
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *               eventId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Promo code created
 */
router.post('/', authenticate, authorize('CREATOR'), validate(createPromoCodeSchema), PromoCodeController.create);

/**
 * @swagger
 * /promo-codes:
 *   get:
 *     summary: Get creator's promo codes (Creator only)
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: List of promo codes
 */
router.get('/', authenticate, authorize('CREATOR'), PromoCodeController.getAll);

/**
 * @swagger
 * /promo-codes/validate:
 *   post:
 *     summary: Validate a promo code for an event
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, eventId]
 *             properties:
 *               code:
 *                 type: string
 *                 example: EARLY20
 *               eventId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Validation result with discount details
 */
router.post('/validate', authenticate, validate(applyPromoCodeSchema), PromoCodeController.validateCode);

/**
 * @swagger
 * /promo-codes/{id}:
 *   get:
 *     summary: Get a promo code by ID (Creator only)
 *     tags: [Promo Codes]
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
 *         description: Promo code details
 */
router.get('/:id', authenticate, authorize('CREATOR'), PromoCodeController.getById);

/**
 * @swagger
 * /promo-codes/{id}:
 *   put:
 *     summary: Update a promo code (Creator only)
 *     tags: [Promo Codes]
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
 *               isActive:
 *                 type: boolean
 *               maxUses:
 *                 type: integer
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Promo code updated
 */
router.put('/:id', authenticate, authorize('CREATOR'), validate(updatePromoCodeSchema), PromoCodeController.update);

/**
 * @swagger
 * /promo-codes/{id}:
 *   delete:
 *     summary: Delete a promo code (Creator only)
 *     tags: [Promo Codes]
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
 *         description: Promo code deleted
 */
router.delete('/:id', authenticate, authorize('CREATOR'), PromoCodeController.delete);

export default router;
