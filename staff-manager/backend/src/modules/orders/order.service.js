const { pool } = require('../../config/store');

// DB จริงใน glowtime.sql ใช้ Capitalized: Pending, Confirmed, Shipping, Delivered
// เราเก็บ lowercase เพื่อ consistency ใน JS แต่ query แบบ LOWER()
const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'delivered'];

/**
 * ดูออเดอร์ทั้งหมด (Staff)
 * รองรับ filter: status, customerId
 * JOIN orders → customers → users + order_items → products
 */
const getAllOrders = async ({ status, customerId } = {}) => {
  let sql = `
    SELECT
      o.order_id     AS id,
      o.order_id,
      o.customer_id  AS customerId,
      o.order_date   AS createdAt,
      o.status,
      o.total_amount AS totalAmount,
      u.username     AS recipient,
      u.email,
      c.phone        AS phone
    FROM orders o
    JOIN customers c ON c.customer_id = o.customer_id
    JOIN users u     ON u.user_id     = c.user_id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    // DB เก็บ Capitalized (Pending, Confirmed, Shipping, Delivered)
    sql += ' AND LOWER(o.status) = LOWER(?)';
    params.push(status);
  }
  if (customerId) {
    sql += ' AND o.customer_id = ?';
    params.push(parseInt(customerId));
  }

  sql += ' ORDER BY o.order_date DESC';

  const [orders] = await pool.query(sql, params);

  // ดึง order_items สำหรับทุก order (batch query)
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.order_id);
  const [items] = await pool.query(
    `SELECT
       oi.order_id,
       oi.order_item_id AS orderItemId,
       oi.product_id    AS productId,
       p.name           AS productName,
       oi.qty,
       oi.unit_price    AS unitPrice,
       (oi.qty * oi.unit_price) AS subtotal
     FROM order_items oi
     JOIN products p ON p.product_id = oi.product_id
     WHERE oi.order_id IN (?)`,
    [orderIds]
  );

  // จัดกลุ่ม items ตาม order_id
  const itemsByOrder = {};
  items.forEach((item) => {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push({
      orderItemId:  item.orderItemId,
      productId:    item.productId,
      productName:  item.productName,
      qty:          item.qty,
      unitPrice:    Number(item.unitPrice),
      subtotal:     Number(item.subtotal),
    });
  });

  return orders.map((o) => ({
    id:          o.order_id,
    orderId:     String(o.order_id),
    customerId:  o.customerId,
    createdAt:   o.createdAt,
    status:      (o.status || '').toLowerCase(),
    totalAmount: Number(o.totalAmount),
    recipient:   o.recipient,
    email:       o.email,
    shippingAddress: {
      recipient: o.recipient,
      phone:     o.phone || '',
    },
    items: itemsByOrder[o.order_id] || [],
  }));
};

/**
 * อัปเดตสถานะออเดอร์ (Staff)
 */
const updateOrderStatus = async (id, newStatus) => {
  if (!ORDER_STATUSES.includes(newStatus.toLowerCase())) {
    const err = new Error(`สถานะไม่ถูกต้อง ต้องเป็นหนึ่งใน: ${ORDER_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // แปลง status เป็น Capitalized เพื่อบันทึกลง DB (ตรงกับ seed data)
  const dbStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase();

  const [[order]] = await pool.query(
    'SELECT order_id, status FROM orders WHERE order_id = ?',
    [parseInt(id)]
  );
  if (!order) {
    const err = new Error('ไม่พบคำสั่งซื้อ');
    err.statusCode = 404;
    throw err;
  }

  // ตรวจสอบลำดับ status (ห้ามย้อนกลับ)
  const currentIdx = ORDER_STATUSES.indexOf(order.status);
  const newIdx     = ORDER_STATUSES.indexOf(newStatus);
  if (newIdx < currentIdx) {
    const err = new Error(`ไม่สามารถเปลี่ยนสถานะย้อนกลับได้ (ปัจจุบัน: ${order.status})`);
    err.statusCode = 400;
    throw err;
  }

  await pool.query(
    'UPDATE orders SET status = ? WHERE order_id = ?',
    [dbStatus, parseInt(id)]
  );

  const [[updated]] = await pool.query(
    'SELECT order_id AS id, LOWER(status) AS status, total_amount AS totalAmount, order_date AS createdAt FROM orders WHERE order_id = ?',
    [parseInt(id)]
  );
  return updated;
};

module.exports = { getAllOrders, updateOrderStatus, ORDER_STATUSES };
