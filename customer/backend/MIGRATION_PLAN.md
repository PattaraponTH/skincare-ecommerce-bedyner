# GLOWTIME — Handoff: เชื่อม Backend เข้า MySQL จริง

> เอกสารนี้สรุปสถานะปัจจุบัน + สิ่งที่ต้องทำต่อ สำหรับส่งไม้ต่อใน Antigravity

---

## ✅ สิ่งที่ทำเสร็จแล้ว

- [x] สร้าง MySQL database บน **Railway** (project: `heartfelt-enchantment`)
- [x] Import schema + seed data จาก `database/glowtime.sql` เข้า Railway สำเร็จ (ลบบรรทัด `USE glowtime;` ออกก่อน import เพราะ database จริงชื่อ `railway` ไม่ใช่ `glowtime`)
- [x] ยืนยันข้อมูลเข้าแล้ว (เช็คผ่าน `SELECT * FROM products;` บน Railway Data tab)
- [x] วางโครงสร้าง repo แบบแยก concern ชัดเจน:
  ```
  witchayada-skincare-ecommerce/
    database/
      glowtime.sql
    customer/
      frontend/
      backend/
    staff-manager/
      frontend/
      backend/
  ```

## 🔑 Railway MySQL Credentials

เก็บไว้ใน Railway → MySQL service → แท็บ **Variables**:
MYSQL_DATABASE="railway"
MYSQL_PUBLIC_URL="mysql://${{MYSQLUSER}}:${{MYSQL_ROOT_PASSWORD}}@${{RAILWAY_TCP_PROXY_DOMAIN}}:${{RAILWAY_TCP_PROXY_PORT}}/${{MYSQL_DATABASE}}"
MYSQL_ROOT_PASSWORD="epWmPDAIhAOcVtqWwEIZszERKKNmiLjI"
MYSQL_URL="mysql://${{MYSQLUSER}}:${{MYSQL_ROOT_PASSWORD}}@${{RAILWAY_PRIVATE_DOMAIN}}:3306/${{MYSQL_DATABASE}}"
MYSQLDATABASE="${{MYSQL_DATABASE}}"
MYSQLHOST="${{RAILWAY_PRIVATE_DOMAIN}}"
MYSQLPASSWORD="${{MYSQL_ROOT_PASSWORD}}"
MYSQLPORT="3306"
MYSQLUSER="root"
```

---

## 🎯 เป้าหมายตอนนี้

เปลี่ยน `customer/backend` จากใช้ Mock JSON in-memory (`src/data/*.json`) ให้ต่อ MySQL จริงบน Railway — **ทำให้เสร็จฝั่ง customer ก่อน** แล้วค่อยทำ `staff-manager/backend` ตาม pattern เดียวกันทีหลัง

---

## 📋 สิ่งที่ต้องทำต่อ (เรียงลำดับ)

### 1. Setup พื้นฐาน
- [ ] สร้างไฟล์ `customer/backend/.env` ใส่ credentials จาก Railway (host, port, user, password, database)
- [ ] เพิ่ม `.env` เข้า `.gitignore` (ห้าม commit credentials ขึ้น GitHub)
- [ ] ติดตั้ง package: `npm install mysql2` ใน `customer/backend`

### 2. เขียน Data Layer ใหม่ — `src/config/store.js`
- [ ] เปลี่ยนจากโหลด JSON ในหน่วยความจำ → เป็น connection pool ผ่าน `mysql2/promise`
- [ ] เปลี่ยนทุกฟังก์ชัน (`findAll`, `findById`, `findOne`, `create`, `update`, `remove`) ให้เป็น `async`

### 3. แก้ไล่ทีละ Service (เรียงง่าย → ยาก)

| ลำดับ | ไฟล์ | สิ่งที่ต้องแก้ |
|---|---|---|
| 1 | `src/modules/auth/auth.service.js` | query ตาราง `users` ตรงๆ, เปลี่ยน `.id` → `.user_id`, เติม `await` — **ทำก่อนเพื่อทดสอบว่าต่อ DB ติด** |
| 2 | `src/modules/products/product.service.js` | แปลง filter (skinType/brand/price/search) เป็น SQL `WHERE` + JOIN `brands`/`categories` |
| 3 | `src/modules/cart/cart.service.js` | ⚠️ ต้องเขียนใหม่ทั้งชุด — mock เดิมเก็บ `cart.items` เป็น array ฝังในตัว object เดียว แต่ schema จริงแยกตาราง `carts` + `cart_items` (มี FK) ต้อง JOIN ตอนอ่าน, INSERT/DELETE แยกตอนเขียน |
| 4 | `src/modules/orders/order.service.js` | ⚠️ เขียนใหม่ทั้งชุดเหมือน cart — แยกตาราง `orders` + `order_items` |
| 5 | `src/modules/payments/payment.service.js` | query/insert ตาราง `payments` ตรงๆ |
| 6 | `src/modules/reviews/review.service.js` | query/insert ตาราง `reviews` ตรงๆ |

- [ ] ทุก `*.controller.js` ที่เรียก service ข้างต้น ต้องเติม `await` ตามจุดที่เรียกใช้ (เพราะ service จะกลายเป็น async ทั้งหมด)

### 4. จุดที่ต้องระวังเป็นพิเศษ
- **Field naming ไม่ตรงกัน**: โค้ดเดิมใช้ camelCase (`customerId`, `productId`) แต่ schema ใช้ snake_case (`customer_id`, `product_id`) — ต้อง map ให้ตรงทุกจุดตอนเขียน query
- **Nested vs Relational**: cart/order ใน mock เป็น embedded array แต่ schema จริงแยกตาราง (ดูตารางด้านบน)

### 5. ทดสอบ Local
- [ ] รัน backend จาก localhost ต่อ Railway MySQL จริง ทดสอบทุก endpoint ผ่าน Swagger UI (`/api/docs`)
- [ ] เทียบ response shape กับตอนใช้ mock data ให้เหมือนเดิม (จะได้ไม่ต้องแก้ frontend)

---

## 🚀 หลังจากโค้ดเชื่อม DB เสร็จ (ยังไม่ต้องทำตอนนี้)

- Deploy backend ขึ้น Vercel (ต้องเพิ่ม `vercel.json`, ตั้ง env vars บน Vercel dashboard)
- แก้ `customer/frontend/api.js` เปลี่ยน `API_BASE` จาก localhost เป็น URL จริงบน Vercel
- Deploy frontend ขึ้น GitHub Pages
- ทำ `staff-manager/backend` ตาม pattern เดียวกับ customer

---

## 📂 ไฟล์อ้างอิงสำคัญในโปรเจกต์

- `database/glowtime.sql` — schema จริง (12 ตาราง) + seed data
- `customer/backend/src/config/store.js` — จุดศูนย์กลางที่ต้องแก้เป็นอันดับแรก
- `customer/backend/src/modules/*/​*.service.js` — 6 ไฟล์ที่ต้องแก้ตามตารางด้านบน