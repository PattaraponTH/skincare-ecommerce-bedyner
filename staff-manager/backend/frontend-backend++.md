# GLOWTIME Staff Manager — Frontend ↔ Backend Integration Guide

> **Backend Developer:** ภัทรพล ไหมร้อน (67171599)
> **อัปเดตล่าสุด:** 2026-07-26

---



---

## Architecture Overview

```
GitHub Pages (static)                   Vercel (Node.js)              Railway MySQL
staff-manager/frontend/                 staff-manager/backend/        glowtime.sql
  index.html ─────────────────────────► /api/manager/reports/sales ──► orders + order_items
  index.html ─────────────────────────► /api/manager/reports/revenue ► orders (aggregate)
  orders.html ────────────────────────► /api/staff/orders ────────────► orders + customers
  products.html ──────────────────────► /api/manager/products ───────► products + brands
  categories.html ────────────────────► /api/manager/categories ─────► categories table
  inventory.html ─────────────────────► /api/manager/inventory/lots ──► products.expiry_date
  users.html ─────────────────────────► /api/manager/users ──────────► users + staffs
  coupons.html ───────────────────────► /api/manager/coupons ─────────► in-memory store*
  marketing.html ─────────────────────► /api/manager/promotions ──────► in-memory store*
  settings.html ──────────────────────► /api/manager/settings ────────► in-memory store*
  content.html ───────────────────────► /api/manager/reviews ─────────► reviews table (DB)
```

> *in-memory store = glowtime.sql ไม่มี table รองรับ ใช้ RAM แทน (reset เมื่อ server restart)

---

## API Base URL — Auto-detect

```js
// js/api.js — ตรวจสอบอัตโนมัติ
const ADMIN_API_BASE = (() => {
  const h = window.location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:5001';
  return 'https://glowtime-staff-backend.vercel.app'; // production Vercel
})();
```

| Environment | URL |
|-------------|-----|
| Local Dev | `http://localhost:5001` |
| GitHub Pages | `https://glowtime-staff-backend.vercel.app` |

---

## Login Credentials (seed data จาก glowtime.sql)

| Email | Password | Role | สิทธิ์เข้าถึง |
|-------|----------|------|--------------|
| `staff01@gmail.com` | `123456` | staff | orders, shipments, stock |
| `staff02@gmail.com` | `123456` | staff | orders, shipments, stock |
| `manager01@gmail.com` | `123456` | manager | ทุกหน้า (full access) |

---

## Frontend Pages ↔ API Mapping

### 1. Dashboard (`index.html`)
| Widget | API Endpoint | แหล่งข้อมูล |
|--------|-------------|-----------|
| Net Total Revenue | `GET /api/manager/reports/sales` | orders (confirmed+shipping+delivered) |
| Total Orders | `GET /api/manager/reports/sales` | orders COUNT |
| Registered Customers | `GET /api/manager/users?role=customer` | users + customers |
| Low Stock | `GET /api/manager/reports/stock` | products.stock_qty |
| Revenue Chart (7D/30D/1Y) | `GET /api/manager/reports/revenue?period=7D` | orders aggregate by date |
| Top Products table | `GET /api/manager/reports/sales` → `topProducts` | order_items aggregate |
| Recent Orders table | `GET /api/staff/orders` | orders + customers |

> **Fallback:** ถ้า API ไม่ตอบ → ใช้ CHART_DATA / MOCK_* ใน dashboard.js อัตโนมัติ

### 2. Orders & Payments (`orders.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลด orders | `/api/staff/orders` | GET |
| กรองตาม status | `/api/staff/orders?status=pending` | GET |
| อัปเดตสถานะ | `/api/staff/orders/:id/status` | PUT |
| เพิ่มข้อมูลจัดส่ง | `/api/staff/shipments` | POST |

### 3. Products (`products.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลดสินค้า | `/api/manager/products` | GET |
| กรองตาม category | `/api/manager/products?category=Serum` | GET |
| เพิ่มสินค้า | `/api/manager/products` | POST |
| แก้ไขสินค้า | `/api/manager/products/:id` | PUT |
| ลบสินค้า | `/api/manager/products/:id` | DELETE |

### 4. Categories (`categories.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลดหมวดหมู่ | `/api/manager/categories` | GET |
| เพิ่มหมวดหมู่ | `/api/manager/categories` | POST |
| แก้ไขหมวดหมู่ | `/api/manager/categories/:id` | PUT |
| ลบหมวดหมู่ | `/api/manager/categories/:id` | DELETE |

**Categories ใน glowtime.sql:** Cleanser, Toner, Serum, Moisturizer, Sunscreen

