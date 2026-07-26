/**
 * GLOWTIME — Categories Management (js/categories.js)
 * ─────────────────────────────────────────────────────
 * CRUD หมวดหมู่สินค้า + นับจำนวน products ต่อหมวด
 * API-first, fallback mock data
 */

const MOCK_CATEGORIES = [
  { id: 1, name: 'Serum',       icon: '💧', productCount: 3, description: 'Concentrated active treatments', status: 'Active',  color: '#2A4B7C' },
  { id: 2, name: 'Moisturizer', icon: '🧴', productCount: 2, description: 'Hydrating creams and lotions',   status: 'Active',  color: '#4A6741' },
  { id: 3, name: 'Sunscreen',   icon: '☀️', productCount: 1, description: 'UV protection formulas',         status: 'Active',  color: '#C5A059' },
  { id: 4, name: 'Cleanser',    icon: '🫧', productCount: 1, description: 'Gentle face wash & cleansers',   status: 'Active',  color: '#8B6F5E' },
  { id: 5, name: 'Oil',         icon: '✨', productCount: 1, description: 'Facial oils & elixirs',          status: 'Active',  color: '#C5A059' },
  { id: 6, name: 'Mask',        icon: '🌿', productCount: 1, description: 'Clay, sheet & sleep masks',      status: 'Active',  color: '#4A6741' },
  { id: 7, name: 'Mist',        icon: '💦', productCount: 1, description: 'Hydrating facial mists',        status: 'Active',  color: '#2A4B7C' },
  { id: 8, name: 'Toner',       icon: '🍃', productCount: 0, description: 'Balancing toners & essences',   status: 'Hidden',  color: '#777777' },
];

let categoriesList = [...MOCK_CATEGORIES];

// ── Load on DOM Ready ─────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (!applyRoleGate(['manager'])) return; // ← เช็คสิทธิ์ก่อน
  // Try fetching categories from backend
  if (window.GlowtimeAdminAPI) {
    try {
      const apiProducts = await window.GlowtimeAdminAPI.Products.list();
      if (apiProducts && apiProducts.length > 0) {
        // Build category counts from products
        const counts = {};
        apiProducts.forEach(p => {
          const cat = p.category || 'Other';
          counts[cat] = (counts[cat] || 0) + 1;
        });
        categoriesList.forEach(c => {
          if (counts[c.name] !== undefined) c.productCount = counts[c.name];
        });
      }
    } catch (e) {
      console.warn('[categories.js] Using mock data:', e.message);
    }
  }

  renderCategoryStats();
  renderCategoryTable();
  renderSearchHandler();
});

// ── Stat Summary Cards ────────────────────────────────
function renderCategoryStats() {
  const total   = categoriesList.length;
  const active  = categoriesList.filter(c => c.status === 'Active').length;
  const hidden  = categoriesList.filter(c => c.status === 'Hidden').length;
  const prods   = categoriesList.reduce((s, c) => s + c.productCount, 0);

  const statsEl = document.getElementById('categoryStats');
  if (!statsEl) return;
  statsEl.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total Categories</div>
      <div class="stat-value">${total}</div>
      <div class="stat-meta">Across all product types</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active</div>
      <div class="stat-value" style="color:var(--status-success);">${active}</div>
      <div class="stat-meta">Visible to customers</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Hidden</div>
      <div class="stat-value" style="color:var(--gray);">${hidden}</div>
      <div class="stat-meta">Not shown in shop</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Products</div>
      <div class="stat-value">${prods}</div>
      <div class="stat-meta">Assigned to categories</div>
    </div>
  `;
}

// ── Render Category Table ────────────────────────────
function renderCategoryTable(data = categoriesList) {
  const tbody = document.getElementById('categoryTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--gray);">
        No categories found. <a href="#" onclick="openAddCategoryModal(); return false;" style="color:var(--black);">Add one →</a>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(c => `
    <tr class="clickable-row">
      <td>
        <div style="display:flex; align-items:center; gap:0.8rem;">
          <div style="width:38px; height:38px; border-radius:8px; background:${c.color}18; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0;">
            ${c.icon || '📦'}
          </div>
          <div>
            <strong>${c.name}</strong>
            <div style="font-size:0.7rem; color:var(--gray); margin-top:1px;">${c.description || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <span style="font-weight:700;">${c.productCount}</span>
        <span style="color:var(--gray); font-size:0.75rem;"> products</span>
      </td>
      <td>
        <span class="status-badge ${c.status === 'Active' ? 'badge-success' : 'badge-danger'}">
          ${c.status}
        </span>
      </td>
      <td>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn-ghost-sm" onclick="editCategory(${c.id})">✏️ Edit</button>
          <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="deleteCategory(${c.id})">🗑 Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search Handler ────────────────────────────────────
function renderSearchHandler() {
  const searchInput = document.getElementById('categorySearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = categoriesList.filter(c =>
        c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
      );
      renderCategoryTable(filtered);
    });
  }
}

