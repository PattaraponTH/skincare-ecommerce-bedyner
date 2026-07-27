const { pool } = require('../../config/store');

/**
 * ดูสินค้าทั้งหมด (Manager)
 * รองรับ filter: category, brand
 * JOIN products → brands + categories + product_images
 */
const getAllProducts = async ({ category, brand } = {}) => {
  let sql = `
    SELECT
      p.product_id      AS id,
      p.product_id,
      p.name,
      p.ingredients,
      p.price,
      p.stock_qty       AS stockQty,
      p.expiry_date     AS expiryDate,
      b.brand_id,
      b.name            AS brand,
      b.country         AS brandCountry,
      c.category_id,
      c.name            AS category,
      c.skin_type_target AS skinTypeTarget,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id LIMIT 1) AS imageUrl,
      COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.product_id), 0) AS averageRating,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id), 0) AS reviewCount
    FROM products p
    JOIN brands b     ON b.brand_id    = p.brand_id
    JOIN categories c ON c.category_id = p.category_id
    WHERE 1=1
  `;
  const params = [];

  if (category) {
    sql += ' AND LOWER(c.name) = LOWER(?)';
    params.push(category);
  }
  if (brand) {
    sql += ' AND LOWER(b.name) = LOWER(?)';
    params.push(brand);
  }

  sql += ' ORDER BY p.product_id ASC';

  const [rows] = await pool.query(sql, params);
  return rows.map(formatProduct);
};

/**
 * ดูสินค้าตาม id
 */
const getProductById = async (id) => {
  const [[product]] = await pool.query(
    `SELECT
      p.product_id      AS id,
      p.product_id,
      p.name,
      p.ingredients,
      p.price,
      p.stock_qty       AS stockQty,
      p.expiry_date     AS expiryDate,
      b.brand_id,
      b.name            AS brand,
      c.category_id,
      c.name            AS category,
      c.skin_type_target AS skinTypeTarget,
      (SELECT image_url FROM product_images WHERE product_id = p.product_id LIMIT 1) AS imageUrl,
      COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE product_id = p.product_id), 0) AS averageRating,
      COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = p.product_id), 0) AS reviewCount
    FROM products p
    JOIN brands b     ON b.brand_id    = p.brand_id
    JOIN categories c ON c.category_id = p.category_id
    WHERE p.product_id = ?`,
    [Number(id)]
  );
  if (!product) {
    const err = new Error('ไม่พบสินค้า');
    err.statusCode = 404;
    throw err;
  }
  return formatProduct(product);
};

/**
 * เพิ่มสินค้าใหม่ (Manager)
 * รับ brand/category เป็นชื่อ แล้วหา id จาก DB
 */
