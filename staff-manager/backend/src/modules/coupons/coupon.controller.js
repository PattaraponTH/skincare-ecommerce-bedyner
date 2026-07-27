const svc = require('./coupon.service');

exports.getAllCoupons = async (req, res, next) => {
  try { const data = await svc.getAllCoupons(); res.json({ success: true, total: data.length, data }); }
  catch (e) { next(e); }
};
exports.createCoupon = async (req, res, next) => {
  try { const data = await svc.createCoupon(req.body); res.status(201).json({ success: true, data }); }
  catch (e) { next(e); }
};
exports.updateCoupon = async (req, res, next) => {
  try { const data = await svc.updateCoupon(req.params.id, req.body); res.json({ success: true, data }); }
  catch (e) { next(e); }
};
exports.deleteCoupon = async (req, res, next) => {
  try { await svc.deleteCoupon(req.params.id); res.json({ success: true, data: { message: `Deleted coupon #${req.params.id}` } }); }
  catch (e) { next(e); }
};
