const svc = require('./inventory.service');
exports.getInventoryLots = async (req, res, next) => {
  try { const data = await svc.getInventoryLots(); res.json({ success: true, total: data.length, data }); }
  catch (e) { next(e); }
};
