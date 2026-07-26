const { pool } = require('../../config/store');

/**
 * จัดการสต็อกสินค้า — อัปเดต stock_qty (Staff)
 * UPDATE products SET stock_qty WHERE product_id
 */
const updateStock = async (productId, stockQty) => {
  const id = parseInt(productId);

  if (isNaN(id)) {
    const err = new Error('productId ไม่ถูกต้อง');
    err.statusCode = 400;
    throw err;
  }

  if (stockQty === undefined || stockQty === null || isNaN(Number(stockQty)) || Number(stockQty) < 0) {
    const err = new Error('stockQty ต้องเป็นตัวเลขที่ >= 0');
    err.statusCode = 400;
    throw err;
  }

  const [[product]] = await pool.query(
    'SELECT product_id FROM products WHERE product_id = ?',
    [id]
  );
  if (!product) {
    const err = new Error('ไม่พบสินค้า');
    err.statusCode = 404;
    throw err;
  }

  await pool.query(
    'UPDATE products SET stock_qty = ? WHERE product_id = ?',
    [Number(stockQty), id]
  );

  const [[updated]] = await pool.query(
    `SELECT
       p.product_id AS productId,
       p.name,
       p.stock_qty  AS stockQty,
       p.expiry_date AS expiryDate,
       b.name AS brand,
       c.name AS category
     FROM products p
     JOIN brands b     ON b.brand_id    = p.brand_id
     JOIN categories c ON c.category_id = p.category_id
     WHERE p.product_id = ?`,
    [id]
  );

  return {
    ...updated,
    stockQty:  Number(updated.stockQty),
    status: Number(updated.stockQty) === 0 ? 'out' : Number(updated.stockQty) <= 20 ? 'low' : 'ok',
  };
};

/**
 * ดูสต็อกสินค้าทั้งหมด (Staff)
 * Query จาก MySQL โดยตรง
 */
const getAllStock = async () => {
  const [rows] = await pool.query(
    `SELECT
       p.product_id AS productId,
       p.name,
       p.stock_qty  AS stockQty,
       p.expiry_date AS expiryDate,
       b.name AS brand,
       c.name AS category
     FROM products p
     JOIN brands b     ON b.brand_id    = p.brand_id
     JOIN categories c ON c.category_id = p.category_id
     ORDER BY p.stock_qty ASC`
  );

  return rows.map((p) => ({
    productId:  p.productId,
    name:       p.name,
    brand:      p.brand,
    category:   p.category,
    stockQty:   Number(p.stockQty),
    expiryDate: p.expiryDate,
    status: Number(p.stockQty) === 0 ? 'out' : Number(p.stockQty) <= 20 ? 'low' : 'ok',
  }));
};

module.exports = { updateStock, getAllStock };
