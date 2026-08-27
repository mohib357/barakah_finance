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

// ══════════════════════════════════════════════════
//  SHARED AUTH MODAL (injected into inner pages)
// ══════════════════════════════════════════════════
// This provides openAuthModal() for pages that don't include auth.js directly.
// If auth.js is loaded, its openAuthModal() takes precedence.

(function injectSharedAuthModal() {
  if (document.getElementById('sharedAuthModal')) return; // already injected

  const html = `
  <style>
    #sharedAuthModal{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px}
    #sharedAuthModal.hidden{display:none}
    .sauth-box{background:var(--bg-surface,#fff);border-radius:20px;width:100%;max-width:420px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.22)}
    .sauth-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 12px;border-bottom:1px solid var(--border-light,#e5e7eb)}
    .sauth-head h2{font-size:1.1rem;font-weight:700;color:var(--text-primary,#111);margin:0}
    .sauth-close{background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text-muted,#888);line-height:1}
    .sauth-tabs{display:flex;border-bottom:1px solid var(--border-light,#e5e7eb)}
    .sauth-tab{flex:1;padding:12px;text-align:center;cursor:pointer;font-size:.9rem;color:var(--text-muted,#888);border-bottom:3px solid transparent;transition:.2s}
    .sauth-tab.on{color:var(--clr-primary-600,#065F46);border-bottom-color:var(--clr-primary-600,#065F46);font-weight:600}
    .sauth-body{padding:20px 24px}
    .sauth-field{margin-bottom:14px}
    .sauth-field label{display:block;font-size:.82rem;font-weight:600;color:var(--text-secondary,#374151);margin-bottom:6px}
    .sauth-field input{width:100%;padding:10px 14px;border:1.5px solid var(--border,#d1d5db);border-radius:10px;font-size:.9rem;font-family:inherit;color:var(--text-primary,#111);background:var(--bg-surface,#fff);outline:none;box-sizing:border-box}
    .sauth-field input:focus{border-color:var(--clr-primary-500,#1D9E75);box-shadow:0 0 0 3px rgba(29,158,117,.1)}
    .sauth-btn{width:100%;padding:12px;background:var(--clr-primary-600,#065F46);color:#fff;border:none;border-radius:10px;font-size:.95rem;font-weight:700;cursor:pointer;margin-top:6px;font-family:inherit;transition:.2s}
    .sauth-btn:hover{background:var(--clr-primary-700,#044D38)}
    .sauth-err{background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:.82rem;margin-bottom:12px;display:none}
    .sauth-ok{background:#f0fdf4;border:1px solid #86efac;color:#16a34a;padding:10px 14px;border-radius:8px;font-size:.82rem;margin-bottom:12px;display:none}
    .sauth-link{background:none;border:none;color:var(--clr-primary-600,#065F46);cursor:pointer;font-size:.82rem;text-decoration:underline;font-family:inherit}
    .sauth-row{display:flex;gap:12px}
    .sauth-row .sauth-field{flex:1}
    .sauth-footer{text-align:center;padding:0 24px 16px;font-size:.82rem;color:var(--text-muted,#888)}
  </style>
  <div id="sharedAuthModal" class="hidden" onclick="if(event.target===this)closeAuthModal()">
    <div class="sauth-box">
      <div class="sauth-head">
        <h2>বারাকাহ ফাইন্যান্স</h2>
        <button class="sauth-close" onclick="closeAuthModal()">✕</button>
      </div>
      <div class="sauth-tabs">
        <div class="sauth-tab on" id="sauth-tab-login" onclick="sauthSetTab('login')">🔑 লগইন</div>
        <div class="sauth-tab" id="sauth-tab-signup" onclick="sauthSetTab('signup')">📝 নিবন্ধন</div>
      </div>
      <!-- Login -->
      <div id="sauth-login" class="sauth-body">
        <div class="sauth-err" id="sauth-login-err"></div>
        <div class="sauth-field"><label>মোবাইল / ইউজারনেম *</label><input id="sauth-li-id" placeholder="01XXXXXXXXX" onkeydown="if(event.key==='Enter')sauthDoLogin()"/></div>
        <div class="sauth-field"><label>পাসওয়ার্ড *</label><input type="password" id="sauth-li-pw" placeholder="••••••••" onkeydown="if(event.key==='Enter')sauthDoLogin()"/></div>
        <div style="text-align:right;margin-bottom:10px"><button class="sauth-link" onclick="sauthSetTab('forgot')">পাসওয়ার্ড ভুলে গেছেন?</button></div>
        <button class="sauth-btn" onclick="sauthDoLogin()">🔑 লগইন করুন</button>
      </div>
      <!-- Signup -->
      <div id="sauth-signup" class="sauth-body" style="display:none">
        <div class="sauth-err" id="sauth-signup-err"></div>
        <div class="sauth-row">
          <div class="sauth-field"><label>নাম *</label><input id="sauth-su-name" placeholder="প্রথম নাম" oninput="sauthAutoUname()"/></div>
          <div class="sauth-field"><label>উপনাম</label><input id="sauth-su-sname" placeholder="শেষ নাম"/></div>
        </div>
        <div class="sauth-field"><label>মোবাইল *</label><input id="sauth-su-phone" placeholder="01XXXXXXXXX" inputmode="numeric"/></div>
        <div class="sauth-field"><label>ইউজারনেম *</label><input id="sauth-su-uname" placeholder="username" oninput="sauthCheckUname()"/><div id="sauth-uname-hint" style="font-size:.75rem;margin-top:4px"></div></div>
        <div class="sauth-field"><label>পাসওয়ার্ড * (৮+ অক্ষর)</label><input type="password" id="sauth-su-pw" placeholder="••••••••"/></div>
        <div class="sauth-field"><label>পাসওয়ার্ড নিশ্চিতকরণ *</label><input type="password" id="sauth-su-pw2" placeholder="••••••••"/></div>
        <button class="sauth-btn" onclick="sauthDoSignup()">📩 OTP পাঠান</button>
      </div>
      <!-- OTP -->
      <div id="sauth-otp" class="sauth-body" style="display:none">
        <div class="sauth-err" id="sauth-otp-err"></div>
        <div class="sauth-ok" id="sauth-otp-ok"></div>
        <p style="font-size:.85rem;color:var(--text-muted);text-align:center;margin-bottom:16px">OTP পাঠানো হয়েছে: <strong id="sauth-otp-phone"></strong></p>
        <div class="sauth-field"><label>৬ সংখ্যার OTP *</label><input id="sauth-otp-val" placeholder="• • • • • •" maxlength="6" inputmode="numeric" onkeydown="if(event.key==='Enter')sauthVerifyOtp()"/></div>
        <button class="sauth-btn" onclick="sauthVerifyOtp()">✅ যাচাই করুন</button>
        <div style="text-align:center;margin-top:10px"><button class="sauth-link" onclick="sauthResendOtp()">🔄 পুনরায় পাঠান</button></div>
      </div>
      <!-- Forgot -->
      <div id="sauth-forgot" class="sauth-body" style="display:none">
        <div class="sauth-err" id="sauth-forgot-err"></div>
        <div class="sauth-ok" id="sauth-forgot-ok"></div>
        <div class="sauth-field"><label>মোবাইল বা ইমেইল</label><input id="sauth-fg-id" placeholder="নম্বর বা ইমেইল"/></div>
        <button class="sauth-btn" onclick="sauthForgot()">🔑 পাসওয়ার্ড পুনরুদ্ধার</button>
        <div style="text-align:center;margin-top:10px"><button class="sauth-link" onclick="sauthSetTab('login')">← লগইনে ফিরুন</button></div>
      </div>
      <div class="sauth-footer">বারাকাহ ফাইন্যান্স — সুদমুক্ত লেনদেনে সমৃদ্ধি সবার</div>
    </div>
  </div>`;

  const div = document.createElement('div');
  div.innerHTML = html;
  document.body.appendChild(div.firstElementChild); // style tag
  document.body.appendChild(div.lastElementChild);  // modal div
})();

