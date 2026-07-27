const svc = require('./settings.service');
exports.getSettings = async (req, res, next) => { try { const data = await svc.getSettings(); res.json({ success: true, data }); } catch (e) { next(e); } };
exports.updateSettings = async (req, res, next) => { try { const data = await svc.updateSettings(req.body); res.json({ success: true, data }); } catch (e) { next(e); } };
