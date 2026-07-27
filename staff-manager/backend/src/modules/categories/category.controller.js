const svc = require('./category.service');

exports.getAllCategories = async (req, res, next) => {
  try {
    const data = await svc.getAllCategories();
    res.json({ success: true, total: data.length, data });
  } catch (e) { next(e); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name required' });
    const data = await svc.createCategory(name);
    res.status(201).json({ success: true, data });
  } catch (e) { next(e); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { name } = req.body;
    const data = await svc.updateCategory(req.params.id, name);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    await svc.deleteCategory(req.params.id);
    res.json({ success: true, data: { message: `Deleted category #${req.params.id}` } });
  } catch (e) { next(e); }
};
