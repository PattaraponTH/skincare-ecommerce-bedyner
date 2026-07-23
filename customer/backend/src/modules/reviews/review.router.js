const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const reviewController = require('./review.controller');

const router = express.Router();

/**
 * @openapi
 * /api/reviews/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: ดูรีวิวของสินค้า (สาธารณะ)
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: รายการรีวิวของสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count:   { type: integer, example: 2 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Review' }
 */
router.get('/:productId', reviewController.getReviews);

/**
 * @openapi
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: เขียนรีวิวสินค้า
 *     description: ต้อง Login ในฐานะ customer และไม่สามารถรีวิวซ้ำในออเดอร์เดียวกันได้
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, rating, comment]
 *             properties:
 *               productId: { type: integer, example: 1001 }
 *               orderId:
 *                 type: string
 *                 example: ORD-20260701-0001
 *                 description: Optional — ระบุเพื่อป้องกันรีวิวซ้ำในออเดอร์เดียวกัน
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment: { type: string, example: ผิวชุ่มชื้นมาก เหมาะกับผิวแพ้ง่าย }
 *     responses:
 *       201:
 *         description: บันทึกรีวิวสำเร็จ (averageRating ของสินค้าจะอัปเดตอัตโนมัติ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Review' }
 *       400:
 *         description: ข้อมูลไม่ครบ หรือ rating ไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: รีวิวซ้ำในออเดอร์เดียวกัน
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', verifyToken, requireRole('customer'), reviewController.createReview);

module.exports = router;

