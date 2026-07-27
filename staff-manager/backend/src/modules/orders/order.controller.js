const orderService = require('./order.service');

/**
 * GET /api/staff/orders
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const orders = await orderService.getAllOrders({ status, customerId });
    res.json({ success: true, data: orders, total: orders.length });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/staff/orders/:id/status
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ status',
      });
    }

    const updated = await orderService.updateOrderStatus(id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllOrders, updateOrderStatus };
