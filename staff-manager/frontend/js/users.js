/**
 * GLOWTIME — Staff & Admin User Management (js/users.js)
 * ──────────────────────────────────────────────────────────
 * แสดงรายการผู้ใช้, กรอง, แก้ไข Role จริง (ไม่ใช่แค่ toast)
 */

let usersList = [
  { id: 1, username: 'napassorn_skin', email: 'napassorn@glowtime.com',  role: 'customer', skinType: 'sensitive',    phone: '081-234-5678', createdAt: '2026-07-01T10:00:00+07:00' },
  { id: 2, username: 'karn_staff',     email: 'karn@glowtime.com',       role: 'staff',    skinType: 'combination',  phone: '089-999-8888', createdAt: '2026-06-15T09:00:00+07:00' },
  { id: 3, username: 'warakorn_mgr',   email: 'warakorn@glowtime.com',   role: 'manager',  skinType: 'normal',       phone: '086-777-6666', createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 4, username: 'mintra_bronze',  email: 'mintra@glowtime.com',     role: 'customer', skinType: 'oily',         phone: '092-111-2233', createdAt: '2026-07-10T11:30:00+07:00' },
  { id: 5, username: 'staff_somchai',  email: 'somchai@glowtime.com',    role: 'staff',    skinType: 'dry',          phone: '085-444-5566', createdAt: '2026-06-01T08:00:00+07:00' },
];

let _currentEditUserId = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!applyRoleGate(['manager'])) return; // ← เช็คสิทธิ์ก่อน
  // Try API first
  if (window.GlowtimeAdminAPI) {
    try {
      const apiUsers = await window.GlowtimeAdminAPI.Users.list();
      if (apiUsers && apiUsers.length > 0) usersList = apiUsers;
    } catch (e) {
      console.warn('[users.js] Using mock data:', e.message);
    }
  }
  renderUserStats();
  renderUserTable(usersList);
  renderSearchHandler();
});

