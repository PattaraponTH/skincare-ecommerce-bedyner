require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 5001;

// ── Vercel Serverless: export app ตรงๆ ─────────────────────────
// Vercel ไม่ใช่ long-running process → ห้าม app.listen() และ process.exit()
// ใช้ module.exports = app แทน แล้ว Vercel จะ wrap เป็น serverless function เอง
if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // Production (Vercel): export เท่านั้น — DB จะเชื่อมต่อเมื่อมี request แรก
  module.exports = app;
} else {
  // Local development: start server ปกติ พร้อมทดสอบ DB connection ก่อน
  const { testConnection } = require('./src/config/store');
  (async () => {
    try {
      await testConnection();
      console.log('✅  MySQL connected to Railway successfully');
    } catch (err) {
      console.error('❌  MySQL connection failed:', err.message);
      console.warn('⚠️   Starting without DB — some endpoints may fail');
      // ไม่ process.exit() เพื่อให้ server ยังทำงานได้สำหรับ health check
    }

    app.listen(PORT, () => {
      console.log('╔══════════════════════════════════════════════╗');
      console.log('║    GLOWTIME — Staff & Manager Backend        ║');
      console.log('╠══════════════════════════════════════════════╣');
      console.log(`║  Server running on  : http://localhost:${PORT}  ║`);
      console.log(`║  Environment        : ${(process.env.NODE_ENV || 'development').padEnd(26)}║`);
      console.log('║  Data Mode          : Railway MySQL (Live DB)║');
      console.log('║  Roles              : staff | manager        ║');
      console.log('╚══════════════════════════════════════════════╝');
    });
  })();
}