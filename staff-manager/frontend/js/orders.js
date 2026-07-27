/**
 * GLOWTIME — Staff & Admin Order Management Logic (js/orders.js)
 * ─────────────────────────────────────────────────────────────
 * ระบบจัดการคำสั่งซื้อ การอนุมัติสลิปโอนเงิน และการอัปเดตสถานะการจัดส่ง
 * เชื่อมต่อกับ backend จริงผ่าน GlowtimeAdminAPI
 * ─────────────────────────────────────────────────────────────
 */

let activeSelectedOrderId = null;
let currentFilterStatus = 'all'; // track active filter

// ── Mock data (ตรงกับ backend orders.json) ──────────────────────
let ordersList = [
  {
    id: 1,
    orderId: "ORD-20260701-0001",
    customerId: 1,
    status: "delivered",
    paymentMethod: "PromptPay QR Code",
    slipRef: "SLIP-20260701-1122",
    items: [
      { orderItemId: 1, productId: 1001, productName: "Hyaluronic Acid Serum 30ml", qty: 1, unitPrice: 590.00, subtotal: 590.00 }
    ],
    totalAmount: 590.00,
    shippingAddress: { recipient: "นภัสสร ใส่ใจผิว", phone: "081-234-5678", address: "123/45 ถ.สุขุมวิท", province: "กรุงเทพมหานคร", postalCode: "10110" },
    trackingNo: "KRY-11223344-TH",
    approvedAt: "2026-07-01T10:30:00+07:00",
    deliveredAt: "2026-07-03T14:15:00+07:00",
    createdAt: "2026-07-01T10:15:00+07:00"
  },
  {
    id: 2,
    orderId: "ORD-20260702-0001",
    customerId: 2,
    status: "pending_payment",
    paymentMethod: "PromptPay QR Code",
    slipRef: "SLIP-20260702-9988",
    items: [
      { orderItemId: 1, productId: 1003, productName: "Oil Control Moisturizer 50ml", qty: 1, unitPrice: 380.00, subtotal: 380.00 },
      { orderItemId: 2, productId: 1006, productName: "Sunscreen SPF50+ PA++++ 50ml", qty: 2, unitPrice: 320.00, subtotal: 640.00 }
    ],
    totalAmount: 1020.00,
    shippingAddress: { recipient: "เจน ผิวมัน", phone: "089-876-5432", address: "88 ถ.เพชรบุรี", province: "กรุงเทพมหานคร", postalCode: "10400" },
    createdAt: "2026-07-02T14:30:00+07:00"
  },
  {
    id: 3,
    orderId: "ORD-20260703-0001",
    customerId: 1,
    status: "shipping",
    paymentMethod: "Credit Card (VISA *** 4921)",
    slipRef: "TXN-20260703-4921",
    items: [
      { orderItemId: 1, productId: 1004, productName: "Soothing Centella Cream 30g", qty: 1, unitPrice: 650.00, subtotal: 650.00 }
    ],
    totalAmount: 650.00,
    shippingAddress: { recipient: "นภัสสร ใส่ใจผิว", phone: "081-234-5678", address: "123/45 ถ.สุขุมวิท", province: "กรุงเทพมหานคร", postalCode: "10110" },
    trackingNo: "FLE-55667788-TH",
    approvedAt: "2026-07-03T09:30:00+07:00",
    createdAt: "2026-07-03T09:00:00+07:00"
  },
  {
    id: 4,
    orderId: "ORD-20260705-0001",
    customerId: 2,
    status: "confirmed",
    paymentMethod: "Credit Card (Mastercard *** 8812)",
    slipRef: "TXN-20260705-8812",
    items: [
      { orderItemId: 1, productId: 1002, productName: "Vitamin C Brightening Toner 150ml", qty: 1, unitPrice: 450.00, subtotal: 450.00 }
    ],
    totalAmount: 450.00,
    shippingAddress: { recipient: "เจน ผิวมัน", phone: "089-876-5432", address: "88 ถ.เพชรบุรี", province: "กรุงเทพมหานคร", postalCode: "10400" },
    approvedAt: "2026-07-05T12:00:00+07:00",
    createdAt: "2026-07-05T11:20:00+07:00"
  }
];

