/* ============================================================
   UnavuHub — Admin Shared Utilities (admin.js)
   Sidebar toggle, admin auth guard, shared render helpers
   ============================================================ */

/* ── Sidebar toggle (mobile) ── */
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('open');
}

/* ── Admin logout ── */
function adminLogout() {
  DB.clearSession();
  window.location.href = 'login.html';
}

/* ── Guard: redirect non-admins ── */
function guardAdmin() {
  if (!DB.isLoggedIn() || !DB.isAdmin()) {
    window.location.href = 'login.html';
  }
}

/* ── Sidebar active link ── */
function setSidebarActive(page) {
  document.querySelectorAll('.sidebar-link').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

/* ── Build sidebar HTML (shared across admin pages) ── */
function buildAdminSidebar(activePage) {
  const admin = DB.getSession();
  return `
    <div class="sidebar-overlay" onclick="toggleSidebar()"></div>
    <aside class="sidebar">
      <div class="sidebar-brand">Unavu<span>Hub</span></div>
      <nav class="sidebar-nav">
        <div class="sidebar-label">Main</div>
        <a class="sidebar-link" data-page="dashboard" href="admin-dashboard.html">
          <i class="fas fa-gauge-high"></i> Dashboard
        </a>
        <div class="sidebar-label">Management</div>
        <a class="sidebar-link" data-page="menu" href="admin-menu.html">
          <i class="fas fa-utensils"></i> Menu Items
        </a>
        <a class="sidebar-link" data-page="orders" href="admin-orders.html">
          <i class="fas fa-receipt"></i> Orders
        </a>
        <a class="sidebar-link" data-page="customers" href="admin-customers.html">
          <i class="fas fa-users"></i> Customers
        </a>
        <div class="sidebar-label">Account</div>
        <a class="sidebar-link" href="#" onclick="adminLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </a>
      </nav>
      <div class="sidebar-footer">
        <i class="fas fa-user-shield me-1"></i> ${admin ? admin.name : 'Admin'}
      </div>
    </aside>`;
}

/* ── Topbar HTML ── */
function buildAdminTopbar(title) {
  return `
    <div class="admin-topbar">
      <div class="d-flex align-items-center gap-3">
        <button class="sidebar-toggle" onclick="toggleSidebar()">
          <i class="fas fa-bars"></i>
        </button>
        <span class="fw-bold" style="font-size:1rem;">${title}</span>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="text-muted" style="font-size:.85rem;">
          <i class="fas fa-circle text-success me-1" style="font-size:.5rem;"></i>Admin Panel
        </span>
        <a href="index.html" class="btn btn-outline-primary btn-sm" target="_blank">
          <i class="fas fa-external-link-alt me-1"></i>View Site
        </a>
      </div>
    </div>`;
}

/* ── Status select options ── */
function statusOptions(current) {
  const statuses = ['pending','confirmed','preparing','out for delivery','delivered','cancelled'];
  return statuses.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('');
}
