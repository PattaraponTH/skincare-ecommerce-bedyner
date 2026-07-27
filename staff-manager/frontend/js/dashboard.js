/**
 * GLOWTIME — Interactive Dashboard & Analytics Logic (js/dashboard.js)
 * ─────────────────────────────────────────────────────────────────────
 * กราฟ 4 แบบ + Animated counters + API-first with mock fallback
 * + Top Products & Recent Orders from API
 * + Export CSV
 * ─────────────────────────────────────────────────────────────────────
 */

// ── Chart Instances ──────────────────────────────────────────
let _revenueChart  = null;
let _categoryChart = null;
let _skinChart     = null;
let _forecastChart = null;

// ── Cached API Data ──────────────────────────────────────────
let _cachedTopProducts = [];
let _currentPeriod = '7D';

// ── Mock Chart Data (fallback เมื่อ backend ไม่ตอบสนอง) ──────
const CHART_DATA = {
  '7D': {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    revenue: [42000, 58000, 49000, 68000, 85000, 92000, 105000],
    orders:  [14, 19, 16, 22, 28, 31, 35],
    totalRevenue: 519000,
    totalOrders: 165,
    statChange: '▲ +24.8% vs last week'
  },
  '30D': {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    revenue: [280000, 315000, 420000, 485000],
    orders:  [95, 108, 142, 164],
    totalRevenue: 1500000,
    totalOrders: 509,
    statChange: '▲ +18.5% vs last month'
  },
  '1Y': {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    revenue: [850000, 920000, 1100000, 1250000, 1380000, 1450000, 1500000, 0, 0, 0, 0, 0],
    orders:  [280, 310, 370, 410, 460, 490, 509, 0, 0, 0, 0, 0],
    totalRevenue: 8450000,
    totalOrders: 2829,
    statChange: '▲ +32.1% YTD Growth'
  }
};

// ── Mock Fallback Data ────────────────────────────────────────
const MOCK_TOP_PRODUCTS = [
  { rank: 1, productId: 1001, productName: 'Hydrating Serum 30ml',  category: 'Serum',      price: 590,  totalQty: 480, totalRevenue: 283200 },
  { rank: 2, productId: 1007, productName: 'Daily SPF 50+ Sunscreen', category: 'Sunscreen', price: 490,  totalQty: 310, totalRevenue: 151900 },
  { rank: 3, productId: 1002, productName: 'Renewal Cream 50g',    category: 'Moisturizer', price: 890,  totalQty: 220, totalRevenue: 195800 },
  { rank: 4, productId: 1004, productName: 'Gentle Cleanser 150ml', category: 'Cleanser',   price: 390,  totalQty: 195, totalRevenue: 76050  },
  { rank: 5, productId: 1008, productName: 'Niacinamide 10% Serum', category: 'Serum',      price: 550,  totalQty: 180, totalRevenue: 99000  },
];

const MOCK_RECENT_ORDERS = [
  { orderId: 'ORD-20260722-0001', customerName: 'Sirinpha Wongs.', totalAmount: 1500, status: 'pending_payment' },
  { orderId: 'ORD-20260722-0002', customerName: 'Pattarapong A.',  totalAmount: 450,  status: 'confirmed'       },
  { orderId: 'ORD-20260721-0005', customerName: 'Natnicha K.',     totalAmount: 890,  status: 'shipping'        },
  { orderId: 'ORD-20260720-0003', customerName: 'Somsak P.',       totalAmount: 590,  status: 'delivered'       },
  { orderId: 'ORD-20260720-0001', customerName: 'Manee S.',        totalAmount: 1180, status: 'delivered'       },
];

const MOCK_LOW_STOCK = [
  { name: 'Radiance Oil 30ml',    category: 'Oil',       brand: 'GLOWTIME', stockQty: 4  },
  { name: 'Glow Mask 75g',        category: 'Mask',      brand: 'GLOWTIME', stockQty: 12 },
  { name: 'Rose Barrier Cream',   category: 'Moisturizer', brand: 'GLOWTIME', stockQty: 18 },
];

// ── Animated Counter ──────────────────────────────────────────
function animateCounter(el, targetValue, prefix = '', suffix = '', duration = 1200) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  const isFloat = String(targetValue).includes('.');

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const current = Math.floor(eased * targetValue);
    el.textContent = prefix + current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = prefix + targetValue.toLocaleString() + suffix;
  }
  requestAnimationFrame(update);
}

