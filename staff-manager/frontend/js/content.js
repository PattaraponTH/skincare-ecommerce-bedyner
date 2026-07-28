/**
 * GLOWTIME — Reviews & Content Management (js/content.js)
 * ──────────────────────────────────────────────────────────
 * เชื่อมต่อ API: GET /api/manager/reviews + PUT /api/manager/reviews/:id/status
 * แหล่งข้อมูล: Railway MySQL reviews + products + customers + users
 */

// ── Fallback mock data (ใช้เมื่อ API ไม่ตอบสนอง) ────────────
let reviewsList = [
  { id: 1, rating: 5, productName: 'Hydrating Serum', customerName: 'นภัสสร ใส่ใจผิว', comment: 'Works amazingly well — no irritation at all. Skin felt noticeably more hydrated after 2 weeks.', status: 'approved', createdAt: '2026-07-22' },
  { id: 2, rating: 4, productName: 'Daily SPF 50+',   customerName: 'ศิรินทร์ภา วงศ์อุบล', comment: 'Lightweight formula, no white cast at all. Delivery was 1 day later than expected.', status: 'approved', createdAt: '2026-07-22' },
  { id: 3, rating: 5, productName: 'Renewal Cream',   customerName: 'ภัทรพงศ์ อนันต์', comment: 'Applied before bed and woke up with visibly plumper, softer skin!', status: 'pending', createdAt: '2026-07-23' },
];

// ── Load on page ready ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadReviews();
});

async function loadReviews() {
  if (window.GlowtimeAdminAPI) {
    try {
      const apiData = await window.GlowtimeAdminAPI.Reviews.list();
      if (Array.isArray(apiData) && apiData.length > 0) {
        reviewsList = apiData;
      }
    } catch (e) {
      console.warn('[content.js] ใช้ mock data เนื่องจาก backend ไม่ตอบสนอง:', e.message);
    }
  }
  renderReviewsTable(reviewsList);
}

// ── Render Reviews Table ──────────────────────────────────────
function renderReviewsTable(items) {
  const tbody = document.getElementById('reviewsTableBody');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--gray); padding:1.5rem;">ไม่มีรีวิว</td></tr>';
    return;
  }

  const stars = (n) => '★'.repeat(Math.min(5, Math.max(0, Number(n)))) + '☆'.repeat(5 - Math.min(5, Number(n)));

  tbody.innerHTML = items.map(r => `
    <tr>
      <td><span style="color:#D4AF37; font-weight:bold;">${stars(r.rating)} ${Number(r.rating).toFixed(1)}</span></td>
      <td><strong>${r.productName || '-'}</strong></td>
      <td>${r.customerName || r.customer || '-'}
        ${r.skinType ? `<div style="font-size:0.7rem; color:#777;">${r.skinType}</div>` : ''}
      </td>
      <td style="max-width:200px; font-size:0.82rem;">"${r.comment || '-'}"</td>
      <td>
        <span class="status-badge badge-${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}">
          ${r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
        </span>
      </td>
      <td>
        ${r.status !== 'approved'
          ? `<button class="btn-dark-sm" style="font-size:0.72rem;" onclick="approveReview(${r.id})">Approve</button>`
          : `<button class="btn-ghost-sm" onclick="hideReview(${r.id})">Hide</button>`
        }
        <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="rejectReview(${r.id})">Delete</button>
      </td>
    </tr>
  `).join('');

  const pendingCount = items.filter(r => r.status === 'pending').length;
  const badge = document.getElementById('pendingReviewCount');
  if (badge) {
    badge.textContent = `${pendingCount} REVIEWS PENDING APPROVAL`;
    badge.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
  }
}

// ── Review Actions ────────────────────────────────────────────
async function approveReview(id) {
  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Reviews.updateStatus(id, 'approved');
    }
    const idx = reviewsList.findIndex(r => r.id === id);
    if (idx !== -1) reviewsList[idx].status = 'approved';
    renderReviewsTable(reviewsList);
    showToast(`Review #${id} approved and published!`);
  } catch (e) {
    console.warn('[content.js] approve error:', e.message);
    showToast('Error: ไม่สามารถ approve ได้');
  }
}

async function hideReview(id) {
  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Reviews.updateStatus(id, 'pending');
    }
    const idx = reviewsList.findIndex(r => r.id === id);
    if (idx !== -1) reviewsList[idx].status = 'pending';
    renderReviewsTable(reviewsList);
    showToast(`Review #${id} hidden from product page`);
  } catch (e) {
    console.warn('[content.js] hide error:', e.message);
  }
}

async function rejectReview(id) {
  if (!confirm(`Delete review #${id}? This cannot be undone.`)) return;
  try {
    if (window.GlowtimeAdminAPI) {
      await window.GlowtimeAdminAPI.Reviews.updateStatus(id, 'rejected');
    }
    reviewsList = reviewsList.filter(r => r.id !== id);
    renderReviewsTable(reviewsList);
    showToast(`Review #${id} deleted`);
  } catch (e) {
    console.warn('[content.js] reject error:', e.message);
  }
}
