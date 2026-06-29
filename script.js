// ============================================
// BVR DEBRIEFING SYSTEM - Interactive Logic
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initDateTime();
  initSidebar();
  initMap();
  initTableInteractions();
  initSearchFilter();
  initPagination();
});

// ---- Live Date & Time ----
function initDateTime() {
  const el = document.getElementById('header-datetime');
  if (!el) return;

  function update() {
    const now = new Date();
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-GB', options).toUpperCase();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.textContent = `${dateStr}  ${timeStr}`;
  }

  update();
  setInterval(update, 1000);
}

// ---- Sidebar Navigation ----
function initSidebar() {
  const navItems = document.querySelectorAll('.nav-item');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Close mobile sidebar
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    });
  });

  // Mobile menu toggle
  if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// ---- Map Canvas ----
function initMap() {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMap();
  }

  function drawMap() {
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(44, 52, 68, 0.4)';
    ctx.lineWidth = 0.5;

    const gridSize = 30;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Terrain shading (subtle)
    const grad = ctx.createRadialGradient(w * 0.3, h * 0.6, 10, w * 0.3, h * 0.6, 120);
    grad.addColorStop(0, 'rgba(0, 60, 30, 0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const grad2 = ctx.createRadialGradient(w * 0.7, h * 0.3, 10, w * 0.7, h * 0.3, 100);
    grad2.addColorStop(0, 'rgba(0, 40, 60, 0.12)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, w, h);

    // Friendly positions (green triangles)
    const friendlies = [
      { x: w * 0.2, y: h * 0.65 },
      { x: w * 0.3, y: h * 0.45 },
    ];

    friendlies.forEach(pos => {
      drawAircraftIcon(ctx, pos.x, pos.y, '#00C553', 'friendly');
    });

    // Enemy positions (red X markers)
    const enemies = [
      { x: w * 0.65, y: h * 0.35 },
      { x: w * 0.55, y: h * 0.55 },
    ];

    enemies.forEach(pos => {
      drawAircraftIcon(ctx, pos.x, pos.y, '#FF5252', 'enemy');
    });

    // Missile tracks (dashed cyan lines)
    ctx.strokeStyle = '#00B0FF';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);

    // Missile 1: Friendly 1 -> Enemy 1
    drawCurvedPath(ctx, friendlies[0].x, friendlies[0].y, enemies[0].x, enemies[0].y);

    // Missile 2: Friendly 2 -> Enemy 2
    drawCurvedPath(ctx, friendlies[1].x, friendlies[1].y, enemies[1].x, enemies[1].y);

    ctx.setLineDash([]);

    // Waypoints (cyan diamonds)
    const waypoints = [
      { x: w * 0.15, y: h * 0.8 },
      { x: w * 0.4, y: h * 0.75 },
      { x: w * 0.75, y: h * 0.7 },
    ];

    waypoints.forEach(wp => {
      drawWaypoint(ctx, wp.x, wp.y);
    });

    // Waypoint path (dotted green)
    ctx.strokeStyle = 'rgba(0, 197, 83, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    waypoints.forEach(wp => ctx.lineTo(wp.x, wp.y));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawAircraftIcon(ctx, x, y, color, type) {
    ctx.save();
    if (type === 'friendly') {
      // Triangle pointing up
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x - 7, y + 6);
      ctx.lineTo(x + 7, y + 6);
      ctx.closePath();
      ctx.fill();

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
    } else {
      // X marker
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 6);
      ctx.lineTo(x - 6, y + 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCurvedPath(ctx, x1, y1, x2, y2) {
    const cpx = (x1 + x2) / 2;
    const cpy = Math.min(y1, y2) - 25;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(cpx, cpy, x2, y2);
    ctx.stroke();
  }

  function drawWaypoint(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#00B0FF';
    ctx.shadowColor = '#00B0FF';
    ctx.shadowBlur = 6;
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  window.addEventListener('resize', resize);
  // Use ResizeObserver for more accurate sizing
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement);
  }
  resize();
}

// ---- Table Row Interactions ----
function initTableInteractions() {
  // Row click highlight
  const rows = document.querySelectorAll('.data-table tbody tr');
  rows.forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => {
      rows.forEach(r => r.style.background = '');
      row.style.background = 'rgba(0, 176, 255, 0.08)';
    });
  });

  // Action button tooltips (simple title)
  document.querySelectorAll('.action-icon').forEach(icon => {
    icon.addEventListener('mouseenter', function () {
      this.style.transform = 'scale(1.15)';
    });
    icon.addEventListener('mouseleave', function () {
      this.style.transform = 'scale(1)';
    });
  });
}

// ---- Search / Filter ----
function initSearchFilter() {
  const searchBtn = document.getElementById('btn-search');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const name = document.getElementById('filter-name')?.value || '';
    const from = document.getElementById('filter-from')?.value || '';
    const to = document.getElementById('filter-to')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';

    // Ripple animation on button
    searchBtn.style.transform = 'scale(0.95)';
    setTimeout(() => { searchBtn.style.transform = 'scale(1)'; }, 150);

    console.log('Search triggered:', { name, from, to, status });
    // In a real app, this would filter the table data
  });
}

// ---- Pagination ----
function initPagination() {
  const pageBtns = document.querySelectorAll('.page-btn:not(.nav-arrow)');
  pageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pageBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // In a real app, this would load the corresponding page
    });
  });
}

// ---- Quick Action Buttons ----
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    // Pulse effect
    this.style.transform = 'scale(0.96)';
    setTimeout(() => { this.style.transform = 'scale(1)'; }, 150);
  });
});
