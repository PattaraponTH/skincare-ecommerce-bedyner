require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/store');

const PORT = process.env.PORT || 5001;

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
