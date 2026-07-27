// glowtime.sql ไม่มี promotions table — in-memory store
let promotionsStore = [
  { id: 1, title: 'Summer Glow Sale', description: 'ลด 15% สินค้าทุกชิ้นในหมวด Serum', type: 'discount', discount: 15, startDate: '2026-07-01', endDate: '2026-07-31', targetCategory: 'Serum', status: 'Active', bannerUrl: '' },
  { id: 2, title: 'Buy 2 Get 1 Free', description: 'ซื้อ Moisturizer 2 ชิ้น แถม 1 ชิ้น', type: 'bundle', discount: 0, startDate: '2026-08-01', endDate: '2026-08-15', targetCategory: 'Moisturizer', status: 'Scheduled', bannerUrl: '' },
];
let nextId = 3;

const getAllPromotions = async () => promotionsStore;
const createPromotion = async (data) => { const p = { ...data, id: nextId++ }; promotionsStore.unshift(p); return p; };
const updatePromotion = async (id, data) => { const i = promotionsStore.findIndex(p => p.id === Number(id)); if (i === -1) throw Object.assign(new Error('Not found'), { status: 404 }); promotionsStore[i] = { ...promotionsStore[i], ...data }; return promotionsStore[i]; };
const deletePromotion = async (id) => { promotionsStore = promotionsStore.filter(p => p.id !== Number(id)); return { id: Number(id) }; };

module.exports = { getAllPromotions, createPromotion, updatePromotion, deletePromotion };
