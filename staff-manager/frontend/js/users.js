/**
 * GLOWTIME — Staff & Admin User Management (js/users.js)
 * ──────────────────────────────────────────────────────────
 * แสดงรายการผู้ใช้, กรอง, แก้ไข Role จริง (ไม่ใช่แค่ toast)
 */

let usersList = [
  { id: 1, username: 'napassorn_skin', email: 'napassorn@glowtime.com',  role: 'customer', profile: { skinType: 'sensitive',    phone: '081-234-5678' }, createdAt: '2026-07-01T10:00:00+07:00' },
  { id: 2, username: 'karn_staff',     email: 'karn@glowtime.com',       role: 'staff',    profile: { skinType: 'combination',  phone: '089-999-8888' }, createdAt: '2026-06-15T09:00:00+07:00' },
  { id: 3, username: 'warakorn_mgr',   email: 'warakorn@glowtime.com',   role: 'manager',  profile: { skinType: 'normal',       phone: '086-777-6666' }, createdAt: '2026-05-01T08:00:00+07:00' },
  { id: 4, username: 'mintra_bronze',  email: 'mintra@glowtime.com',     role: 'customer', profile: { skinType: 'oily',         phone: '092-111-2233' }, createdAt: '2026-07-10T11:30:00+07:00' },
  { id: 5, username: 'staff_somchai',  email: 'somchai@glowtime.com',    role: 'staff',    profile: { skinType: 'dry',          phone: '085-444-5566' }, createdAt: '2026-06-01T08:00:00+07:00' },
];

let _currentEditUserId = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
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
      <td><span class="status-badge badge-warning">${u.profile?.skinType || '—'}</span></td>
      <td style="font-size:0.78rem;">${u.profile?.phone || '—'}</td>
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

// ── Search + Filter ────────────────────────────────────────────
function renderSearchHandler() {
  const searchEl = document.getElementById('userSearch');
  const roleEl   = document.getElementById('userRoleFilter');

  function applyFilters() {
    const q    = (searchEl?.value || '').toLowerCase();
    const role = roleEl?.value || '';
    let data   = [...usersList];
    if (q)    data = data.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    if (role) data = data.filter(u => u.role === role);
    renderUserTable(data);
  }

  searchEl?.addEventListener('input', applyFilters);
  roleEl?.addEventListener('change', applyFilters);
}

// ── Edit Role Modal (REAL logic) ───────────────────────────────
function openEditRoleModal(id) {
  const u = usersList.find(u => u.id === id);
  if (!u) return;
  _currentEditUserId = id;

  document.getElementById('editRoleUsername').textContent  = u.username;
  document.getElementById('editRoleEmail').textContent     = u.email;
  document.getElementById('editRoleSelect').value          = u.role;
  document.getElementById('editRoleCurrent').textContent   = u.role;

  openModal('modalEditRole');
}

async function saveUserRole(e) {
  e.preventDefault();
  const id      = _currentEditUserId;
  const newRole = document.getElementById('editRoleSelect').value;
  if (!id || !newRole) return;

  const user = usersList.find(u => u.id === id);
  if (!user) return;

  const oldRole = user.role;

  // Try API first
  if (window.GlowtimeAdminAPI) {
    try {
      await window.GlowtimeAdminAPI.Users.update(id, { role: newRole });
    } catch (e) {
      console.warn('[users.js] API update failed, updating local only:', e.message);
    }
  }

  // Update local state
  user.role = newRole;
  renderUserStats();
  renderUserTable(usersList);
  closeModal('modalEditRole');
  showToast(`✅ ${user.username} role changed: ${oldRole} → ${newRole}`);
}

// ── Delete User ────────────────────────────────────────────────
async function deleteUser(id) {
  const user = usersList.find(u => u.id === id);
  if (!user) return;
  if (!confirm(`Delete user "${user.username}"? This action cannot be undone.`)) return;

  if (window.GlowtimeAdminAPI) {
    try {
      await window.GlowtimeAdminAPI.Users.delete(id);
    } catch (e) {
      console.warn('[users.js] API delete failed, removing locally:', e.message);
    }
  }

  usersList = usersList.filter(u => u.id !== id);
  renderUserStats();
  renderUserTable(usersList);
  showToast(`User "${user.username}" deleted`);
}