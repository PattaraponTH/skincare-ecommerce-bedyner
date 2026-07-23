const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const cartController = require('./cart.controller');

const router = express.Router();

// ทุก route ต้อง login ในฐานะ customer
router.use(verifyToken, requireRole('customer'));

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: ดูตะกร้าสินค้าของตัวเอง
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูลตะกร้าสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Cart' }
 *       401:
 *         description: ไม่มี Token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/', cartController.getCart);

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: เพิ่มสินค้าลงตะกร้า
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, qty]
 *             properties:
 *               productId: { type: integer, example: 1001 }
 *               qty:       { type: integer, minimum: 1, example: 2 }
 *     responses:
 *       201:
 *         description: เพิ่มสินค้าลงตะกร้าสำเร็จ (ได้ cart ที่อัปเดตกลับมา)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Cart' }
 *       400:
 *         description: สินค้าไม่เพียงพอหรือข้อมูลไม่ครบ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: ไม่พบสินค้า
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/items', cartController.addItem);

/**
 * @openapi
 * /api/cart/items/{cartItemId}:
 *   put:
 *     tags: [Cart]
 *     summary: แก้ไขจำนวนสินค้าในตะกร้า
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema: { type: integer }
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [qty]
 *             properties:
 *               qty: { type: integer, minimum: 1, example: 3 }
 *     responses:
 *       200:
 *         description: อัปเดตจำนวนสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Cart' }
 *       404:
 *         description: ไม่พบสินค้าในตะกร้า
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     tags: [Cart]
 *     summary: ลบสินค้าออกจากตะกร้า
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cartItemId
 *         required: true
 *         schema: { type: integer }
 *         example: 1
 *     responses:
 *       200:
 *         description: ลบสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: ลบสินค้าออกจากตะกร้าแล้ว }
 *                 data: { $ref: '#/components/schemas/Cart' }
 *       404:
 *         description: ไม่พบสินค้าในตะกร้า
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.put('/items/:cartItemId', cartController.updateItem);
router.delete('/items/:cartItemId', cartController.removeItem);

module.exports = router;

