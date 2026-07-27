const { pool } = require('../../config/store');

const getAllReviews = async () => {
  const [rows] = await pool.query(`
    SELECT r.review_id AS id, r.rating, r.comment,
      p.name AS productName,
      u.username AS customerName
    FROM reviews r
    JOIN products p ON p.product_id = r.product_id
    JOIN customers c ON c.customer_id = r.customer_id
    JOIN users u ON u.user_id = c.user_id
    ORDER BY r.review_id DESC
  `);
  return rows.map(r => ({ ...r, status: 'approved' }));
};

module.exports = { getAllReviews };