// ── Initialize All Charts ─────────────────────────────────────
function initDashboardCharts() {
  if (typeof Chart === 'undefined') return;

  // Shared chart defaults
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.color = '#777777';

  // 1. Revenue & Orders Trend (Bar + Line dual-axis)
  const ctxRev = document.getElementById('revenueChart');
  if (ctxRev) {
    _revenueChart = new Chart(ctxRev.getContext('2d'), {
      type: 'bar',
      data: {
        labels: CHART_DATA['7D'].labels,
        datasets: [
          {
            label: 'Revenue (฿)',
            data: CHART_DATA['7D'].revenue,
            backgroundColor: 'rgba(10, 10, 10, 0.82)',
            hoverBackgroundColor: '#C5A059',
            borderRadius: 5,
            barThickness: 26,
            yAxisID: 'y'
          },
          {
            label: 'Total Orders',
            data: CHART_DATA['7D'].orders,
            type: 'line',
            borderColor: '#C5A059',
            borderWidth: 2.5,
            backgroundColor: 'rgba(197, 160, 89, 0.08)',
            pointBackgroundColor: '#C5A059',
            pointRadius: 5,
            pointHoverRadius: 8,
            tension: 0.4,
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 600, easing: 'easeOutQuart' },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { font: { size: 12 }, usePointStyle: true, padding: 20 }
          },
          tooltip: {
            backgroundColor: '#0A0A0A',
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            padding: 14,
            cornerRadius: 4,
            callbacks: {
              label: ctx => ctx.dataset.yAxisID === 'y'
                ? ` Revenue: ฿${ctx.raw.toLocaleString()}`
                : ` Orders: ${ctx.raw} orders`
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 11 } } },
          y: {
            type: 'linear', position: 'left',
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              font: { size: 11 },
              callback: v => '฿' + (v >= 1000 ? (v / 1000) + 'k' : v)
            }
          },
          y1: {
            type: 'linear', position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  // 2. Category Share (Doughnut)
  const ctxCat = document.getElementById('categoryChart');
  if (ctxCat) {
    _categoryChart = new Chart(ctxCat.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Serums', 'Moisturizers', 'Sunscreen', 'Cleansers', 'Oils & Mists', 'Masks'],
        datasets: [{
          data: [38, 24, 18, 10, 6, 4],
          backgroundColor: ['#0A0A0A', '#C5A059', '#8B6F5E', '#4A6741', '#D4C4B7', '#A0856A'],
          borderWidth: 3,
          borderColor: '#FFFFFF',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutBack' },
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 11 }, usePointStyle: true, padding: 12 }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}% share`
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  // 3. Skin Type Bar Chart (horizontal)
  const ctxSkin = document.getElementById('skinTypeChart');
  if (ctxSkin) {
    _skinChart = new Chart(ctxSkin.getContext('2d'), {
      type: 'bar',
      data: {
        labels: ['Sensitive', 'Dry', 'Oily', 'Combination', 'Normal'],
        datasets: [{
          label: 'Customer Profiles',
          data: [385, 270, 195, 160, 92],
          backgroundColor: [
            'rgba(197,160,89,0.85)',
            'rgba(197,160,89,0.70)',
            'rgba(197,160,89,0.55)',
            'rgba(197,160,89,0.40)',
            'rgba(197,160,89,0.25)'
          ],
          hoverBackgroundColor: '#0A0A0A',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.raw.toLocaleString()} members`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(0,0,0,0.05)' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // 4. Monthly Revenue Forecast (Line chart)
  const ctxForecast = document.getElementById('forecastChart');
  if (ctxForecast) {
    const actualData = [850000, 920000, 1100000, 1250000, 1380000, 1450000, 1500000];
    const forecastData = [null, null, null, null, null, null, 1500000, 1620000, 1750000, 1900000, 2050000, 2200000];

    _forecastChart = new Chart(ctxForecast.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Actual Revenue',
            data: [...actualData, null, null, null, null, null],
            borderColor: '#0A0A0A',
            borderWidth: 2.5,
            pointBackgroundColor: '#0A0A0A',
            pointRadius: 4,
            tension: 0.35,
            fill: false
          },
          {
            label: 'Forecast',
            data: forecastData,
            borderColor: '#C5A059',
            borderWidth: 2,
            borderDash: [6, 4],
            pointBackgroundColor: '#C5A059',
            pointBorderColor: '#fff',
            pointRadius: 4,
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        plugins: {
          legend: { position: 'top', labels: { usePointStyle: true, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ctx.raw ? ` ฿${ctx.raw.toLocaleString()}` : ' —'
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              callback: v => '฿' + (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : (v / 1000) + 'k')
            }
          }
        }
      }
    });
  }
}


// ── Timeframe Filter (API-first + mock fallback) ─────────────
async function switchTimeframe(period, btn) {

// ── Timeframe Filter ──────────────────────────────────────────
function switchTimeframe(period, btn) {
  if (!CHART_DATA[period]) return;

  _currentPeriod = period;
  document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');


  // เรียก Revenue Chart API ก่อน, fallback mock
  let data = null;
  if (window.GlowtimeAdminAPI?.RevenueChart) {
    try {
      data = await window.GlowtimeAdminAPI.RevenueChart.get(period);
    } catch { data = null; }
  }

  if (data && Array.isArray(data.labels) && data.labels.length > 0) {
    // ── API ตอบสนอง: ใช้ข้อมูลจริง ──
    const revEl = document.getElementById('statTotalRevenue');
    const ordEl = document.getElementById('statTotalOrders');
    if (revEl) animateCounter(revEl, Number(data.totalRevenue || 0), '฿');
    if (ordEl) animateCounter(ordEl, Number(data.totalOrders || 0));
    const revMetaEl = document.getElementById('statTotalRevenueMeta');
    if (revMetaEl) revMetaEl.textContent = `- (${period})`;

    if (_revenueChart) {
      _revenueChart.data.labels = data.labels;
      _revenueChart.data.datasets[0].data = data.revenue;
      _revenueChart.data.datasets[1].data = data.orders;
      _revenueChart.update('active');
    }
    showToast(`✅ Updated analytics to ${period} view (Live DB)`);
  } else {
    // ── Fallback: ใช้ mock data ──
    const mockData = CHART_DATA[period] || CHART_DATA['7D'];
    const revEl = document.getElementById('statTotalRevenue');
    const ordEl = document.getElementById('statTotalOrders');
    if (revEl) animateCounter(revEl, mockData.totalRevenue, '฿');
    if (ordEl) animateCounter(ordEl, mockData.totalOrders);
    const revMetaEl = document.getElementById('statTotalRevenueMeta');
    if (revMetaEl) revMetaEl.textContent = mockData.statChange;
    if (_revenueChart) {
      _revenueChart.data.labels = mockData.labels;
      _revenueChart.data.datasets[0].data = mockData.revenue;
      _revenueChart.data.datasets[1].data = mockData.orders;
      _revenueChart.update('active');
    }
    showToast(`Updated analytics to ${period === '7D' ? '7 Days' : period === '30D' ? '30 Days' : '1 Year'} view`);
  }

  const data = CHART_DATA[period];

  // Update stat cards with animation
  const revEl = document.getElementById('statTotalRevenue');
  const ordEl = document.getElementById('statTotalOrders');
  if (revEl) animateCounter(revEl, data.totalRevenue, '฿');
  if (ordEl) animateCounter(ordEl, data.totalOrders);

  const revMetaEl = document.getElementById('statTotalRevenueMeta');
  if (revMetaEl) revMetaEl.textContent = data.statChange;

  // Update Revenue chart
  if (_revenueChart) {
    _revenueChart.data.labels = data.labels;
    _revenueChart.data.datasets[0].data = data.revenue;
    _revenueChart.data.datasets[1].data = data.orders;
    _revenueChart.update('active');
  }
  showToast(`Updated analytics to ${period === '7D' ? '7 Days' : period === '30D' ? '30 Days' : '1 Year'} view`);

}

// ── Render Top Products Table ─────────────────────────────────
function renderTopProducts(products) {
  const tbody = document.getElementById('topProductsBody');
  if (!tbody) return;

  const CATEGORY_BADGE = {
    'Serum': 'badge-info', 'Moisturizer': 'badge-info', 'Sunscreen': 'badge-warning',
    'Cleanser': 'badge-success', 'Oil': 'badge-warning', 'Mask': 'badge-danger',
    'Mist': 'badge-info', 'Toner': 'badge-info'
  };

  tbody.innerHTML = products.map((p, i) => `
    <tr class="clickable-row" onclick="inspectProduct(${p.productId || p.id || i})">
      <td><span style="font-weight:700; color:${i < 3 ? '#C5A059' : 'var(--gray)'};">${i < 3 ? ['🥇','🥈','🥉'][i] : `#${i + 1}`}</span></td>
      <td><strong>${p.productName || p.name}</strong></td>
      <td><span class="status-badge ${CATEGORY_BADGE[p.category] || 'badge-info'}">${p.category}</span></td>
      <td>฿${(p.price || 0).toLocaleString()}</td>
      <td>
        <strong style="color:var(--status-success);">฿${(p.totalRevenue || 0).toLocaleString()}</strong>
        <div style="font-size:0.68rem; color:var(--gray);">${(p.totalQty || 0).toLocaleString()} units</div>
      </td>
    </tr>
  `).join('');

  _cachedTopProducts = products;
}

// ── Render Recent Orders Table ────────────────────────────────
function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrdersBody');
  if (!tbody) return;

  const STATUS_MAP = {
    pending_payment: { label: 'Pending Payment', cls: 'badge-warning' },
    pending:         { label: 'Pending',          cls: 'badge-warning' },
    confirmed:       { label: 'Confirmed',         cls: 'badge-info'    },
    shipping:        { label: 'Shipping',           cls: 'badge-info'    },
    delivered:       { label: 'Delivered',          cls: 'badge-success' },
    cancelled:       { label: 'Cancelled',          cls: 'badge-danger'  },
  };

  tbody.innerHTML = orders.slice(0, 5).map(o => {
    const s = STATUS_MAP[o.status] || { label: o.status, cls: 'badge-warning' };
    const shortId = String(o.orderId || '').replace('ORD-', '').slice(-8);
    return `
      <tr class="clickable-row" onclick="inspectOrder('${o.orderId}')">
        <td><strong style="font-size:0.75rem;">#${shortId}</strong></td>
        <td>${o.customerName || o.username || '—'}</td>
        <td><strong>฿${(o.totalAmount || 0).toLocaleString()}</strong></td>
        <td><span class="status-badge ${s.cls}">${s.label}</span></td>
      </tr>
    `;
  }).join('');
}

// ── Render Low Stock Alert List ───────────────────────────────
function renderLowStockList(products) {
  const el = document.getElementById('lowStockAlertList');
  if (!el) return;

  if (!products || products.length === 0) {
    el.innerHTML = `
      <div style="text-align:center; padding:2rem; color:var(--status-success);">
        <div style="font-size:2rem;">✅</div>
        <p style="font-size:0.8rem; margin-top:0.5rem;">All products well stocked</p>
      </div>
    `;
    return;
  }


  el.innerHTML = products.map(p => {
    const status = p.status || (p.stockQty === 0 ? 'out' : p.stockQty <= 30 ? 'low' : 'ok');
    const badgeCls  = status === 'out' ? 'badge-danger' : status === 'low' ? 'badge-warning' : 'badge-success';
    const badgeText = status === 'out' ? 'Out of Stock' : `${p.stockQty} left`;
    return `
      <div class="low-stock-item">
        <div class="low-stock-info">
          <strong>${p.name}</strong>
          <span>${p.category} — ${p.brand || 'GLOWTIME'}</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span class="status-badge ${badgeCls}">${badgeText}</span>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = products.map(p => `
    <div class="low-stock-item">
      <div class="low-stock-info">
        <strong>${p.name}</strong>
        <span>${p.category} — ${p.brand || 'GLOWTIME'}</span>
      </div>
      <div style="display:flex; align-items:center; gap:0.6rem;">
        <span class="status-badge ${p.stockQty === 0 ? 'badge-danger' : 'badge-warning'}">
          ${p.stockQty === 0 ? 'Out of Stock' : `${p.stockQty} left`}
        </span>
      </div>
    </div>
  `).join('');

}

// ── Inspect Product Modal ─────────────────────────────────────
function inspectProduct(id) {
  const p = _cachedTopProducts.find(p => (p.productId || p.id) === id)
    || _cachedTopProducts[0]
    || MOCK_TOP_PRODUCTS[0];

  if (!p) return;

  const modal = document.getElementById('detailModalOverlay');
  const body  = document.getElementById('detailModalBody');
  const title = document.getElementById('detailModalTitle');
  if (!modal || !body) return;

  title.textContent = `🧴 Product Analytics: ${p.productName || p.name}`;
  body.innerHTML = `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem; font-size:0.85rem;">
      <div style="background:var(--cream); padding:1.2rem; border-radius:6px;">
        <span style="font-size:0.65rem; color:var(--gray); text-transform:uppercase; letter-spacing:0.1em;">Category</span>
        <h4 style="margin:0.3rem 0; font-size:1rem;">${p.category || '—'}</h4>
        <p style="color:#8B6F5E; font-weight:700; font-size:1.15rem;">฿${(p.price || 0).toLocaleString()}</p>
      </div>
      <div style="background:var(--cream); padding:1.2rem; border-radius:6px;">
        <span style="font-size:0.65rem; color:var(--gray); text-transform:uppercase; letter-spacing:0.1em;">Total Revenue</span>
        <h4 style="margin:0.3rem 0; font-size:1rem; color:var(--status-success);">฿${(p.totalRevenue || 0).toLocaleString()}</h4>
        <p style="font-size:0.78rem; color:var(--black);">Units Sold: ${(p.totalQty || 0).toLocaleString()}</p>
      </div>
    </div>
    <div style="margin-top:1.2rem; display:flex; justify-content:flex-end;">
      <button class="btn-dark-sm" onclick="closeDetailModal()">Close</button>
    </div>
  `;
  modal.classList.add('open');
}

// ── Inspect Order Modal ───────────────────────────────────────
function inspectOrder(orderId) {
  const modal = document.getElementById('detailModalOverlay');
  const body  = document.getElementById('detailModalBody');
  const title = document.getElementById('detailModalTitle');
  if (!modal || !body) return;

  title.textContent = `📦 Order: #${String(orderId).replace('ORD-', '')}`;
  body.innerHTML = `
    <div style="text-align:center; padding:1.5rem 0; font-size:0.85rem; color:var(--gray);">
      <div style="font-size:2rem;">📦</div>
      <p style="margin-top:0.8rem;">Order ID: <strong style="color:var(--black);">${orderId}</strong></p>
      <p style="margin-top:0.5rem;">ดูรายละเอียดเพิ่มเติมได้ที่หน้า Orders</p>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
      <a href="orders.html" class="btn-ghost-sm">View Full Order Management →</a>
      <button class="btn-dark-sm" onclick="closeDetailModal()">Close</button>
    </div>
  `;
  modal.classList.add('open');
}

function closeDetailModal() {
  const modal = document.getElementById('detailModalOverlay');
  if (modal) modal.classList.remove('open');
}

// ── Export Chart Data as CSV ──────────────────────────────────
function exportChartCSV() {
  const data = CHART_DATA[_currentPeriod];
  if (!data) return;
  const rows = [['Period', 'Revenue (฿)', 'Orders']];
  data.labels.forEach((label, i) => {
    rows.push([label, data.revenue[i] || 0, data.orders[i] || 0]);

  });
  _downloadCSV(rows, `glowtime-revenue-${_currentPeriod}-${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('📊 Revenue data exported as CSV');
}

function exportProductsCSV() {
  if (!_cachedTopProducts.length) { showToast('No product data to export'); return; }
  const rows = [['Rank', 'Product Name', 'Category', 'Price (฿)', 'Units Sold', 'Revenue (฿)']];
  _cachedTopProducts.forEach((p, i) => {
    rows.push([i + 1, p.productName || p.name, p.category, p.price || 0, p.totalQty || 0, p.totalRevenue || 0]);
  });
  _downloadCSV(rows, `glowtime-top-products-${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('📦 Top products exported as CSV');
}

function _downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Update Category Chart with Real API Data ──────────────────
const CATEGORY_PALETTE = ['#0A0A0A', '#C5A059', '#8B6F5E', '#4A6741', '#D4C4B7', '#A0856A', '#5C4A3D', '#B08968'];

function updateCategoryChart(data) {
  if (!_categoryChart || !data || !Array.isArray(data.labels) || data.labels.length === 0) return;
  const values = Array.isArray(data.percentages) && data.percentages.length ? data.percentages : data.revenue;
  _categoryChart.data.labels = data.labels;
  _categoryChart.data.datasets[0].data = values;
  _categoryChart.data.datasets[0].backgroundColor = data.labels.map((_, i) => CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]);
  _categoryChart.update('active');
}

// ── Update Skin Type Chart with Real API Data ─────────────────
function updateSkinChart(data) {
  if (!_skinChart || !data || !Array.isArray(data.labels) || data.labels.length === 0) return;
  _skinChart.data.labels = data.labels;
  _skinChart.data.datasets[0].data = data.counts;
  _skinChart.data.datasets[0].backgroundColor = data.labels.map((_, i) => `rgba(197,160,89,${Math.max(0.25, 0.85 - i * 0.15)})`);
  _skinChart.update('active');
}

// ── Update Monthly Forecast Chart ──────────────────────────────
// Actual: ข้อมูลจริงจาก GET /api/manager/reports/revenue?period=1Y
// Forecast: คำนวณฝั่ง frontend เอง (ไม่มีทางดึงจาก DB เพราะเป็นเดือนอนาคต)
// โดยใช้ growth rate เฉลี่ยแบบเดือนต่อเดือนจากข้อมูลจริง แล้ว project ต่อไปจนครบ 12 เดือน
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function _shortMonthLabel(ym) {
  const parts = String(ym).split('-');
  const idx = parseInt(parts[1], 10) - 1;
  return MONTH_NAMES[idx] || String(ym);
}

function updateForecastChart(rawLabels, actualRevenue) {
  if (!_forecastChart || !Array.isArray(rawLabels) || rawLabels.length === 0) return;

  const actualLabels = rawLabels.map(_shortMonthLabel);

  // Growth rate เฉลี่ยจากข้อมูลจริง (กันค่าสุดโต่งด้วยการ clamp -15% ถึง +25%)
  let avgGrowth = 0.06;
  const growthRates = [];
  for (let i = 1; i < actualRevenue.length; i++) {
    if (actualRevenue[i - 1] > 0) {
      growthRates.push((actualRevenue[i] - actualRevenue[i - 1]) / actualRevenue[i - 1]);
    }
  }
  if (growthRates.length > 0) {
    avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    avgGrowth = Math.max(-0.15, Math.min(0.25, avgGrowth));
  }

  const forecastMonthsCount = Math.max(0, 12 - actualLabels.length);
  const lastRaw = String(rawLabels[rawLabels.length - 1]);
  let [lastYear, lastMonth] = lastRaw.split('-').map(Number);
  lastYear = lastYear || new Date().getFullYear();
  lastMonth = lastMonth || (new Date().getMonth() + 1);

  const forecastLabels = [];
  const forecastValues = [];
  let lastValue = actualRevenue[actualRevenue.length - 1] || 0;

  for (let i = 0; i < forecastMonthsCount; i++) {
    lastMonth += 1;
    if (lastMonth > 12) { lastMonth = 1; lastYear += 1; }
    lastValue = Math.round(lastValue * (1 + avgGrowth));
    forecastLabels.push(MONTH_NAMES[lastMonth - 1]);
    forecastValues.push(lastValue);
  }

  const allLabels     = [...actualLabels, ...forecastLabels];
  const actualSeries   = [...actualRevenue, ...new Array(forecastLabels.length).fill(null)];
  const bridgeValue    = actualRevenue.length ? actualRevenue[actualRevenue.length - 1] : null;
  const forecastSeries = [
    ...new Array(Math.max(0, actualLabels.length - 1)).fill(null),
    bridgeValue,
    ...forecastValues,
  ];

  _forecastChart.data.labels = allLabels;
  _forecastChart.data.datasets[0].data = actualSeries;
  _forecastChart.data.datasets[1].data = forecastSeries;
  _forecastChart.update('active');
}

// ── Load Dashboard from API (with fallback) ───────────────────
async function loadDashboardFromAPI() {
  if (!window.GlowtimeAdminAPI) {
    _loadFallbackData();
    return;
  }

  // เรียก API พร้อมกัน (เฉพาะ manager endpoints)
  const [salesData, stockData, categoryData, skinData, revenue1YData] = await Promise.allSettled([
    window.GlowtimeAdminAPI.Reports.getSales(),
    window.GlowtimeAdminAPI.Reports.getStock(),
    window.GlowtimeAdminAPI.Reports.getCategorySales(),
    window.GlowtimeAdminAPI.Reports.getSkinTypes(),
    window.GlowtimeAdminAPI.RevenueChart ? window.GlowtimeAdminAPI.RevenueChart.get('1Y') : Promise.resolve(null),
  ]);

  // ── Category Chart (โดนัทชาร์ต) — ก่อนหน้านี้เป็น mock data ล้วน ─
  const categoryReport = categoryData.status === 'fulfilled' ? categoryData.value : null;
  if (categoryReport) updateCategoryChart(categoryReport);

  // ── Skin Type Chart (บาร์ชาร์ต) — ก่อนหน้านี้เป็น mock data ล้วน ─
  const skinReport = skinData.status === 'fulfilled' ? skinData.value : null;
  if (skinReport) updateSkinChart(skinReport);

  // ── Monthly Forecast Chart — Actual จาก API จริง, Forecast คำนวณฝั่ง frontend ─
  const revenue1Y = revenue1YData.status === 'fulfilled' ? revenue1YData.value : null;
  if (revenue1Y && Array.isArray(revenue1Y.labels) && revenue1Y.labels.length > 0) {
    updateForecastChart(revenue1Y.labels, revenue1Y.revenue);
  }

  // ── Sales Report ─────────────────────────────────────
  const sales = salesData.status === 'fulfilled' ? salesData.value : null;
  if (sales) {
    const revEl     = document.getElementById('statTotalRevenue');
    const ordEl     = document.getElementById('statTotalOrders');
    const revMetaEl = document.getElementById('statTotalRevenueMeta');
    const ordMetaEl = document.getElementById('statTotalOrdersMeta');

    if (revEl) animateCounter(revEl, Number(sales.totalRevenue || 0), '฿');
    if (ordEl) animateCounter(ordEl, Number(sales.totalOrders || 0));
    if (revMetaEl) revMetaEl.textContent = '-'; //`Delivered: ${sales.deliveredCount || 0} | Shipping: ${sales.shippingCount || 0}`;
    if (ordMetaEl) ordMetaEl.textContent = '-'; //`Confirmed: ${sales.confirmedCount || 0}`;

    // Top Products from API
    if (Array.isArray(sales.topProducts) && sales.topProducts.length > 0) {
      renderTopProducts(sales.topProducts);
    } else {
      renderTopProducts(MOCK_TOP_PRODUCTS);
    }
  } else {
    // Fallback counters from mock
    const d = CHART_DATA['7D'];
    const revEl = document.getElementById('statTotalRevenue');
    const ordEl = document.getElementById('statTotalOrders');
    if (revEl) animateCounter(revEl, d.totalRevenue, '฿');
    if (ordEl) animateCounter(ordEl, d.totalOrders);
    const revMetaEl = document.getElementById('statTotalRevenueMeta');
    if (revMetaEl) revMetaEl.textContent = d.statChange;
    renderTopProducts(MOCK_TOP_PRODUCTS);
  }

  // ── Stock Report ──────────────────────────────────────
  const stock = stockData.status === 'fulfilled' ? stockData.value : null;
  if (stock) {
    const lowStockEl  = document.getElementById('statLowStock');
    const lowMetaEl   = document.getElementById('statLowStockMeta');

    if (lowStockEl) animateCounter(lowStockEl, Number(stock.lowStockProducts || 0), '', ' Products');
    if (lowMetaEl) lowMetaEl.textContent = `Out of stock: ${stock.outOfStock || 0} items`;

    // แสดงสต็อกสินค้า "ทุกรายการ" เรียงจากน้อยไปมาก (backend ORDER BY stock_qty ASC ให้แล้ว)
    const allStockItems = stock.products || [];
    renderLowStockList(allStockItems.length > 0 ? allStockItems : MOCK_LOW_STOCK);
  } else {
    const lowStockEl = document.getElementById('statLowStock');
    const lowMetaEl  = document.getElementById('statLowStockMeta');
    if (lowStockEl) animateCounter(lowStockEl, MOCK_LOW_STOCK.length, '', ' Products');
    if (lowMetaEl) lowMetaEl.textContent = 'Reorder replenishment needed';
    renderLowStockList(MOCK_LOW_STOCK);
  }

  // ── Recent Orders ───────────────────────────────────────────
  // Manager ไม่มีสิทธิ์เรียก /api/staff/orders → ใช้ recentOrders จาก getSales() แทน
  if (sales && Array.isArray(sales.recentOrders) && sales.recentOrders.length > 0) {
    renderRecentOrders(sales.recentOrders);
  } else {
    renderRecentOrders(MOCK_RECENT_ORDERS);
  }

  // ── Revenue Chart (initial 7D load) ────────────────────────
  if (window.GlowtimeAdminAPI?.RevenueChart) {
    try {
      const chartData = await window.GlowtimeAdminAPI.RevenueChart.get('7D');
      if (chartData && Array.isArray(chartData.labels) && chartData.labels.length > 0 && _revenueChart) {
        _revenueChart.data.labels = chartData.labels;
        _revenueChart.data.datasets[0].data = chartData.revenue;
        _revenueChart.data.datasets[1].data = chartData.orders;
        _revenueChart.update('active');
      }
    } catch { /* use chart.js initialized data */ }
  }

  // ── Customers count ───────────────────────────────────
  const custEl     = document.getElementById('statTotalCustomers');
  const custMetaEl = document.getElementById('statTotalCustomersMeta');
  try {
    const usersData = await window.GlowtimeAdminAPI.Users.list({ role: 'customer' });
    const count = Array.isArray(usersData) ? usersData.length : (usersData?.total || 1102);
    if (custEl) animateCounter(custEl, count);
    if (custMetaEl) custMetaEl.textContent = `-`;
  } catch {
    if (custEl) animateCounter(custEl, 1102);
    if (custMetaEl) custMetaEl.textContent = '▲ +18 members this week';
  }
}

function _loadFallbackData() {
  const d = CHART_DATA['7D'];
  animateCounter(document.getElementById('statTotalRevenue'), d.totalRevenue, '฿');
  animateCounter(document.getElementById('statTotalOrders'),  d.totalOrders);
  animateCounter(document.getElementById('statTotalCustomers'), 1102);
  animateCounter(document.getElementById('statLowStock'), MOCK_LOW_STOCK.length, '', ' Products');

  const revMetaEl  = document.getElementById('statTotalRevenueMeta');
  const ordMetaEl  = document.getElementById('statTotalOrdersMeta');
  const custMetaEl = document.getElementById('statTotalCustomersMeta');
  const lowMetaEl  = document.getElementById('statLowStockMeta');

  if (revMetaEl)  revMetaEl.textContent  = d.statChange;
  if (ordMetaEl)  ordMetaEl.textContent  = '▲ +42 orders today';
  if (custMetaEl) custMetaEl.textContent = '▲ +18 members this week';
  if (lowMetaEl)  lowMetaEl.textContent  = 'Reorder replenishment needed';

  renderTopProducts(MOCK_TOP_PRODUCTS);
  renderRecentOrders(MOCK_RECENT_ORDERS);
  renderLowStockList(MOCK_LOW_STOCK);
}

// ── DOM Load Trigger ────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!applyRoleGate(['manager'])) return; // ← เช็คสิทธิ์ก่อน
    initDashboardCharts();
    loadDashboardFromAPI();
  });
} else {
  if (applyRoleGate(['manager'])) { // ← เช็คสิทธิ์ก่อน
    initDashboardCharts();
    loadDashboardFromAPI();
  }

  });
  _downloadCSV(rows, `glowtime-revenue-${_currentPeriod}-${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('📊 Revenue data exported as CSV');
}

function exportProductsCSV() {
  if (!_cachedTopProducts.length) { showToast('No product data to export'); return; }
  const rows = [['Rank', 'Product Name', 'Category', 'Price (฿)', 'Units Sold', 'Revenue (฿)']];
  _cachedTopProducts.forEach((p, i) => {
    rows.push([i + 1, p.productName || p.name, p.category, p.price || 0, p.totalQty || 0, p.totalRevenue || 0]);
  });
  _downloadCSV(rows, `glowtime-top-products-${new Date().toISOString().slice(0, 10)}.csv`);
  showToast('📦 Top products exported as CSV');
}

function _downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Load Dashboard from API (with fallback) ───────────────────
async function loadDashboardFromAPI() {
  if (!window.GlowtimeAdminAPI) {
    _loadFallbackData();
    return;
  }

  // Run all requests in parallel
  const [salesData, stockData, ordersData] = await Promise.allSettled([
    window.GlowtimeAdminAPI.Reports.getSales(),
    window.GlowtimeAdminAPI.Reports.getStock(),
    window.GlowtimeAdminAPI.Orders.list(),
  ]);

  // ── Sales Report ─────────────────────────────────────
  const sales = salesData.status === 'fulfilled' ? salesData.value : null;
  if (sales) {
    const revEl     = document.getElementById('statTotalRevenue');
    const ordEl     = document.getElementById('statTotalOrders');
    const revMetaEl = document.getElementById('statTotalRevenueMeta');
    const ordMetaEl = document.getElementById('statTotalOrdersMeta');

    if (revEl) animateCounter(revEl, Number(sales.totalRevenue || 0), '฿');
    if (ordEl) animateCounter(ordEl, Number(sales.totalOrders || 0));
    if (revMetaEl) revMetaEl.textContent = `Delivered: ${sales.deliveredCount || 0} | Shipping: ${sales.shippingCount || 0}`;
    if (ordMetaEl) ordMetaEl.textContent = `Confirmed: ${sales.confirmedCount || 0}`;

    // Top Products from API
    if (Array.isArray(sales.topProducts) && sales.topProducts.length > 0) {
      renderTopProducts(sales.topProducts);
    } else {
      renderTopProducts(MOCK_TOP_PRODUCTS);
    }
  } else {
    // Fallback counters from mock
    const d = CHART_DATA['7D'];
    const revEl = document.getElementById('statTotalRevenue');
    const ordEl = document.getElementById('statTotalOrders');
    if (revEl) animateCounter(revEl, d.totalRevenue, '฿');
    if (ordEl) animateCounter(ordEl, d.totalOrders);
    const revMetaEl = document.getElementById('statTotalRevenueMeta');
    if (revMetaEl) revMetaEl.textContent = d.statChange;
    renderTopProducts(MOCK_TOP_PRODUCTS);
  }

  // ── Stock Report ──────────────────────────────────────
  const stock = stockData.status === 'fulfilled' ? stockData.value : null;
  if (stock) {
    const lowStockEl  = document.getElementById('statLowStock');
    const lowMetaEl   = document.getElementById('statLowStockMeta');

    if (lowStockEl) animateCounter(lowStockEl, Number(stock.lowStockProducts || 0), '', ' Products');
    if (lowMetaEl) lowMetaEl.textContent = `Out of stock: ${stock.outOfStock || 0} items`;

    const lowItems = (stock.products || []).filter(p => p.status === 'low' || p.status === 'out');
    renderLowStockList(lowItems.length > 0 ? lowItems : MOCK_LOW_STOCK);
  } else {
    const lowStockEl = document.getElementById('statLowStock');
    const lowMetaEl  = document.getElementById('statLowStockMeta');
    if (lowStockEl) animateCounter(lowStockEl, MOCK_LOW_STOCK.length, '', ' Products');
    if (lowMetaEl) lowMetaEl.textContent = 'Reorder replenishment needed';
    renderLowStockList(MOCK_LOW_STOCK);
  }

  // ── Recent Orders ─────────────────────────────────────
  const orders = ordersData.status === 'fulfilled' ? ordersData.value : null;
  if (Array.isArray(orders) && orders.length > 0) {
    renderRecentOrders(orders);
  } else {
    renderRecentOrders(MOCK_RECENT_ORDERS);
  }

  // ── Customers (mock fallback — no endpoint yet) ───────
  const custEl     = document.getElementById('statTotalCustomers');
  const custMetaEl = document.getElementById('statTotalCustomersMeta');
  if (custEl) animateCounter(custEl, 1102);
  if (custMetaEl) custMetaEl.textContent = '▲ +18 members this week';
}

function _loadFallbackData() {
  const d = CHART_DATA['7D'];
  animateCounter(document.getElementById('statTotalRevenue'), d.totalRevenue, '฿');
  animateCounter(document.getElementById('statTotalOrders'),  d.totalOrders);
  animateCounter(document.getElementById('statTotalCustomers'), 1102);
  animateCounter(document.getElementById('statLowStock'), MOCK_LOW_STOCK.length, '', ' Products');

  const revMetaEl  = document.getElementById('statTotalRevenueMeta');
  const ordMetaEl  = document.getElementById('statTotalOrdersMeta');
  const custMetaEl = document.getElementById('statTotalCustomersMeta');
  const lowMetaEl  = document.getElementById('statLowStockMeta');

  if (revMetaEl)  revMetaEl.textContent  = d.statChange;
  if (ordMetaEl)  ordMetaEl.textContent  = '▲ +42 orders today';
  if (custMetaEl) custMetaEl.textContent = '▲ +18 members this week';
  if (lowMetaEl)  lowMetaEl.textContent  = 'Reorder replenishment needed';

  renderTopProducts(MOCK_TOP_PRODUCTS);
  renderRecentOrders(MOCK_RECENT_ORDERS);
  renderLowStockList(MOCK_LOW_STOCK);
}

// ── DOM Load Trigger ──────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDashboardCharts();
    loadDashboardFromAPI();
  });
} else {
  initDashboardCharts();
  loadDashboardFromAPI();

}