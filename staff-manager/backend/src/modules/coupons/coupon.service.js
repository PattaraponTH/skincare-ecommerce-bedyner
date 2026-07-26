// glowtime.sql ไม่มี coupons table — ใช้ in-memory store (demo)
// เหมาะสำหรับ MVP phase

let couponsStore = [
  { id: 1, code: 'GLOW20', description: '20% discount on all orders (Min spend ฿1,000)', type: 'percentage', value: 20, minSpend: 1000, usageCount: 145, usageLimit: 500, expiry: '2026-08-31', status: 'Active' },
  { id: 2, code: 'FREESHIP', description: 'Free shipping on all orders', type: 'free_shipping', value: 0, minSpend: 0, usageCount: 200, usageLimit: 0, expiry: '2026-12-31', status: 'Active' },
];

let nextId = 3;

const getAllCoupons = async () => couponsStore;
const createCoupon = async (data) => { const c = { ...data, id: nextId++, usageCount: 0 }; couponsStore.unshift(c); return c; };
const updateCoupon = async (id, data) => { const i = couponsStore.findIndex(c => c.id === Number(id)); if (i === -1) throw Object.assign(new Error('Not found'), { status: 404 }); couponsStore[i] = { ...couponsStore[i], ...data }; return couponsStore[i]; };
const deleteCoupon = async (id) => { const before = couponsStore.length; couponsStore = couponsStore.filter(c => c.id !== Number(id)); if (couponsStore.length === before) throw Object.assign(new Error('Not found'), { status: 404 }); return { id: Number(id) }; };

module.exports = { getAllCoupons, createCoupon, updateCoupon, deleteCoupon };
