// SkincareShop — Main JavaScript
// CSI204 Workshop #1 | วิชญาดา กิตตินัฏพงศ์ 67154712 T001

// ── Cart State (in-memory) ──
const cart = {
  items: [],

  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.items.push({ ...product, qty: 1 });
    }
    this.updateCount();
    this.saveToSession();
  },

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.updateCount();
    this.saveToSession();
  },

  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  get count() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  },

  updateCount() {
    const badge = document.querySelector('.cart-count');
    if (badge) badge.textContent = this.count;
  },

  saveToSession() {
    try {
      sessionStorage.setItem('skincareShopCart', JSON.stringify(this.items));
    } catch(e) { /* sessionStorage may not be available */ }
  },

  loadFromSession() {
    try {
      const saved = sessionStorage.getItem('skincareShopCart');
      if (saved) this.items = JSON.parse(saved);
      this.updateCount();
    } catch(e) {}
  }
};

// ── Filter Chips ──
function initFilterChips() {
  document.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // TODO: filter product cards by category
    });
  });
}

// ── Add to Cart Buttons ──
function initAddToCart() {
  document.querySelectorAll('.product-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      const name  = card.querySelector('.product-name')?.textContent || '';
      const price = parseFloat(
        card.querySelector('.product-price')?.textContent.replace(/[^0-9]/g, '') || '0'
      );
      cart.add({ id: name, name, price });

      const orig = btn.textContent;
      btn.textContent = 'Added ✓';
      btn.style.cssText = 'background:#0A0A0A;color:#fff;border-color:#0A0A0A;';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.cssText = '';
      }, 1500);
    });
  });
}

// ── Quantity Controls ──
function changeQty(btn, delta) {
  const row = btn.closest('.cart-row');
  const qtyEl = row.querySelector('.qty-val');
  let qty = parseInt(qtyEl.textContent) + delta;
  if (qty < 1) qty = 1;
  qtyEl.textContent = qty;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  cart.loadFromSession();
  initFilterChips();
  initAddToCart();
});