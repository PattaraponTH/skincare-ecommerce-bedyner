const { findOne, create, update } = require('../../config/store');

const PAYMENT_METHODS = ['credit_card', 'qr_code', 'bank_transfer', 'cash_on_delivery'];

/**
 * จำลองการชำระเงิน (Simulation)
 * — ตรวจสอบ order → สร้าง payment → อัปเดต status order เป็น confirmed
 */
const checkout = (customerId, { orderId, method }) => {
  if (!PAYMENT_METHODS.includes(method)) {
    const err = new Error(`วิธีชำระเงินไม่ถูกต้อง: ${PAYMENT_METHODS.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const order = findOne('orders', (o) => o.orderId === orderId && o.customerId === customerId);
  if (!order) {
    const err = new Error('ไม่พบคำสั่งซื้อ');
    err.statusCode = 404;
    throw err;
  }
  if (order.status !== 'pending_payment') {
    const err = new Error(`ชำระเงินไม่ได้ (สถานะปัจจุบัน: ${order.status})`);
    err.statusCode = 400;
    throw err;
  }

  // เก็บเงินปลายทาง: ไม่ต้องมี payment record, แค่ยืนยัน order
  if (method === 'cash_on_delivery') {
    update('orders', order.id, { status: 'confirmed', paymentMethod: 'cash_on_delivery' });
    return {
      paymentId: null,
      orderId,
      method: 'cash_on_delivery',
      status: 'pending_cod',
      amount: order.totalAmount,
      note: 'ชำระเงินเมื่อได้รับสินค้า',
    };
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const paymentId = `PAY-${dateStr}-${String(Date.now()).slice(-4)}`;

  const payment = create('payments', {
    paymentId,
    orderId,
    method,
    status: 'success',   // Simulation: always success
    amount: order.totalAmount,
    paidAt: new Date().toISOString(),
  });

  // อัปเดตสถานะ order → confirmed
  update('orders', order.id, { status: 'confirmed' });

  return payment;
};

module.exports = { checkout, PAYMENT_METHODS };