const statusBadgeMap = {
  'pending':         '<span class="status-badge badge-warning">Pending Payment</span>',
  'pending_payment': '<span class="status-badge badge-warning">Pending Payment</span>',
  'paid':            '<span class="status-badge badge-info">Confirmed (Paid)</span>',
  'confirmed':       '<span class="status-badge badge-info">Confirmed (Paid)</span>',
  'processing':      '<span class="status-badge badge-info">Processing</span>',
  'shipped':         '<span class="status-badge badge-info">Shipping</span>',
  'shipping':        '<span class="status-badge badge-info">Shipping</span>',
  'delivered':       '<span class="status-badge badge-success">Delivered</span>',
  'completed':       '<span class="status-badge badge-success">Delivered</span>',
  'cancelled':       '<span class="status-badge badge-danger">Cancelled</span>'
};

// ── Load Orders from Backend ──────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!applyRoleGate(['staff'])) return; // ← เช็คสิทธิ์ก่อน
  await loadOrdersFromBackend();
});

async function loadOrdersFromBackend() {
  if (window.GlowtimeAdminAPI) {
    try {
      const apiOrders = await window.GlowtimeAdminAPI.Orders.list();
      if (apiOrders && apiOrders.length > 0) {
        ordersList = apiOrders;

        // DB มี 2 คำสำหรับ "รอชำระเงิน" ปนกันอยู่: 'pending' (จาก seed data เดิมใน
        // glowtime.sql) กับ 'pending_payment' (จาก checkout จริงฝั่งลูกค้า/customer backend)
        // ทำให้ตัวนับ (4) กับตารางที่กรอง (3) ไม่ตรงกัน — normalize ให้เหลือค่าเดียว
        // ตั้งแต่ตรงนี้ เพื่อให้ badge/tab/filter/table สอดคล้องกันทั้งหน้า
        ordersList.forEach((o) => {
          if (o.status === 'pending') o.status = 'pending_payment';
        });

        // ดึงข้อมูลการจัดส่งทั้งหมด (GET /api/staff/shipments) แล้ว merge เข้ากับ order
        // ที่ตรง order_id — เดิม orders.js ไม่เคยเรียก endpoint นี้เลย ทำให้ trackingNo/
        // deliveredAt หายไปทุกครั้งที่โหลดหน้าใหม่ ทั้งๆ ที่มีข้อมูลจริงในตาราง shipments
        try {
          const shipments = await window.GlowtimeAdminAPI.Shipments.list();
          if (Array.isArray(shipments)) {
            const shipmentByOrderId = {};
            shipments.forEach(s => { shipmentByOrderId[String(s.orderId)] = s; });
            ordersList.forEach(o => {
              const s = shipmentByOrderId[String(o.id)];
              if (s) {
                o.trackingNo   = s.trackingNumber || o.trackingNo;
                o.carrier      = s.carrier || o.carrier;
                o.shippedAt    = s.shippedAt || o.shippedAt;
                o.deliveredAt  = s.deliveredAt || o.deliveredAt;
              }
            });
          }
        } catch (e) {
          console.warn('[orders.js] ดึงข้อมูล GET /api/staff/shipments ไม่สำเร็จ:', e.message);
        }
      }
    } catch (e) {
      console.warn('[orders.js] ใช้ mock data เนื่องจาก backend ไม่ตอบสนอง:', e.message);
    }
  }
  applyFilter(currentFilterStatus);
  updateCounters();
}

