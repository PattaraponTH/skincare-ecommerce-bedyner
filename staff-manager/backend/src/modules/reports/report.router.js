const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const reportController = require('./report.controller');

const router = express.Router();

/**
 * @openapi
 * /api/manager/reports/sales:
 *   get:
 *     tags: [Reports]
 *     summary: รายงานยอดขาย (Manager)
 *     description: |
 *       SQL aggregate จากตาราง orders + order_items + products
 *
 *       **Query Logic:**
 *       - totalOrders: COUNT(order_id) ทั้งหมด
 *       - totalRevenue: SUM(total_amount) ของ orders ที่ status IN (Confirmed, Shipping, Delivered)
 *       - นับจำนวนแต่ละสถานะ: confirmedCount, shippingCount, deliveredCount
 *       - Top 5 สินค้าขายดี: GROUP BY product_id, ORDER BY SUM(qty*unit_price) DESC
 *
 *       **Orders ใน glowtime.sql seed data:**
 *       | order_id | status | total_amount |
 *       |---------|--------|-------------|
 *       | 1 | Confirmed | 2370 |
 *       | 2 | Shipping | 850 |
 *       | 3 | Delivered | 1100 |
 *       | 4 | Pending | 490 |
 *       | 5 | Confirmed | 2370 |
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายงานยอดขาย
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/SalesReport' }
 *       401:
 *         description: ไม่มี Token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น manager)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/sales', verifyToken, requireRole('manager'), reportController.getSalesReport);

/**
 * @openapi
 * /api/manager/reports/stock:
 *   get:
 *     tags: [Reports]
 *     summary: รายงานสต็อกสินค้า (Manager)
 *     description: |
 *       SELECT จาก products JOIN brands JOIN categories
 *       เรียงตาม stock_qty ASC (น้อยสุดก่อน)
 *
 *       **Stock Status:**
 *       - **ok**: products.stock_qty > 30
 *       - **low**: products.stock_qty ระหว่าง 1–30 (แจ้งเตือนใกล้หมด)
 *       - **out**: products.stock_qty = 0 (หมดสต็อก)
 *
 *       **ข้อมูลจาก glowtime.sql (ทั้งหมด 10 สินค้า stock_qty > 30 ทุกชิ้น = status: ok)**
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายงานสต็อก
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/StockReport' }
 *       401:
 *         description: ไม่มี Token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น manager)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/stock', verifyToken, requireRole('manager'), reportController.getStockReport);

/**
 * @openapi
 * /api/manager/reports/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: ข้อมูล Revenue Chart (Manager)
 *     description: |
 *       Aggregate จาก orders WHERE status IN (confirmed, shipping, delivered)
 *       GROUP BY date (7D/30D) หรือ month (1Y)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['7D', '30D', '1Y']
 *           default: '7D'
 *         description: ช่วงเวลา (7 วัน / 30 วัน / 1 ปี)
 *         example: 7D
 *     responses:
 *       200:
 *         description: ข้อมูล chart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:       { type: string }
 *                     labels:       { type: array, items: { type: string } }
 *                     revenue:      { type: array, items: { type: number } }
 *                     orders:       { type: array, items: { type: integer } }
 *                     totalRevenue: { type: number }
 *                     totalOrders:  { type: integer }
 */
router.get('/revenue', verifyToken, requireRole('manager'), reportController.getRevenueChart);

/**
 * @openapi
 * /api/manager/reports/category-sales:
 *   get:
 *     tags: [Reports]
 *     summary: ยอดขายแยกตามหมวดหมู่สินค้า (Manager)
 *     description: |
 *       SUM(qty * unit_price) GROUP BY category จากตาราง categories + products + order_items
 *       ใช้สำหรับ widget "Sales Revenue by Category" (โดนัทชาร์ต)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ยอดขายแยกตามหมวดหมู่
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     labels:      { type: array, items: { type: string } }
 *                     revenue:     { type: array, items: { type: number } }
 *                     percentages: { type: array, items: { type: number } }
 *       401:
 *         description: ไม่มี Token
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น manager)
 */
router.get('/category-sales', verifyToken, requireRole('manager'), reportController.getCategorySales);

/**
 * @openapi
 * /api/manager/reports/skin-types:
 *   get:
 *     tags: [Reports]
 *     summary: สัดส่วนลูกค้าตามประเภทผิว (Manager)
 *     description: |
 *       COUNT(*) GROUP BY customers.skin_type
 *       ใช้สำหรับ widget "Customer Skin Type Profiles" (บาร์ชาร์ต)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สัดส่วนลูกค้าตามประเภทผิว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     labels: { type: array, items: { type: string } }
 *                     counts: { type: array, items: { type: integer } }
 *       401:
 *         description: ไม่มี Token
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น manager)
 */
router.get('/skin-types', verifyToken, requireRole('manager'), reportController.getSkinTypes);

module.exports = router;
