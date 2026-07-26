const { pool } = require('../../config/store');

/**
 * รายงานยอดขาย (Manager)
 * Query จากตาราง orders + order_items จริงบน MySQL
 */
const getSalesReport = async () => {
  // นับ orders ตาม status (เฉพาะที่ผ่านการชำระเงินแล้ว)
  const [statusRows] = await pool.query(`
    SELECT
      status,
      COUNT(*) AS cnt,
      COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    WHERE status IN ('confirmed', 'shipping', 'delivered')
    GROUP BY status
  `);

  let totalOrders = 0;
  let totalRevenue = 0;
  let confirmedCount = 0;
  let shippingCount  = 0;
  let deliveredCount = 0;

  statusRows.forEach((row) => {
    totalOrders  += Number(row.cnt);
    totalRevenue += Number(row.revenue);
    if (row.status === 'confirmed') confirmedCount = Number(row.cnt);
    if (row.status === 'shipping')  shippingCount  = Number(row.cnt);
    if (row.status === 'delivered') deliveredCount = Number(row.cnt);
  });

  // Top 5 สินค้าขายดี จาก order_items
  // (แก้บั๊ก: เพิ่ม JOIN products.price + categories.name เพราะเดิม query
  //  ไม่ได้ select 2 ฟิลด์นี้ ทำให้หน้าเว็บขึ้น UNDEFINED (category) และ ฿0 (price))
  const [topRows] = await pool.query(`
    SELECT
      oi.product_id   AS productId,
      p.name          AS productName,
      p.price         AS price,
      c.name          AS category,
      SUM(oi.qty)     AS totalQty,
      SUM(oi.qty * oi.unit_price) AS totalRevenue
    FROM order_items oi
    JOIN products p    ON p.product_id  = oi.product_id
    JOIN categories c  ON c.category_id = p.category_id
    JOIN orders o      ON o.order_id    = oi.order_id
    WHERE o.status IN ('confirmed', 'shipping', 'delivered')
    GROUP BY oi.product_id, p.name, p.price, c.name
    ORDER BY totalRevenue DESC
    LIMIT 5
  `);

  const topProducts = topRows.map((r) => ({
    productId:    r.productId,
    productName:  r.productName,
    category:     r.category,
    price:        Number(r.price),
    totalQty:     Number(r.totalQty),
    totalRevenue: Number(r.totalRevenue),
  }));

  // Recent Orders (5 ออเดอร์ล่าสุด) — ใช้แทน /api/staff/orders
  // เพราะ manager ไม่มีสิทธิ์เรียก endpoint ของ staff
  const [recentRows] = await pool.query(`
    SELECT
      o.order_id     AS orderId,
      o.total_amount AS totalAmount,
      o.status       AS status,
      o.order_date   AS orderDate,
      u.username     AS customerName
    FROM orders o
    JOIN customers c ON c.customer_id = o.customer_id
    JOIN users u     ON u.user_id     = c.user_id
    ORDER BY o.order_date DESC
    LIMIT 5
  `);

  const recentOrders = recentRows.map((r) => ({
    orderId:      `ORD-${String(r.orderId).padStart(6, '0')}`,
    customerName: r.customerName,
    totalAmount:  Number(r.totalAmount),
    status:       r.status,
    orderDate:    r.orderDate,
  }));

  return {
    totalOrders,
    totalRevenue:   Math.round(totalRevenue * 100) / 100,
    confirmedCount,
    shippingCount,
    deliveredCount,
    topProducts,
    recentOrders,
    generatedAt: new Date().toISOString(),
  };
};

/**
 * รายงานสต็อก (Manager)
 * Query จากตาราง products จริงบน MySQL
 */
