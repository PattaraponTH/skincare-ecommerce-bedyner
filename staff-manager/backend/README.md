# Staff & Manager Backend

> **โฟลเดอร์นี้สำหรับทีม Backend (Staff/Manager)**
> รับผิดชอบโดย: ภัทรพล ไหมร้อน (67171599)
> **อัปเดตล่าสุด:** 2026-07-26

## Tech Stack
- Node.js + Express.js
- MySQL (Railway — เชื่อมต่อจริง)
- Deploy: Vercel (`vercel.json`)

## API Endpoints ที่จะพัฒนา

| Method | Endpoint | Role | คำอธิบาย |
|--------|----------|------|-----------|
| GET | `/api/staff/orders` | staff | ดูออเดอร์ทั้งหมด |
| PUT | `/api/staff/orders/:id/status` | staff | อัปเดตสถานะออเดอร์ |
| POST | `/api/staff/shipments` | staff | บันทึกข้อมูลการจัดส่ง |
| PUT | `/api/staff/stock/:productId` | staff | จัดการสต็อกสินค้า |

| GET | `/api/manager/reports/sales` | manager | รายงานยอดขาย |
| GET | `/api/manager/reports/stock` | manager | รายงานสต็อก |
| GET | `/api/manager/products` | manager | ดูสินค้าทั้งหมด |
| POST | `/api/manager/products` | manager | เพิ่มสินค้า |
| PUT | `/api/manager/products/:id` | manager | แก้ไขสินค้า |
| DELETE | `/api/manager/products/:id` | manager | ลบสินค้า |
| GET | `/api/manager/users` | manager | จัดการบัญชีผู้ใช้ |

## API Endpoints (ปัจจุบัน)

| Method | Endpoint | Role | คำอธิบาย |
|--------|----------|------|-----------|
| GET | `/api/health` | any | เช็คสถานะ server |
| POST | `/api/auth/login` | any | เข้าสู่ระบบ รับ JWT token |
| GET | `/api/auth/profile` | staff, manager | ดูข้อมูลโปรไฟล์ผู้ใช้ที่ล็อกอิน |
| GET | `/api/staff/orders` | staff | ดูออเดอร์ทั้งหมด (รองรับ `?status=`) |
| PUT | `/api/staff/orders/:id/status` | staff | อัปเดตสถานะออเดอร์ |
| GET | `/api/staff/shipments` | staff | ดูข้อมูลการจัดส่งทั้งหมด |
| POST | `/api/staff/shipments` | staff | บันทึกข้อมูลการจัดส่ง |
| GET | `/api/staff/shipments/:orderId` | staff | ดูข้อมูลการจัดส่งตามออเดอร์ |
| GET | `/api/staff/stock` | staff | ดูสต็อกสินค้า |
| PUT | `/api/staff/stock/:productId` | staff | จัดการสต็อกสินค้า |

| GET | `/api/manager/products` | manager | ดูสินค้าทั้งหมด (รองรับ `?category=`) |
| GET | `/api/manager/products/:id` | manager | ดูสินค้ารายชิ้น |
| POST | `/api/manager/products` | manager | เพิ่มสินค้า |
| PUT | `/api/manager/products/:id` | manager | แก้ไขสินค้า |
| DELETE | `/api/manager/products/:id` | manager | ลบสินค้า |
| GET | `/api/manager/reports/sales` | manager | รายงานยอดขาย + Top Products |
| GET | `/api/manager/reports/stock` | manager | รายงานสต็อก / สินค้าใกล้หมด |
| GET | `/api/manager/reports/revenue` | manager | ข้อมูล Revenue Chart (รองรับ `?period=7D\|30D\|1Y`) |
| GET | `/api/manager/reports/category-sales` | manager | ยอดขายแยกตามหมวดหมู่สินค้า (สำหรับโดนัทชาร์ต) |
| GET | `/api/manager/reports/skin-types` | manager | สัดส่วนลูกค้าตามประเภทผิว (สำหรับบาร์ชาร์ต) |
| GET | `/api/manager/users` | manager | ดูบัญชีผู้ใช้ทั้งหมด (รองรับ `?role=`) |
| GET | `/api/manager/users/:id` | manager | ดูบัญชีผู้ใช้ตาม ID |
| PUT | `/api/manager/users/:id` | manager | แก้ไขบัญชีผู้ใช้ |
| DELETE | `/api/manager/users/:id` | manager | ลบบัญชีผู้ใช้ |
| GET | `/api/manager/categories` | manager | ดูหมวดหมู่สินค้าทั้งหมด |
| POST | `/api/manager/categories` | manager | เพิ่มหมวดหมู่ใหม่ |
| PUT | `/api/manager/categories/:id` | manager | แก้ไขชื่อหมวดหมู่ |
| DELETE | `/api/manager/categories/:id` | manager | ลบหมวดหมู่ |
| GET | `/api/manager/coupons` | manager | ดูโค้ดส่วนลดทั้งหมด *(in-memory)* |
| POST | `/api/manager/coupons` | manager | สร้างโค้ดส่วนลดใหม่ *(in-memory)* |
| PUT | `/api/manager/coupons/:id` | manager | แก้ไขโค้ดส่วนลด *(in-memory)* |
| DELETE | `/api/manager/coupons/:id` | manager | ลบโค้ดส่วนลด *(in-memory)* |
| GET | `/api/manager/promotions` | manager | ดูโปรโมชั่นทั้งหมด *(in-memory)* |
| POST | `/api/manager/promotions` | manager | สร้างโปรโมชั่นใหม่ *(in-memory)* |
| PUT | `/api/manager/promotions/:id` | manager | แก้ไขโปรโมชั่น *(in-memory)* |
| DELETE | `/api/manager/promotions/:id` | manager | ลบโปรโมชั่น *(in-memory)* |
| GET | `/api/manager/reviews` | manager | ดูรีวิวทั้งหมด |
| PUT | `/api/manager/reviews/:id/status` | manager | อนุมัติ/ปฏิเสธรีวิว |
| GET | `/api/manager/settings` | manager | ดูการตั้งค่าระบบ *(in-memory)* |
| PUT | `/api/manager/settings` | manager | อัปเดตการตั้งค่าระบบ *(in-memory)* |


