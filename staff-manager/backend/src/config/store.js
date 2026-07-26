/**
 * MySQL Data Layer — GLOWTIME Staff & Manager Backend
 * ─────────────────────────────────────────────────────────────────
 * เชื่อมต่อ Railway MySQL ผ่าน mysql2/promise connection pool
 * แทนที่ Mock JSON in-memory store เดิม
 * Pattern เดียวกับ customer/backend/src/config/store.js
 * ─────────────────────────────────────────────────────────────────
 */

const mysql = require('mysql2/promise');

// ── Connection Pool ──────────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASS,
  database:           process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  // คืนค่าคอลัมน์ type DATE เป็น string 'YYYY-MM-DD' ตรงๆ แทนที่จะแปลงเป็น JS Date object
  // (ถ้าไม่ตั้งค่านี้ mysql2 จะตีความเป็น local-midnight แล้วแปลงเป็น UTC ตอน JSON.stringify
  //  ทำให้วันที่เพี้ยนไป 1 วันเมื่อ server timezone เป็น UTC+ และยังทำให้ <input type="date"> รับค่าไม่ได้)
  dateStrings: true,
  // SSL required for Railway external connections
  ssl: { rejectUnauthorized: false },
});

/**
 * ทดสอบการเชื่อมต่อ — เรียกใช้ตอน server start
 */
const testConnection = async () => {
  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
};

module.exports = { pool, testConnection };
