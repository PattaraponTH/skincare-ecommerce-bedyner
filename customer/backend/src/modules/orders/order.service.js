const { findAll, findOne, create, update } = require('../../config/store');

const ORDER_STATUSES = ['pending_payment', 'confirmed', 'shipping', 'delivered'];

/**
 * สร้างคำสั่งซื้อจากตะกร้าปัจจุบัน
 */
const createOrder = (customerId, { shippingAddress, paymentMethod }) => {
  const cart = findOne('carts', (c) => c.customerId === customerId);
  if (!cart || cart.items.length === 0) {
    const err = new Error('ตะกร้าสินค้าว่างเปล่า');
    err.statusCode = 400;
    throw err;
  }
  if (!shippingAddress?.recipient || !shippingAddress?.address) {
    const err = new Error('กรุณาระบุที่อยู่จัดส่ง (recipient, address)');
    err.statusCode = 400;
    throw err;
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const orderCount = findAll('orders').length + 1;
  const orderId = `ORD-${dateStr}-${String(orderCount).padStart(4, '0')}`;

  const orderItems = cart.items.map((item, idx) => ({
    orderItemId: idx + 1,
    productId: item.productId,
    productName: item.productName,
    qty: item.qty,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
  }));

  const newOrder = create('orders', {
    orderId,
    customerId,
    status: 'pending_payment',
    items: orderItems,
    totalAmount: cart.totalAmount,
    shippingAddress,
    paymentMethod: paymentMethod || null,
    createdAt: new Date().toISOString(),
  });

  // เคลียร์ตะกร้า
  update('carts', cart.id, { items: [], totalAmount: 0, updatedAt: new Date().toISOString() });

  return newOrder;
};

/**
 * ดึงประวัติคำสั่งซื้อของ customer
 */
const getMyOrders = (customerId) => {
  return findAll('orders', (o) => o.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * ดึงคำสั่งซื้อตาม orderId (ตรวจสอบว่าเป็นของ customer นี้)
 */
const getOrderById = (customerId, orderId) => {
  const order = findOne('orders', (o) => o.orderId === orderId && o.customerId === customerId);
  if (!order) {
    const err = new Error('ไม่พบคำสั่งซื้อ');
    err.statusCode = 404;
    throw err;
  }
  return order;
};

/**
 * ลูกค้ากดยืนยันรับสินค้า → เปลี่ยนสถานะเป็น delivered
 * (อนุญาตเมื่อสถานะเป็น confirmed หรือ shipping เท่านั้น)
 */
const confirmReceive = (customerId, orderId) => {
  const order = findOne('orders', (o) => o.orderId === orderId && o.customerId === customerId);
  if (!order) {
    const err = new Error('ไม่พบคำสั่งซื้อ');
    err.statusCode = 404;
    throw err;
  }
  if (order.status === 'delivered') {
    const err = new Error('คำสั่งซื้อนี้ได้รับสินค้าแล้ว');
    err.statusCode = 400;
    throw err;
  }
  if (order.status === 'pending_payment') {
    const err = new Error('กรุณาชำระเงินก่อนยืนยันรับสินค้า');
    err.statusCode = 400;
    throw err;
  }
  return update('orders', order.id, {
    status: 'delivered',
    deliveredAt: new Date().toISOString(),
  });
};

module.exports = { createOrder, getMyOrders, getOrderById, confirmReceive, ORDER_STATUSES };
