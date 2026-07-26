/**
 * GLOWTIME — Marketing & Promotions (js/marketing.js)
 * ──────────────────────────────────────────────────────
 * Bundle sets CRUD + Flash sale timer + Cart recovery
 */

// ── Mock Data ─────────────────────────────────────────
let bundlesList = [
  {
    id: 1,
    name: 'Calming Duo Set',
    products: ['Hydrating Serum 30ml', 'Rose Barrier Cream 50g'],
    regularPrice: 1280,
    bundlePrice: 990,
    sold: 48,
    status: 'Active',
    endDate: '2026-08-31'
  },
  {
    id: 2,
    name: 'Glow Starter Kit',
    products: ['Gentle Cleanser 150ml', 'Niacinamide 10% Serum', 'Daily SPF 50+'],
    regularPrice: 1530,
    bundlePrice: 1190,
    sold: 31,
    status: 'Active',
    endDate: '2026-09-15'
  },
  {
    id: 3,
    name: 'Oily Skin Rescue Pack',
    products: ['Glow Mask 75g', 'Niacinamide 10%', 'Hydrating Mist'],
    regularPrice: 1320,
    bundlePrice: 999,
    sold: 19,
    status: 'Hidden',
    endDate: '2026-07-31'
  }
];

const flashSalesData = [
  { id: 1, product: 'Glow Mask 75g',     discount: 30, originalPrice: 450, salePrice: 315, stock: 15, sold: 28, endsIn: Date.now() + 4 * 3600000 },
  { id: 2, product: 'Radiance Oil 30ml', discount: 20, originalPrice: 750, salePrice: 600, stock: 4,  sold: 41, endsIn: Date.now() + 9 * 3600000 },
];

const cartRecoveryData = {
  pending: 14,
  value: 18200,
  customers: [
    { name: 'กัณฑ์ ร.', cart: 'Hydrating Serum × 2, SPF 50+', value: 1670, since: '2.5h ago' },
    { name: 'มณี ส.',  cart: 'Rose Barrier Cream × 1',         value: 690,  since: '3h ago'   },
    { name: 'ปิยะ ว.', cart: 'Renewal Cream × 1, Serum × 1',  value: 1480, since: '4h ago'   },
  ]
};

// ── Flash Sale Countdown Timers ────────────────────────
const _timers = {};
function startCountdown(id, endsIn, elId) {
  if (_timers[id]) clearInterval(_timers[id]);
  _timers[id] = setInterval(() => {
    const diff = endsIn - Date.now();
    if (diff <= 0) { document.getElementById(elId).textContent = 'Ended'; clearInterval(_timers[id]); return; }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const el = document.getElementById(elId);
    if (el) el.textContent = `${h}h ${m}m ${s}s`;
  }, 1000);
}

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderMarketingStats();
  renderBundlesTable();
  renderFlashSales();
  renderCartRecovery();
});

