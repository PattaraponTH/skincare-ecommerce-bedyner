require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/store');

const PORT = process.env.PORT || 5001;

// ── Vercel รันไฟล์นี้เป็น Serverless Function ──────────────
// (VERCEL env var ถูกตั้งอัตโนมัติโดย Vercel ทุก deployment)
const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  // ── Local / Railway: รันแบบ persistent server ปกติ ──────
  // ── Test DB Connection then Start Server ───────────────────
  testConnection()
    .then(() => {
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║    GLOWTIME — Staff & Manager Backend        ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Server running on  : http://localhost:${PORT}  ║`);
      console.log(`║  Environment        : ${(process.env.NODE_ENV || 'development').padEnd(21)}║`);
      console.log('║  Data Mode          : Railway MySQL (Live DB)║');
      console.log('║  Roles              : staff | manager        ║');
      console.log('╚══════════════════════════════════════════════╝');

      app.listen(PORT);
    })
    .catch((err) => {
      console.error('❌ Database connection failed:', err.message);
      console.error('   กรุณาตรวจสอบ DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME ใน .env');
      process.exit(1);
    });
} else {
  // ── Vercel: ห้าม app.listen() และห้าม process.exit() ────
  // เดี๋ยว mysql2 pool จะ lazy-connect เองตอนมี query แรกเข้ามา
  // ถ้า connection พังตรงนี้ ปล่อยให้ request นั้นๆ ตอบ error แทน
  // การ crash ทั้ง function ทันที
  testConnection().catch((err) => {
    console.error('⚠️  DB connection test failed on cold start:', err.message);
  });
}

// ── Export สำหรับ @vercel/node (ตาม vercel.json) ───────────
module.exports = app;