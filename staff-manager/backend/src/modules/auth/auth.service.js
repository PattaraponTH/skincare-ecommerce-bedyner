const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { pool } = require('../../config/store');

/**
 * เข้าสู่ระบบ (staff / manager)
 * Query ตาราง users + staffs จาก MySQL จริง
 */
const login = async ({ email, password }) => {
  const [[user]] = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.password_hash, u.role,
            s.staff_id, s.position
     FROM users u
     LEFT JOIN staffs s ON s.user_id = u.user_id
     WHERE u.email = ? AND u.role IN ('staff', 'manager')`,
    [email]
  );

  if (!user) {
    const err = new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
};

/**
 * ดึงข้อมูล profile ของตัวเอง
 */
const getProfile = async (userId) => {
  const [[user]] = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.role,
            s.staff_id, s.position
     FROM users u
     LEFT JOIN staffs s ON s.user_id = u.user_id
     WHERE u.user_id = ?`,
    [userId]
  );

  if (!user) {
    const err = new Error('ไม่พบข้อมูลผู้ใช้');
    err.statusCode = 404;
    throw err;
  }
  return sanitizeUser(user);
};

// ── Helpers ────────────────────────────────────────────────

const generateToken = (user) =>
  jwt.sign(
    { userId: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/** ซ่อน password_hash ก่อนส่งออก */
const sanitizeUser = ({ password_hash: _pw, ...rest }) => rest;

module.exports = { login, getProfile };
