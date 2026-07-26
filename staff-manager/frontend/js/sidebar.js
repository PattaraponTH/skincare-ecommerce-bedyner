/**
 * GLOWTIME — Dynamic Admin Sidebar Component (js/sidebar.js)
 * ─────────────────────────────────────────────────────────────
 * แสดงผล Sidebar พร้อมซ่อนเมนูที่ role ปัจจุบันไม่มีสิทธิ์เข้า
 * ─────────────────────────────────────────────────────────────
 */

function renderAdminSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  if (!sidebarEl) return;

  let currentPath = window.location.pathname.split('/').pop();
  if (!currentPath || currentPath === '') currentPath = 'index.html';

  // ── ดึง role ปัจจุบัน ─────────────────────────────────────
  const api  = window.GlowtimeAdminAPI;
  const role = api?.Auth?.currentUser?.()?.role ?? null;

  // ── Role Map: แต่ละหน้าอนุญาต role อะไร ──────────────────
  // ตรงกับ backend README.md (endpoint /api/staff/* หรือ /api/manager/*)
  const PAGE_ROLES = {
    'index.html':      ['manager'],
    'orders.html':     ['staff'],
    'customers.html':  ['manager'],
    'products.html':   ['manager'],
    'categories.html': ['manager'],
    'inventory.html':  ['staff'],
    'content.html':    ['manager'],
    'marketing.html':  ['manager'],
    'coupons.html':    ['manager'],
    'settings.html':   ['manager'],
    'users.html':      ['manager'],
  };

  // ── สร้างเมนู (ซ่อนเมนูที่ role ไม่มีสิทธิ์) ────────────
  const menuSections = [
    {
      title: "Core System",
      items: [
        { href: "index.html",     label: "Dashboard & Analytics" },
        { href: "orders.html",    label: "Orders & Payments", badge: "", badgeId: "ordersSidebarBadge" },
        { href: "customers.html", label: "Customers & Skin Profiles" }
      ]
    },
    {
      title: "Catalogue & Inventory",
      items: [
        { href: "products.html",   label: "Products" },
        { href: "categories.html", label: "Categories" },
        { href: "inventory.html",  label: "Inventory & Batches" }
      ]
    },
    {
      title: "Growth & Settings",
      items: [
        { href: "content.html",   label: "Reviews & Content" },
        { href: "marketing.html", label: "Promotions & Bundles" },
        { href: "coupons.html",   label: "Coupons & Discounts" },
        { href: "settings.html",  label: "System Settings" }
      ]
    }
  ];

  // ── Helper: เช็คว่า role ปัจจุบันเข้าหน้านี้ได้ไหม ────────
  function canAccess(href) {
    const allowed = PAGE_ROLES[href];
    if (!allowed) return true;         // ไม่ได้ล็อก role = เข้าได้ทุกคน
    if (!role)    return false;        // ยังไม่ login = ซ่อน
    return allowed.includes(role);
  }

  sidebarEl.innerHTML = `
    <div>
      <div class="sidebar-header">
        <a href="index.html" class="sidebar-logo">GLOWTIME</a>
        <p class="sidebar-tag">Staff Admin Suite</p>
      </div>
      
      <ul class="sidebar-nav">
        ${menuSections.map((section, idx) => {
          // ซ่อน section title ถ้าทุก item ใน section ซ่อนอยู่
          const visibleItems = section.items.filter(item => canAccess(item.href));
          if (visibleItems.length === 0) return '';

          return `
            <li class="nav-section-title" style="${idx > 0 ? 'margin-top:0.8rem;' : ''}">${section.title}</li>
            ${visibleItems.map(item => {
              const isActive = currentPath === item.href;
              return `
                <li>
                  <a href="${item.href}" class="nav-item ${isActive ? 'active' : ''}">
                    ${item.label}
                    ${item.badgeId ? `<span class="badge" id="${item.badgeId}" style="display:none;"></span>` : (item.badge ? `<span class="badge">${item.badge}</span>` : '')}
                  </a>
                </li>
              `;
            }).join('')}
          `;
        }).join('')}
      </ul>
    </div>
  `;
}

// ── Badge "Orders & Payments" ────────────────────────────────
// เดิมเป็นเลข "3" hardcode ไว้เฉยๆ ไม่เกี่ยวกับข้อมูลจริง —
// ตอนนี้ดึงจำนวนออเดอร์ที่ยังไม่ชำระเงินจริงจาก /api/staff/orders มาแทน
// หมายเหตุ: DB มี status ทั้ง 'pending' (seed เดิม) และ 'pending_payment'
// (จาก checkout ฝั่งลูกค้า) จึงนับทั้งสองแบบรวมกัน ให้ตรงกับหน้า orders.html
async function updateOrdersSidebarBadge() {
  const badgeEl = document.getElementById('ordersSidebarBadge');
  if (!badgeEl) return; // เมนูนี้ถูกซ่อนอยู่ (role ไม่ใช่ staff) หรือยังไม่ได้ render

  const api = window.GlowtimeAdminAPI;
  if (!api?.Orders?.list) return;

  try {
    const orders = await api.Orders.list();
    if (!Array.isArray(orders)) return;
    const pendingCount = orders.filter(
      (o) => o.status === 'pending' || o.status === 'pending_payment'
    ).length;

    if (pendingCount > 0) {
      badgeEl.textContent = String(pendingCount);
      badgeEl.style.display = '';
    } else {
      badgeEl.style.display = 'none';
    }
  } catch (e) {
    console.warn('[sidebar.js] โหลดจำนวน pending orders ไม่สำเร็จ:', e.message);
    // เงียบไว้ — ปล่อยให้ badge ซ่อนอยู่ ดีกว่าโชว์เลขเก่า/ผิด
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderAdminSidebar();
    updateOrdersSidebarBadge();
  });
} else {
  renderAdminSidebar();
  updateOrdersSidebarBadge();
}