> `*(in-memory)*` = glowtime.sql ไม่มี table รองรับฟีเจอร์นี้ ใช้ RAM เก็บแทน (ข้อมูลจะรีเซ็ตเมื่อ server restart)

## โครงสร้างจริง

```
staff-manager/backend/
├── src/
│   ├── config/
│   │   ├── store.js          (MySQL2 pool — Railway)
│   │   └── swagger.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── modules/
│   │   ├── auth/             (shared)
│   │   ├── orders/           (staff)
│   │   ├── shipments/        (staff)
│   │   ├── stock/            (staff)
│   │   ├── products/         (manager)
│   │   ├── reports/          (manager)
│   │   ├── users/            (manager)
│   │   ├── categories/       (manager)
│   │   ├── coupons/          (manager, in-memory)
│   │   ├── marketing/        (manager, in-memory)
│   │   ├── reviews/          (manager)
│   │   ├── settings/         (manager, in-memory)
│   │   └── inventory/        (manager)
│   └── app.js
├── .env.example
├── package.json
├── vercel.json
└── server.js
```

## ตารางหน้า → Role ที่อนุญาต

| หน้า (HTML) | Role ที่อนุญาต | API Endpoint หลัก | ไฟล์ JS ที่แก้ |
|-------------|--------------|-------------------|----------------|
| `index.html` (Dashboard) | `manager` | `/api/manager/reports/*` | `js/dashboard.js` |
| `orders.html` | `staff` | `/api/staff/orders` | `js/orders.js` |
| `customers.html` | `manager` | `/api/manager/users` | inline script ใน HTML |
| `products.html` | `manager` | `/api/manager/products` | `js/products.js` |
| `categories.html` | `manager` | `/api/manager/categories` | `js/categories.js` |
| `inventory.html` | `staff` | `/api/staff/stock` (GET + PUT) | inline script ใน HTML |
| `content.html` | `manager` | `/api/manager/reviews` | inline script ใน HTML |
| `marketing.html` | `manager` | `/api/manager/promotions` | inline script ใน HTML |
| `coupons.html` | `manager` | `/api/manager/coupons` | `js/coupons.js` |
| `settings.html` | `manager` | `/api/manager/settings` | inline script ใน HTML |
| `users.html` | `manager` | `/api/manager/users` | `js/users.js` |

## Login Credentials (seed data จาก glowtime.sql)

| Email | Password | Role |
|-------|----------|------|
| `staff01@gmail.com` | `123456` | staff |
| `staff02@gmail.com` | `123456` | staff |
| `manager01@gmail.com` | `123456` | manager |

## Swagger API Docs
เปิดทดสอบ endpoint ทั้งหมดได้ที่ `/api/docs` (Swagger UI) หรือ import `/api/docs.json` เข้า Postman (api อาจอันยังไม่มีครบ)

http://127.0.0.1:5500/staff-manager/frontend/index.html

> **หมายเหตุ:** ใช้ JWT เดิมจาก Customer Backend ได้เลย (shared `JWT_SECRET`)
> ตรวจสอบ role ด้วย `requireRole('staff')` หรือ `requireRole('manager')`