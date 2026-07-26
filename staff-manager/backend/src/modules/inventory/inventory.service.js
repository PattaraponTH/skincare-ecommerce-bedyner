const { pool } = require('../../config/store');

// glowtime.sql ไม่มี inventory_lots table
// ใช้ products + expiry_date สร้าง lot data แทน
const getInventoryLots = async () => {
  const [rows] = await pool.query(`
    SELECT
      p.product_id AS productId,
      p.name AS productName,
      p.stock_qty AS qtyReceived,
      p.expiry_date AS expDate,
      b.name AS brand
    FROM products p
    JOIN brands b ON b.brand_id = p.brand_id
    ORDER BY p.expiry_date ASC
  `);

  return rows.map((r, i) => ({
    lotNo: `LOT-${String(r.productId).padStart(4, '0')}`,
    productId: r.productId,
    productName: r.productName,
    supplier: `${r.brand} Supplier Co., Ltd.`,
    qtyReceived: Number(r.qtyReceived),
    expDate: r.expDate,
    status: Number(r.qtyReceived) === 0 ? 'Out of Stock'
      : Number(r.qtyReceived) <= 30 ? 'Low Stock'
      : 'In Stock',
  }));
};

module.exports = { getInventoryLots };
