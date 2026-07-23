const cartService = require('./cart.service');

/**
 * GET /api/cart
 */
const getCart = (req, res, next) => {
  try {
    const cart = cartService.getCart(req.user.userId);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/**
 * POST /api/cart/items
 * body: { productId, qty }
 */
const addItem = (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    if (!productId || !qty) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุ productId และ qty' });
    }
    const cart = cartService.addItem(req.user.userId, { productId, qty: Number(qty) });
    res.status(201).json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/**
 * PUT /api/cart/items/:cartItemId
 * body: { qty }
 */
const updateItem = (req, res, next) => {
  try {
    const { qty } = req.body;
    if (!qty) {
      return res.status(400).json({ success: false, message: 'กรุณาระบุ qty' });
    }
    const cart = cartService.updateItem(req.user.userId, req.params.cartItemId, { qty: Number(qty) });
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
};

/**
 * DELETE /api/cart/items/:cartItemId
 */
const removeItem = (req, res, next) => {
  try {
    const cart = cartService.removeItem(req.user.userId, req.params.cartItemId);
    res.json({ success: true, message: 'ลบสินค้าออกจากตะกร้าแล้ว', data: cart });
  } catch (err) { next(err); }
};

module.exports = { getCart, addItem, updateItem, removeItem };