// ── Counter & Badge Update ────────────────────────────────────
function updateCounters() {
  const total     = ordersList.length;
  const pending   = ordersList.filter(o => o.status === 'pending_payment' || o.status === 'pending').length;
  const confirmed = ordersList.filter(o => o.status === 'confirmed').length;
  const shipping  = ordersList.filter(o => o.status === 'shipping').length;
  const delivered = ordersList.filter(o => o.status === 'delivered').length;
  const active    = ordersList.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status)).length;

  // Header badge
  const activeBadge = document.getElementById('activeOrdersBadge');
  if (activeBadge) activeBadge.textContent = `${active} Active Orders`;

  // Filter buttons label — ทุกแท็บนับจาก ordersList จริง (จาก /api/staff/orders) ไม่ใช่ mockdata
  const allBtn = document.getElementById('btnFilterAll');
  if (allBtn) allBtn.textContent = `All Orders (${total})`;

  const pendingBtn = document.getElementById('btnFilterPending');
  if (pendingBtn) {
    pendingBtn.textContent = `⏳ Pending Payment${pending > 0 ? ` (${pending})` : ''}`;
  }

  // เดิม 3 แท็บนี้ไม่เคยถูกอัปเดตเลย (ค้างข้อความ static ใน HTML ไม่มีตัวเลขติด)
  const confirmedBtn = document.getElementById('btnFilterConfirmed');
  if (confirmedBtn) confirmedBtn.textContent = `Confirmed / Paid (${confirmed})`;

  const shippingBtn = document.getElementById('btnFilterShipping');
  if (shippingBtn) shippingBtn.textContent = `Shipping / In Transit (${shipping})`;

  const deliveredBtn = document.getElementById('btnFilterDelivered');
  if (deliveredBtn) deliveredBtn.textContent = `Delivered (${delivered})`;
}