const createProduct = async (data) => {
  const { name, brand, category, price, stockQty } = data;
  if (!name || !brand || !category || price === undefined || stockQty === undefined) {
    const err = new Error('กรุณาระบุ name, brand, category, price และ stockQty');
    err.statusCode = 400;
    throw err;
  }
  if (Number(price) < 0 || Number(stockQty) < 0) {
    const err = new Error('price และ stockQty ต้องไม่ติดลบ');
    err.statusCode = 400;
    throw err;
  }

  // หา brand_id
  const [[brandRow]] = await pool.query('SELECT brand_id FROM brands WHERE name = ?', [brand]);
  if (!brandRow) {
    const err = new Error(`ไม่พบ brand "${brand}" ในระบบ`);
    err.statusCode = 400;
    throw err;
  }

  // หา category_id
  const [[catRow]] = await pool.query('SELECT category_id FROM categories WHERE name = ?', [category]);
  if (!catRow) {
    const err = new Error(`ไม่พบ category "${category}" ในระบบ`);
    err.statusCode = 400;
    throw err;
  }

  const ingredientsValue = Array.isArray(data.ingredients)
    ? (data.ingredients.length ? data.ingredients.join(', ') : null)
    : (data.ingredients || null);

  const [result] = await pool.query(
    `INSERT INTO products (brand_id, category_id, name, ingredients, price, stock_qty, expiry_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      brandRow.brand_id,
      catRow.category_id,
      name,
      ingredientsValue,
      Number(price),
      Number(stockQty),
      data.expiryDate || null,
    ]
  );

  // บันทึกรูปสินค้าลง product_images ถ้ามีการส่ง imageUrl มา
  if (data.imageUrl) {
    await pool.query(
      'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
      [result.insertId, data.imageUrl]
    );
  }

  return getProductById(result.insertId);
};

/**
 * แก้ไขสินค้า (Manager)
 */
const updateProduct = async (id, data) => {
  const existing = await getProductById(id);

  const setClauses = [];
  const params     = [];

  if (data.name !== undefined)      { setClauses.push('name = ?');        params.push(data.name); }
  if (data.ingredients !== undefined){
    const ingredientsValue = Array.isArray(data.ingredients)
      ? (data.ingredients.length ? data.ingredients.join(', ') : null)
      : (data.ingredients || null);
    setClauses.push('ingredients = ?');
    params.push(ingredientsValue);
  }
  if (data.price !== undefined)     { setClauses.push('price = ?');       params.push(Number(data.price)); }
  if (data.stockQty !== undefined)  { setClauses.push('stock_qty = ?');   params.push(Number(data.stockQty)); }
  if (data.expiryDate !== undefined){ setClauses.push('expiry_date = ?'); params.push(data.expiryDate); }

  // แก้ brand โดยชื่อ
  if (data.brand !== undefined) {
    const [[brandRow]] = await pool.query('SELECT brand_id FROM brands WHERE name = ?', [data.brand]);
    if (!brandRow) { const err = new Error(`ไม่พบ brand "${data.brand}"`); err.statusCode = 400; throw err; }
    setClauses.push('brand_id = ?');
    params.push(brandRow.brand_id);
  }

  // แก้ category โดยชื่อ
  if (data.category !== undefined) {
    const [[catRow]] = await pool.query('SELECT category_id FROM categories WHERE name = ?', [data.category]);
    if (!catRow) { const err = new Error(`ไม่พบ category "${data.category}"`); err.statusCode = 400; throw err; }
    setClauses.push('category_id = ?');
    params.push(catRow.category_id);
  }

  if (setClauses.length > 0) {
    params.push(Number(id));
    await pool.query(`UPDATE products SET ${setClauses.join(', ')} WHERE product_id = ?`, params);
  }

  // บันทึกรูปสินค้าลง product_images ถ้ามีการส่ง imageUrl มา (upsert: มีอยู่แล้วก็อัปเดต ไม่มีก็เพิ่มใหม่)
  if (data.imageUrl !== undefined) {
    const [[existingImage]] = await pool.query(
      'SELECT image_id FROM product_images WHERE product_id = ? LIMIT 1',
      [Number(id)]
    );
    if (existingImage) {
      await pool.query(
        'UPDATE product_images SET image_url = ? WHERE image_id = ?',
        [data.imageUrl, existingImage.image_id]
      );
    } else {
      await pool.query(
        'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)',
        [Number(id), data.imageUrl]
      );
    }
  }

  return getProductById(id);
};

/**
 * ลบสินค้า (Manager)
 */
const deleteProduct = async (id) => {
  const product = await getProductById(id);

  // ลบ product_images ก่อน (ถ้าไม่มี ON DELETE CASCADE)
  await pool.query('DELETE FROM product_images WHERE product_id = ?', [Number(id)]);
  await pool.query('DELETE FROM products WHERE product_id = ?', [Number(id)]);

  return { message: `ลบสินค้า "${product.name}" สำเร็จ` };
};

// ── Helper: แปลง DB row → response format ──────────────────────
const formatProduct = (p) => ({
  id:            p.id || p.product_id,
  name:          p.name,
  brand:         p.brand,
  brandCountry:  p.brandCountry,
  category:      p.category,
  skinTypeTarget: p.skinTypeTarget,
  ingredients:   p.ingredients,
  price:         Number(p.price),
  stockQty:      Number(p.stockQty),
  expiryDate:    p.expiryDate,
  imageUrl:      p.imageUrl || null,
  averageRating: Number(p.averageRating),
  reviewCount:   Number(p.reviewCount),
});

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
