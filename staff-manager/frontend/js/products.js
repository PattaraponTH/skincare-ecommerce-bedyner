// ── State ──────────────────────────────────────────────────────
// หมายเหตุ: ไม่มี mock data ฮาร์ดโค้ดอีกต่อไป — ทั้ง productsList และ categoriesList
// ต้องโหลดจาก backend (Railway MySQL) เท่านั้น ถ้าเชื่อมต่อไม่ได้ หน้าจะโชว์สถานะว่างเปล่า
// พร้อมข้อความแจ้งเตือน แทนการ fallback ไปแสดงข้อมูลม็อกเหมือนของจริง
let productsList  = [];
let categoriesList = [];

// รายชื่อรูป placeholder ที่มีไฟล์จริงอยู่ใน images/products/ (ชุดเดียวกับที่ customer/frontend/api.js ใช้)
const KNOWN_IMAGES = ['hydrating-serum', 'renewal-cream', 'radiance-oil', 'gentle-cleanser',
                      'hydrating-mist', 'glow-mask', 'daily-spf-50', 'niacinamide-10', 'rose-barrier-cream'];
const CATEGORY_IMAGE = {
  serum: 'hydrating-serum', toner: 'hydrating-mist', moisturizer: 'renewal-cream',
  cleanser: 'gentle-cleanser', sunscreen: 'daily-spf-50', oil: 'radiance-oil',
  mist: 'hydrating-mist', mask: 'glow-mask', cream: 'renewal-cream', 'eye cream': 'renewal-cream',
};

function resolveProductImg(imageUrl, product = {}) {
  const DEFAULT_IMG = 'images/products/hydrating-serum.jpg';

  // ไฟล์ที่อัปโหลดจริงผ่าน POST /api/manager/products/upload-image จะขึ้นต้นด้วย /uploads/
  // ต้องต่อกับ origin ของ backend เอง (ไม่ใช่ origin ของหน้า frontend ที่อาจรันคนละพอร์ต/โดเมน)
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('/uploads/')) {
    const base = (window.GlowtimeAdminAPI && window.GlowtimeAdminAPI.apiBase) || '';
    return `${base}${imageUrl}`;
  }

  // รองรับ URL เต็มอยู่แล้ว
  if (imageUrl && typeof imageUrl === 'string' && /^https?:\/\//i.test(imageUrl)) return imageUrl;

  // ชื่อไฟล์เดี่ยวๆ จาก seed data เดิม (glowtime.sql เช่น "anua1.jpg") ที่ไม่มีไฟล์จริงในระบบ
  // → แมพไปหา placeholder ที่มีไฟล์จริงตามชื่อสินค้า/หมวดหมู่แทน (เหมือนวิธีที่ customer/frontend/api.js ใช้)
  const slug = String(product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let pick = null;
  if (KNOWN_IMAGES.includes(slug)) pick = slug;
  else if (slug.includes('niacinamide')) pick = 'niacinamide-10';
  else pick = CATEGORY_IMAGE[String(product.category || '').toLowerCase()] || null;

  return pick ? `images/products/${pick}.jpg` : DEFAULT_IMG;
}

function showStatusBanner(message) {
  const banner = document.getElementById('productsStatusBanner');
  if (!banner) return;
  banner.textContent = message;
  banner.style.display = 'block';
}

function hideStatusBanner() {
  const banner = document.getElementById('productsStatusBanner');
  if (!banner) return;
  banner.style.display = 'none';
  banner.textContent = '';
}

// ── Load categories จริงจาก DB (ไม่ฮาร์ดโค้ดชื่อ category อีกต่อไป) ──
async function loadCategories() {
  try {
    const apiCategories = window.GlowtimeAdminAPI
      ? await window.GlowtimeAdminAPI.Categories.list()
      : null;
    categoriesList = Array.isArray(apiCategories) ? apiCategories : [];
  } catch (e) {
    console.warn('[products.js] โหลด categories จาก backend ไม่สำเร็จ:', e.message);
    categoriesList = [];
  }
  renderCategorySelectOptions();
}

// ── Load รายการสินค้าจริงจาก DB ──
async function loadProducts() {
  try {
    if (!window.GlowtimeAdminAPI) throw new Error('ไม่พบ GlowtimeAdminAPI');
    const apiProducts = await window.GlowtimeAdminAPI.Products.list();
    productsList = Array.isArray(apiProducts) ? apiProducts : [];
    hideStatusBanner();
  } catch (e) {
    console.warn('[products.js] โหลดสินค้าจาก backend ไม่สำเร็จ:', e.message);
    productsList = [];
    showStatusBanner('⚠ ไม่สามารถเชื่อมต่อ backend (Railway MySQL) ได้ในขณะนี้ — ไม่มีข้อมูลสินค้าให้แสดง กรุณาตรวจสอบว่าเซิร์ฟเวอร์เปิดใช้งานอยู่ แล้วรีเฟรชหน้านี้ใหม่');
  }
  renderCategoryTabs();
  renderProductTable(productsList);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!applyRoleGate(['manager'])) return; // ← เช็คสิทธิ์ก่อน
  await loadCategories();
  await loadProducts();
});

