const express = require('express');
const productController = require('./product.controller');

const router = express.Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: ดึงรายการสินค้าทั้งหมด (รองรับ filter)
 *     parameters:
 *       - in: query
 *         name: skinType
 *         schema:
 *           type: string
 *           enum: [dry, oily, combination, sensitive, normal, all]
 *         description: กรองตามประเภทผิว
 *         example: sensitive
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: กรองตามแบรนด์ (case-insensitive)
 *         example: GlowLab
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: กรองตามหมวดหมู่
 *         example: Serum
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *         description: ราคาขั้นต่ำ
 *         example: 300
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         description: ราคาสูงสุด
 *         example: 700
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: ค้นหาจากชื่อสินค้า
 *         example: serum
 *     responses:
 *       200:
 *         description: รายการสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count:   { type: integer, example: 6 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 */
router.get('/', productController.getProducts);

/**
 * @openapi
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: ดูรายละเอียดสินค้าตาม ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Product ID
 *         example: 1001
 *     responses:
 *       200:
 *         description: รายละเอียดสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: ไม่พบสินค้า
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', productController.getProductById);

module.exports = router;