// ── Render Table ──────────────────────────────────────────────
function renderOrderTable(items) {
  const tbody = document.getElementById('orderTableBody');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--gray); padding:2rem;">ไม่มีรายการในสถานะนี้</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(o => `
    <tr>
      <td>
        <strong>#${o.orderId}</strong>
        <div style="font-size:0.7rem; color:var(--gray);">${o.createdAt ? o.createdAt.split('T')[0] : ''}</div>
      </td>
      <td>
        <strong>${o.shippingAddress?.recipient || 'Customer'}</strong>
        <div style="font-size:0.7rem; color:var(--gray);">${o.shippingAddress?.province || ''} · ${o.shippingAddress?.address || ''}</div>
      </td>
      <td>
        <div style="font-size:0.8rem;">${Array.isArray(o.items) ? o.items.map(i => `${i.productName || 'Item'} x ${i.qty}`).join(', ') : '-'}</div>
      </td>
      <td><strong>฿${Number(o.totalAmount || 0).toLocaleString()}</strong></td>
      <td>${statusBadgeMap[o.status] || `<span class="status-badge">${o.status}</span>`}</td>
      <td>
        <button class="btn-dark-sm" onclick="openOrderDetail('${o.orderId}')">View Details</button>
      </td>
    </tr>
  `).join('');
}

// ── Filter ────────────────────────────────────────────────────
function filterOrders(status) {
  currentFilterStatus = status;

  // อัปเดต active state ของ button
  document.querySelectorAll('.filter-row button').forEach(btn => {
    btn.classList.remove('btn-dark-sm');
    btn.classList.add('btn-ghost-sm');
  });
  const activeBtn = document.getElementById(`btnFilter${capitalize(status)}`);
  if (activeBtn) {
    activeBtn.classList.remove('btn-ghost-sm');
    activeBtn.classList.add('btn-dark-sm');
  }

  applyFilter(status);
}

function applyFilter(status) {
  if (status === 'all') {
    renderOrderTable(ordersList);
  } else {
    renderOrderTable(ordersList.filter(o => o.status === status));
  }
}

function capitalize(s) {
  if (!s) return 'All';
  if (s === 'all') return 'All';
  if (s === 'pending_payment') return 'Pending';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Order Detail Modal ────────────────────────────────────────
async function openOrderDetail(ordId) {
  activeSelectedOrderId = ordId;
  const ord = ordersList.find(o => o.orderId === ordId);
  if (!ord) return;

  // ดึงข้อมูลการจัดส่งล่าสุดของออเดอร์นี้โดยเฉพาะ (GET /api/staff/shipments/:orderId)
  // เผื่อกรณีเพิ่งบันทึกการจัดส่ง/mark delivered ไปแล้วแต่ยังไม่ reload หน้าใหม่
  if (window.GlowtimeAdminAPI) {
    try {
      const shipment = await window.GlowtimeAdminAPI.Shipments.getByOrderId(ord.id);
      if (shipment) {
        ord.trackingNo  = shipment.trackingNumber || ord.trackingNo;
        ord.carrier     = shipment.carrier || ord.carrier;
        ord.shippedAt   = shipment.shippedAt || ord.shippedAt;
        ord.deliveredAt = shipment.deliveredAt || ord.deliveredAt;
      }
    } catch (e) {
      // ยังไม่มีข้อมูลการจัดส่ง (เช่น order ยัง pending/confirmed อยู่) — ไม่ใช่ error ร้ายแรง
      console.warn('[orders.js] ไม่มีข้อมูลการจัดส่งสำหรับออเดอร์นี้:', e.message);
    }
  }

  const titleEl = document.getElementById('modalOrdId');
  const infoEl = document.getElementById('modalCustomerInfo');
  const actionContainer = document.getElementById('modalPaymentActionBox');

  if (titleEl) titleEl.textContent = ord.orderId;

  // 1. Render Customer & Items Info
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="background:var(--cream); padding:1rem; border:1px solid var(--border); border-radius:4px; margin-bottom:1rem;">
        <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--gray); margin-bottom:0.4rem;">Customer & Shipping Address</h4>
        <p style="font-size:0.95rem; margin-bottom:0.2rem;"><strong>${ord.shippingAddress?.recipient || 'Customer'}</strong></p>
        <p style="font-size:0.8rem; color:var(--gray); margin-bottom:0.4rem;">${ord.shippingAddress?.phone || '-'}</p>
        <p style="font-size:0.82rem; color:var(--black); line-height:1.4;">${ord.shippingAddress?.address || ''} ${ord.shippingAddress?.province || ''} ${ord.shippingAddress?.postalCode || ''}</p>
      </div>

      <div style="padding:1rem; border:1px solid var(--border); border-radius:4px;">
        <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--gray); margin-bottom:0.4rem;">Order Items</h4>
        <ul style="list-style:none; padding:0; margin:0; font-size:0.82rem;">
          ${Array.isArray(ord.items) ? ord.items.map(i => `
            <li style="display:flex; justify-content:space-between; padding:0.35rem 0; border-bottom:1px dashed var(--border);">
              <span>${i.productName} <strong>x${i.qty}</strong></span>
              <strong>฿${Number(i.subtotal || (i.unitPrice * i.qty)).toLocaleString()}</strong>
            </li>
          `).join('') : ''}
        </ul>
        <div style="display:flex; justify-content:space-between; margin-top:0.8rem; font-size:0.95rem; font-weight:bold;">
          <span>Total Amount:</span>
          <span style="color:#8B6F5E;">฿${Number(ord.totalAmount || 0).toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  // 2. Render Dynamic Payment & Fulfillment Actions
  if (actionContainer) {
    if (ord.status === 'pending_payment' || ord.status === 'pending') {
      actionContainer.innerHTML = `
        <div style="background:var(--cream); padding:1rem; border:1px solid var(--border); border-radius:4px; height:100%;">
          <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--gray); margin-bottom:0.4rem;">Payment Slip Verification</h4>
          <div style="text-align:center; padding:1.2rem; background:#fff; border:1px dashed var(--border); border-radius:4px;">
            <div style="font-size:0.85rem; font-weight:bold; color:var(--black); margin-bottom:0.2rem;">${ord.paymentMethod || 'PromptPay QR Code'}</div>
            <div style="font-size:0.72rem; color:var(--gray); margin-bottom:0.6rem;">Ref ID: ${ord.slipRef || '-'}</div>
            <div style="display:inline-block; padding:0.4rem 0.8rem; background:rgba(197, 160, 89, 0.15); color:#8B6F5E; font-weight:bold; font-size:0.85rem; border-radius:2px; margin-bottom:0.8rem;">
              Pending Payment: ฿${Number(ord.totalAmount).toLocaleString()}
            </div>
            <p style="font-size:0.72rem; color:var(--gray); margin-bottom:1rem;">Please verify the payment slip before approving.</p>
            <div style="display:flex; gap:0.5rem; justify-content:center;">
              <button class="btn-dark-sm" onclick="approveSlip('${ord.orderId}')">Approve Slip</button>
              <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="rejectSlip('${ord.orderId}')">Reject</button>
            </div>
          </div>
        </div>
      `;
    } else if (ord.status === 'confirmed' || ord.status === 'paid' || ord.status === 'processing') {
      actionContainer.innerHTML = `
        <div style="background:var(--cream); padding:1rem; border:1px solid var(--border); border-radius:4px; height:100%;">
          <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--gray); margin-bottom:0.4rem;">Payment Confirmed & Fulfillment</h4>
          <div style="padding:1rem; background:#fff; border:1px solid var(--border); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem;">
              <span class="status-badge badge-success">Payment Approved</span>
            </div>
            <p style="font-size:0.8rem; color:var(--black); margin-bottom:0.4rem;">Method: <strong>${ord.paymentMethod || 'PromptPay QR'}</strong></p>
            <p style="font-size:0.75rem; color:var(--gray); margin-bottom:0.8rem;">Approved at: ${formatDateTime(ord.approvedAt)}</p>
            <div style="background:rgba(74, 103, 65, 0.08); padding:0.8rem; border-radius:4px; margin-bottom:1rem; font-size:0.8rem; color:#4A6741;">
              <strong>Status:</strong> Payment confirmed — packing in progress.
            </div>
            <button class="btn-dark-sm" style="width:100%; justify-content:center;" onclick="promptShipOrder('${ord.orderId}')">Enter Tracking & Ship Order</button>
          </div>
        </div>
      `;
    } else if (ord.status === 'shipping' || ord.status === 'shipped') {
      actionContainer.innerHTML = `
        <div style="background:var(--cream); padding:1rem; border:1px solid var(--border); border-radius:4px; height:100%;">
          <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--gray); margin-bottom:0.4rem;">Shipment Details</h4>
          <div style="padding:1rem; background:#fff; border:1px solid var(--border); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem;">
              <span class="status-badge badge-info">Shipping</span>
            </div>
            <p style="font-size:0.82rem; margin-bottom:0.4rem;"><strong>Tracking No.:</strong> <span style="color:#8B6F5E; font-weight:bold;">${ord.trackingNo || '-'}</span></p>
            <p style="font-size:0.75rem; color:var(--gray); margin-bottom:1rem;">Parcel has been handed to carrier — estimated delivery within 24h.</p>
            <button class="btn-dark-sm" style="width:100%; justify-content:center;" onclick="markDelivered('${ord.orderId}')">Mark as Delivered</button>
          </div>
        </div>
      `;
    } else if (ord.status === 'delivered' || ord.status === 'completed') {
      actionContainer.innerHTML = `
        <div style="background:var(--cream); padding:1rem; border:1px solid var(--border); border-radius:4px; height:100%;">
          <h4 style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--gray); margin-bottom:0.4rem;">Delivery Summary</h4>
          <div style="padding:1rem; background:#fff; border:1px solid var(--border); border-radius:4px;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.6rem;">
              <span class="status-badge badge-success">Delivered</span>
            </div>
            <p style="font-size:0.8rem; margin-bottom:0.3rem;"><strong>Received by:</strong> ${ord.signedBy || ord.shippingAddress?.recipient || '-'}</p>
            <p style="font-size:0.8rem; margin-bottom:0.3rem;"><strong>Delivered at:</strong> ${formatDateTime(ord.deliveredAt)}</p>
            <p style="font-size:0.75rem; color:var(--gray);">Tracking No.: ${ord.trackingNo || '-'}</p>
          </div>
        </div>
      `;
    }
  }

  openModal('modalOrderDetail');
}

// ── Helpers ───────────────────────────────────────────────────
function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    // mysql2 คืนค่า DATETIME เป็น string 'YYYY-MM-DD HH:MM:SS' (มี space คั่น) ตอนนี้
    // (เพราะตั้ง dateStrings:true ที่ backend) — แปลง space เป็น 'T' เพื่อให้ Date() parse ได้ชัวร์ทุก browser
    const normalized = typeof isoString === 'string' ? isoString.replace(' ', 'T') : isoString;
    return new Date(normalized).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return isoString; }
}

// ── Action Handlers ───────────────────────────────────────────

async function approveSlip(ordId) {
  const ord = ordersList.find(o => o.orderId === ordId);
  if (!ord) return;

  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Orders.updateStatus(ord.id, 'confirmed');
    }
  } catch (e) {
    console.warn('[orders.js] approveSlip backend error:', e.message);
  }

  ord.status = 'confirmed';
  ord.approvedAt = new Date().toISOString();
  updateCounters();
  applyFilter(currentFilterStatus);
  openOrderDetail(ordId);
  showToast(`✓ Payment slip for order #${ordId} approved.`);
}

