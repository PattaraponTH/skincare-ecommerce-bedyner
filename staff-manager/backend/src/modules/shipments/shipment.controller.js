const shipmentService = require('./shipment.service');

/**
 * POST /api/staff/shipments
 */
const createShipment = async (req, res, next) => {
  try {
    const { orderId, trackingNumber, carrier } = req.body;
    const shipment = await shipmentService.createShipment({ orderId, trackingNumber, carrier });
    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/staff/shipments
 */
const getAllShipments = async (_req, res, next) => {
  try {
    const shipments = await shipmentService.getAllShipments();
    res.json({ success: true, data: shipments, total: shipments.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/staff/shipments/:orderId
 */
const getShipmentByOrderId = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getShipmentByOrderId(req.params.orderId);
    res.json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
};

module.exports = { createShipment, getAllShipments, getShipmentByOrderId };
