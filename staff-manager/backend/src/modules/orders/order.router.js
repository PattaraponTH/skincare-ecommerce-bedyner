const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const orderController = require('./order.controller');

const router = express.Router();

/**
 * @openapi
 * /api/staff/orders:
 *   get:
 *     tags: [Orders]
 *     summary: ดูออเดอร์ทั้งหมด (Staff)
 *     description: |
 *       ดึงข้อมูลจาก orders JOIN customers JOIN users JOIN order_items JOIN products
 *
 *       **ตาราง orders (glowtime.sql)**
 *       | Column | Type | หมายเหตุ |
 *       |--------|------|---------|
 *       | order_id | INT PK | |
 *       | customer_id | INT FK | → customers |
 *       | order_date | DATETIME | → createdAt |
 *       | status | VARCHAR(50) | Pending/Confirmed/Shipping/Delivered |
 *       | total_amount | DECIMAL(10,2) | → totalAmount |
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, shipping, delivered]
 *         description: |
 *           กรองตามสถานะ (DB เก็บ Capitalized, ส่งเป็น lowercase ได้เลย)
 *           - pending → รอดำเนินการ
 *           - confirmed → ยืนยันแล้ว
 *           - shipping → กำลังจัดส่ง
 *           - delivered → ส่งแล้ว
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: กรองตาม customer_id (FK → customers.customer_id)
 *         example: 1
 *     responses:
 *       200:
 *         description: รายการออเดอร์ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 5 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *       401:
 *         description: ไม่มี Token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น staff)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', verifyToken, requireRole('staff'), orderController.getAllOrders);

/**
 * @openapi
 * /api/staff/orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: อัปเดตสถานะออเดอร์ (Staff)
 *     description: |
 *       อัปเดต orders.status ใน DB
 *       Flow: **pending → confirmed → shipping → delivered**
 *       DB เก็บ Capitalized (Pending/Confirmed/Shipping/Delivered)
 *       ส่งเป็น lowercase ก็ได้ — API แปลงให้อัตโนมัติ
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: orders.order_id
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, shipping, delivered]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: อัปเดตสถานะสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Order' }
 *       400:
 *         description: สถานะไม่ถูกต้อง ต้องเป็น pending/confirmed/shipping/delivered
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: ไม่พบออเดอร์ (order_id ไม่มีใน DB)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.put('/:id/status', verifyToken, requireRole('staff'), orderController.updateOrderStatus);

module.exports = router;
