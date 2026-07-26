const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./marketing.controller');
const router = express.Router();

/**
 * @openapi
 * /api/manager/promotions:
 *   get:
 *     tags: [Marketing]
 *     summary: ดูโปรโมชั่นทั้งหมด (Manager)
 *     description: In-memory store (glowtime.sql ไม่มี promotions table)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการโปรโมชั่น
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:     { type: integer }
 *                       title:  { type: string, example: Summer Glow Sale }
 *                       type:   { type: string, enum: [discount, bundle, flash_sale] }
 *                       status: { type: string, enum: [Active, Scheduled, Ended] }
 */
router.get('/', verifyToken, requireRole('manager'), ctrl.getAllPromotions);
router.post('/', verifyToken, requireRole('manager'), ctrl.createPromotion);
router.put('/:id', verifyToken, requireRole('manager'), ctrl.updatePromotion);
router.delete('/:id', verifyToken, requireRole('manager'), ctrl.deletePromotion);

module.exports = router;
