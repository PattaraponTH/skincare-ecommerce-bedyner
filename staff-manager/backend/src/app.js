const path         = require('path');
const express      = require('express');
const cors         = require('cors');
const swaggerUi    = require('swagger-ui-express');
const swaggerSpec  = require('./config/swagger');

const authRouter     = require('./modules/auth/auth.router');
const orderRouter    = require('./modules/orders/order.router');
const shipmentRouter = require('./modules/shipments/shipment.router');
const stockRouter    = require('./modules/stock/stock.router');
const productRouter  = require('./modules/products/product.router');
const reportRouter   = require('./modules/reports/report.router');
const userRouter     = require('./modules/users/user.router');
const categoryRouter  = require('./modules/categories/category.router');
const couponRouter    = require('./modules/coupons/coupon.router');
const marketingRouter = require('./modules/marketing/marketing.router');
const reviewRouter    = require('./modules/reviews/review.router');
const settingsRouter  = require('./modules/settings/settings.router');
const inventoryRouter = require('./modules/inventory/inventory.router');

const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  // อนุญาตทุก origin ในช่วง development
  // (null = เปิดจาก file://, localhost port ใดก็ได้)
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json());

// ── Static files: รูปสินค้าที่อัปโหลดจริงผ่าน /api/manager/products/upload-image ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Swagger UI ─────────────────────────────────────────────
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'GLOWTIME Staff & Manager API Docs',
    customfavIcon: '',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
    },
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
      .swagger-ui .topbar .download-url-wrapper { display: none; }
      .swagger-ui .info .title { color: #e91e8c; }
      .swagger-ui .info { margin: 20px 0; }
    `,
  })
);

// ── JSON Spec endpoint (สำหรับ import เข้า Postman ได้เลย)
app.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ── Health Check ───────────────────────────────────────────
/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: ตรวจสอบสถานะ Server
 *     description: ใช้เพื่อตรวจสอบว่า Server ทำงานอยู่หรือไม่
 *     responses:
 *       200:
 *         description: Server ทำงานปกติ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:    { type: string, example: ok }
 *                 service:   { type: string, example: GLOWTIME Staff & Manager Backend }
 *                 version:   { type: string, example: "1.0.0" }
 *                 dataMode:  { type: string, example: Mock JSON (in-memory) }
 *                 roles:     { type: string, example: "staff | manager" }
 *                 timestamp: { type: string, format: date-time }
 */
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'GLOWTIME Staff & Manager Backend',
    version:   '1.0.0',
    dataMode:  'Railway MySQL (Live DB)',
    roles:     'staff | manager',
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────
// Auth (shared)
app.use('/api/auth',              authRouter);

// Staff routes
app.use('/api/staff/orders',      orderRouter);
app.use('/api/staff/shipments',   shipmentRouter);
app.use('/api/staff/stock',       stockRouter);

// Manager routes
app.use('/api/manager/products',  productRouter);
app.use('/api/manager/reports',   reportRouter);
app.use('/api/manager/users',     userRouter);
app.use('/api/manager/categories',  categoryRouter);
app.use('/api/manager/coupons',     couponRouter);
app.use('/api/manager/promotions',  marketingRouter);
app.use('/api/manager/reviews',     reviewRouter);
app.use('/api/manager/settings',    settingsRouter);
app.use('/api/manager/inventory',   inventoryRouter);

// ── 404 Handler (API routes only) ──────────────────────────
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// ── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

module.exports = app;
