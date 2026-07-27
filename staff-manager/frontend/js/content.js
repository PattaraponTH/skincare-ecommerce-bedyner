/**
 * GLOWTIME — Reviews & Content Logic (js/content.js)
 * ─────────────────────────────────────────────────────
 * Approve / Hide reviews พร้อมเปลี่ยน DOM จริง
 * API-first → fallback local state
 */

// ── State ──────────────────────────────────────────────
let reviewsState = []; // populate จาก DOM หรือ API

// ── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadReviews();
  updatePendingBadge();
});

// ── Load Reviews (API-first) ───────────────────────────
async function loadReviews() {
  if (window.GlowtimeAdminAPI) {
    try {
      const apiData = await window.GlowtimeAdminAPI.Reviews?.list?.({ status: 'all' });
      if (apiData && apiData.length > 0) {
        reviewsState = apiData;
        renderAllReviewTables();
        return;
      }
    } catch (e) {
      console.warn('[content.js] API unavailable, using static HTML');
    }
  }
  // ถ้าไม่มี API → อ่าน state จาก DOM
  buildStateFromDOM();
}

// ── อ่าน state เริ่มต้นจาก DOM ────────────────────────
function buildStateFromDOM() {
  // ทำ rows ใน customer reviews table สามารถถูก manipulate ได้
  document.querySelectorAll('[data-review-id]').forEach(row => {
    reviewsState.push({
      id: row.dataset.reviewId,
      status: row.dataset.reviewStatus || 'pending',
      el: row
    });
  });
}

// ── Approve Review ──────────────────────────────────────
async function approveReview(btn, reviewId) {
  const row = btn.closest('tr');
  if (!row) return;

  // Try API
  if (window.GlowtimeAdminAPI?.Reviews?.updateStatus) {
    try {
      await window.GlowtimeAdminAPI.Reviews.updateStatus(reviewId, 'approved');
    } catch (e) {
      console.warn('[content.js] API approve failed, updating DOM only');
    }
  }

  // Update DOM
  const badgeCell = row.querySelector('.review-status-badge');
  if (badgeCell) {
    badgeCell.className = 'status-badge badge-success review-status-badge';
    badgeCell.textContent = 'Approved';
  }

  // เปลี่ยนปุ่ม Approve → Hide เท่านั้น
  const actionCell = row.querySelector('.review-actions');
  if (actionCell) {
    actionCell.innerHTML = `
      <button class="btn-ghost-sm" onclick="hideReview(this, '${reviewId}')">👁 Hide</button>
    `;
  }

  row.dataset.reviewStatus = 'approved';
  updatePendingBadge();
  showToast('✅ รีวิวได้รับการอนุมัติและเผยแพร่แล้ว');
}

// ── Hide Review ─────────────────────────────────────────
async function hideReview(btn, reviewId) {
  const row = btn.closest('tr');
  if (!row) return;

  // Try API
  if (window.GlowtimeAdminAPI?.Reviews?.updateStatus) {
    try {
      await window.GlowtimeAdminAPI.Reviews.updateStatus(reviewId, 'hidden');
    } catch (e) {
      console.warn('[content.js] API hide failed, updating DOM only');
    }
  }

  // Fade out row
  row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  row.style.opacity = '0.3';
  row.style.transform = 'scale(0.98)';

  const badgeCell = row.querySelector('.review-status-badge');
  if (badgeCell) {
    badgeCell.className = 'status-badge badge-danger review-status-badge';
    badgeCell.textContent = 'Hidden';
  }

  const actionCell = row.querySelector('.review-actions');
  if (actionCell) {
    actionCell.innerHTML = `
      <button class="btn-ghost-sm" onclick="approveReview(this, '${reviewId}')">✅ Re-approve</button>
    `;
  }

  row.dataset.reviewStatus = 'hidden';
  updatePendingBadge();
  showToast('🙈 รีวิวถูกซ่อนจากหน้าเว็บแล้ว');
}

// ── Delete Review ───────────────────────────────────────
async function deleteReview(btn, reviewId) {
  if (!confirm('ลบรีวิวนี้? การกระทำนี้ไม่สามารถกู้คืนได้')) return;

  const row = btn.closest('tr');
  if (!row) return;

  if (window.GlowtimeAdminAPI?.Reviews?.delete) {
    try {
      await window.GlowtimeAdminAPI.Reviews.delete(reviewId);
    } catch (e) {
      console.warn('[content.js] API delete failed, removing from DOM only');
    }
  }

  row.style.transition = 'all 0.3s ease';
  row.style.opacity = '0';
  row.style.height = '0';
  row.style.overflow = 'hidden';
  setTimeout(() => row.remove(), 300);

  updatePendingBadge();
  showToast('🗑 รีวิวถูกลบออกจากระบบแล้ว');
}

// ── Update pending count badge ──────────────────────────
function updatePendingBadge() {
  const badge = document.getElementById('pendingReviewBadge');
  if (!badge) return;
  const pendingRows = document.querySelectorAll('[data-review-status="pending"]').length;
  badge.textContent = pendingRows > 0 ? `${pendingRows} Reviews Pending Approval` : 'All Reviews Moderated ✅';
  badge.className = pendingRows > 0 ? 'status-badge badge-warning' : 'status-badge badge-success';
}

// ── Render if loaded from API ────────────────────────────
function renderAllReviewTables() {
  const tbody = document.getElementById('reviewTableBody');
  if (!tbody || reviewsState.length === 0) return;

  tbody.innerHTML = reviewsState.map(r => {
    const isPending  = r.status === 'pending';
    const isApproved = r.status === 'approved';
    const badgeClass = isPending ? 'badge-warning' : isApproved ? 'badge-success' : 'badge-danger';
    const badgeLabel = isPending ? 'Pending Review' : isApproved ? 'Approved' : 'Hidden';

    return `
      <tr data-review-id="${r.id}" data-review-status="${r.status}">
        <td>★${r.rating || '5'}.0</td>
        <td><strong>${r.productName || '—'}</strong></td>
        <td>${r.customerName || '—'}<div style="font-size:0.7rem;color:var(--gray);">${r.skinType || ''}</div></td>
        <td>"${r.comment || '—'}"</td>
        <td><span class="status-badge ${badgeClass} review-status-badge">${badgeLabel}</span></td>
        <td class="review-actions">
          ${isPending
            ? `<button class="btn-dark-sm" onclick="approveReview(this, '${r.id}')">Approve</button>
               <button class="btn-ghost-sm" style="color:var(--status-danger);" onclick="deleteReview(this, '${r.id}')">Delete</button>`
            : `<button class="btn-ghost-sm" onclick="hideReview(this, '${r.id}')">👁 Hide</button>`
          }
        </td>
      </tr>
    `;
  }).join('');
}
