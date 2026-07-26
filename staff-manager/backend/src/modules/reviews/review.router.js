const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./review.controller');
const router = express.Router();

/**
 * @openapi
 * /api/manager/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: ดูรีวิวทั้งหมด (Manager)
 *     description: |
 *       Query จากตาราง reviews JOIN products JOIN customers JOIN users
 *       **Seed data ใน glowtime.sql:** มีรีวิวจาก customer01-05
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการรีวิว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total:   { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:           { type: integer }
 *                       rating:       { type: integer, example: 5 }
 *                       comment:      { type: string }
 *                       productName:  { type: string }
 *                       customerName: { type: string }
 *                       createdAt:    { type: string }
 *                       status:       { type: string, enum: [approved, rejected, pending] }
 */
router.get('/', verifyToken, requireRole('manager'), ctrl.getAllReviews);

/**
 * @openapi
 * /api/manager/reviews/{id}/status:
 *   put:
 *     tags: [Reviews]
 *     summary: อนุมัติ/ปฏิเสธรีวิว (Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected, pending], example: approved }
 *     responses:
 *       200:
 *         description: อัปเดตสถานะรีวิวสำเร็จ
 */
router.put('/:id/status', verifyToken, requireRole('manager'), ctrl.updateReviewStatus);

module.exports = router;