### 5. Inventory & Batches (`inventory.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลด lots | `/api/manager/inventory/lots` | GET |

**หมายเหตุ:** สร้าง lot data จาก `products.expiry_date` + `brands.name`

### 6. Coupons (`coupons.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลดคูปอง | `/api/manager/coupons` | GET |
| สร้างคูปอง | `/api/manager/coupons` | POST |
| แก้ไขคูปอง | `/api/manager/coupons/:id` | PUT |
| ลบคูปอง | `/api/manager/coupons/:id` | DELETE |

### 7. Marketing / Promotions (`marketing.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลดโปรโมชั่น | `/api/manager/promotions` | GET |
| สร้างโปรโมชั่น | `/api/manager/promotions` | POST |
| แก้ไข | `/api/manager/promotions/:id` | PUT |
| ลบ | `/api/manager/promotions/:id` | DELETE |

### 8. Users (`users.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลด users | `/api/manager/users` | GET |
| กรองตาม role | `/api/manager/users?role=staff` | GET |
| อัปเดต user | `/api/manager/users/:id` | PUT |
| ลบ user | `/api/manager/users/:id` | DELETE |

### 9. System Settings (`settings.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลด settings | `/api/manager/settings` | GET |
| บันทึก settings | `/api/manager/settings` | PUT |

### 10. Reviews & Content (`content.html`)
| Feature | Endpoint | Method |
|---------|----------|--------|
| โหลดรีวิว | `/api/manager/reviews` | GET |
| อนุมัติ/ปฏิเสธ | `/api/manager/reviews/:id/status` | PUT |

### 11. Revenue Chart (dashboard ปุ่ม 7D/30D/1Y)
| Feature | Endpoint | Method |
|---------|----------|--------|
| Chart 7 วัน | `/api/manager/reports/revenue?period=7D` | GET |
| Chart 30 วัน | `/api/manager/reports/revenue?period=30D` | GET |
| Chart 1 ปี | `/api/manager/reports/revenue?period=1Y` | GET |

---

## Frontend API Client (`js/api.js`) — window.GlowtimeAdminAPI

```js
window.GlowtimeAdminAPI = {
  Auth,           // login, logout, profile
  Products,       // list, create, update, delete, updateStock
  Orders,         // list, updateStatus, addShipment
  Reports,        // getSales, getStock
  Users,          // list, update, delete
  Shipments,      // list, getByOrderId
  Stock,          // list, update
  Categories,     // list, create, update, delete     ← เชื่อม DB แล้ว
  Coupons,        // list, create, update, delete     ← in-memory
  Marketing,      // list, create, update, delete     ← in-memory
  Reviews,        // list, updateStatus               ← เชื่อม DB แล้ว
  Settings,       // get, update                      ← in-memory
  Inventory,      // getLots                          ← เชื่อม DB แล้ว
  RevenueChart,   // get(period)                      ← เชื่อม DB แล้ว
}
```

---

## Status Enums (ตาม glowtime.sql)

### Order Status
```
pending → confirmed → shipping → delivered
```

### Shipment Status
```
pending → shipping → delivered
```

---

## Push Safety — ไม่มีปัญหาแน่นอน ✅

| ไฟล์/โฟลเดอร์ | แตะไหม | ผลกระทบ |
|--------------|-------|---------|
| `customer/` | ❌ ไม่แตะ | ✅ ปลอดภัย |
| `database/glowtime.sql` | ❌ ไม่แตะ | ✅ ปลอดภัย |
| `staff-manager/frontend/` | ✅ อัปเดต | ✅ GitHub Pages อัปเดต |
| `staff-manager/backend/` | ✅ เพิ่ม 7 modules | ✅ Vercel redeploy |

### GitHub Actions Workflow
```yaml
# deploy-customer-frontend.yml
paths:
  - 'customer/frontend/**'  ← trigger เฉพาะ customer เท่านั้น
```
→ Push `staff-manager/**` จะ **ไม่** trigger customer workflow

### Merge Safety
- ไม่มี conflict กับ customer เพราะอยู่คนละ folder สมบูรณ์
- Vercel `staff-manager/backend/` auto-redeploy เมื่อ push main

---

## DB Tables ที่ใช้จริง

| Table | ใช้ใน Endpoint |
|-------|--------------|
| `users` | auth, users |
| `customers` | orders, users |
| `staffs` | users |
| `products` | products, stock, inventory |
| `brands` | products, inventory |
| `categories` | products, categories |
| `orders` | orders, reports/sales, reports/revenue |
| `order_items` | reports/sales (top products) |
| `shipments` | shipments |
| `reviews` | reviews (content) |
| `product_images` | products |
