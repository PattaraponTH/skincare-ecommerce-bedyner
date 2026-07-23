const { findOne, findById, update } = require('../../config/store');

/**
 * คำนวณ totalAmount จาก items
 */
const calcTotal = (items) =>
  items.reduce((sum, item) => sum + item.subtotal, 0);

/**
 * ดึงตะกร้าของ customer (สร้างใหม่อัตโนมัติถ้ายังไม่มี)
 */
const getCart = (customerId) => {
  let cart = findOne('carts', (c) => c.customerId === customerId);
  if (!cart) {
    // สร้างตะกร้าว่างในหน่วยความจำ
    const { create } = require('../../config/store');
    cart = create('carts', {
      customerId,
      items: [],
      totalAmount: 0,
      updatedAt: new Date().toISOString(),
    });
  }
  return cart;
};

/**
 * เพิ่มสินค้าลงตะกร้า
 */
const addItem = (customerId, { productId, qty }) => {
  const { findById: findProduct } = require('../../config/store');

  const product = findProduct('products', Number(productId));
  if (!product) {
    const err = new Error('ไม่พบสินค้า');
    err.statusCode = 404;
    throw err;
  }
  if (qty < 1) {
    const err = new Error('จำนวนสินค้าต้องมากกว่า 0');
    err.statusCode = 400;
    throw err;
  }
  if (product.stockQty < qty) {
    const err = new Error(`สินค้าคงเหลือไม่เพียงพอ (คงเหลือ: ${product.stockQty})`);
    err.statusCode = 400;
    throw err;
  }

  const cart = getCart(customerId);
  const existingItem = cart.items.find((i) => i.productId === Number(productId));

  if (existingItem) {
    existingItem.qty += qty;
    existingItem.subtotal = +(existingItem.unitPrice * existingItem.qty).toFixed(2);
  } else {
    const newCartItemId = cart.items.length > 0
      ? Math.max(...cart.items.map((i) => i.cartItemId)) + 1
      : 1;
    cart.items.push({
      cartItemId: newCartItemId,
      productId: Number(productId),
      productName: product.name,
      unitPrice: product.price,
      qty,
      subtotal: +(product.price * qty).toFixed(2),
    });
  }

  cart.totalAmount = +calcTotal(cart.items).toFixed(2);
  cart.updatedAt = new Date().toISOString();
  update('carts', cart.id, cart);
  return cart;
};

/**
 * แก้ไขจำนวนสินค้าในตะกร้า
 */
const updateItem = (customerId, cartItemId, { qty }) => {
  if (qty < 1) {
    const err = new Error('จำนวนสินค้าต้องมากกว่า 0 (ถ้าต้องการลบให้ใช้ DELETE)');
    err.statusCode = 400;
    throw err;
  }

  const cart = getCart(customerId);
  const item = cart.items.find((i) => i.cartItemId === Number(cartItemId));
  if (!item) {
    const err = new Error('ไม่พบสินค้าในตะกร้า');
    err.statusCode = 404;
    throw err;
  }

  item.qty = qty;
  item.subtotal = +(item.unitPrice * qty).toFixed(2);
  cart.totalAmount = +calcTotal(cart.items).toFixed(2);
  cart.updatedAt = new Date().toISOString();
  update('carts', cart.id, cart);
  return cart;
};

/**
 * ลบสินค้าออกจากตะกร้า
 */
const removeItem = (customerId, cartItemId) => {
  const cart = getCart(customerId);
  const index = cart.items.findIndex((i) => i.cartItemId === Number(cartItemId));
  if (index === -1) {
    const err = new Error('ไม่พบสินค้าในตะกร้า');
    err.statusCode = 404;
    throw err;
  }

  cart.items.splice(index, 1);
  cart.totalAmount = +calcTotal(cart.items).toFixed(2);
  cart.updatedAt = new Date().toISOString();
  update('carts', cart.id, cart);
  return cart;
};

module.exports = { getCart, addItem, updateItem, removeItem };