// ── Stat Cards ─────────────────────────────────────────────────
function renderUserStats() {
  const total    = usersList.length;
  const customer = usersList.filter(u => u.role === 'customer').length;
  const staff    = usersList.filter(u => u.role === 'staff').length;
  const manager  = usersList.filter(u => u.role === 'manager').length;

  const el = document.getElementById('userStats');
  if (!el) return;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Users</div>
      <div class="stat-value">${total}</div>
      <div class="stat-meta">All accounts</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Customers</div>
      <div class="stat-value" style="color:var(--status-info);">${customer}</div>
      <div class="stat-meta">Registered buyers</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Staff</div>
      <div class="stat-value" style="color:var(--status-success);">${staff}</div>
      <div class="stat-meta">Order & fulfillment</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Managers</div>
      <div class="stat-value" style="color:var(--status-danger);">${manager}</div>
      <div class="stat-meta">Full access</div>
    </div>
  `;
}

// ── Render Table ───────────────────────────────────────────────
function renderUserTable(items) {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gray);">No users found.</td></tr>`;
    return;
  }

  const ROLE_BADGE = {
    customer: 'badge-info',
    staff:    'badge-success',
    manager:  'badge-danger',
  };

  tbody.innerHTML = items.map(u => `
    <tr>
      <td><strong style="font-size:0.75rem;">#${u.id}</strong></td>
      <td>
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <div style="width:34px; height:34px; background:var(--black); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.78rem; flex-shrink:0;">
            ${u.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <strong style="font-size:0.82rem;">${u.username}</strong>
            <div style="font-size:0.7rem; color:var(--gray);">${u.email}</div>
          </div>
        </div>
      </td>
      <td><span class="status-badge badge-warning">${u.skinType || '—'}</span></td>
      <td style="font-size:0.78rem;">${u.phone || '—'}</td>
      <td><span class="status-badge ${ROLE_BADGE[u.role] || 'badge-info'}">${u.role}</span></td>
      <td style="font-size:0.72rem; color:var(--gray);">${u.createdAt ? u.createdAt.slice(0, 10) : '—'}</td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn-ghost-sm" onclick="openEditRoleModal(${u.id})">✏️ Edit Role</button>
          <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="deleteUser(${u.id})">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search + Role Filter ───────────────────────────────────────
function renderSearchHandler() {
  const searchInput = document.getElementById('userSearch');
  const roleFilter   = document.getElementById('userRoleFilter');

  if (searchInput) searchInput.addEventListener('input', applyUserFilter);
  if (roleFilter)  roleFilter.addEventListener('change', applyUserFilter);
}

function applyUserFilter() {
  const keyword = (document.getElementById('userSearch')?.value || '').trim().toLowerCase();
  const role    = document.getElementById('userRoleFilter')?.value || '';

  const filtered = usersList.filter(u => {
    const matchesRole = !role || u.role === role;
    const matchesKeyword = !keyword
      || (u.username || '').toLowerCase().includes(keyword)
      || (u.email || '').toLowerCase().includes(keyword);
    return matchesRole && matchesKeyword;
  });

  renderUserTable(filtered);
}

// ── Edit Role Modal ─────────────────────────────────────────────
async function openEditRoleModal(id) {
  let user = usersList.find(u => u.id === id);

  // ดึงข้อมูลล่าสุดของผู้ใช้คนนี้โดยเฉพาะ (GET /api/manager/users/:id) ก่อนเปิดฟอร์มแก้ไข
  if (window.GlowtimeAdminAPI) {
    try {
      const fresh = await window.GlowtimeAdminAPI.Users.getById(id);
      if (fresh) {
        user = fresh;
        const idx = usersList.findIndex(u => u.id === id);
        if (idx !== -1) usersList[idx] = fresh; else usersList.push(fresh);
      }
    } catch (e) {
      console.warn('[users.js] ดึงข้อมูลล่าสุดจาก GET /api/manager/users/:id ไม่สำเร็จ:', e.message);
    }
  }

  if (!user) {
    showToast('ไม่พบผู้ใช้นี้');
    return;
  }

  _currentEditUserId = id;

  document.getElementById('editRoleUsername').textContent = user.username || '';
  document.getElementById('editRoleEmail').textContent    = user.email || '';
  document.getElementById('editRoleCurrent').textContent  = user.role || '';
  document.getElementById('editRoleSelect').value         = user.role || 'customer';

  openModal('modalEditRole');
}

async function saveUserRole(e) {
  e.preventDefault();
  if (!_currentEditUserId) return;

  const newRole = document.getElementById('editRoleSelect').value;

  try {
    if (window.GlowtimeAdminAPI) {
      const updated = await window.GlowtimeAdminAPI.Users.update(_currentEditUserId, { role: newRole });
      const idx = usersList.findIndex(u => u.id === _currentEditUserId);
      if (updated && idx !== -1) usersList[idx] = updated;
      else if (idx !== -1) usersList[idx].role = newRole;
    }
    renderUserStats();
    applyUserFilter();
    closeModal('modalEditRole');
    showToast('อัปเดต Role สำเร็จ');
  } catch (err) {
    showToast('อัปเดต Role ไม่สำเร็จ: ' + err.message);
  }
}

// ── Delete User ─────────────────────────────────────────────────
async function deleteUser(id) {
  const user = usersList.find(u => u.id === id);
  if (!user) return;
  if (!confirm(`ยืนยันลบบัญชีผู้ใช้ "${user.username}" ?`)) return;

  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Users.delete(id);
    }
    usersList = usersList.filter(u => u.id !== id);
    renderUserStats();
    applyUserFilter();
    showToast('ลบบัญชีผู้ใช้สำเร็จ');
  } catch (err) {
    showToast('ลบบัญชีผู้ใช้ไม่สำเร็จ: ' + err.message);
  }
}