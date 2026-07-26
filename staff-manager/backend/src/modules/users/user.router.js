const express = require('express');
const { verifyToken, requireRole } = require('../../middlewares/auth.middleware');
const userController = require('./user.controller');

const router = express.Router();

/**
 * @openapi
 * /api/manager/users:
 *   get:
 *     tags: [Users]
 *     summary: จัดการบัญชีผู้ใช้ — ดูทั้งหมด (Manager)
 *     description: |
 *       JOIN: users LEFT JOIN staffs LEFT JOIN customers
 *
 *       **ตาราง users (glowtime.sql)**
 *       | Column | Type | หมายเหตุ |
 *       |--------|------|---------|
 *       | user_id | INT PK | |
 *       | username | VARCHAR(50) | |
 *       | email | VARCHAR(100) UNIQUE | |
 *       | password_hash | VARCHAR(255) | bcrypt hash |
 *       | role | ENUM | customer/staff/manager |
 *
 *       **Users ใน glowtime.sql seed data:**
 *       | user_id | username | role |
 *       |---------|----------|------|
 *       | 1 | customer01 | customer |
 *       | 2 | customer02 | customer |
 *       | 3 | customer03 | customer |
 *       | 4 | customer04 | customer |
 *       | 5 | customer05 | customer |
 *       | 6 | staff01 | staff (position: Warehouse) |
 *       | 7 | staff02 | staff (position: Sales) |
 *       | 8 | manager01 | manager |
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [customer, staff, manager]
 *         description: กรองตาม users.role (ไม่ระบุ = แสดงทุก role)
 *         example: staff
 *     responses:
 *       200:
 *         description: รายการผู้ใช้ทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 total:   { type: integer, example: 8 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/AnyUser' }
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
router.get('/', verifyToken, requireRole('manager'), userController.getAllUsers);

/**
 * @openapi
 * /api/manager/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: ดูบัญชีผู้ใช้ตาม user_id (Manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: users.user_id (1–8 ใน seed data)
 *         example: 6
 *     responses:
 *       200:
 *         description: ข้อมูลผู้ใช้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AnyUser' }
 *       404:
 *         description: ไม่พบผู้ใช้ (user_id ไม่มีใน DB)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/:id', verifyToken, requireRole('manager'), userController.getUserById);

/**
 * @openapi
 * /api/manager/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: อัปเดตบัญชีผู้ใช้ (Manager)
 *     description: |
 *       UPDATE users SET ... WHERE user_id = ?
 *       ถ้า role = staff จะ UPDATE staffs.position ด้วย
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: users.user_id
 *         example: 6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, example: "staff01_updated" }
 *               role:
 *                 type: string
 *                 enum: [customer, staff, manager]
 *                 description: users.role
 *                 example: staff
 *               position:
 *                 type: string
 *                 example: "Sales"
 *                 description: "staffs.position (ใช้ได้เฉพาะ role=staff)"
 *     responses:
 *       200:
 *         description: อัปเดตผู้ใช้สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/AnyUser' }
 *       404:
 *         description: ไม่พบผู้ใช้
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.put('/:id', verifyToken, requireRole('manager'), userController.updateUser);

/**
 * @openapi
 * /api/manager/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: ลบบัญชีผู้ใช้ (Manager)
 *     description: |
 *       DELETE จาก users WHERE user_id = ?
 *       > ⚠️ ระวัง: ลบ users จะ CASCADE ถึง staffs/customers ที่ FK อ้างถึง
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: users.user_id
 *         example: 6
 *     responses:
 *       200:
 *         description: ลบผู้ใช้สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "ลบบัญชีผู้ใช้ staff01 สำเร็จ" }
 *       404:
 *         description: ไม่พบผู้ใช้
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.delete('/:id', verifyToken, requireRole('manager'), userController.deleteUser);

module.exports = router;
