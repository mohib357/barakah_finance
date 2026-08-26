// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — SHARED APP UTILITIES
//  (Used by all inner pages)
// ═══════════════════════════════════════════════════════════

// ── Determine base path (root vs pages/) ──
const IS_SUBPAGE = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/admin/');
const BASE = IS_SUBPAGE ? '../' : './';

// ── Format helpers ──
function fmtMoney(n) {
  if (!n && n !== 0) return '৳ ০';
  return '৳ ' + Math.round(n).toLocaleString('en-IN');
}
function fmtNum(n) { return (n || 0).toLocaleString('en-IN'); }
function fmtDate(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return str; }
}
function fmtDateTime(str) {
  if (!str) return '—';
  try {
    return new Date(str).toLocaleString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return str; }
}
function bangla(n) {
  const d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(n).replace(/[0-9]/g, c => d[c]);
}
function randomColor(str) {
  const colors = ['#1D9E75','#639922','#BA7517','#185FA5','#3B6D11','#0F6E56','#854F0B','#3C3489','#993C1D','#972B56'];
  let h = 0;
  for (let c of (str || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function initial(name) {
  const clean = (name || '').replace(/জনাব|মাওলানা|হাফেজ|হা\.|ক্বারী|মাও\./g,'').trim();
  return clean.split(/\s+/)[0]?.[0] || 'ব';
}

// ── Toast ──
function showToast(msg, type = 'success') {
  let box = document.getElementById('toastContainer');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toastContainer';
    box.className = 'toast-container';
    document.body.appendChild(box);
  }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span style="flex:1">${msg}</span><button onclick="this.parentNode.remove()" style="background:none;border:none;cursor:pointer;font-size:1rem;opacity:.6">✕</button>`;
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 4000);
}

// ── Confirm dialog ──
function showConfirm(title, msg, onYes) {
  let overlay = document.getElementById('_confirmOverlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = '_confirmOverlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal modal-sm">
      <div class="modal-head"><h3>${title}</h3></div>
      <div class="modal-body"><p>${msg}</p></div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('_confirmOverlay').remove()">বাতিল</button>
        <button class="btn btn-primary btn-sm" id="_confirmYes">হ্যাঁ</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.getElementById('_confirmYes').onclick = () => { overlay.remove(); onYes(); };
}

// ── Reveal observer ──
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── Theme ──
function initTheme() {
  const t = localStorage.getItem('bf_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.body.classList.toggle('dark-mode', t === 'dark');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = t === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const t = localStorage.getItem('bf_theme') || 'light';
  const next = t === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.body.classList.toggle('dark-mode', next === 'dark');
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('bf_theme', next);
}

// ── Nav session ──
function initNavSession() {
  const session = (typeof DB !== 'undefined') ? DB.getSession() : null;
  const navAuth = document.getElementById('navAuth');
  const navUser = document.getElementById('navUser');
  if (session?.verified) {
    navAuth?.classList.add('hidden');
    navUser?.classList.remove('hidden');
    const av = document.getElementById('navUserAvatar');
    if (av) av.textContent = (session.name || 'ব')[0];
    if (document.getElementById('userMenuName')) document.getElementById('userMenuName').textContent = session.name;
    const roles = { admin:'অ্যাডমিন', super_admin:'সুপার অ্যাডমিন', member:'সদস্য', user:'গ্রাহক' };
    if (document.getElementById('userMenuRole')) document.getElementById('userMenuRole').textContent = roles[session.role] || 'গ্রাহক';
    if ((session.role === 'admin' || session.role === 'super_admin') && document.getElementById('adminMenuLinks'))
      document.getElementById('adminMenuLinks').classList.remove('hidden');
  } else {
    navAuth?.classList.remove('hidden');
    navUser?.classList.add('hidden');
  }
}

function toggleUserMenu() {
  document.getElementById('userMenu')?.classList.toggle('hidden');
}
document.addEventListener('click', function(e) {
  const u = document.getElementById('navUser');
  const m = document.getElementById('userMenu');
  if (m && u && !u.contains(e.target)) m.classList.add('hidden');
});

function doLogout() {
  if (typeof AuthAPI !== 'undefined') AuthAPI.logout();
  else if (typeof DB !== 'undefined') { DB.clearSession(); localStorage.removeItem('bf_token'); }
  showToast('লগআউট সফল।', 'success');
  setTimeout(() => window.location.href = BASE + 'index.html', 600);
}

function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
  document.getElementById('hamburgerBtn')?.classList.toggle('open');
}

// ── Page nav scroll ──
function initPageScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
}

// ── All together ──
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initNavSession();
  initPageScroll();
  initReveal();
  // Theme button
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  // Mobile menu
  document.getElementById('hamburgerBtn')?.addEventListener('click', toggleMobileMenu);
  // Notice bar
  if (typeof initNoticeBar !== 'undefined') initNoticeBar();
  // Language toggle
  const lt = document.getElementById('langToggle');
  if (lt) {
    lt.addEventListener('click', e => { e.stopPropagation(); lt.classList.toggle('open'); });
    document.addEventListener('click', () => lt.classList.remove('open'));
    document.querySelectorAll('.lang-opt').forEach(b => b.addEventListener('click', function() {
      localStorage.setItem('bf_lang', this.dataset.lang);
      const labels = { bn:'বাংলা', en:'English', ar:'العربية' };
      const lbl = document.getElementById('langLabel');
      if (lbl) lbl.textContent = labels[this.dataset.lang] || 'বাংলা';
      lt.classList.remove('open');
    }));
  }
});

// ── Shared navbar HTML injector ──
function injectNav(activePage) {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const links = [
    { href: BASE+'pages/timeline.html', id:'navTimeline', label:'📰 টাইমলাইন', key:'timeline' },
    { href: BASE+'pages/gallery.html',  id:'navGallery',  label:'🖼️ গ্যালারি',   key:'gallery' },
    { href: BASE+'pages/learn-more.html', label:'ℹ️ আরও জানুন', key:'learnmore' },
    { href: BASE+'pages/shop.html',     label:'🛒 শপ',       key:'shop' },
  ];
  const ul = nav.querySelector('.nav-links');
  if (ul) {
    ul.innerHTML = links.map(l =>
      `<li><a href="${l.href}" class="nav-link${l.key===activePage?' active':''}">${l.label}</a></li>`
    ).join('');
  }
}
