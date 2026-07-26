/**
 * GLOWTIME — Inventory & Batches Management (js/inventory.js)
 * ─────────────────────────────────────────────────────────────
 * Track batch/lot numbers, expiry warnings, stock levels
 * API-first (uses AdminStock), fallback mock data
 */

const MOCK_INVENTORY = [
  { lotNo: 'LOT-B8842', productId: 1001, productName: 'Hydrating Serum 30ml',     category: 'Serum',       supplier: 'GLOWTIME OEM Co., Ltd.', costPrice: 180, qtyReceived: 500, stockQty: 120, mfgDate: '2025-06-01', expDate: '2028-06-30', status: 'ok'  },
  { lotNo: 'LOT-C4410', productId: 1007, productName: 'Daily SPF 50+ Sunscreen',   category: 'Sunscreen',   supplier: 'GLOWTIME Lab Ltd.',       costPrice: 150, qtyReceived: 200, stockQty: 5,   mfgDate: '2025-05-15', expDate: '2028-05-31', status: 'low' },
  { lotNo: 'LOT-A1123', productId: 1002, productName: 'Renewal Cream 50g',         category: 'Moisturizer', supplier: 'GLOWTIME OEM Co., Ltd.',  costPrice: 280, qtyReceived: 150, stockQty: 80,  mfgDate: '2025-04-01', expDate: '2028-03-31', status: 'ok'  },
  { lotNo: 'LOT-D5501', productId: 1003, productName: 'Radiance Oil 30ml',         category: 'Oil',         supplier: 'Pure Botanics Ltd.',      costPrice: 230, qtyReceived: 80,  stockQty: 4,   mfgDate: '2025-03-10', expDate: '2027-12-31', status: 'low' },
  { lotNo: 'LOT-E9901', productId: 1004, productName: 'Gentle Cleanser 150ml',     category: 'Cleanser',    supplier: 'GLOWTIME OEM Co., Ltd.',  costPrice: 120, qtyReceived: 300, stockQty: 200, mfgDate: '2025-07-01', expDate: '2028-09-30', status: 'ok'  },
  { lotNo: 'LOT-F3310', productId: 1006, productName: 'Glow Mask 75g',             category: 'Mask',        supplier: 'Pure Botanics Ltd.',      costPrice: 140, qtyReceived: 120, stockQty: 12,  mfgDate: '2025-02-01', expDate: '2027-10-31', status: 'low' },
];

const LOW_STOCK_THRESHOLD = 30;

// เก็บข้อมูลล่าสุดไว้ระดับโมดูล เพื่อให้ reload หลัง restock ได้โดยไม่ต้องผูก DOMContentLoaded ใหม่
let _inventoryData = MOCK_INVENTORY;

async function loadInventory() {
  let inventoryData = MOCK_INVENTORY;

  // Try API — /api/staff/stock (GET)
  if (window.GlowtimeAdminAPI) {
    try {
      const stockData = await window.GlowtimeAdminAPI.Stock.list();
      if (stockData && stockData.length > 0) {
        inventoryData = stockData.map((p, i) => ({
          lotNo:        `LOT-${String(p.productId || i).padStart(4, '0')}`,
          productId:    p.productId || p.id,
          productName:  p.name,
          category:     p.category,
          // หมายเหตุ: DB จริง (glowtime.sql) ยังไม่มีตาราง batch/lot แยกต่างหาก
          // ฟิลด์ supplier / costPrice / mfgDate จึงเป็นค่า placeholder ไม่ใช่ข้อมูลจริง
          supplier:     'GLOWTIME OEM',
          costPrice:    0,
          qtyReceived:  p.stockQty,
          stockQty:     p.stockQty,
          mfgDate:      '—',
          expDate:      p.expiryDate || '—',
          status:       p.stockQty === 0 ? 'out' : p.stockQty <= LOW_STOCK_THRESHOLD ? 'low' : 'ok',
        }));
      }
    } catch (e) {
      console.warn('[inventory.js] Using mock data:', e.message);
    }
  }

  _inventoryData = inventoryData;
  renderInventoryStats(inventoryData);
  renderInventoryTable(inventoryData);
  setupFilters(inventoryData);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!applyRoleGate(['staff'])) return; // ← /api/staff/stock → staff เท่านั้น
  await loadInventory();
});

