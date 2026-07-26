const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const shipmentController = require('./shipment.controller');

const router = express.Router();

/**
 * @openapi
 * /api/staff/shipments:
 *   get:
 *     tags: [Shipments]
 *     summary: ดูข้อมูลการจัดส่งทั้งหมด (Staff)
 *     description: |
 *       ดึงข้อมูลจากตาราง shipments ใน glowtime.sql
 *
 *       **ตาราง shipments**
 *       | Column | Type | หมายเหตุ |
 *       |--------|------|---------|
 *       | shipment_id | INT PK | |
 *       | order_id | INT UNIQUE FK | → orders (1 order = 1 shipment) |
 *       | tracking_number | VARCHAR(100) | เลขพัสดุ |
 *       | carrier | VARCHAR(100) | ขนส่ง |
 *       | status | VARCHAR(50) | Pending/Shipping/Delivered |
 *       | shipped_at | DATETIME | วันที่ส่ง (NULL ถ้า pending) |
 *       | delivered_at | DATETIME | วันที่ถึง (NULL ถ้ายังไม่ถึง) |
 *
 *       **Seed data ใน glowtime.sql:**
 *       - TH000001 / Flash Express / Shipping
 *       - TH000002 / Kerry Express / Delivered
 *       - TH000003 / Thailand Post / Delivered
 *       - TH000004 / Flash Express / Pending
 *       - TH000005 / Kerry Express / Shipping
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการการจัดส่งทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 5 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Shipment' }
 *       401:
 *         description: ไม่มี Token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', verifyToken, requireRole('staff'), shipmentController.getAllShipments);

/**
 * @openapi
 * /api/staff/shipments:
 *   post:
 *     tags: [Shipments]
 *     summary: บันทึกข้อมูลการจัดส่ง (Staff)
 *     description: |
 *       INSERT ลงตาราง shipments
 *       status จะถูกตั้งเป็น **Shipping** อัตโนมัติ
 *       (ตรงกับ seed data ใน glowtime.sql)
 *
 *       **Flow:** orders.status → Confirmed → Staff กด Ship → shipments INSERT → orders.status → Shipping
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, trackingNumber, carrier]
 *             properties:
 *               orderId:
 *                 type: integer
 *                 example: 4
 *                 description: orders.order_id (INT — ไม่ใช่ string)
 *               trackingNumber:
 *                 type: string
 *                 example: TH000006
 *                 description: shipments.tracking_number
 *               carrier:
 *                 type: string
 *                 enum: [Kerry Express, Flash Express, Thailand Post]
 *                 example: Flash Express
 *                 description: shipments.carrier (ตรงตาม glowtime.sql)
 *     responses:
 *       201:
 *         description: บันทึกการจัดส่งสำเร็จ — status = Shipping
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Shipment' }
 *       400:
 *         description: ข้อมูลไม่ครบหรือ carrier ไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: order_id นี้มีข้อมูลการจัดส่งแล้ว (UNIQUE constraint)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', verifyToken, requireRole('staff'), shipmentController.createShipment);

/**
 * @openapi
 * /api/staff/shipments/{orderId}:
 *   get:
 *     tags: [Shipments]
 *     summary: ดูข้อมูลการจัดส่งตาม order_id
 *     description: |
 *       SELECT จาก shipments WHERE order_id = ?
 *       (shipments.order_id เป็น UNIQUE FK → orders.order_id)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: integer }
 *         description: orders.order_id (INT)
 *         example: 1
 *     responses:
 *       200:
 *         description: ข้อมูลการจัดส่ง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Shipment' }
 *       404:
 *         description: ไม่พบข้อมูลการจัดส่ง (order_id นี้ยังไม่ถูก ship)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:orderId', verifyToken, requireRole('staff'), shipmentController.getShipmentByOrderId);

module.exports = router;