// ── แท็บ filter แบบ dynamic ตาม categories จริงใน DB (แก้ปัญหา "ไม่มีแท็บ Toner" /
//    "กด Serum แล้วชื่อไม่ตรงกับที่แก้ในตาราง categories") ──
function renderCategoryTabs() {
  const row = document.getElementById('categoryFilterRow');
  if (!row) return;

  const escAttr = (s) => String(s).replace(/'/g, "\\'");

  const allBtn = `<button class="btn-dark-sm" onclick="filterProducts('all')">All Products (${productsList.length})</button>`;

  const catBtns = categoriesList
    .map(c => `<button class="btn-ghost-sm" onclick="filterProducts('${escAttr(c.name)}')">${c.name}</button>`)
    .join('');

  const lowStockBtn = `<button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="filterProducts('low_stock')">Low Stock (&lt;10)</button>`;

  row.innerHTML = allBtn + catBtns + lowStockBtn;
}

// ── option ในฟอร์ม Add/Edit แบบ dynamic ตาม categories จริงใน DB ──
function renderCategorySelectOptions(selectedValue) {
  const select = document.getElementById('newProdCat');
  if (!select) return;

  if (categoriesList.length === 0) {
    select.innerHTML = `<option value="" disabled selected>ไม่พบหมวดหมู่ (เชื่อมต่อ backend ไม่ได้)</option>`;
    return;
  }

  select.innerHTML = categoriesList
    .map(c => `<option value="${c.name}">${c.name}</option>`)
    .join('');

  if (selectedValue) select.value = selectedValue;
}

function openImageLightbox(imgSrc, title, category, price) {
  let modal = document.getElementById('imageLightboxModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageLightboxModal';
    modal.className = 'admin-modal-overlay';
    modal.onclick = function(e) { if (e.target === this) closeImageLightbox(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="admin-modal-box" style="max-width: 480px; text-align: center; background: #ffffff; padding: 0; overflow: hidden; border-radius: 6px; box-shadow: 0 25px 60px rgba(0,0,0,0.35);">
      <div style="background: #0A0A0A; color: #ffffff; padding: 1rem 1.4rem; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.72rem; letter-spacing: 0.15em; text-transform: uppercase; color: #C5A059;">High-Res Product Image Preview</span>
        <button onclick="closeImageLightbox()" style="background: none; border: none; color: #ffffff; font-size: 1.5rem; cursor: pointer; line-height: 1;">&times;</button>
      </div>
      <div style="padding: 2rem 1.5rem; background: #FAF9F6; display: flex; justify-content: center; align-items: center; min-height: 300px;">
        <img src="${imgSrc}" alt="${title}" style="max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 4px; box-shadow: 0 12px 30px rgba(0,0,0,0.12);" />
      </div>
      <div style="padding: 1.2rem 1.6rem; text-align: left; background: #ffffff; border-top: 1px solid var(--border);">
        <span class="status-badge badge-info" style="margin-bottom: 0.4rem; display: inline-block;">${category}</span>
        <h3 style="font-family: var(--serif); font-size: 1.35rem; margin: 0.2rem 0; color: var(--black);">${title}</h3>
        <p style="color: #8B6F5E; font-weight: 600; font-size: 1.2rem; margin: 0.3rem 0 0;">${price}</p>
      </div>
    </div>
  `;

  modal.classList.add('open');
}

function closeImageLightbox() {
  const modal = document.getElementById('imageLightboxModal');
  if (modal) modal.classList.remove('open');
}

function renderProductTable(items) {
  const tbody = document.getElementById('productTableBody');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2.5rem; color:var(--gray);">ไม่พบสินค้า</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(p => {
    const imgUrl = resolveProductImg(p.imageUrl, p);
    const safeTitle = (p.name || '').replace(/'/g, "\\'");

    return `
    <tr>
      <td><strong>#${p.id}</strong></td>
      <td>
        <div class="product-thumb" onclick="openImageLightbox('${imgUrl}', '${safeTitle}', '${p.category}', '฿${Number(p.price).toLocaleString()}')" title="Click to view image preview">
          <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='images/products/hydrating-serum.jpg';"/>
        </div>
      </td>
      <td>
        <strong>${p.name}</strong>
        <div style="font-size:0.7rem; color:var(--gray);">Brand: ${p.brand || 'GLOWTIME'} | Key Ingredients: ${Array.isArray(p.ingredients) ? p.ingredients.join(', ') : (p.ingredients || '-')}</div>
      </td>
      <td><span class="status-badge badge-info">${p.category}</span></td>
      <td><strong>฿${Number(p.price).toLocaleString()}</strong></td>
      <td>
        ${p.stockQty < 10
          ? `<strong style="color:var(--status-danger);">${p.stockQty} units (Low)</strong>`
          : `<span>${p.stockQty} units</span>`}
      </td>
      <td><span style="font-size:0.75rem; color:var(--gray);">${p.expiryDate || '-'}</span></td>
      <td>
        <button class="btn-ghost-sm" onclick="editProduct(${p.id})">Edit</button>
        <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="deleteProductRow(${p.id})">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function filterProducts(cat) {
  if (cat === 'all') renderProductTable(productsList);
  else if (cat === 'low_stock') renderProductTable(productsList.filter(p => p.stockQty < 10));
  else renderProductTable(productsList.filter(p => p.category === cat));
}

async function saveNewProduct(e) {
  e.preventDefault();

  if (!window.GlowtimeAdminAPI) {
    showToast('ไม่สามารถเชื่อมต่อ backend ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    return;
  }

  const fileInput = document.getElementById('newProdImageFile');
  const file = fileInput && fileInput.files[0];

  const ingredientsRaw = document.getElementById('newProdIngredients').value;
  const ingredients = ingredientsRaw
    ? ingredientsRaw.split(',').map(i => i.trim()).filter(Boolean)
    : [];

  const editId = document.getElementById('editProdId').value;
  const isEdit = !!editId;

  const submitBtn = e.target.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

  try {
    // 1) อัปโหลดไฟล์รูปจริงขึ้น server ก่อน (ถ้ามีการเลือกไฟล์ใหม่) — ได้ imageUrl จริงกลับมา
    let imageUrl;
    if (file) {
      const uploaded = await window.GlowtimeAdminAPI.Products.uploadImage(file);
      imageUrl = uploaded && uploaded.imageUrl;
    }

    const prodData = {
      name: document.getElementById('newProdName').value.trim(),
      brand: document.getElementById('newProdBrand').value.trim() || 'GLOWTIME',
      category: document.getElementById('newProdCat').value,
      ingredients,
      description: document.getElementById('newProdDesc').value.trim(),
      price: Number(document.getElementById('newProdPrice').value),
      stockQty: Number(document.getElementById('newProdStock').value),
      expiryDate: document.getElementById('newProdExpiry').value,
      ...(imageUrl ? { imageUrl } : {}),
    };

    if (isEdit) {
      const updated = await window.GlowtimeAdminAPI.Products.update(editId, prodData);
      const idx = productsList.findIndex(p => p.id === Number(editId));
      if (idx !== -1) productsList[idx] = updated;
    } else {
      const created = await window.GlowtimeAdminAPI.Products.create(prodData);
      productsList.unshift(created);
    }

    renderCategoryTabs();
    renderProductTable(productsList);
    closeModal('modalAddProduct');
    resetAddProductForm();
    showToast(`"${prodData.name}" ${isEdit ? 'updated' : 'added'} successfully!`);
  } catch (err) {
    // ไม่ fallback เป็นการบันทึกลงเครื่องแบบเงียบๆ อีกต่อไป — ถ้า backend/Railway MySQL
    // เชื่อมต่อไม่ได้ ต้องแจ้งผู้ใช้ตรงๆ ว่าบันทึกไม่สำเร็จ ไม่ใช่ทำเหมือนสำเร็จทั้งที่ไม่ได้เก็บลง DB จริง
    console.warn('[products.js] saveNewProduct ล้มเหลว:', err.message);
    showToast(`บันทึกไม่สำเร็จ — เชื่อมต่อ backend (Railway MySQL) ไม่ได้: ${err.message}`);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Product'; }
  }
}

function previewProductImage(input) {
  const file = input.files[0];
  if (!file) return;

  const preview = document.getElementById('imgPreview');
  const placeholder = document.getElementById('imgPlaceholder');

  if (file.size > 5 * 1024 * 1024) {
    showToast('Image file size must be under 5MB');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    preview.src = e.target.result;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function resetAddProductForm() {
  const form = document.querySelector('#modalAddProduct form');
  if (form) form.reset();
  const preview = document.getElementById('imgPreview');
  const placeholder = document.getElementById('imgPlaceholder');
  if (preview) { preview.src = ''; preview.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
}

function openAddProductModal() {
  resetAddProductForm();
  document.getElementById('productModalTitle').innerText = 'Add New Product';
  document.getElementById('editProdId').value = '';
  renderCategorySelectOptions();
  openModal('modalAddProduct');
}

async function deleteProductRow(id) {
  if (!confirm(`Are you sure you want to delete product #${id} from the catalog?`)) return;

  if (!window.GlowtimeAdminAPI) {
    showToast('ไม่สามารถเชื่อมต่อ backend ได้ในขณะนี้');
    return;
  }

  try {
    await window.GlowtimeAdminAPI.Products.delete(id);
    productsList = productsList.filter(p => p.id !== id);
    renderCategoryTabs();
    renderProductTable(productsList);
    showToast(`Deleted product #${id} successfully`);
  } catch (err) {
    console.warn('[products.js] deleteProductRow ล้มเหลว:', err.message);
    showToast(`ลบไม่สำเร็จ — เชื่อมต่อ backend (Railway MySQL) ไม่ได้: ${err.message}`);
  }
}

// ── เชื่อมกับ GET /api/manager/products/:id จริง แทนการอ่านจาก productsList ในเครื่องอย่างเดียว ──
async function editProduct(id) {
  let product = productsList.find(p => p.id === id);

  if (window.GlowtimeAdminAPI) {
    try {
      const fresh = await window.GlowtimeAdminAPI.Products.getById(id);
      if (fresh) {
        product = fresh;
        const idx = productsList.findIndex(p => p.id === id);
        if (idx !== -1) productsList[idx] = fresh; else productsList.push(fresh);
      }
    } catch (e) {
      console.warn('[products.js] ดึงข้อมูลล่าสุดจาก GET /api/manager/products/:id ไม่สำเร็จ ใช้ข้อมูลที่มีอยู่ในเครื่องแทน:', e.message);
    }
  }

  if (!product) {
    showToast('ไม่พบสินค้านี้ (เชื่อมต่อ backend ไม่ได้ และไม่มีข้อมูลในเครื่อง)');
    return;
  }

  resetAddProductForm();

  document.getElementById('productModalTitle').innerText = 'Edit Product #' + id;
  document.getElementById('editProdId').value = id;

  document.getElementById('newProdName').value = product.name || '';
  document.getElementById('newProdBrand').value = product.brand || '';
  renderCategorySelectOptions(product.category || '');
  document.getElementById('newProdPrice').value = product.price || 0;
  document.getElementById('newProdStock').value = product.stockQty || 0;
  document.getElementById('newProdExpiry').value = product.expiryDate ? String(product.expiryDate).slice(0, 10) : '';
  document.getElementById('newProdIngredients').value = Array.isArray(product.ingredients) ? product.ingredients.join(', ') : (product.ingredients || '');
  document.getElementById('newProdDesc').value = product.description || '';

  const imgUrl = resolveProductImg(product.imageUrl, product);
  const preview = document.getElementById('imgPreview');
  const placeholder = document.getElementById('imgPlaceholder');
  if (imgUrl && preview) {
    preview.src = imgUrl;
    preview.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }

  openModal('modalAddProduct');
}