// ── Auth modal public API ──
function openAuthModal(mode) {
  // If main auth.js is loaded, it handles this — but we still need to show the modal.
  // Check if index.html auth modal exists first:
  const mainModal = document.getElementById('authModal');
  if (mainModal) {
    mainModal.classList.remove('hidden');
    if (mode === 'signup') {
      if (typeof setAtab === 'function') setAtab('signup');
      else if (typeof setAuthTab === 'function') setAuthTab('signup');
    }
    return;
  }
  // Use shared modal
  const m = document.getElementById('sharedAuthModal');
  if (m) m.classList.remove('hidden');
  sauthSetTab(mode || 'login');
}

function closeAuthModal() {
  const mainModal = document.getElementById('authModal');
  if (mainModal) { mainModal.classList.add('hidden'); return; }
  const m = document.getElementById('sharedAuthModal');
  if (m) m.classList.add('hidden');
}

function sauthSetTab(tab) {
  ['login','signup','otp','forgot'].forEach(t => {
    const el = document.getElementById('sauth-' + t);
    if (el) el.style.display = t === tab ? '' : 'none';
  });
  ['login','signup'].forEach(t => {
    const btn = document.getElementById('sauth-tab-' + t);
    if (btn) btn.classList.toggle('on', t === tab);
  });
  // Show only relevant tabs header
  const tabBar = document.querySelector('#sharedAuthModal .sauth-tabs');
  if (tabBar) tabBar.style.display = (tab === 'otp' || tab === 'forgot') ? 'none' : '';
}

