const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./inventory.controller');
const router = express.Router();

/**
 * @openapi
 * /api/manager/inventory/lots:
 *   get:
 *     tags: [Inventory]
 *     summary: ดูข้อมูล Inventory Lots (Manager)
 *     description: |
 *       สร้างจาก products + expiry_date (glowtime.sql ไม่มี inventory_lots table)
 *       เรียงตาม expiry_date ASC (ใกล้หมดอายุก่อน)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: รายการ lots ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total:   { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       lotNo:        { type: string, example: LOT-0001 }
 *                       productName:  { type: string }
 *                       supplier:     { type: string }
 *                       qtyReceived:  { type: integer }
 *                       expDate:      { type: string }
 *                       status:       { type: string, enum: [In Stock, Low Stock, Out of Stock] }
 */
router.get('/lots', verifyToken, requireRole('manager'), ctrl.getInventoryLots);

module.exports = router;
