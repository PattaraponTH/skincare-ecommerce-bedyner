const svc = require('./marketing.service');
exports.getAllPromotions = async (req, res, next) => { try { const data = await svc.getAllPromotions(); res.json({ success: true, total: data.length, data }); } catch (e) { next(e); } };
exports.createPromotion = async (req, res, next) => { try { const data = await svc.createPromotion(req.body); res.status(201).json({ success: true, data }); } catch (e) { next(e); } };
exports.updatePromotion = async (req, res, next) => { try { const data = await svc.updatePromotion(req.params.id, req.body); res.json({ success: true, data }); } catch (e) { next(e); } };
exports.deletePromotion = async (req, res, next) => { try { await svc.deletePromotion(req.params.id); res.json({ success: true, data: { message: `Deleted #${req.params.id}` } }); } catch (e) { next(e); } };
