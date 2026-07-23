const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { findOne, create } = require('../../config/store');

const SALT_ROUNDS = 10;

/**
 * สมัครสมาชิก
 */
const register = async ({ username, email, password, skinType, phone }) => {
  // ตรวจสอบ email ซ้ำ
  const existing = findOne('users', (u) => u.email === email);
  if (existing) {
    const err = new Error('อีเมลนี้ถูกใช้งานแล้ว');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = create('users', {
    username,
    email,
    passwordHash,
    role: 'customer',
    createdAt: new Date().toISOString(),
    profile: { skinType: skinType || null, phone: phone || null },
  });

  const token = generateToken(newUser);
  return { token, user: sanitizeUser(newUser) };
};

/**
 * เข้าสู่ระบบ
 */
const login = async ({ email, password }) => {
  const user = findOne('users', (u) => u.email === email && u.role === 'customer');
  if (!user) {
    const err = new Error('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
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
const getProfile = (userId) => {
  const user = findOne('users', (u) => u.id === userId);
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
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/** ซ่อน passwordHash ก่อนส่งออก */
const sanitizeUser = ({ passwordHash: _pw, ...rest }) => rest;

module.exports = { register, login, getProfile };
