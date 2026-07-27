const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./coupon.controller');
const router = express.Router();

/**
 * @openapi
 * /api/manager/coupons:
 *   get:
 *     tags: [Coupons]
 *     summary: ดูโค้ดส่วนลดทั้งหมด (Manager)
 *     description: |
 *       ข้อมูลจาก in-memory store (glowtime.sql ไม่มี coupons table)
 *       สำหรับ MVP phase — สามารถขยายเป็น DB table ได้ในอนาคต
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการคูปองทั้งหมด
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
 *                       id:         { type: integer }
 *                       code:       { type: string, example: GLOW20 }
 *                       type:       { type: string, enum: [percentage, fixed, free_shipping] }
 *                       value:      { type: number, example: 20 }
 *                       usageCount: { type: integer }
 *                       status:     { type: string, enum: [Active, Inactive] }
 */
router.get('/', verifyToken, requireRole('manager'), ctrl.getAllCoupons);
router.post('/', verifyToken, requireRole('manager'), ctrl.createCoupon);
router.put('/:id', verifyToken, requireRole('manager'), ctrl.updateCoupon);
router.delete('/:id', verifyToken, requireRole('manager'), ctrl.deleteCoupon);

module.exports = router;
