// in-memory store (glowtime.sql ไม่มี settings table)
let settingsStore = {
  storeName: 'GLOWTIME',
  storeEmail: 'support@glowtime.com',
  storePhone: '02-123-4567',
  currency: 'THB',
  taxRate: 7,
  freeShippingThreshold: 1000,
  lowStockThreshold: 30,
  maintenanceMode: false,
};

const getSettings = async () => settingsStore;
const updateSettings = async (data) => { settingsStore = { ...settingsStore, ...data }; return settingsStore; };

module.exports = { getSettings, updateSettings };