const getStockReport = async () => {
  const LOW_STOCK_THRESHOLD = 30;

  const [rows] = await pool.query(`
    SELECT
      p.product_id  AS productId,
      p.name,
      p.stock_qty   AS stockQty,
      p.expiry_date AS expiryDate,
      b.name        AS brand,
      c.name        AS category
    FROM products p
    JOIN brands b     ON b.brand_id    = p.brand_id
    JOIN categories c ON c.category_id = p.category_id
    ORDER BY p.stock_qty ASC
  `);

  const productList = rows.map((p) => ({
    productId:  p.productId,
    name:       p.name,
    brand:      p.brand,
    category:   p.category,
    stockQty:   Number(p.stockQty),
    expiryDate: p.expiryDate,
    status: Number(p.stockQty) === 0
      ? 'out'
      : Number(p.stockQty) <= LOW_STOCK_THRESHOLD
        ? 'low'
        : 'ok',
  }));

  const totalProducts    = productList.length;
  const outOfStock       = productList.filter((p) => p.status === 'out').length;
  const lowStockProducts = productList.filter((p) => p.status === 'low').length;

  return {
    totalProducts,
    lowStockProducts,
    outOfStock,
    products: productList,
    generatedAt: new Date().toISOString(),
  };
};

const getRevenueChart = async (period = '7D') => {
  let dateExpr, daysBack;

  if (period === '30D') {
    dateExpr = `DATE_FORMAT(order_date, '%Y-%m-%d')`;
    daysBack = 30;
  } else if (period === '1Y') {
    dateExpr = `DATE_FORMAT(order_date, '%Y-%m')`;
    daysBack = 365;
  } else {
    dateExpr = `DATE_FORMAT(order_date, '%Y-%m-%d')`;
    daysBack = 7;
  }

  const [rows] = await pool.query(`
    SELECT
      ${dateExpr} AS label,
      COUNT(*) AS orders,
      COALESCE(SUM(total_amount), 0) AS revenue
    FROM orders
    WHERE order_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND status IN ('confirmed','shipping','delivered')
    GROUP BY ${dateExpr}
    ORDER BY ${dateExpr} ASC
  `, [daysBack]);

  return {
    period,
    labels: rows.map(r => r.label),
    revenue: rows.map(r => Number(r.revenue)),
    orders: rows.map(r => Number(r.orders)),
    totalRevenue: rows.reduce((s, r) => s + Number(r.revenue), 0),
    totalOrders: rows.reduce((s, r) => s + Number(r.orders), 0),
  };
};

/**
 * ยอดขายแยกตามหมวดหมู่ (Manager)
 * SUM(qty * unit_price) GROUP BY category — สำหรับ "Sales Revenue by Category" (โดนัทชาร์ต)
 */
const getCategorySales = async () => {
  const [rows] = await pool.query(`
    SELECT
      c.name AS category,
      COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue
    FROM categories c
    LEFT JOIN products p     ON p.category_id = c.category_id
    LEFT JOIN order_items oi ON oi.product_id  = p.product_id
    LEFT JOIN orders o       ON o.order_id = oi.order_id
      AND o.status IN ('confirmed', 'shipping', 'delivered')
    GROUP BY c.category_id, c.name
    ORDER BY revenue DESC
  `);

  const revenue     = rows.map((r) => Number(r.revenue));
  const totalRevenue = revenue.reduce((s, v) => s + v, 0);

  return {
    labels: rows.map((r) => r.category),
    revenue,
    percentages: revenue.map((v) =>
      totalRevenue > 0 ? Math.round((v / totalRevenue) * 1000) / 10 : 0
    ),
    generatedAt: new Date().toISOString(),
  };
};

/**
 * สัดส่วนลูกค้าตามประเภทผิว (Manager)
 * COUNT(*) GROUP BY customers.skin_type — สำหรับ "Customer Skin Type Profiles" (บาร์ชาร์ต)
 */
const getSkinTypes = async () => {
  const [rows] = await pool.query(`
    SELECT
      COALESCE(NULLIF(TRIM(skin_type), ''), 'Unspecified') AS skinType,
      COUNT(*) AS cnt
    FROM customers
    GROUP BY skinType
    ORDER BY cnt DESC
  `);

  return {
    labels: rows.map((r) => r.skinType),
    counts: rows.map((r) => Number(r.cnt)),
    generatedAt: new Date().toISOString(),
  };
};

module.exports = {
  getSalesReport,
  getStockReport,
  getRevenueChart,
  getCategorySales,
  getSkinTypes,
};
