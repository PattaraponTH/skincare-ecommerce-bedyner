const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const authController = require('./auth.controller');

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: สมัครสมาชิกลูกค้าใหม่
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:  { type: string, example: my_username }
 *               email:     { type: string, format: email, example: user@example.com }
 *               password:  { type: string, minLength: 6, example: password123 }
 *               skinType:
 *                 type: string
 *                 enum: [dry, oily, combination, sensitive, normal]
 *                 example: sensitive
 *               phone: { type: string, example: "081-234-5678" }
 *     responses:
 *       201:
 *         description: สมัครสมาชิกสำเร็จ ได้รับ JWT token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: ข้อมูลไม่ครบ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       409:
 *         description: อีเมลซ้ำ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/register', authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: เข้าสู่ระบบ
 *     description: |
 *       **Mock accounts (password: `password123`)**
 *       - `customer@glowtime.com`
 *       - `jane@glowtime.com`
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: customer@glowtime.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ ได้รับ JWT token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400:
 *         description: ข้อมูลไม่ครบ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: อีเมลหรือรหัสผ่านไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /api/auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: ดูข้อมูล Profile ของตัวเอง
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ข้อมูล Profile สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/UserProfile' }
 *       401:
 *         description: ไม่มี Token หรือ Token หมดอายุ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/profile', verifyToken, requireRole('customer'), authController.getProfile);

module.exports = router;

