const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const productController = require('./product.controller');

const router = express.Router();

/**
 * @openapi
 * /api/manager/products:
 *   get:
 *     tags: [Products]
 *     summary: ดูสินค้าทั้งหมด (Manager)
 *     description: |
 *       JOIN: products + brands + categories + product_images + reviews
 *
 *       **ตาราง products (glowtime.sql)**
 *       | Column | Type | หมายเหตุ |
 *       |--------|------|---------|
 *       | product_id | INT PK | → id |
 *       | brand_id | INT FK | → brands.brand_id |
 *       | category_id | INT FK | → categories.category_id |
 *       | name | VARCHAR(255) | ชื่อสินค้า |
 *       | ingredients | TEXT | ส่วนผสม (string ไม่ใช่ array) |
 *       | price | DECIMAL(10,2) | ราคา |
 *       | stock_qty | INT | → stockQty |
 *       | expiry_date | DATE | → expiryDate |
 *
 *       **Brands ใน DB:** Anua, SKINTIFIC, Beauty of Joseon, COSRX, La Roche-Posay
 *       **Categories ใน DB:** Cleanser, Toner, Serum, Moisturizer, Sunscreen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: กรองตาม categories.name (เช่น Serum, Toner, Cleanser)
 *         example: Serum
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: กรองตาม brands.name (เช่น Anua, COSRX)
 *         example: Anua
 *     responses:
 *       200:
 *         description: รายการสินค้าทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 10 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 */
router.get('/', verifyToken, requireRole('manager'), productController.getAllProducts);

/**
 * @openapi
 * /api/manager/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: ดูสินค้าตาม product_id (Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: products.product_id
 *         example: 1
 *     responses:
 *       200:
 *         description: ข้อมูลสินค้า
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
router.get('/:id', verifyToken, requireRole('manager'), productController.getProductById);

/**
 * @openapi
 * /api/manager/products:
 *   post:
 *     tags: [Products]
 *     summary: เพิ่มสินค้าใหม่ (Manager)
 *     description: |
 *       INSERT ลงตาราง products (+ product_images ถ้ามี imageUrl)
 *       brand และ category ต้องมีอยู่ใน DB แล้ว
 *
 *       **Brands ที่มีใน DB:** Anua, SKINTIFIC, Beauty of Joseon, COSRX, La Roche-Posay
 *       **Categories ที่มีใน DB:** Cleanser, Toner, Serum, Moisturizer, Sunscreen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, brand, category, price, stockQty]
 *             properties:
 *               name:        { type: string,  example: "COSRX Snail Mucin Serum 30ml" }
 *               brand:       { type: string,  example: "COSRX", description: "ต้องมีใน brands table" }
 *               category:    { type: string,  example: "Serum", description: "ต้องมีใน categories table" }
 *               ingredients: { type: string,  example: "Snail Secretion Filtrate", description: "TEXT field (string ไม่ใช่ array)" }
 *               price:       { type: number,  example: 690 }
 *               stockQty:    { type: integer, example: 100, description: "→ products.stock_qty" }
 *               expiryDate:  { type: string,  example: "2028-12-31", description: "→ products.expiry_date (DATE)" }
 *               imageUrl:    { type: string,  example: "cosrx_snail.jpg", description: "→ product_images.image_url" }
 *     responses:
 *       201:
 *         description: เพิ่มสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       400:
 *         description: ข้อมูลไม่ครบ (name/brand/category/price/stockQty required)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/', verifyToken, requireRole('manager'), productController.createProduct);

/**
 * @openapi
 * /api/manager/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: แก้ไขสินค้า (Manager)
 *     description: |
 *       UPDATE products SET ... WHERE product_id = ?
 *       ส่งเฉพาะ field ที่ต้องการแก้ไขได้ (partial update)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: products.product_id
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string,  example: "Anua Heartleaf Toner 200ml" }
 *               brand:       { type: string,  example: "Anua" }
 *               category:    { type: string,  example: "Toner" }
 *               ingredients: { type: string,  example: "Heartleaf Extract 77%", description: "TEXT string" }
 *               price:       { type: number,  example: 750 }
 *               stockQty:    { type: integer, example: 80, description: "→ products.stock_qty" }
 *               expiryDate:  { type: string,  example: "2029-06-30", description: "→ products.expiry_date" }
 *               imageUrl:    { type: string,  example: "anua1_new.jpg", description: "→ product_images.image_url" }
 *     responses:
 *       200:
 *         description: แก้ไขสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: ไม่พบสินค้า (product_id ไม่มีใน DB)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.put('/:id', verifyToken, requireRole('manager'), productController.updateProduct);

/**
 * @openapi
 * /api/manager/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: ลบสินค้า (Manager)
 *     description: |
 *       DELETE จาก products WHERE product_id = ?
 *       (ลบ product_images ที่เกี่ยวข้องด้วย)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: products.product_id
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "ลบสินค้า Anua Heartleaf Toner สำเร็จ" }
 *       404:
 *         description: ไม่พบสินค้า
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete('/:id', verifyToken, requireRole('manager'), productController.deleteProduct);

module.exports = router;