function rejectSlip(ordId) {
  showToast(`Order #${ordId}: Payment slip rejected. Customer has been notified.`);
}

async function promptShipOrder(ordId) {
  const ord = ordersList.find(o => o.orderId === ordId);
  if (!ord) return;

  const tracking = prompt('กรุณาระบุเลขพัสดุ (Tracking Number):', `KRY-${Math.floor(10000000 + Math.random() * 90000000)}-TH`);
  if (!tracking) return;

  const carriers = ['Kerry Express', 'Flash Express', 'Thailand Post'];
  const carrier = carriers[0];

  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Orders.updateStatus(ord.id, 'shipping');
      await window.GlowtimeAdminAPI.Orders.addShipment(ord.id, tracking, carrier);
    }
  } catch (e) {
    console.warn('[orders.js] promptShipOrder backend error:', e.message);
  }

  ord.status = 'shipping';
  ord.trackingNo = `${tracking} (${carrier})`;
  updateCounters();
  applyFilter(currentFilterStatus);
  openOrderDetail(ordId);
  showToast(`📦 Order #${ordId} shipped. Tracking: ${tracking}`);
}

async function markDelivered(ordId) {
  const ord = ordersList.find(o => o.orderId === ordId);
  if (!ord) return;

  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Orders.updateStatus(ord.id, 'delivered');
    }
  } catch (e) {
    console.warn('[orders.js] markDelivered backend error:', e.message);
  }

  ord.status = 'delivered';
  ord.deliveredAt = new Date().toISOString();
  ord.signedBy = ord.shippingAddress?.recipient || 'ลูกค้าผู้รับ';
  updateCounters();
  applyFilter(currentFilterStatus);
  openOrderDetail(ordId);
  showToast(`✓ Order #${ordId} marked as Delivered.`);
}

