const { findAll, findOne, create, update } = require('../../config/store');

/**
 * ดึงรีวิวของสินค้า
 */
const getReviewsByProduct = (productId) => {
  return findAll('reviews', (r) => r.productId === Number(productId));
};

/**
 * เขียนรีวิว (Verified Purchase)
 * — ต้องเคยซื้อสินค้านี้และออเดอร์นั้นมีสถานะ delivered แล้วเท่านั้น
 * — ลูกค้า 1 คน รีวิวสินค้าแต่ละชิ้นได้ 1 ครั้ง
 */
const createReview = (customerId, { productId, orderId, rating, comment }) => {
  if (!rating || rating < 1 || rating > 5) {
    const err = new Error('rating ต้องอยู่ระหว่าง 1-5');
    err.statusCode = 400;
    throw err;
  }
  if (!comment?.trim()) {
    const err = new Error('กรุณาเขียนความคิดเห็น');
    err.statusCode = 400;
    throw err;
  }

  // ── Verified Purchase: ต้องมีออเดอร์ delivered ที่มีสินค้านี้ ──
  const purchasedOrders = findAll(
    'orders',
    (o) =>
      o.customerId === customerId &&
      o.status === 'delivered' &&
      (o.items || []).some((it) => it.productId === Number(productId))
  );
  if (purchasedOrders.length === 0) {
    const err = new Error('รีวิวได้เฉพาะสินค้าที่คุณซื้อและได้รับแล้วเท่านั้น');
    err.statusCode = 403;
    throw err;
  }

  // ── กันรีวิวซ้ำ: 1 คน / 1 สินค้า / 1 รีวิว ──
  const duplicate = findOne(
    'reviews',
    (r) => r.productId === Number(productId) && r.customerId === customerId
  );
  if (duplicate) {
    const err = new Error('คุณได้รีวิวสินค้านี้แล้ว');
    err.statusCode = 409;
    throw err;
  }

  const newReview = create('reviews', {
    productId: Number(productId),
    customerId,
    // ถ้า frontend ไม่ส่ง orderId มา ให้ผูกกับออเดอร์แรกที่ซื้อสินค้านี้อัตโนมัติ
    orderId: orderId || purchasedOrders[0].orderId,
    rating: Number(rating),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  });

  // อัปเดต averageRating ของสินค้า
  _recalcRating(Number(productId));

  return newReview;
};

/**
 * คำนวณ averageRating ใหม่หลังเพิ่มรีวิว
 */
const _recalcRating = (productId) => {
  const { db, update: updateStore } = require('../../config/store');
  const reviews = db.reviews.filter((r) => r.productId === productId);
  if (reviews.length === 0) return;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const product = db.products.find((p) => p.id === productId);
  if (product) {
    product.averageRating = Math.round(avg * 10) / 10;
    product.reviewCount = reviews.length;
  }
};

module.exports = { getReviewsByProduct, createReview };