// ── Stats ────────────────────────────────────────────────
function renderInventoryStats(data) {
  const total    = data.length;
  const ok       = data.filter(d => d.status === 'ok').length;
  const low      = data.filter(d => d.status === 'low').length;
  const out      = data.filter(d => d.status === 'out').length;
  const expiringSoon = data.filter(d => {
    if (!d.expDate || d.expDate === '—') return false;
    const daysLeft = (new Date(d.expDate) - new Date()) / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft < 180;
  }).length;

  const el = document.getElementById('inventoryStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Lots</div>
      <div class="stat-value">${total}</div>
      <div class="stat-meta">Tracked batches</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">In Stock</div>
      <div class="stat-value" style="color:var(--status-success);">${ok}</div>
      <div class="stat-meta">Healthy levels</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Low / Out of Stock</div>
      <div class="stat-value" style="color:var(--status-danger);">${low + out}</div>
      <div class="stat-meta">Needs reorder</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Expiring Soon</div>
      <div class="stat-value" style="color:var(--status-warning);">${expiringSoon}</div>
      <div class="stat-meta">Within 6 months</div>
    </div>
  `;
}

// ── Table ────────────────────────────────────────────────
function renderInventoryTable(data) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  const STATUS_MAP = {
    ok:  { cls: 'badge-success', label: 'In Stock'     },
    low: { cls: 'badge-warning', label: 'Low Stock'    },
    out: { cls: 'badge-danger',  label: 'Out of Stock' },
  };

  tbody.innerHTML = data.map(row => {
    const s = STATUS_MAP[row.status] || STATUS_MAP.ok;
    const daysLeft = row.expDate && row.expDate !== '—'
      ? Math.round((new Date(row.expDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null;
    const expWarn = daysLeft !== null && daysLeft < 180 && daysLeft > 0;

    return `
      <tr>
        <td><strong>${row.lotNo}</strong></td>
        <td>
          <strong style="font-size:0.82rem;">${row.productName}</strong>
          <div style="font-size:0.68rem; color:var(--gray);">${row.category}</div>
        </td>
        <td style="font-size:0.78rem;">${row.supplier}</td>
        <td style="font-size:0.78rem;">฿${(row.costPrice || 0).toLocaleString()}/unit</td>
        <td><strong>${(row.stockQty || 0).toLocaleString()}</strong><span style="color:var(--gray); font-size:0.7rem;"> / ${(row.qtyReceived || 0).toLocaleString()}</span></td>
        <td style="font-size:0.75rem;">${row.mfgDate || '—'}</td>
        <td style="font-size:0.75rem; ${expWarn ? 'color:var(--status-warning); font-weight:600;' : ''}">
          ${row.expDate || '—'}
          ${expWarn ? `<div style="font-size:0.65rem;">(${daysLeft}d left)</div>` : ''}
        </td>
        <td>
          <span class="status-badge ${s.cls}">${s.label}</span>
          ${row.stockQty <= LOW_STOCK_THRESHOLD ? `<div style="font-size:0.65rem; color:var(--status-danger); margin-top:3px;">${row.stockQty} units left</div>` : ''}
        </td>
        <td>
          <button class="btn-ghost-sm" onclick="openRestockModal('${row.productId}', '${row.productName}', ${row.stockQty})">+ Restock</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Search + Filter ──────────────────────────────────────
function setupFilters(allData) {
  const searchEl  = document.getElementById('inventorySearch');
  const statusEl  = document.getElementById('inventoryStatusFilter');

  function apply() {
    const q   = (searchEl?.value || '').toLowerCase();
    const st  = statusEl?.value || '';
    let data  = [...allData];
    if (q)  data = data.filter(d => d.productName.toLowerCase().includes(q) || d.lotNo.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
    if (st) data = data.filter(d => d.status === st);
    renderInventoryTable(data);
  }

  searchEl?.addEventListener('input', apply);
  statusEl?.addEventListener('change', apply);
}

// ── Restock Modal ────────────────────────────────────────
let _restockProductId    = null;
let _restockCurrentStock = 0; // ← เก็บ stock ปัจจุบันไว้ เพราะ backend PUT /api/staff/stock/:id
                               //   คือ "SET stock_qty = ค่าที่ส่งไป" ไม่ใช่บวกเพิ่ม (UPDATE ... SET stock_qty = ?)
                               //   ถ้าส่ง addQty ตรงๆ จะเท่ากับ "เซ็ตสต็อกทับ" ไม่ใช่ restock เพิ่ม

function openRestockModal(productId, productName, currentStock) {
  _restockProductId    = productId;
  _restockCurrentStock = Number(currentStock) || 0;
  document.getElementById('restockProductName').textContent = productName;
  document.getElementById('restockCurrentQty').textContent  = currentStock + ' units';
  document.getElementById('restockQty').value = '';
  openModal('modalRestock');
}

async function saveRestock(e) {
  e.preventDefault();
  const addQty = Number(document.getElementById('restockQty').value);
  if (!addQty || addQty <= 0) return;

  // คำนวณสต็อกใหม่ = ของเดิม + จำนวนที่รับเข้า ก่อนส่งให้ backend (backend เซ็ตทับ ไม่ได้บวกให้)
  const newQty = _restockCurrentStock + addQty;

  if (!window.GlowtimeAdminAPI) {
    showToast('❌ ไม่พบการเชื่อมต่อ API');
    return;
  }

  try {
    await window.GlowtimeAdminAPI.Stock.update(_restockProductId, newQty); // PUT /api/staff/stock/:productId
  } catch (err) {
    showToast('❌ อัปเดตสต็อกไม่สำเร็จ: ' + err.message);
    return;
  }

  closeModal('modalRestock');
  showToast(`✅ Restocked +${addQty} units สำเร็จ (สต็อกใหม่: ${newQty} units)`);
  await loadInventory(); // ← โหลดตารางใหม่จาก DB ให้ตัวเลขอัปเดตทันที
}