// ── Open Add Modal ────────────────────────────────────
function openAddCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Add New Category';
  document.getElementById('editCatId').value = '';
  document.getElementById('catName').value = '';
  document.getElementById('catIcon').value = '📦';
  document.getElementById('catDescription').value = '';
  document.getElementById('catStatus').value = 'Active';
  openModal('modalAddCategory');
}

// ── Edit Category ─────────────────────────────────────
function editCategory(id) {
  const cat = categoriesList.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('categoryModalTitle').textContent = `Edit: ${cat.name}`;
  document.getElementById('editCatId').value = id;
  document.getElementById('catName').value = cat.name;
  document.getElementById('catIcon').value = cat.icon || '📦';
  document.getElementById('catDescription').value = cat.description || '';
  document.getElementById('catStatus').value = cat.status;
  openModal('modalAddCategory');
}

// ── Save Category (Add / Edit) ────────────────────────
async function saveCategory(e) {
  e.preventDefault();
  const editId = document.getElementById('editCatId').value;
  const isEdit = !!editId;

  const catData = {
    id:          isEdit ? Number(editId) : Math.max(0, ...categoriesList.map(c => c.id)) + 1,
    name:        document.getElementById('catName').value.trim(),
    icon:        document.getElementById('catIcon').value.trim() || '📦',
    description: document.getElementById('catDescription').value.trim(),
    status:      document.getElementById('catStatus').value,
    productCount: isEdit ? (categoriesList.find(c => c.id === Number(editId))?.productCount || 0) : 0,
    color:       '#C5A059',
  };

  if (!catData.name) return;

  // Try API
  if (window.GlowtimeAdminAPI) {
    try {
      if (isEdit) {
        await window.GlowtimeAdminAPI.Categories.update(Number(editId), catData);
      } else {
        await window.GlowtimeAdminAPI.Categories.create(catData);
      }
    } catch (err) {
      console.warn('[categories.js] API save failed, updating local only');
    }
  }

  if (isEdit) {
    const idx = categoriesList.findIndex(c => c.id === Number(editId));
    if (idx !== -1) categoriesList[idx] = catData;
  } else {
    categoriesList.unshift(catData);
  }

  renderCategoryStats();
  renderCategoryTable();
  closeModal('modalAddCategory');
  showToast(`Category "${catData.name}" ${isEdit ? 'updated' : 'created'} ✅`);
}

// ── Toggle Status ─────────────────────────────────────
function toggleCategoryStatus(id) {
  const cat = categoriesList.find(c => c.id === id);
  if (!cat) return;
  cat.status = cat.status === 'Active' ? 'Hidden' : 'Active';
  renderCategoryTable();
  showToast(`"${cat.name}" is now ${cat.status}`);
}

// ── Delete Category ───────────────────────────────────
async function deleteCategory(id) {
  const cat = categoriesList.find(c => c.id === id);
  if (!cat) return;
  if (cat.productCount > 0) {
    showToast(`❌ Cannot delete — "${cat.name}" still has ${cat.productCount} products assigned`, 'error');
    return;
  }
  if (!confirm(`Delete category "${cat.name}"? This action cannot be undone.`)) return;

  // Try API
  if (window.GlowtimeAdminAPI) {
    try {
      await window.GlowtimeAdminAPI.Categories.delete(id);
    } catch (err) {
      console.warn('[categories.js] API delete failed, removing locally');
    }
  }

  categoriesList = categoriesList.filter(c => c.id !== id);
  renderCategoryStats();
  renderCategoryTable();
  showToast(`"${cat.name}" deleted`);
}
