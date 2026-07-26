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
  const [topRows] = await pool.query(`
    SELECT
      oi.product_id   AS productId,
      p.name          AS productName,
      SUM(oi.qty)     AS totalQty,
      SUM(oi.qty * oi.unit_price) AS totalRevenue
    FROM order_items oi
    JOIN products p ON p.product_id = oi.product_id
    JOIN orders o   ON o.order_id   = oi.order_id
    WHERE o.status IN ('confirmed', 'shipping', 'delivered')
    GROUP BY oi.product_id, p.name
    ORDER BY totalRevenue DESC
    LIMIT 5
  `);

  const topProducts = topRows.map((r) => ({
    productId:    r.productId,
    productName:  r.productName,
    totalQty:     Number(r.totalQty),
    totalRevenue: Number(r.totalRevenue),
  }));

  return {
    totalOrders,
    totalRevenue:   Math.round(totalRevenue * 100) / 100,
    confirmedCount,
    shippingCount,
    deliveredCount,
    topProducts,
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

module.exports = { getSalesReport, getStockReport, getRevenueChart };
