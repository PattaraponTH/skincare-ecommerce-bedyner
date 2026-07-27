const reportService = require('./report.service');

/**
 * GET /api/manager/reports/sales
 */
const getSalesReport = async (_req, res, next) => {
  try {
    const report = await reportService.getSalesReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/manager/reports/stock
 */
const getStockReport = async (_req, res, next) => {
  try {
    const report = await reportService.getStockReport();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

const getRevenueChart = async (req, res, next) => {
  try {
    const period = req.query.period || '7D';
    if (!['7D','30D','1Y'].includes(period)) {
      return res.status(400).json({ success: false, message: 'period must be 7D, 30D, or 1Y' });
    }
    const data = await reportService.getRevenueChart(period);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

/**
 * GET /api/manager/reports/category-sales
 */
const getCategorySales = async (_req, res, next) => {
  try {
    const data = await reportService.getCategorySales();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/manager/reports/skin-types
 */
const getSkinTypes = async (_req, res, next) => {
  try {
    const data = await reportService.getSkinTypes();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalesReport,
  getStockReport,
  getRevenueChart,
  getCategorySales,
  getSkinTypes,
};