// ── Stats ─────────────────────────────────────────────
function renderMarketingStats() {
  const activeBundles = bundlesList.filter(b => b.status === 'Active').length;
  const totalBundleSold = bundlesList.reduce((s, b) => s + b.sold, 0);
  const flashActive = flashSalesData.length;
  const cartValue = cartRecoveryData.value;

  const el = document.getElementById('marketingStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Active Bundles</div>
      <div class="stat-value" style="color:var(--status-success);">${activeBundles}</div>
      <div class="stat-meta">Bundle sets running</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Bundle Units Sold</div>
      <div class="stat-value">${totalBundleSold}</div>
      <div class="stat-meta">All time</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Flash Sales Live</div>
      <div class="stat-value" style="color:#C5A059;">${flashActive}</div>
      <div class="stat-meta">With countdown timer</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Abandoned Cart Value</div>
      <div class="stat-value" style="color:var(--status-danger);">฿${cartValue.toLocaleString()}</div>
      <div class="stat-meta">${cartRecoveryData.pending} carts pending</div>
    </div>
  `;
}

// ── Bundles Table ─────────────────────────────────────
function renderBundlesTable() {
  const tbody = document.getElementById('bundlesTableBody');
  if (!tbody) return;
  tbody.innerHTML = bundlesList.map(b => {
    const saving = b.regularPrice - b.bundlePrice;
    const pct    = Math.round(saving / b.regularPrice * 100);
    return `
      <tr>
        <td>
          <strong>${b.name}</strong>
          <div style="font-size:0.7rem; color:var(--gray); margin-top:2px;">${b.products.join(' + ')}</div>
        </td>
        <td><span style="text-decoration:line-through; color:var(--gray);">฿${b.regularPrice.toLocaleString()}</span></td>
        <td>
          <strong style="color:var(--status-success);">฿${b.bundlePrice.toLocaleString()}</strong>
          <span class="status-badge badge-success" style="margin-left:0.4rem;">Save ${pct}%</span>
        </td>
        <td><strong>${b.sold}</strong> sets</td>
        <td>${b.endDate}</td>
        <td><span class="status-badge ${b.status === 'Active' ? 'badge-success' : 'badge-danger'}">${b.status}</span></td>
        <td>
          <button class="btn-ghost-sm" onclick="editBundle(${b.id})">✏️ Edit</button>
          <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="deleteBundle(${b.id})">🗑</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Flash Sales ───────────────────────────────────────
function renderFlashSales() {
  const el = document.getElementById('flashSaleList');
  if (!el) return;
  el.innerHTML = flashSalesData.map(f => `
    <div class="flash-sale-card">
      <div class="flash-info">
        <div class="flash-title">${f.product}</div>
        <div class="flash-meta">
          <span style="text-decoration:line-through; color:var(--gray); font-size:0.78rem;">฿${f.originalPrice}</span>
          <strong style="color:var(--status-success); margin-left:0.5rem;">฿${f.salePrice}</strong>
          <span class="status-badge badge-danger" style="margin-left:0.5rem;">-${f.discount}% OFF</span>
        </div>
      </div>
      <div class="flash-progress-wrap">
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--gray); margin-bottom:4px;">
          <span>Sold: ${f.sold}</span>
          <span>Remaining: ${f.stock}</span>
        </div>
        <div class="flash-progress-bar">
          <div class="flash-progress-fill" style="width:${Math.min(f.sold / (f.sold + f.stock) * 100, 100)}%"></div>
        </div>
      </div>
      <div class="flash-countdown">
        ⏰ Ends in: <strong id="countdown-${f.id}">--:--:--</strong>
      </div>
      <button class="btn-ghost-sm" onclick="showToast('Flash sale for ${f.product} ended early')">End Now</button>
    </div>
  `).join('');

  // Start all countdowns
  flashSalesData.forEach(f => startCountdown(f.id, f.endsIn, `countdown-${f.id}`));
}

// ── Cart Recovery ─────────────────────────────────────
function renderCartRecovery() {
  const tbody = document.getElementById('cartRecoveryBody');
  if (!tbody) return;
  tbody.innerHTML = cartRecoveryData.customers.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td style="font-size:0.78rem;">${c.cart}</td>
      <td><strong>฿${c.value.toLocaleString()}</strong></td>
      <td style="color:var(--status-danger); font-size:0.78rem;">${c.since}</td>
      <td>
        <button class="btn-ghost-sm" onclick="showToast('Recovery email sent to ${c.name}!')">📧 Send Email</button>
        <button class="btn-ghost-sm" onclick="showToast('LINE notification sent to ${c.name}!')">💬 LINE</button>
      </td>
    </tr>
  `).join('');
}

// ── Bundle CRUD ───────────────────────────────────────
function openCreateBundleModal() {
  document.getElementById('bundleModalTitle').textContent = 'Create Bundle Set';
  document.getElementById('editBundleId').value = '';
  document.getElementById('bundleForm').reset();
  openModal('modalBundle');
}

function editBundle(id) {
  const b = bundlesList.find(b => b.id === id);
  if (!b) return;
  document.getElementById('bundleModalTitle').textContent = `Edit: ${b.name}`;
  document.getElementById('editBundleId').value = id;
  document.getElementById('bundleName').value = b.name;
  document.getElementById('bundleProducts').value = b.products.join(', ');
  document.getElementById('bundleRegularPrice').value = b.regularPrice;
  document.getElementById('bundleSalePrice').value = b.bundlePrice;
  document.getElementById('bundleEndDate').value = b.endDate;
  document.getElementById('bundleStatus').value = b.status;
  openModal('modalBundle');
}

function saveBundle(e) {
  e.preventDefault();
  const editId = document.getElementById('editBundleId').value;
  const isEdit = !!editId;

  const bundleData = {
    id:           isEdit ? Number(editId) : Math.max(0, ...bundlesList.map(b => b.id)) + 1,
    name:         document.getElementById('bundleName').value.trim(),
    products:     document.getElementById('bundleProducts').value.split(',').map(s => s.trim()).filter(Boolean),
    regularPrice: Number(document.getElementById('bundleRegularPrice').value),
    bundlePrice:  Number(document.getElementById('bundleSalePrice').value),
    endDate:      document.getElementById('bundleEndDate').value,
    status:       document.getElementById('bundleStatus').value,
    sold:         isEdit ? (bundlesList.find(b => b.id === Number(editId))?.sold || 0) : 0,
  };

  if (isEdit) {
    const idx = bundlesList.findIndex(b => b.id === Number(editId));
    if (idx !== -1) bundlesList[idx] = bundleData;
  } else {
    bundlesList.unshift(bundleData);
  }

  renderMarketingStats();
  renderBundlesTable();
  closeModal('modalBundle');
  showToast(`Bundle "${bundleData.name}" ${isEdit ? 'updated' : 'created'} ✅`);
}

function deleteBundle(id) {
  const b = bundlesList.find(b => b.id === id);
  if (!b) return;
  if (confirm(`Delete bundle "${b.name}"?`)) {
    bundlesList = bundlesList.filter(b => b.id !== id);
    renderMarketingStats();
    renderBundlesTable();
    showToast(`Bundle "${b.name}" deleted`);
  }
}

// ── Send All Cart Recovery ────────────────────────────
function sendCartRecoveryAll() {
  showToast(`📧 Recovery email sent to all ${cartRecoveryData.pending} customers!`);
}
