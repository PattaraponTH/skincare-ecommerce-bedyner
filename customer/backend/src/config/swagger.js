const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GLOWTIME — Customer Backend API',
      version: '1.0.0',
      description: `
## ระบบร้านจำหน่ายสกินแคร์ออนไลน์ GLOWTIME

API สำหรับฝั่ง **Customer** (ลูกค้า) ครอบคลุม:
- 🔐 **Auth** — สมัครสมาชิก / เข้าสู่ระบบ
- 🧴 **Products** — ค้นหาและดูสินค้า (รองรับ filter ประเภทผิว, แบรนด์, ราคา)
- 🛒 **Cart** — จัดการตะกร้าสินค้า
- 📦 **Orders** — สั่งซื้อและติดตามสถานะ
- 💳 **Payments** — ชำระเงิน (Simulation)
- ⭐ **Reviews** — เขียนและดูรีวิวสินค้า

> **หมายเหตุ:** ปัจจุบันใช้ **Mock JSON (in-memory)** แทน MySQL
> เมื่อพร้อม ให้แทนที่ \`src/config/store.js\` ด้วย MySQL2 queries

### การ Authenticate
ใช้ **Bearer Token (JWT)** — รับ token จาก \`POST /api/auth/login\` แล้วใส่ใน header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
      `,
      contact: {
        name: 'GLOWTIME Dev Team',
        email: 'glowtime@dev.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server (Mock Data)',
      },
      {
        url: 'https://glowtime-customer-api.onrender.com',
        description: 'Production Server (Render)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'รับ token จาก POST /api/auth/login แล้วใส่ที่นี่',
        },
      },
      schemas: {
        // ── User ────────────────────────────────────────────
        UserProfile: {
          type: 'object',
          properties: {
            id:        { type: 'integer', example: 1 },
            username:  { type: 'string',  example: 'naphatsorn_k' },
            email:     { type: 'string',  format: 'email', example: 'customer@glowtime.com' },
            role:      { type: 'string',  example: 'customer' },
            createdAt: { type: 'string',  format: 'date-time' },
            profile: {
              type: 'object',
              properties: {
                skinType: { type: 'string', example: 'sensitive' },
                phone:    { type: 'string', example: '081-234-5678' },
              },
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                user:  { $ref: '#/components/schemas/UserProfile' },
              },
            },
          },
        },
        // ── Product ─────────────────────────────────────────
        Product: {
          type: 'object',
          properties: {
            id:            { type: 'integer',  example: 1001 },
            name:          { type: 'string',   example: 'Hyaluronic Acid Serum 30ml' },
            brand:         { type: 'string',   example: 'GlowLab' },
            category:      { type: 'string',   example: 'Serum' },
            skinTypeTarget:{ type: 'array', items: { type: 'string' }, example: ['dry', 'sensitive'] },
            ingredients:   { type: 'array', items: { type: 'string' }, example: ['Hyaluronic Acid', 'Panthenol'] },
            description:   { type: 'string' },
            price:         { type: 'number',   example: 590 },
            stockQty:      { type: 'integer',  example: 120 },
            expiryDate:    { type: 'string',   example: '2027-05-01' },
            images:        { type: 'array', items: { type: 'string' } },
            averageRating: { type: 'number',   example: 4.6 },
            reviewCount:   { type: 'integer',  example: 38 },
          },
        },
        // ── Cart ────────────────────────────────────────────
        CartItem: {
          type: 'object',
          properties: {
            cartItemId:  { type: 'integer', example: 1 },
            productId:   { type: 'integer', example: 1001 },
            productName: { type: 'string',  example: 'Hyaluronic Acid Serum 30ml' },
            unitPrice:   { type: 'number',  example: 590 },
            qty:         { type: 'integer', example: 2 },
            subtotal:    { type: 'number',  example: 1180 },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            customerId:  { type: 'integer', example: 1 },
            items:       { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
            totalAmount: { type: 'number', example: 1180 },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        // ── Order ───────────────────────────────────────────
        ShippingAddress: {
          type: 'object',
          required: ['recipient', 'address'],
          properties: {
            recipient:  { type: 'string', example: 'นภัสสร ใส่ใจผิว' },
            address:    { type: 'string', example: '123/45 ถ.สุขุมวิท' },
            province:   { type: 'string', example: 'กรุงเทพมหานคร' },
            postalCode: { type: 'string', example: '10110' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id:              { type: 'integer', example: 1 },
            orderId:         { type: 'string',  example: 'ORD-20260722-0001' },
            customerId:      { type: 'integer', example: 1 },
            status: {
              type: 'string',
              enum: ['pending_payment', 'confirmed', 'shipping', 'delivered'],
              example: 'pending_payment',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  orderItemId: { type: 'integer' },
                  productId:   { type: 'integer' },
                  productName: { type: 'string' },
                  qty:         { type: 'integer' },
                  unitPrice:   { type: 'number' },
                  subtotal:    { type: 'number' },
                },
              },
            },
            totalAmount:     { type: 'number',  example: 1180 },
            shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
            createdAt:       { type: 'string',  format: 'date-time' },
          },
        },
        // ── Payment ─────────────────────────────────────────
        Payment: {
          type: 'object',
          properties: {
            id:        { type: 'integer', example: 1 },
            paymentId: { type: 'string',  example: 'PAY-20260722-0001' },
            orderId:   { type: 'string',  example: 'ORD-20260722-0001' },
            method: {
              type: 'string',
              enum: ['credit_card', 'qr_code', 'bank_transfer'],
              example: 'credit_card',
            },
            status:  { type: 'string', example: 'success' },
            amount:  { type: 'number', example: 1180 },
            paidAt:  { type: 'string', format: 'date-time' },
          },
        },
        // ── Review ──────────────────────────────────────────
        Review: {
          type: 'object',
          properties: {
            id:         { type: 'integer', example: 1 },
            productId:  { type: 'integer', example: 1001 },
            customerId: { type: 'integer', example: 1 },
            orderId:    { type: 'string',  example: 'ORD-20260701-0001', nullable: true },
            rating:     { type: 'integer', minimum: 1, maximum: 5, example: 5 },
            comment:    { type: 'string',  example: 'ผิวชุ่มชื้นมาก เหมาะกับผิวแพ้ง่าย' },
            createdAt:  { type: 'string',  format: 'date-time' },
          },
        },
        // ── Common ──────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: 'เกิดข้อผิดพลาด' },
          },
        },
      },
    },
    tags: [
      { name: 'Health',   description: '🏥 ตรวจสอบสถานะ Server' },
      { name: 'Auth',     description: '🔐 สมัครสมาชิก / เข้าสู่ระบบ' },
      { name: 'Products', description: '🧴 สินค้า (สาธารณะ)' },
      { name: 'Cart',     description: '🛒 ตะกร้าสินค้า (ต้อง Login)' },
      { name: 'Orders',   description: '📦 คำสั่งซื้อ (ต้อง Login)' },
      { name: 'Payments', description: '💳 ชำระเงิน (ต้อง Login)' },
      { name: 'Reviews',  description: '⭐ รีวิวสินค้า' },
    ],
  },
  apis: ['./src/app.js', './src/modules/**/*.router.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
