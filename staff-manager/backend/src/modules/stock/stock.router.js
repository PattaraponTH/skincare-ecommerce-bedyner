const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const stockController = require('./stock.controller');

const router = express.Router();

/**
 * @openapi
 * /api/staff/stock:
 *   get:
 *     tags: [Stock]
 *     summary: ดูสต็อกสินค้าทั้งหมด (Staff)
 *     description: |
 *       SELECT จาก products JOIN brands JOIN categories
 *       เรียงตาม stock_qty จากน้อยสุดก่อน (เพื่อให้เห็นของใกล้หมดก่อน)
 *
 *       **สินค้าใน glowtime.sql (10 รายการ):**
 *       | product_id | name | stock_qty |
 *       |-----------|------|-----------|
 *       | 1 | Anua Heartleaf Toner | 100 |
 *       | 2 | SKINTIFIC Niacinamide Serum | 120 |
 *       | 3 | BOJ Dynasty Cream | 80 |
 *       | 4 | COSRX Low pH Cleanser | 150 |
 *       | 5 | La Roche-Posay Anthelios SPF50 | 70 |
 *       | 6 | Anua Peach Serum | 90 |
 *       | 7 | SKINTIFIC Moisture Gel | 100 |
 *       | 8 | BOJ Relief Sun | 130 |
 *       | 9 | COSRX Propolis Toner | 95 |
 *       | 10 | Effaclar Cleanser | 60 |
 *
 *       **Stock Status (คำนวณใน service):**
 *       - **ok**: stock_qty > 30
 *       - **low**: stock_qty 1–30 (ใกล้หมด)
 *       - **out**: stock_qty = 0 (หมดแล้ว)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการสต็อกสินค้าทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 10 }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       productId:  { type: integer, example: 1, description: "products.product_id" }
 *                       name:       { type: string,  example: "Anua Heartleaf Toner" }
 *                       brand:      { type: string,  example: "Anua", description: "brands.name" }
 *                       category:   { type: string,  example: "Toner", description: "categories.name" }
 *                       stockQty:   { type: integer, example: 100, description: "products.stock_qty" }
 *                       expiryDate: { type: string,  example: "2028-12-31", description: "products.expiry_date" }
 *                       status:
 *                         type: string
 *                         enum: [ok, low, out]
 *                         description: "ok = stock_qty>30 | low = 1-30 | out = 0"
 *       401:
 *         description: ไม่มี Token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', verifyToken, requireRole('staff'), stockController.getAllStock);

/**
 * @openapi
 * /api/staff/stock/{productId}:
 *   put:
 *     tags: [Stock]
 *     summary: อัปเดตจำนวนสต็อก (Staff)
 *     description: |
 *       UPDATE products SET stock_qty = ? WHERE product_id = ?
 *
 *       ตัวอย่าง: อัปเดต Anua Heartleaf Toner (product_id=1) เพิ่มสต็อกเป็น 150
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: integer }
 *         description: products.product_id (1–10 ใน seed data)
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stockQty]
 *             properties:
 *               stockQty:
 *                 type: integer
 *                 minimum: 0
 *                 example: 150
 *                 description: "จำนวน stock_qty ใหม่ (ต้อง >= 0)"
 *     responses:
 *       200:
 *         description: อัปเดตสต็อกสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       400:
 *         description: stockQty ไม่ถูกต้อง (ต้องเป็น integer >= 0)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: ไม่พบสินค้า (product_id ไม่มีใน products table)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.put('/:productId', verifyToken, requireRole('staff'), stockController.updateStock);

module.exports = router;
