const orderService = require('./order.service');

/**
 * POST /api/orders
 * body: { shippingAddress: { recipient, address, province, postalCode }, paymentMethod }
 */
const createOrder = (req, res, next) => {
  try {
    const order = orderService.createOrder(req.user.userId, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

/**
 * GET /api/orders
 */
const getMyOrders = (req, res, next) => {
  try {
    const orders = orderService.getMyOrders(req.user.userId);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) { next(err); }
};

/**
 * GET /api/orders/:orderId
 */
const getOrderById = (req, res, next) => {
  try {
    const order = orderService.getOrderById(req.user.userId, req.params.orderId);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

/**
 * PUT /api/orders/:orderId/receive
 * ลูกค้ายืนยันว่าได้รับสินค้าแล้ว → status = delivered
 */
const confirmReceive = (req, res, next) => {
  try {
    const order = orderService.confirmReceive(req.user.userId, req.params.orderId);
    res.json({ success: true, message: 'ยืนยันรับสินค้าเรียบร้อย', data: order });
  } catch (err) { next(err); }
};

module.exports = { createOrder, getMyOrders, getOrderById, confirmReceive };
