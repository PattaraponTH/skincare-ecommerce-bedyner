const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const ctrl = require('./settings.controller');
const router = express.Router();

/**
 * @openapi
 * /api/manager/settings:
 *   get:
 *     tags: [Settings]
 *     summary: ดูการตั้งค่าระบบ (Manager)
 *     description: In-memory store (glowtime.sql ไม่มี settings table)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: การตั้งค่าปัจจุบัน
 */
router.get('/', verifyToken, requireRole('manager'), ctrl.getSettings);

/**
 * @openapi
 * /api/manager/settings:
 *   put:
 *     tags: [Settings]
 *     summary: อัปเดตการตั้งค่าระบบ (Manager)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeName:             { type: string }
 *               taxRate:               { type: number }
 *               freeShippingThreshold: { type: number }
 *               lowStockThreshold:     { type: integer }
 *               maintenanceMode:       { type: boolean }
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 */
router.put('/', verifyToken, requireRole('manager'), ctrl.updateSettings);

module.exports = router;