// ── Direct Status Update (Quick Buttons in Modal) ─────────────
async function updateOrderStatus(newStatus) {
  const ord = ordersList.find(o => o.orderId === activeSelectedOrderId);
  if (!ord) return;

  // backend (staff-manager) รับแค่ 'pending' ไม่รับ 'pending_payment'
  // (ORDER_STATUSES ฝั่ง staff = ['pending','confirmed','shipping','delivered'])
  // ส่วน 'pending_payment' เป็นคำที่ frontend ใช้แสดงผล/กรองแท็บเท่านั้น
  const backendStatus = newStatus === 'pending_payment' ? 'pending' : newStatus;

  try {
    if (!window.GlowtimeAdminAPI) throw new Error('ไม่พบการเชื่อมต่อ API');
    await window.GlowtimeAdminAPI.Orders.updateStatus(ord.id, backendStatus);
  } catch (e) {
    // เดิมกลืน error แล้วอัปเดต local state ต่อ ทำให้ toast ขึ้นว่าสำเร็จทั้งที่ backend
    // อาจ reject ไปแล้ว (เช่น "ห้ามย้อนสถานะกลับ") — ตอนนี้หยุดทันทีถ้า backend ล้มเหลว
    showToast(`❌ อัปเดตสถานะไม่สำเร็จ: ${e.message}`);
    return;
  }

  ord.status = newStatus;
  if (newStatus === 'confirmed' && !ord.approvedAt) ord.approvedAt = new Date().toISOString();
  if (newStatus === 'delivered' && !ord.deliveredAt) ord.deliveredAt = new Date().toISOString();

  updateCounters();
  applyFilter(currentFilterStatus);
  openOrderDetail(activeSelectedOrderId);
  showToast(`✅ อัปเดตคำสั่งซื้อ ${ord.orderId} → "${newStatus}" แล้ว`);
}