const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./category.controller');
const router = express.Router();

/**
 * @openapi
 * /api/manager/categories:
 *   get:
 *     tags: [Categories]
 *     summary: ดูหมวดหมู่สินค้าทั้งหมด (Manager)
 *     description: |
 *       SELECT จาก categories JOIN products เพื่อนับจำนวนสินค้าแต่ละ category
 *       **Categories ใน glowtime.sql:** Cleanser, Toner, Serum, Moisturizer, Sunscreen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการหมวดหมู่ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 5 }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:           { type: integer, example: 1 }
 *                       name:         { type: string,  example: Serum }
 *                       productCount: { type: integer, example: 2 }
 *                       status:       { type: string,  example: Active }
 */
router.get('/', verifyToken, requireRole('manager'), ctrl.getAllCategories);

/**
 * @openapi
 * /api/manager/categories:
 *   post:
 *     tags: [Categories]
 *     summary: เพิ่มหมวดหมู่ใหม่ (Manager)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Eye Cream" }
 *     responses:
 *       201:
 *         description: เพิ่มหมวดหมู่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:   { type: integer, example: 6 }
 *                     name: { type: string,  example: Eye Cream }
 */
router.post('/', verifyToken, requireRole('manager'), ctrl.createCategory);

/**
 * @openapi
 * /api/manager/categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: แก้ไขชื่อหมวดหมู่ (Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Serum & Essence" }
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 */
router.put('/:id', verifyToken, requireRole('manager'), ctrl.updateCategory);

/**
 * @openapi
 * /api/manager/categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: ลบหมวดหมู่ (Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         example: 6
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */
router.delete('/:id', verifyToken, requireRole('manager'), ctrl.deleteCategory);

module.exports = router;
