const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const paymentController = require('./payment.controller');

const router = express.Router();

/**
 * @openapi
 * /api/payments/checkout:
 *   post:
 *     tags: [Payments]
 *     summary: ชำระเงิน (Simulation)
 *     description: |
 *       จำลองการชำระเงิน — ผลลัพธ์จะ **success เสมอ** (Mock mode)
 *       หลังชำระเงินสำเร็จ สถานะ order จะเปลี่ยนจาก `pending_payment` → `confirmed`
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, method]
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: ORD-20260722-0001
 *                 description: Order ID ที่ต้องการชำระ (ต้องมีสถานะ pending_payment)
 *               method:
 *                 type: string
 *                 enum: [credit_card, qr_code, bank_transfer]
 *                 example: credit_card
 *     responses:
 *       201:
 *         description: ชำระเงินสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: ชำระเงินสำเร็จ }
 *                 data: { $ref: '#/components/schemas/Payment' }
 *       400:
 *         description: วิธีชำระเงินไม่ถูกต้อง หรือ order ไม่อยู่ในสถานะ pending_payment
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: ไม่พบ order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/checkout', verifyToken, requireRole('customer'), paymentController.checkout);

module.exports = router;

