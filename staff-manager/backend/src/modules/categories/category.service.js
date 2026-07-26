const { pool } = require('../../config/store');

const getAllCategories = async () => {
  const [rows] = await pool.query(`
    SELECT c.category_id AS id, c.name,
      COUNT(p.product_id) AS productCount
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.category_id
    GROUP BY c.category_id, c.name
    ORDER BY c.name ASC
  `);
  return rows.map(r => ({ id: r.id, name: r.name, productCount: Number(r.productCount), status: 'Active' }));
};

const createCategory = async (name) => {
  const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
  return { id: result.insertId, name, productCount: 0, status: 'Active' };
};

const updateCategory = async (id, name) => {
  await pool.query('UPDATE categories SET name = ? WHERE category_id = ?', [name, id]);
  return { id: Number(id), name, status: 'Active' };
};

const deleteCategory = async (id) => {
  await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
  return { id: Number(id) };
};

module.exports = { getAllCategories, createCategory, updateCategory, deleteCategory };
