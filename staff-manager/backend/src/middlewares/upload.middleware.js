const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// ── โฟลเดอร์เก็บไฟล์รูปสินค้าจริงบนเซิร์ฟเวอร์ ──────────────
const UPLOAD_DIR = path.join(__dirname, '../../uploads/products');

// Vercel มี read-only filesystem → ใช้ memoryStorage แทน
// Local dev → ใช้ diskStorage ปกติ
let storage;
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safe);
    },
  });
} catch (_) {
  // Vercel / read-only fs → ใช้ memory storage (ไฟล์อยู่ใน RAM ชั่วคราว)
  storage = multer.memoryStorage();
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP เท่านั้น'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload, UPLOAD_DIR };
