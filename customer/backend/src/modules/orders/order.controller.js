const orderService = require('./order.service');

/**
 * POST /api/orders
 * body: { shippingAddress: { recipient, address, province, postalCode }, paymentMethod }
 */
const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrder(req.user.customerId, req.body);
    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
};

/**
 * GET /api/orders
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getMyOrders(req.user.customerId);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) { next(err); }
};

/**
 * GET /api/orders/:orderId
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.user.customerId, req.params.orderId);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
};

module.exports = { createOrder, getMyOrders, getOrderById };
