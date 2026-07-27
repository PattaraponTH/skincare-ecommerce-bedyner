const stockService = require('./stock.service');

/**
 * PUT /api/staff/stock/:productId
 */
const updateStock = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { stockQty } = req.body;

    if (stockQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ stockQty',
      });
    }

    const updated = await stockService.updateStock(productId, stockQty);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/staff/stock
 */
const getAllStock = async (_req, res, next) => {
  try {
    const stockData = await stockService.getAllStock();
    res.json({ success: true, data: stockData, total: stockData.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateStock, getAllStock };