function sauthMsg(panel, msg, type) {
  const id = 'sauth-' + panel + '-' + (type === 'ok' ? 'ok' : 'err');
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

let _sauthPending = null, _sauthOtpPhone = null;

async function sauthDoLogin() {
  const id = document.getElementById('sauth-li-id')?.value.trim();
  const pw = document.getElementById('sauth-li-pw')?.value;
  if (!id || !pw) { sauthMsg('login','সব তথ্য পূরণ করুন.','err'); return; }
  sauthMsg('login','লগইন হচ্ছে...','ok');
  try {
    const res = await fetch('http://localhost:3001/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ identifier: id, password: pw }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem('bf_token', data.token);
      if (typeof DB !== 'undefined') DB.setSession(data.user);
      closeAuthModal();
      showToast('স্বাগতম ' + (data.user?.name || '') + '! 🎉', 'success');
      setTimeout(() => { initNavSession(); }, 300);
      return;
    }
    const err = await res.json();
    sauthMsg('login', err.error || 'লগইন ব্যর্থ।', 'err'); return;
  } catch(_) {}
  // Offline fallback
  if (typeof DB !== 'undefined') {
    const u = DB.findUser(id);
    if (u && u.password === pw) {
      DB.setSession(u);
      closeAuthModal();
      showToast('স্বাগতম ' + u.name + '! 🎉', 'success');
      setTimeout(() => initNavSession(), 300);
      return;
    }
  }
  sauthMsg('login','ভুল আইডি বা পাসওয়ার্ড।','err');
}

async function sauthDoSignup() {
  const name = document.getElementById('sauth-su-name')?.value.trim();
  const sname = document.getElementById('sauth-su-sname')?.value.trim() || '';
  const phone = document.getElementById('sauth-su-phone')?.value.replace(/\D/g,'');
  const uname = document.getElementById('sauth-su-uname')?.value.trim();
  const pw = document.getElementById('sauth-su-pw')?.value;
  const pw2 = document.getElementById('sauth-su-pw2')?.value;
  if (!name || !phone || !uname || !pw || !pw2) { sauthMsg('signup','সব তথ্য পূরণ করুন.','err'); return; }
  if (pw.length < 8) { sauthMsg('signup','পাসওয়ার্ড ৮+ অক্ষর হতে হবে.','err'); return; }
  if (pw !== pw2) { sauthMsg('signup','পাসওয়ার্ড মিলছে না.','err'); return; }
  sauthMsg('signup','OTP পাঠানো হচ্ছে...','ok');
  _sauthPending = { name: name + (sname ? ' ' + sname : ''), phone, username: uname, password: pw, role:'user', verified:false };
  _sauthOtpPhone = phone;
  try {
    const res = await fetch('http://localhost:3001/api/auth/signup', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(_sauthPending),
      signal: AbortSignal.timeout(8000)
    });
    const data = await res.json();
    if (!res.ok) { sauthMsg('signup', data.error || 'নিবন্ধন ব্যর্থ.', 'err'); return; }
    document.getElementById('sauth-otp-phone').textContent = phone;
    document.getElementById('sauth-otp-val').value = '';
    sauthMsg('otp', data.demo_otp ? 'ডেমো OTP: ' + data.demo_otp : 'OTP পাঠানো হয়েছে.', 'ok');
    sauthSetTab('otp'); return;
  } catch(_) {}
  // Offline
  if (typeof DB !== 'undefined') {
    if (!DB.checkUsername(uname)) { sauthMsg('signup','ইউজারনেম নেওয়া হয়েছে.','err'); return; }
    if (DB.findUser(phone)) { sauthMsg('signup','এই নম্বরে অ্যাকাউন্ট আছে.','err'); return; }
    _sauthPending.id = 'USR-'+Date.now();
    _sauthPending.createdAt = new Date().toISOString();
    const otp = Math.floor(100000 + Math.random() * 900000);
    DB.setOTP(phone, otp);
    console.log('[DEMO OTP]', phone, '→', otp);
    document.getElementById('sauth-otp-phone').textContent = phone;
    document.getElementById('sauth-otp-val').value = '';
    sauthMsg('otp','OTP পাঠানো হয়েছে (অফলাইন — কনসোলে দেখুন).','ok');
    sauthSetTab('otp');
  }
}

