const { findAll, findById } = require('../../config/store');

/**
 * ดึงสินค้าทั้งหมด พร้อม filter
 * @param {Object} filters - { skinType, brand, category, minPrice, maxPrice, search }
 */
const getProducts = ({ skinType, brand, category, minPrice, maxPrice, search } = {}) => {
  const products = findAll('products', (p) => {
    // filter ประเภทผิว
    if (skinType) {
      const targets = p.skinTypeTarget.map((s) => s.toLowerCase());
      if (!targets.includes(skinType.toLowerCase()) && !targets.includes('all')) return false;
    }
    // filter แบรนด์
    if (brand && p.brand.toLowerCase() !== brand.toLowerCase()) return false;
    // filter หมวดหมู่
    if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
    // filter ราคา
    if (minPrice !== undefined && p.price < Number(minPrice)) return false;
    if (maxPrice !== undefined && p.price > Number(maxPrice)) return false;
    // search ชื่อสินค้า / หมวดหมู่ / แบรนด์ / คำอธิบาย
    if (search) {
      const q = search.toLowerCase();
      const haystack = [p.name, p.category, p.brand, p.description || '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  return products;
};

/**
 * ดึงสินค้าตาม id
 */
const getProductById = (id) => {
  const product = findById('products', Number(id));
  if (!product) {
    const err = new Error('ไม่พบสินค้า');
    err.statusCode = 404;
    throw err;
  }
  return product;
};

module.exports = { getProducts, getProductById };
