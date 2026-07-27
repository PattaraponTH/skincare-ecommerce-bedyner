const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GLOWTIME — Staff & Manager Backend API',
      version: '1.0.0',
      description: `
## ระบบร้านจำหน่ายสกินแคร์ออนไลน์ GLOWTIME

API สำหรับฝั่ง **Staff** (พนักงาน) และ **Manager** (ผู้จัดการ) ครอบคลุม:
- 🔐 **Auth** — เข้าสู่ระบบ (staff / manager)
- 📦 **Orders** — จัดการคำสั่งซื้อ (Staff)
- 🚚 **Shipments** — บันทึกข้อมูลการจัดส่ง (Staff)
- 📦 **Stock** — จัดการสต็อกสินค้า (Staff)
- 🧴 **Products** — จัดการข้อมูลสินค้า (Manager)
- 📊 **Reports** — รายงานยอดขายและสต็อก (Manager)
- 👥 **Users** — จัดการบัญชีผู้ใช้ (Manager)

> **Data Source:** Railway MySQL — ฐานข้อมูล \`glowtime.sql\` (ข้อมูลจริง)

### การ Authenticate
ใช้ **Bearer Token (JWT)** — รับ token จาก \`POST /api/auth/login\` แล้วใส่ใน header:
\`\`\`
Authorization: Bearer <token>
\`\`\`

### Accounts (password: \`123456\` — จาก seed data ใน glowtime.sql)
| Email | Role |
|-------|------|
| staff01@gmail.com | staff |
| staff02@gmail.com | staff |
| manager01@gmail.com | manager |
      `,
      contact: {
        name: 'ภัทรพล ไหมร้อน (67171599) — Backend Developer',
        email: 'glowtime@dev.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: '🖥️ Local Development Server',
      },
      {
        url: 'https://glowtime-staff-backend.vercel.app',
        description: '🚀 Production Server (Vercel)',
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
        // ── User (จากตาราง users + staffs ใน glowtime.sql) ──────
        AdminUser: {
          type: 'object',
          description: 'ข้อมูล staff หรือ manager (จากตาราง users JOIN staffs)',
          properties: {
            user_id:  { type: 'integer', example: 6, description: 'Primary key ในตาราง users' },
            username: { type: 'string',  example: 'staff01' },
            email:    { type: 'string',  format: 'email', example: 'staff01@gmail.com' },
            role:     { type: 'string',  enum: ['staff', 'manager'], example: 'staff' },
            staff_id: { type: 'integer', example: 1, description: 'Primary key ในตาราง staffs' },
            position: { type: 'string',  example: 'Warehouse', nullable: true, description: 'จากตาราง staffs.position' },
          },
        },
        // ครอบคลุมทุก role (customer / staff / manager)
        AnyUser: {
          type: 'object',
          description: 'ข้อมูลผู้ใช้ทุก role (JOIN users + staffs + customers)',
          properties: {
            user_id:     { type: 'integer', example: 1 },
            username:    { type: 'string',  example: 'customer01' },
            email:       { type: 'string',  format: 'email', example: 'customer01@gmail.com' },
            role:        { type: 'string',  enum: ['customer', 'staff', 'manager'], example: 'customer' },
            staff_id:    { type: 'integer', example: null, nullable: true },
            position:    { type: 'string',  example: null, nullable: true },
            customer_id: { type: 'integer', example: 1,   nullable: true },
            skinType:    { type: 'string',  example: 'Oily', nullable: true, description: 'จากตาราง customers.skin_type' },
            phone:       { type: 'string',  example: '0811111111', nullable: true, description: 'จากตาราง customers.phone' },
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
                user:  { $ref: '#/components/schemas/AdminUser' },
              },
            },
          },
        },
        // ── Product (จากตาราง products JOIN brands+categories+product_images) ─
        Product: {
          type: 'object',
          description: 'ข้อมูลสินค้า (JOIN products + brands + categories + product_images)',
          properties: {
            id:             { type: 'integer',  example: 1, description: 'products.product_id' },
            name:           { type: 'string',   example: 'Anua Heartleaf Toner', description: 'products.name' },
            brand:          { type: 'string',   example: 'Anua', description: 'brands.name' },
            brandCountry:   { type: 'string',   example: 'South Korea', description: 'brands.country' },
            category:       { type: 'string',   example: 'Toner', description: 'categories.name' },
            skinTypeTarget: { type: 'string',   example: 'Sensitive', description: 'categories.skin_type_target' },
            ingredients:    { type: 'string',   example: 'Heartleaf Extract', description: 'products.ingredients (TEXT)' },
            price:          { type: 'number',   example: 690, description: 'products.price (DECIMAL)' },
            stockQty:       { type: 'integer',  example: 100, description: 'products.stock_qty' },
            expiryDate:     { type: 'string',   example: '2028-12-31', description: 'products.expiry_date (DATE)' },
            imageUrl:       { type: 'string',   example: 'anua1.jpg', nullable: true, description: 'product_images.image_url (แรกสุด)' },
            averageRating:  { type: 'number',   example: 4.5, description: 'AVG(reviews.rating)' },
            reviewCount:    { type: 'integer',  example: 3,   description: 'COUNT(reviews)' },
          },
        },
        // ── Order (จากตาราง orders JOIN order_items+products+customers+users) ──
        Order: {
          type: 'object',
          description: 'คำสั่งซื้อ (JOIN orders + order_items + products + customers + users)',
          properties: {
            id:          { type: 'integer', example: 1, description: 'orders.order_id' },
            orderId:     { type: 'string',  example: '1', description: 'String ของ order_id' },
            customerId:  { type: 'integer', example: 1, description: 'orders.customer_id' },
            status: {
              type: 'string',
              // ตรง glowtime.sql: pending/confirmed/shipping/delivered (lowercase ใน response)
              enum: ['pending', 'confirmed', 'shipping', 'delivered'],
              example: 'confirmed',
              description: 'DB เก็บ Capitalized, API ส่งเป็น lowercase',
            },
            totalAmount:     { type: 'number',  example: 2370, description: 'orders.total_amount' },
            recipient:       { type: 'string',  example: 'customer01', description: 'users.username' },
            email:           { type: 'string',  example: 'customer01@gmail.com' },
            shippingAddress: {
              type: 'object',
              properties: {
                recipient: { type: 'string', example: 'customer01' },
                phone:     { type: 'string', example: '0811111111', description: 'customers.phone' },
              },
            },
            createdAt: { type: 'string', format: 'date-time', description: 'orders.order_date' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  orderItemId: { type: 'integer', description: 'order_items.order_item_id' },
                  productId:   { type: 'integer', description: 'order_items.product_id' },
                  productName: { type: 'string',  description: 'products.name' },
                  qty:         { type: 'integer', description: 'order_items.qty' },
                  unitPrice:   { type: 'number',  description: 'order_items.unit_price' },
                  subtotal:    { type: 'number',  description: 'qty * unit_price' },
                },
              },
            },
          },
        },
        // ── Shipment (จากตาราง shipments ใน glowtime.sql) ────────
        Shipment: {
          type: 'object',
          description: 'ข้อมูลการจัดส่ง (ตาราง shipments)',
          properties: {
            id:             { type: 'integer', example: 1,   description: 'shipments.shipment_id' },
            orderId:        { type: 'integer', example: 1,   description: 'shipments.order_id' },
            trackingNumber: { type: 'string',  example: 'TH000001', description: 'shipments.tracking_number' },
            carrier: {
              type: 'string',
              enum: ['Kerry Express', 'Flash Express', 'Thailand Post'],
              example: 'Flash Express',
              description: 'shipments.carrier',
            },
            status: {
              type: 'string',
              // ตรง glowtime.sql seed: Pending, Shipping, Delivered
              enum: ['pending', 'shipping', 'delivered'],
              example: 'shipping',
              description: 'shipments.status (in_transit ถูกยกเลิก ใช้ shipping แทน)',
            },
            shippedAt:   { type: 'string', format: 'date-time', nullable: true, description: 'shipments.shipped_at' },
            deliveredAt: { type: 'string', format: 'date-time', nullable: true, description: 'shipments.delivered_at' },
          },
        },
        // ── Stock ────────────────────────────────────────────────
        StockUpdate: {
          type: 'object',
          required: ['stockQty'],
          properties: {
            stockQty: { type: 'integer', minimum: 0, example: 150, description: 'products.stock_qty ใหม่' },
          },
        },
        // ── Report ───────────────────────────────────────────────
        SalesReport: {
          type: 'object',
          description: 'รายงานยอดขาย (จาก orders + order_items ใน DB จริง)',
          properties: {
            totalOrders:    { type: 'integer', example: 4 },
            totalRevenue:   { type: 'number',  example: 5720.00 },
            deliveredCount: { type: 'integer', example: 1 },
            shippingCount:  { type: 'integer', example: 1 },
            confirmedCount: { type: 'integer', example: 2 },
            topProducts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId:    { type: 'integer' },
                  productName:  { type: 'string' },
                  totalQty:     { type: 'integer' },
                  totalRevenue: { type: 'number' },
                },
              },
            },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
        StockReport: {
          type: 'object',
          description: 'รายงานสต็อก (จากตาราง products + brands + categories)',
          properties: {
            totalProducts:    { type: 'integer', example: 10 },
            lowStockProducts: { type: 'integer', example: 1, description: 'stockQty <= 30' },
            outOfStock:       { type: 'integer', example: 0, description: 'stockQty = 0' },
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId:  { type: 'integer' },
                  name:       { type: 'string' },
                  brand:      { type: 'string' },
                  category:   { type: 'string' },
                  stockQty:   { type: 'integer' },
                  expiryDate: { type: 'string' },
                  status:     { type: 'string', enum: ['ok', 'low', 'out'] },
                },
              },
            },
            generatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Common ──────────────────────────────────────────────
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
      { name: 'Health',    description: '🏥 ตรวจสอบสถานะ Server' },
      { name: 'Auth',      description: '🔐 เข้าสู่ระบบ (staff / manager)' },
      { name: 'Orders',    description: '📦 จัดการคำสั่งซื้อ (Staff)' },
      { name: 'Shipments', description: '🚚 บันทึกข้อมูลการจัดส่ง (Staff)' },
      { name: 'Stock',     description: '📦 จัดการสต็อกสินค้า (Staff)' },
      { name: 'Products',  description: '🧴 จัดการสินค้า (Manager)' },
      { name: 'Reports',   description: '📊 รายงาน (Manager)' },
      { name: 'Users',     description: '👥 จัดการบัญชีผู้ใช้ (Manager)' },
    ],
  },
  apis: ['./src/app.js', './src/modules/**/*.router.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