async function sauthVerifyOtp() {
  const code = document.getElementById('sauth-otp-val')?.value.trim();
  if (!code) { sauthMsg('otp','OTP লিখুন.','err'); return; }
  try {
    const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone: _sauthOtpPhone, otp: code }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) localStorage.setItem('bf_token', data.token);
      if (typeof DB !== 'undefined') DB.setSession(data.user);
      closeAuthModal();
      showToast('অ্যাকাউন্ট তৈরি সফল! 🎉', 'success');
      setTimeout(() => initNavSession(), 300);
      return;
    }
    const err = await res.json();
    sauthMsg('otp', err.error || 'OTP যাচাই ব্যর্থ.', 'err'); return;
  } catch(_) {}
  // Offline
  if (typeof DB !== 'undefined' && _sauthPending) {
    if (!DB.verifyOTP(_sauthOtpPhone, code)) { sauthMsg('otp','OTP ভুল.','err'); return; }
    _sauthPending.verified = true;
    DB.addUser(_sauthPending);
    DB.setSession(_sauthPending);
    closeAuthModal();
    showToast('অ্যাকাউন্ট তৈরি সফল! 🎉', 'success');
    setTimeout(() => initNavSession(), 300);
  }
}

async function sauthResendOtp() {
  if (!_sauthOtpPhone) return;
  try {
    await fetch('http://localhost:3001/api/auth/resend-otp', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone: _sauthOtpPhone }),
      signal: AbortSignal.timeout(5000)
    });
    sauthMsg('otp','OTP পুনরায় পাঠানো হয়েছে.','ok');
  } catch(_) {
    if (typeof DB !== 'undefined') {
      const otp = Math.floor(100000 + Math.random() * 900000);
      DB.setOTP(_sauthOtpPhone, otp);
      console.log('[DEMO OTP RESEND]', _sauthOtpPhone, '→', otp);
      sauthMsg('otp','OTP পুনরায় পাঠানো হয়েছে.','ok');
    }
  }
}

async function sauthForgot() {
  const id = document.getElementById('sauth-fg-id')?.value.trim();
  if (!id) { sauthMsg('forgot','নম্বর বা ইমেইল দিন.','err'); return; }
  try {
    const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ phone: id }),
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    if (res.ok) sauthMsg('forgot','পাসওয়ার্ড রিসেট লিংক/OTP পাঠানো হয়েছে.','ok');
    else sauthMsg('forgot', data.error || 'অ্যাকাউন্ট পাওয়া যায়নি.', 'err');
  } catch(_) { sauthMsg('forgot','সার্ভার সংযোগ নেই.','err'); }
}

function sauthAutoUname() {
  const n = document.getElementById('sauth-su-name')?.value.trim();
  if (!n || typeof DB === 'undefined') return;
  const el = document.getElementById('sauth-su-uname');
  if (el && !el._userEdited) el.value = DB.genUsername(n);
}

function sauthCheckUname() {
  const el = document.getElementById('sauth-su-uname');
  const hint = document.getElementById('sauth-uname-hint');
  if (!el || !hint || typeof DB === 'undefined') return;
  el._userEdited = true;
  const u = el.value.trim();
  if (!u || u.length < 3) { hint.textContent = ''; return; }
  if (DB.checkUsername(u)) { hint.textContent = '✅ পাওয়া গেছে'; hint.style.color = '#059669'; }
  else { hint.textContent = '❌ নেওয়া হয়েছে'; hint.style.color = '#e53e3e'; }
}
