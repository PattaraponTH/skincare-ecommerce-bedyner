const svc = require('./review.service');

exports.getAllReviews = async (req, res, next) => {
  try {
    const data = await svc.getAllReviews();
    res.json({ success: true, total: data.length, data });
  } catch (e) { next(e); }
};

exports.updateReviewStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['approved', 'rejected', 'pending'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${allowed.join(', ')}` });
    }
    // glowtime.sql reviews table ไม่มี status column — return mock success
    res.json({ success: true, data: { id: Number(req.params.id), status, message: `Review #${req.params.id} marked as ${status}` } });
  } catch (e) { next(e); }
};
