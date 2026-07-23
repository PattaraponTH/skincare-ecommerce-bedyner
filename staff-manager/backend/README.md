# Staff & Manager Backend

> **โฟลเดอร์นี้สำหรับทีม Backend (Staff/Manager)**
> รับผิดชอบโดย: ภัทรพล ไหมร้อน (67171599)

## Tech Stack
- Node.js + Express.js
- MySQL (เชื่อมต่อจริง)
- Deploy: Render

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

## แนวทางโครงสร้าง (แนะนำ)

```
staff-manager/backend/
├── src/
│   ├── config/
│   │   └── db.js            (MySQL2 pool)
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── orders/          (staff)
│   │   ├── shipments/       (staff)
│   │   ├── stock/           (staff)
│   │   ├── products/        (manager)
│   │   ├── reports/         (manager)
│   │   └── users/           (manager)
│   └── app.js
├── .env.example
├── package.json
└── server.js
```

> **หมายเหตุ:** ใช้ JWT เดิมจาก Customer Backend ได้เลย (shared JWT_SECRET)
> ตรวจสอบ role ด้วย `requireRole('staff')` หรือ `requireRole('manager')`
