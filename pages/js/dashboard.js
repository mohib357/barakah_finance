// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — USER DASHBOARD JS
// ═══════════════════════════════════════════════════════════

// Use window._API to avoid const redeclaration conflict with api.js
const _DASH_API = (typeof API !== 'undefined') ? API : 'http://localhost:3001/api';
let currentUser = null;
let _allUsers = [];

// ── Islamic Quotes ──
const QUOTES = [
  { text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَذَرُوا مَا بَقِيَ مِنَ الرِّبَا', src: 'সূরা বাকারা: ২৭৮', bn: 'হে মুমিনগণ, আল্লাহকে ভয় করো এবং সুদের যা বকেয়া আছে তা ছেড়ে দাও।' },
  { text: 'الَّذِينَ يَأْكُلُونَ الرِّبَا لَا يَقُومُونَ إِلَّا كَمَا يَقُومُ الَّذِي يَتَخَبَّطُهُ الشَّيْطَانُ', src: 'সূরা বাকারা: ২৭৫', bn: 'যারা সুদ খায় তারা দণ্ডায়মান হবে না, তবে ওই ব্যক্তির মতো যাকে শয়তান স্পর্শে বিভ্রান্ত করে।' },
  { text: 'وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا', src: 'সূরা বাকারা: ২৭৫', bn: 'আল্লাহ ব্যবসাকে হালাল করেছেন এবং সুদকে হারাম করেছেন।' },
  { text: 'مَنْ أَخَذَ أَمْوَالَ النَّاسِ يُرِيدُ أَدَاءَهَا أَدَّى اللَّهُ عَنْهُ', src: 'বুখারি শরীফ', bn: 'যে ব্যক্তি মানুষের মাল পরিশোধের নিয়তে নেয়, আল্লাহ তার পক্ষ থেকে পরিশোধ করে দেন।' },
  { text: 'الْمُسْلِمُونَ عَلَى شُرُوطِهِمْ', src: 'আবু দাউদ', bn: 'মুসলমানরা তাদের শর্তের উপর প্রতিষ্ঠিত থাকে।' },
  { text: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', src: 'তাবারানী', bn: 'মানুষের মধ্যে সেই সর্বোত্তম যে মানুষের উপকারে আসে।' },
  { text: 'الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى', src: 'বুখারি শরীফ', bn: 'উপরের হাত (দাতার হাত) নিচের হাত (গ্রহীতার হাত) থেকে উত্তম।' },
  { text: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ', src: 'মুসলিম শরীফ', bn: 'যে জ্ঞান অন্বেষণের পথ চলে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করেন।' },
];

document.addEventListener('DOMContentLoaded', initDashboard);

async function initDashboard() {
  currentUser = (typeof DB !== 'undefined') ? DB.getSession() : null;
  if (!currentUser || !currentUser.verified) {
    alert('দয়া করে প্রথমে লগইন করুন।');
    window.location.href = '../index.html';
    return;
  }

  // Setup UI
  setupSidebarUser();
  showQuote();
  buildNav();
  showPanel('overview', document.querySelector('.sb-nav-item'));

  // Load data
  await refreshUserData();
}

// ─── Refresh user from server ───
async function refreshUserData() {
  try {
    const res = await fetch(`${_DASH_API}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const fresh = await res.json();
      currentUser = { ...currentUser, ...fresh };
      if (typeof DB !== 'undefined') DB.setSession(currentUser);
    }
  } catch (_) {}
  setupSidebarUser();
}

// ─── Sidebar User Card ───
function setupSidebarUser() {
  const name = currentUser.name || 'ব্যবহারকারী';
  const pct  = currentUser.profileComplete || 40;
  const roles = { admin:'অ্যাডমিন', super_admin:'সুপার অ্যাডমিন', member:'সদস্য', user:'গ্রাহক' };

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('sbAvatar', name[0]);
  set('sbName', name);
  set('sbRole', roles[currentUser.role] || 'গ্রাহক');
  set('sbPct', pct + '%');
  const fill = document.getElementById('sbPctFill');
  if (fill) fill.style.width = pct + '%';

  // Also update nav user
  const av = document.getElementById('navUserAvatar');
  if (av) av.textContent = name[0];
  set('userMenuName', name);
  set('userMenuRole', roles[currentUser.role] || 'গ্রাহক');
}

// ─── Build Nav based on role ───
function buildNav() {
  const isMember = currentUser.role === 'member' || currentUser.role === 'admin' || currentUser.role === 'super_admin';
  const isAdmin  = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const show = (id) => { const el = document.getElementById(id); if (el) el.style.display = ''; };

  if (isMember) {
    show('memberNavLabel');
    show('navSavings');
    show('navLoans');
    show('navLedger');
    show('navWithdrawal'); // ✅ Now has panel
    show('navProfit');     // ✅ Now has panel
    show('navKyc');        // ✅ Now has panel
  }
  if (isAdmin) {
    show('adminNavLabel');
    show('navAdminPanel');
    show('navAllUsers');
  }
}

// ─── Show Panel ───
function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-nav-item').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');

  // Close mobile sidebar
  document.getElementById('dashSidebar')?.classList.remove('open');

  // Load content
  const loaders = {
    overview:      loadOverview,
    savings:       loadSavings,
    loans:         loadLoans,
    orders:        loadOrders,
    profile:       loadProfilePanel,
    allUsers:      loadAllUsers,
    notifications: loadNotifications,
    withdrawal:    loadWithdrawal,   // ✅ Added
    profit:        loadProfit,       // ✅ Added
    kyc:           loadKyc,          // ✅ Added
  };
  loaders[id]?.();
}

function toggleSidebar() {
  document.getElementById('dashSidebar')?.classList.toggle('open');
}

// ─── Quote Rotator ───
function showQuote() {
  const used   = JSON.parse(sessionStorage.getItem('bf_used_quotes') || '[]');
  const avail  = QUOTES.filter((_, i) => !used.includes(i));
  const pool   = avail.length ? avail : QUOTES;
  const idx    = Math.floor(Math.random() * pool.length);
  const q      = pool[idx];
  const realIdx= QUOTES.indexOf(q);

  const newUsed = [...used, realIdx].slice(-QUOTES.length);
  sessionStorage.setItem('bf_used_quotes', JSON.stringify(newUsed));

  const txt = document.getElementById('quoteTxt');
  const src = document.getElementById('quoteSrc');
  if (txt) txt.innerHTML = `<span style="font-family:'Noto Serif Bengali',serif;font-size:.95rem;color:var(--text-primary)">${q.bn}</span>`;
  if (src) src.textContent = '— ' + q.src;
}

// ─── Overview ───
async function loadOverview() {
  const name = currentUser.name || 'ব্যবহারকারী';
  const el = document.getElementById('ovName');
  if (el) el.textContent = name.split(' ')[0];

  const isAdmin  = currentUser.role === 'admin' || currentUser.role === 'super_admin';
  const isMember = currentUser.role === 'member' || isAdmin;

  // Fetch stats
  let stats = {};
  try {
    const res = await fetch(`${_DASH_API}/reports/dashboard`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) stats = await res.json();
  } catch (_) {}

  // Build stat cards
  const savings  = (typeof DB !== 'undefined') ? DB.getSavings().filter(s => s.userId === currentUser.id) : [];
  const loans    = (typeof DB !== 'undefined') ? DB.getLoans().filter(l => l.userId === currentUser.id) : [];
  const orders   = (typeof DB !== 'undefined') ? DB.getOrders().filter(o => o.customerId === currentUser.id || o.customerPhone === currentUser.phone) : [];
  const totalSav = savings.reduce((a, s) => a + (s.amount || 0), 0);
  const activeL  = loans.filter(l => l.status === 'active' || l.status === 'disbursed');

  let cards = [];

  if (isAdmin) {
    cards = [
      { icon: '👥', label: 'মোট ব্যবহারকারী', val: stats.totalUsers || '—', color: 'green' },
      { icon: '🪪', label: 'সক্রিয় সদস্য',   val: stats.totalMembers || '—', color: 'gold' },
      { icon: '💰', label: 'মোট সঞ্চয়',       val: '৳ ' + fmtN(stats.totalSavings || 0), color: 'green' },
      { icon: '🛒', label: 'মোট অর্ডার',       val: stats.totalOrders || '—', color: 'blue' },
      { icon: '🤝', label: 'সক্রিয় করজ',      val: stats.activeLoans || '—', color: 'red' },
      { icon: '📋', label: 'পেন্ডিং আবেদন',   val: stats.pendingApplications || '—', color: 'gold' },
      { icon: '💵', label: 'SMS ব্যালেন্স',    val: stats.smsBalance || '—', color: 'blue' },
      { icon: '📊', label: 'মোট আয় (এই মাসে)', val: '৳ ' + fmtN(stats.monthlyIncome || 0), color: 'green' },
    ];
  } else if (isMember) {
    cards = [
      { icon: '💰', label: 'মোট জমা',     val: '৳ ' + fmtN(totalSav), color: 'green' },
      { icon: '📊', label: 'ইউনিট সংখ্যা', val: ((totalSav / 2000) || 0).toFixed(2), color: 'gold' },
      { icon: '🤝', label: 'সক্রিয় করজ',  val: activeL.length || 0, color: 'blue' },
      { icon: '🛒', label: 'আমার অর্ডার',  val: orders.length || 0, color: 'red' },
    ];
  } else {
    cards = [
      { icon: '🛒', label: 'আমার অর্ডার', val: orders.length || 0, color: 'green' },
      { icon: '🪪', label: 'সদস্যপদ',     val: 'আবেদন করুন', color: 'gold', link: '../form.html' },
    ];
  }

  const statsEl = document.getElementById('ovStats');
  if (statsEl) {
    statsEl.innerHTML = cards.map(c => `
      <div class="stat-card" ${c.link ? `onclick="window.location='${c.link}'" style="cursor:pointer"` : ''}>
        <div class="stat-icon stat-icon-${c.color}">${c.icon}</div>
        <div class="stat-val">${c.val}</div>
        <div class="stat-lbl">${c.label}</div>
      </div>`).join('');
  }

  // Charts
  renderSavingsChart(savings);
  renderFundChart(stats);

  // Recent activity
  loadRecentActivity();

  // Pending actions for admin
  if (isAdmin) loadPendingActions(stats);
}

function fmtN(n) { return Math.round(n || 0).toLocaleString('en-IN'); }

// ─── Savings Chart (6 months) ───
function renderSavingsChart(savings) {
  const canvas = document.getElementById('savingsChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (canvas._chartInstance) canvas._chartInstance.destroy();

  const months = [];
  const amounts = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('bn-BD', { month: 'short', year: '2-digit' });
    months.push(label);
    const total = savings.filter(s => (s.month || '').startsWith(key)).reduce((a, s) => a + (s.amount || 0), 0);
    amounts.push(total);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  canvas._chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{ label: 'সঞ্চয় (৳)', data: amounts, backgroundColor: 'rgba(29,158,117,.7)', borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: isDark ? '#aaa' : '#555', callback: v => '৳' + v.toLocaleString('en-IN') }, grid: { color: isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.05)' } },
        x: { ticks: { color: isDark ? '#aaa' : '#555' }, grid: { display: false } }
      }
    }
  });
}

// ─── Fund Chart (donut) ───
function renderFundChart(stats) {
  const canvas = document.getElementById('fundChart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (canvas._chartInstance) canvas._chartInstance.destroy();

  const data = [
    stats.memberFund || stats.totalSavings || 1,
    stats.qardFund   || 0,
    stats.charityFund|| 0,
    stats.orgFund    || 0,
  ];
  canvas._chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['সদস্য তহবিল', 'করজ ফান্ড', 'চ্যারিটি ফান্ড', 'সংগঠন ফান্ড'],
      datasets: [{ data, backgroundColor: ['#1D9E75', '#C9A227', '#ef4444', '#3b82f6'], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#aaa' : '#555' } } }
    }
  });
}

// ─── Recent Activity ───
async function loadRecentActivity() {
  const wrap = document.getElementById('recentActivity');
  if (!wrap) return;

  let activities = [];
  try {
    const res = await fetch(`${_DASH_API}/audit/live?n=10`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); activities = d.activities || d.log || []; }
  } catch (_) {}

  if (!activities.length) {
    // Fallback: local savings/loans
    const savings = (typeof DB !== 'undefined') ? DB.getSavings().filter(s => s.userId === currentUser.id).slice(-5) : [];
    activities = savings.map(s => ({
      action: 'SAVINGS_ADDED', module: 'savings',
      detail: `৳${(s.amount || 0).toLocaleString('en-IN')} সঞ্চয় — ${s.month || ''}`,
      date: s.date || s.createdAt
    }));
  }

  if (!activities.length) {
    wrap.innerHTML = `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📋</div><div class="empty-state-title">কোনো কার্যক্রম নেই</div></div>`;
    return;
  }

  const icons = { SAVINGS_ADDED:'💰', ORDER_CREATED:'🛒', LOAN_APPLIED:'🤝', LOGIN:'🔐', MEMBER_ADDED:'👤', CREATE_CLIENT:'🏷️' };
  wrap.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px;padding:8px 0">` +
    activities.map(a => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-radius:10px;background:var(--bg-surface-2)">
        <span style="font-size:1.3rem">${icons[a.action] || '📌'}</span>
        <div style="flex:1">
          <div style="font-size:.85rem;font-weight:600;color:var(--text-primary)">${a.detail || a.action || ''}</div>
          <div style="font-size:.75rem;color:var(--text-muted)">${fmtDT(a.date)}</div>
        </div>
        <span class="badge badge-muted" style="font-size:.7rem">${a.module || ''}</span>
      </div>`).join('') + `</div>`;
}

function fmtDT(s) {
  if (!s) return '';
  try { return new Date(s).toLocaleString('bn-BD', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return s; }
}

// ─── Pending actions ───
async function loadPendingActions(stats) {
  const wrap = document.getElementById('pendingActions');
  if (!wrap) return;
  const items = [
    { label: 'পেন্ডিং সদস্য আবেদন', val: stats.pendingApplications, icon: '📝', link: '../admin/panel.html#applications' },
    { label: 'পেন্ডিং অর্ডার', val: stats.pendingOrders, icon: '🛒', link: '../admin/panel.html#orders' },
    { label: 'পেন্ডিং করজ আবেদন', val: stats.pendingQard, icon: '🤝', link: '../admin/panel.html#qard-list' },
  ].filter(i => i.val > 0);
  if (!items.length) return;

  wrap.innerHTML = `
    <div class="admin-card" style="border-left:4px solid var(--clr-warning)">
      <div class="card-title">⚠️ অ্যাকশন প্রয়োজন</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px">
        ${items.map(i => `
          <a href="${i.link}" class="btn btn-outline btn-sm">
            ${i.icon} ${i.label} <span class="badge badge-warning">${i.val}</span>
          </a>`).join('')}
      </div>
    </div>`;
}

// ─── Savings Panel ───
async function loadSavings() {
  let savings = [];
  try {
    const res = await fetch(`${_DASH_API}/savings/user/${currentUser.id}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); savings = d.savings || []; }
  } catch (_) {}
  if (!savings.length && typeof DB !== 'undefined') savings = DB.getSavings().filter(s => s.userId === currentUser.id);

  const total    = savings.reduce((a, s) => a + (s.amount || 0), 0);
  const lateFees = savings.reduce((a, s) => a + (s.lateFee || 0), 0);
  const units    = (total / 2000).toFixed(2);

  const statsEl = document.getElementById('savingsStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-icon stat-icon-green">💰</div><div class="stat-val">৳ ${fmtN(total)}</div><div class="stat-lbl">মোট জমা</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-gold">📊</div><div class="stat-val">${units}</div><div class="stat-lbl">মোট ইউনিট</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-red">⚠️</div><div class="stat-val">৳ ${fmtN(lateFees)}</div><div class="stat-lbl">বিলম্ব ফি</div></div>`;
  }

  const tbody = document.getElementById('savingsTbody');
  if (!tbody) return;
  if (!savings.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">কোনো সঞ্চয় নেই</td></tr>`; return; }

  tbody.innerHTML = savings.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)).map(s => `
    <tr>
      <td>${s.month || '—'}</td>
      <td style="font-weight:700;color:var(--clr-primary-500)">৳ ${fmtN(s.amount)}</td>
      <td>${s.lateFee ? `<span class="badge badge-warning">৳ ${fmtN(s.lateFee)}</span>` : '—'}</td>
      <td>${fmtDT(s.date || s.createdAt)}</td>
      <td><span class="badge badge-${s.status === 'paid' ? 'paid' : 'pending'}">${s.status === 'paid' ? 'পরিশোধিত' : 'পেন্ডিং'}</span></td>
    </tr>`).join('');
}

// ─── Loans Panel ───
async function loadLoans() {
  let loans = [];
  try {
    const res = await fetch(`${_DASH_API}/loans/user/${currentUser.id}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); loans = d.loans || []; }
  } catch (_) {}
  if (!loans.length && typeof DB !== 'undefined') loans = DB.getLoans().filter(l => l.userId === currentUser.id);

  const active  = loans.filter(l => ['active','disbursed','approved'].includes(l.status));
  const pending = loans.filter(l => l.status === 'pending' || l.status === 'applied');
  const paid    = loans.filter(l => l.status === 'completed' || l.status === 'paid');

  const statsEl = document.getElementById('loansStats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat-card"><div class="stat-icon stat-icon-blue">🤝</div><div class="stat-val">${active.length}</div><div class="stat-lbl">সক্রিয় করজ</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-gold">⏳</div><div class="stat-val">${pending.length}</div><div class="stat-lbl">পেন্ডিং</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-green">✅</div><div class="stat-val">${paid.length}</div><div class="stat-lbl">পরিশোধিত</div></div>`;
  }

  const tbody = document.getElementById('loansTbody');
  if (!tbody) return;
  if (!loans.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px">কোনো করজ নেই</td></tr>`; return; }

  const statusBadge = { applied:'badge-warning', pending:'badge-warning', approved:'badge-info', disbursed:'badge-info', active:'badge-info', completed:'badge-paid', paid:'badge-paid', rejected:'badge-danger' };
  const statusLabel = { applied:'আবেদনকৃত', pending:'পেন্ডিং', approved:'অনুমোদিত', disbursed:'বিতরিত', active:'সক্রিয়', completed:'সম্পন্ন', paid:'পরিশোধিত', rejected:'প্রত্যাখ্যাত' };

  tbody.innerHTML = loans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(l => `
    <tr>
      <td><code>${l.loanId || l.id?.slice(0,8) || '—'}</code></td>
      <td style="font-weight:700">৳ ${fmtN(l.amount)}</td>
      <td>৳ ${fmtN(l.remaining || 0)}</td>
      <td style="font-size:.8rem;color:var(--text-muted)">${l.reason || '—'}</td>
      <td>${fmtDT(l.createdAt)}</td>
      <td><span class="badge ${statusBadge[l.status] || 'badge-muted'}">${statusLabel[l.status] || l.status}</span></td>
    </tr>`).join('');
}

// ─── Orders Panel ───
async function loadOrders() {
  let orders = [];
  try {
    const res = await fetch(`${_DASH_API}/orders/user/${currentUser.phone}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); orders = d.orders || []; }
  } catch (_) {}
  if (!orders.length && typeof DB !== 'undefined') orders = DB.getOrders().filter(o => o.customerId === currentUser.id || o.customerPhone === currentUser.phone);

  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  if (!orders.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">কোনো অর্ডার নেই। <a href="shop.html" style="color:var(--clr-primary-500)">শপ দেখুন →</a></td></tr>`; return; }

  const statusBadge = { pending:'badge-warning', approved:'badge-info', confirmed:'badge-info', delivered:'badge-paid', cancelled:'badge-danger' };
  const statusLabel = { pending:'পেন্ডিং', approved:'অনুমোদিত', confirmed:'নিশ্চিত', delivered:'ডেলিভারি', cancelled:'বাতিল' };

  tbody.innerHTML = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(o => `
    <tr>
      <td style="font-weight:600">${o.productName || '—'}</td>
      <td>৳ ${fmtN(o.salePrice || o.price)}</td>
      <td>${o.installments ? `${o.installments} কিস্তি × ৳${fmtN(o.monthlyAmount)}` : '—'}</td>
      <td>${fmtDT(o.createdAt)}</td>
      <td><span class="badge ${statusBadge[o.status] || 'badge-muted'}">${statusLabel[o.status] || o.status}</span></td>
    </tr>`).join('');
}

// ─── Profile Panel ───
async function loadProfilePanel() {
  const wrap = document.getElementById('profileContent');
  if (!wrap) return;
  const u = currentUser;
  wrap.innerHTML = `
    <div class="admin-card">
      <div style="display:flex;align-items:flex-start;gap:24px;flex-wrap:wrap">
        <div style="text-align:center">
          <div class="avatar avatar-xl" style="background:linear-gradient(135deg,var(--clr-primary-400),var(--clr-primary-700))">${(u.name||'ব')[0]}</div>
          <div style="margin-top:8px;font-size:.8rem;color:var(--text-muted)">ইউজারনেম: @${u.username||'—'}</div>
          <span class="badge badge-${u.role==='admin'?'green':u.role==='member'?'info':'muted'} mt-2">${{admin:'অ্যাডমিন',super_admin:'সুপার অ্যাডমিন',member:'সদস্য',user:'গ্রাহক'}[u.role]||'গ্রাহক'}</span>
        </div>
        <div style="flex:1;min-width:200px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:.9rem">
            ${profileRow('নাম', u.name)}
            ${profileRow('মোবাইল', u.phone)}
            ${profileRow('ইমেইল', u.email)}
            ${profileRow('জন্ম তারিখ', u.dob)}
            ${profileRow('সদস্য আইডি', u.memberID)}
            ${profileRow('প্রোফাইল', (u.profileComplete||40)+'% সম্পূর্ণ')}
          </div>
          <div style="margin-top:16px">
            <a href="profile.html" class="btn btn-primary btn-sm">✏️ প্রোফাইল সম্পাদনা করুন</a>
          </div>
        </div>
      </div>
    </div>`;
}

function profileRow(lbl, val) {
  return `<div style="padding:8px;background:var(--bg-surface-2);border-radius:8px"><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">${lbl}</div><div style="font-weight:600;color:var(--text-primary)">${val||'—'}</div></div>`;
}

// ─── All Users (admin) ───
async function loadAllUsers() {
  let users = [];
  try {
    const res = await fetch(`${_DASH_API}/users`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) { const d = await res.json(); users = d.users || d; }
  } catch (_) {}
  if (!users.length && typeof DB !== 'undefined') users = DB.getUsers();
  _allUsers = users;
  renderUsersTable(users);
}

function filterUsers() {
  const q = (document.getElementById('usersSearch')?.value || '').toLowerCase();
  const filtered = _allUsers.filter(u => !q || (u.name||'').toLowerCase().includes(q) || (u.phone||'').includes(q) || (u.email||'').toLowerCase().includes(q));
  renderUsersTable(filtered);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTbody');
  if (!tbody) return;
  if (!users.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px">কোনো ব্যবহারকারী নেই</td></tr>`; return; }
  const roleLabel = { admin:'অ্যাডমিন', super_admin:'সুপার অ্যাডমিন', member:'সদস্য', user:'গ্রাহক' };
  tbody.innerHTML = users.slice(0, 100).map(u => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="avatar avatar-sm">${(u.name||'ব')[0]}</div>
          <div><div style="font-weight:600">${u.name||'—'}</div><div style="font-size:.75rem;color:var(--text-muted)">@${u.username||''}</div></div>
        </div>
      </td>
      <td>${u.phone||'—'}</td>
      <td><span class="badge badge-${u.role==='admin'?'green':u.role==='member'?'info':'muted'}">${roleLabel[u.role]||'গ্রাহক'}</span></td>
      <td style="font-size:.8rem">${fmtDT(u.createdAt)}</td>
      <td><span class="badge badge-${u.verified?'active':'pending'}">${u.verified?'যাচাইকৃত':'অযাচাই'}</span></td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="changeRole('${u.id}','${u.role}')">✏️</button>
      </td>
    </tr>`).join('');
}

async function changeRole(userId, currentRole) {
  const newRole = prompt('নতুন রোল (user/member/admin):', currentRole);
  if (!newRole || newRole === currentRole) return;
  try {
    await fetch(`${_DASH_API}/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      body: JSON.stringify({ role: newRole })
    });
    showToast('রোল পরিবর্তন হয়েছে।', 'success');
    loadAllUsers();
  } catch (_) { showToast('ব্যর্থ হয়েছে।', 'error'); }
}

// ─── Notifications ───
async function loadNotifications() {
  const wrap = document.getElementById('notifList');
  if (!wrap) return;
  // Demo notifications
  const notifs = [
    { icon:'💰', text:'আপনার মাসিক সঞ্চয় জমার শেষ তারিখ ১৫ তারিখ।', date: new Date().toISOString(), type:'warning' },
    { icon:'📱', text:'আপনার প্রোফাইল ৪০% সম্পূর্ণ। বাকিটা পূরণ করুন।', date: new Date().toISOString(), type:'info' },
  ];
  wrap.innerHTML = notifs.map(n => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:12px;background:var(--bg-surface-2);margin-bottom:8px;border-left:3px solid ${n.type==='warning'?'var(--clr-warning)':'var(--clr-info)'}">
      <span style="font-size:1.3rem">${n.icon}</span>
      <div style="flex:1">
        <div style="font-size:.88rem;color:var(--text-primary)">${n.text}</div>
        <div style="font-size:.75rem;color:var(--text-muted);margin-top:3px">${fmtDT(n.date)}</div>
      </div>
    </div>`).join('');
}

// ─── Qard Apply from Dashboard ───
function openQardApplyDash() {
  document.getElementById('qardDashModal')?.classList.remove('hidden');
}

async function submitQardDash() {
  const amount = parseFloat(document.getElementById('qdAmount')?.value) || 0;
  const reason = document.getElementById('qdReason')?.value.trim();
  const months = parseInt(document.getElementById('qdMonths')?.value) || 3;
  if (!amount || !reason) { showToast('সব তথ্য দিন।', 'error'); return; }
  if (amount > 15000) { showToast('সর্বোচ্চ ১৫,০০০ টাকা।', 'error'); return; }

  try {
    const res = await fetch(`${_DASH_API}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      body: JSON.stringify({ amount, reason, months, userId: currentUser.id }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      document.getElementById('qardDashModal')?.classList.add('hidden');
      showToast('করজ আবেদন সফল! কমিটি পর্যালোচনা করবে।', 'success');
      return;
    }
  } catch (_) {}
  // Offline
  if (typeof DB !== 'undefined') {
    DB.addLoan({ id: 'QL-' + Date.now(), userId: currentUser.id, amount, reason, months, status: 'applied', remaining: amount, createdAt: new Date().toISOString() });
  }
  document.getElementById('qardDashModal')?.classList.add('hidden');
  showToast('করজ আবেদন সফল!', 'success');
}

// ─── Withdrawal Panel ───
async function loadWithdrawal() {
  const panel = document.getElementById('panel-withdrawal');
  if (!panel) return;

  let savings = [];
  try {
    const res = await fetch(`${_DASH_API}/savings/user/${currentUser.id}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); savings = d.savings || []; }
  } catch (_) {}
  if (!savings.length && typeof DB !== 'undefined') savings = DB.getSavings().filter(s => s.userId === currentUser.id);

  const total = savings.reduce((a, s) => a + (s.amount || 0), 0);

  panel.innerHTML = `
    <h2 style="margin-bottom:20px;font-size:1.5rem">💸 উত্তোলন আবেদন</h2>

    <!-- Withdrawal Policy Notice -->
    <div class="admin-card" style="border-left:4px solid var(--clr-warning);margin-bottom:20px">
      <div class="card-title">📋 উত্তোলন নীতিমালা</div>
      <ul style="font-size:.9rem;color:var(--text-secondary);line-height:2;margin:0;padding-left:18px">
        <li>আংশিক উত্তোলন: ৩০ দিনের পূর্বনোটিশ প্রয়োজন।</li>
        <li>সম্পূর্ণ উত্তোলন: ৬০ দিনের পূর্বনোটিশ প্রয়োজন।</li>
        <li>জরুরি উত্তোলন: কমিটির বিশেষ অনুমোদন প্রয়োজন।</li>
        <li>উত্তোলনের সময় আনুপাতিক হারে মুনাফা হিসাব করা হবে।</li>
        <li>প্রজেক্টে বিনিয়োগকৃত অর্থ উত্তোলনে বিনিয়োগ উঠে আসার পর পাওয়া যাবে।</li>
      </ul>
    </div>

    <!-- Current Balance -->
    <div class="stats-row" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">💰</div>
        <div class="stat-val">৳ ${fmtN(total)}</div>
        <div class="stat-lbl">মোট জমাকৃত অর্থ</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-gold">📊</div>
        <div class="stat-val">${(total / 2000).toFixed(2)}</div>
        <div class="stat-lbl">মোট ইউনিট</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">💵</div>
        <div class="stat-val">হিসাব চলছে</div>
        <div class="stat-lbl">আনুমানিক মুনাফা</div>
      </div>
    </div>

    <!-- Withdrawal Request Form -->
    <div class="admin-card">
      <div class="card-title">📝 উত্তোলন আবেদন করুন</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px" class="responsive-2col">
        <div class="form-group">
          <label class="form-label">উত্তোলনের ধরন <span style="color:var(--clr-danger)">*</span></label>
          <select class="form-select" id="wdType" onchange="updateWithdrawalInfo()">
            <option value="partial">আংশিক উত্তোলন (৩০ দিন নোটিশ)</option>
            <option value="full">সম্পূর্ণ উত্তোলন (৬০ দিন নোটিশ)</option>
            <option value="emergency">জরুরি উত্তোলন (কমিটি অনুমোদন)</option>
          </select>
        </div>
        <div class="form-group" id="wdAmtWrap">
          <label class="form-label">পরিমাণ (৳) <span style="color:var(--clr-danger)">*</span></label>
          <input type="number" class="form-input" id="wdAmount" placeholder="পরিমাণ লিখুন" min="1" max="${total}" oninput="updateWithdrawalInfo()"/>
          <div style="font-size:.75rem;color:var(--text-muted);margin-top:4px">সর্বোচ্চ: ৳ ${fmtN(total)}</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">কারণ ও বিস্তারিত <span style="color:var(--clr-danger)">*</span></label>
        <textarea class="form-textarea" id="wdReason" rows="3" placeholder="উত্তোলনের কারণ বিস্তারিত লিখুন..."></textarea>
      </div>
      <div class="admin-card" id="wdInfo" style="background:var(--bg-surface-2);border:none;margin-bottom:16px;display:none">
        <div id="wdInfoContent" style="font-size:.88rem;color:var(--text-secondary);line-height:2"></div>
      </div>
      <div id="wdAlert" style="display:none;padding:10px 14px;border-radius:8px;font-size:.85rem;margin-bottom:12px"></div>
      <button class="btn btn-primary" onclick="submitWithdrawal()">💸 উত্তোলন আবেদন করুন</button>
    </div>

    <!-- Previous Requests -->
    <div class="admin-card" style="margin-top:20px">
      <div class="card-title">📋 পূর্ববর্তী আবেদন</div>
      <div id="wdHistory">
        <div class="empty-state" style="padding:30px"><div class="empty-state-icon">📋</div><div class="empty-state-title">কোনো পূর্ববর্তী আবেদন নেই</div></div>
      </div>
    </div>`;

  loadWithdrawalHistory();
}

function updateWithdrawalInfo() {
  const type = document.getElementById('wdType')?.value;
  const amount = parseFloat(document.getElementById('wdAmount')?.value) || 0;
  const infoDiv = document.getElementById('wdInfo');
  const infoContent = document.getElementById('wdInfoContent');
  const amtWrap = document.getElementById('wdAmtWrap');
  if (!infoDiv || !infoContent) return;

  if (type === 'full') {
    if (amtWrap) amtWrap.style.display = 'none';
  } else {
    if (amtWrap) amtWrap.style.display = '';
  }

  const notices = {
    partial: `⏳ আংশিক উত্তোলনের জন্য আবেদনের তারিখ থেকে <strong>৩০ দিন</strong> পর কার্যকর হবে।<br>
              💰 উত্তোলনযোগ্য পরিমাণ: <strong>৳ ${fmtN(amount)}</strong><br>
              📅 আনুমানিক তারিখ: <strong>${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('bn-BD')}</strong>`,
    full: `⏳ সম্পূর্ণ উত্তোলনের জন্য আবেদনের তারিখ থেকে <strong>৬০ দিন</strong> পর কার্যকর হবে।<br>
           💰 সম্পূর্ণ জমাকৃত অর্থ + আনুপাতিক মুনাফা পাওয়া যাবে।<br>
           📅 আনুমানিক তারিখ: <strong>${new Date(Date.now() + 60*24*60*60*1000).toLocaleDateString('bn-BD')}</strong>`,
    emergency: `🚨 জরুরি উত্তোলনের জন্য কমিটির বিশেষ অনুমোদন প্রয়োজন।<br>
                📞 কমিটির সাথে সরাসরি যোগাযোগ করুন।<br>
                ⚠️ কারণ যথেষ্ট প্রমাণযোগ্য হতে হবে।`
  };
  infoContent.innerHTML = notices[type] || '';
  infoDiv.style.display = 'block';
}

async function submitWithdrawal() {
  const type = document.getElementById('wdType')?.value;
  const reason = document.getElementById('wdReason')?.value.trim();
  const amount = type === 'full' ? null : parseFloat(document.getElementById('wdAmount')?.value);
  const alertEl = document.getElementById('wdAlert');

  if (!reason) {
    alertEl.style.cssText = 'display:block;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626';
    alertEl.textContent = 'কারণ লিখুন।'; return;
  }
  if (type !== 'full' && (!amount || amount <= 0)) {
    alertEl.style.cssText = 'display:block;background:#fef2f2;border:1px solid #fca5a5;color:#dc2626';
    alertEl.textContent = 'পরিমাণ লিখুন।'; return;
  }

  const request = {
    id: 'WD-' + Date.now(),
    userId: currentUser.id,
    type, amount: amount || 'সম্পূর্ণ',
    reason, status: 'pending',
    requestedAt: new Date().toISOString()
  };

  try {
    const res = await fetch(`${_DASH_API}/savings/withdrawal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      alertEl.style.cssText = 'display:block;background:#f0fdf4;border:1px solid #86efac;color:#16a34a';
      alertEl.textContent = 'উত্তোলন আবেদন সফলভাবে জমা হয়েছে। কমিটি পর্যালোচনা করবে।';
      loadWithdrawalHistory(); return;
    }
  } catch (_) {}

  // Offline: store in localStorage
  const wdList = JSON.parse(localStorage.getItem('bf_withdrawals_' + currentUser.id) || '[]');
  wdList.push(request);
  localStorage.setItem('bf_withdrawals_' + currentUser.id, JSON.stringify(wdList));
  alertEl.style.cssText = 'display:block;background:#f0fdf4;border:1px solid #86efac;color:#16a34a';
  alertEl.textContent = 'উত্তোলন আবেদন জমা হয়েছে।';
  loadWithdrawalHistory();
}

async function loadWithdrawalHistory() {
  const wrap = document.getElementById('wdHistory');
  if (!wrap) return;
  let history = [];
  try {
    const res = await fetch(`${_DASH_API}/savings/withdrawal/user/${currentUser.id}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); history = d.requests || d.withdrawals || []; }
  } catch (_) {}
  if (!history.length) history = JSON.parse(localStorage.getItem('bf_withdrawals_' + currentUser.id) || '[]');

  if (!history.length) {
    wrap.innerHTML = `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📋</div><div class="empty-state-title">কোনো আবেদন নেই</div></div>`;
    return;
  }
  const typeLabel = { partial:'আংশিক', full:'সম্পূর্ণ', emergency:'জরুরি' };
  const stBadge = { pending:'badge-warning', approved:'badge-paid', rejected:'badge-danger', processing:'badge-info' };
  const stLabel = { pending:'পেন্ডিং', approved:'অনুমোদিত', rejected:'প্রত্যাখ্যাত', processing:'প্রক্রিয়াধীন' };
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>আইডি</th><th>ধরন</th><th>পরিমাণ</th><th>কারণ</th><th>তারিখ</th><th>স্ট্যাটাস</th></tr></thead>
    <tbody>${history.sort((a,b) => new Date(b.requestedAt) - new Date(a.requestedAt)).map(r => `
      <tr>
        <td><code style="font-size:.75rem">${r.id?.slice(0,12) || '—'}</code></td>
        <td>${typeLabel[r.type] || r.type || '—'}</td>
        <td style="font-weight:700">${r.amount === 'সম্পূর্ণ' ? 'সম্পূর্ণ' : '৳ ' + fmtN(r.amount)}</td>
        <td style="font-size:.82rem;color:var(--text-muted)">${(r.reason||'').slice(0,50)}${r.reason?.length > 50 ? '...' : ''}</td>
        <td style="font-size:.8rem">${fmtDT(r.requestedAt)}</td>
        <td><span class="badge ${stBadge[r.status] || 'badge-muted'}">${stLabel[r.status] || r.status}</span></td>
      </tr>`).join('')}
    </tbody></table></div>`;
}

// ─── KYC Panel ───
async function loadKyc() {
  const panel = document.getElementById('panel-kyc');
  if (!panel) return;

  let kycData = null;
  try {
    const res = await fetch(`${_DASH_API}/auth/me`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) { const d = await res.json(); kycData = d.kyc || null; }
  } catch (_) {}

  const kycStatus = kycData?.status || 'not_submitted';
  const statusMap = {
    'not_submitted': { label:'জমা দেওয়া হয়নি', color:'badge-muted', icon:'📋', desc:'KYC ডকুমেন্ট এখনো জমা দেওয়া হয়নি।' },
    'submitted':     { label:'জমা দেওয়া হয়েছে', color:'badge-warning', icon:'⏳', desc:'কমিটি পর্যালোচনা করছে।' },
    'under_review':  { label:'পর্যালোচনাধীন', color:'badge-info', icon:'🔍', desc:'আপনার ডকুমেন্ট যাচাই করা হচ্ছে।' },
    'verified':      { label:'যাচাইকৃত', color:'badge-paid', icon:'✅', desc:'আপনার KYC সফলভাবে যাচাই হয়েছে।' },
    'rejected':      { label:'প্রত্যাখ্যাত', color:'badge-danger', icon:'❌', desc:'KYC প্রত্যাখ্যাত। পুনরায় জমা দিন।' },
  };
  const info = statusMap[kycStatus] || statusMap['not_submitted'];

  panel.innerHTML = `
    <h2 style="margin-bottom:20px;font-size:1.5rem">🪪 KYC যাচাই অবস্থা</h2>

    <!-- Status Card -->
    <div class="admin-card" style="border-left:4px solid var(--clr-primary-500);margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:16px">
        <div style="font-size:3rem">${info.icon}</div>
        <div>
          <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">
            <span class="badge ${info.color}">${info.label}</span>
          </div>
          <div style="font-size:.9rem;color:var(--text-secondary)">${info.desc}</div>
          ${kycData?.rejectionReason ? `<div style="font-size:.85rem;color:var(--clr-danger);margin-top:8px;padding:8px;background:#fef2f2;border-radius:8px">প্রত্যাখ্যানের কারণ: ${kycData.rejectionReason}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- KYC Steps -->
    <div class="admin-card" style="margin-bottom:20px">
      <div class="card-title">KYC প্রক্রিয়া</div>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:8px">
        ${[
          { step:1, label:'প্রোফাইল তথ্য পূরণ', done: (currentUser.profileComplete||0) >= 60, link:'profile.html' },
          { step:2, label:'NID/জন্ম নিবন্ধন আপলোড', done: !!kycData?.nidUploaded, link:'profile.html?tab=photo' },
          { step:3, label:'ছবি ও স্বাক্ষর আপলোড', done: !!kycData?.photoUploaded, link:'profile.html?tab=photo' },
          { step:4, label:'কমিটি পর্যালোচনা', done: kycStatus === 'verified', link: null },
        ].map(s => `
          <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg-surface-2);border-radius:10px">
            <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;background:${s.done ? 'var(--clr-primary-500)' : 'var(--bg-surface)'};color:${s.done ? '#fff' : 'var(--text-muted)'};border:2px solid ${s.done ? 'var(--clr-primary-500)' : 'var(--border)'}">
              ${s.done ? '✓' : s.step}
            </div>
            <div style="flex:1;font-size:.9rem;font-weight:${s.done ? '600' : '400'};color:${s.done ? 'var(--text-primary)' : 'var(--text-secondary)'}">
              ${s.label}
            </div>
            ${!s.done && s.link ? `<a href="${s.link}" class="btn btn-sm btn-outline">সম্পন্ন করুন →</a>` : ''}
            ${s.done ? '<span style="color:var(--clr-primary-500);font-size:1.2rem">✅</span>' : ''}
          </div>`).join('')}
      </div>
    </div>

    <!-- Profile Completion -->
    <div class="admin-card">
      <div class="card-title">📊 প্রোফাইল সম্পূর্ণতা</div>
      <div style="margin-top:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:.85rem;font-weight:600">
          <span>প্রোফাইল</span><span>${currentUser.profileComplete || 40}%</span>
        </div>
        <div style="height:10px;background:var(--bg-surface-2);border-radius:100px;overflow:hidden">
          <div style="height:100%;width:${currentUser.profileComplete || 40}%;background:linear-gradient(90deg,var(--clr-primary-400),var(--clr-primary-600));border-radius:100px;transition:width .6s"></div>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <a href="profile.html" class="btn btn-primary btn-sm">✏️ প্রোফাইল আপডেট</a>
          <a href="profile.html?tab=photo" class="btn btn-outline btn-sm">📷 ছবি আপলোড</a>
        </div>
      </div>
    </div>`;
}

// ─── Profit Panel ───
async function loadProfit() {
  const panel = document.getElementById('panel-profit');
  if (!panel) return;

  let profitData = {};
  try {
    const res = await fetch(`${_DASH_API}/reports/profit/user/${currentUser.id}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) profitData = await res.json();
  } catch (_) {}

  const totalDeposit = profitData.totalDeposit || 0;
  const totalProfit  = profitData.totalProfit  || 0;
  const activeDays   = profitData.activeDays   || 0;
  const units        = profitData.units        || (totalDeposit / 2000);
  const profitShare  = profitData.profitShare  || 60;

  panel.innerHTML = `
    <h2 style="margin-bottom:20px;font-size:1.5rem">📈 মুনাফা বিবরণ</h2>

    <!-- Profit Policy Notice -->
    <div class="admin-card" style="border-left:4px solid var(--clr-gold-500);margin-bottom:20px;background:linear-gradient(135deg,rgba(201,162,39,.05),transparent)">
      <div class="card-title" style="color:var(--clr-gold-600)">📜 মুনাফা বণ্টন নীতি</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px;text-align:center" class="responsive-3col">
        <div style="padding:12px;background:var(--bg-surface-2);border-radius:10px">
          <div style="font-size:1.5rem;font-weight:800;color:var(--clr-primary-500)">${profitShare}%</div>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:4px">সদস্য/বিনিয়োগকারী</div>
        </div>
        <div style="padding:12px;background:var(--bg-surface-2);border-radius:10px">
          <div style="font-size:1.5rem;font-weight:800;color:var(--clr-gold-500)">5%</div>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:4px">চ্যারিটি ফান্ড</div>
        </div>
        <div style="padding:12px;background:var(--bg-surface-2);border-radius:10px">
          <div style="font-size:1.5rem;font-weight:800;color:var(--clr-info)">35%</div>
          <div style="font-size:.8rem;color:var(--text-muted);margin-top:4px">সংগঠন ফান্ড</div>
        </div>
      </div>
      <p style="font-size:.8rem;color:var(--text-muted);margin-top:12px;line-height:1.7">
        মুনাফা গণনা শুরু হয় যখন আপনার জমাকৃত অর্থ কোনো প্রজেক্ট বা পণ্য বিক্রয়ে সক্রিয়ভাবে ব্যবহৃত হয়।
        ইউনিট হিসাবে (প্রতি ৳২,০০০ = ১ ইউনিট) আনুপাতিক হারে মুনাফা বণ্টন করা হয়।
      </p>
    </div>

    <!-- My Profit Stats -->
    <div class="stats-row" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">💰</div>
        <div class="stat-val">৳ ${fmtN(totalDeposit)}</div>
        <div class="stat-lbl">মোট বিনিয়োগ</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-gold">📊</div>
        <div class="stat-val">${parseFloat(units).toFixed(2)}</div>
        <div class="stat-lbl">মোট ইউনিট</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">📈</div>
        <div class="stat-val">৳ ${fmtN(totalProfit)}</div>
        <div class="stat-lbl">আনুমানিক মুনাফা</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">🗓️</div>
        <div class="stat-val">${activeDays || '—'}</div>
        <div class="stat-lbl">সক্রিয় দিন</div>
      </div>
    </div>

    <!-- Profit calculation explanation -->
    <div class="admin-card" style="margin-bottom:20px">
      <div class="card-title">🧮 আপনার মুনাফা হিসাব</div>
      <div style="font-size:.9rem;color:var(--text-secondary);line-height:2;margin-top:8px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="padding:10px;background:var(--bg-surface-2);border-radius:8px">
            <div style="font-size:.75rem;color:var(--text-muted)">আপনার বিনিয়োগ</div>
            <div style="font-weight:700;color:var(--text-primary)">৳ ${fmtN(totalDeposit)}</div>
          </div>
          <div style="padding:10px;background:var(--bg-surface-2);border-radius:8px">
            <div style="font-size:.75rem;color:var(--text-muted)">ইউনিট সংখ্যা</div>
            <div style="font-weight:700;color:var(--text-primary)">${parseFloat(units).toFixed(2)} ইউনিট (প্রতি ৳২,০০০ = ১ ইউনিট)</div>
          </div>
          <div style="padding:10px;background:var(--bg-surface-2);border-radius:8px">
            <div style="font-size:.75rem;color:var(--text-muted)">মুনাফার ভাগ</div>
            <div style="font-weight:700;color:var(--clr-primary-500)">${profitShare}% (নিট মুনাফার)</div>
          </div>
          <div style="padding:10px;background:var(--bg-surface-2);border-radius:8px">
            <div style="font-size:.75rem;color:var(--text-muted)">আনুমানিক মুনাফা</div>
            <div style="font-weight:700;color:var(--clr-gold-600)">৳ ${fmtN(totalProfit)}</div>
          </div>
        </div>
        <div style="padding:12px;background:rgba(29,158,117,.08);border-radius:8px;font-size:.82rem;border:1px solid rgba(29,158,117,.2)">
          ⚠️ <strong>গুরুত্বপূর্ণ:</strong> মুনাফার পরিমাণ ব্যবসায়িক আয়ের উপর নির্ভরশীল। প্রকৃত মুনাফা নির্ধারণে পরিচালন ব্যয় বাদ দিয়ে নিট মুনাফা হিসাব করা হয়।
          মূলধন সর্বদা সুরক্ষিত — কোনো প্রমাণযোগ্য ব্যবসায়িক ক্ষতি না হলে মূল অর্থ ফেরত নিশ্চিত।
        </div>
      </div>
    </div>

    <!-- Profit History -->
    <div class="admin-card">
      <div class="card-title">📋 মুনাফা ইতিহাস</div>
      <div id="profitHistory" style="margin-top:8px">
        ${profitData.history?.length ? `
          <div class="table-wrap"><table>
            <thead><tr><th>মাস/প্রজেক্ট</th><th>বিনিয়োগ</th><th>মুনাফা</th><th>তারিখ</th><th>স্ট্যাটাস</th></tr></thead>
            <tbody>${(profitData.history||[]).map(h => `
              <tr>
                <td>${h.label || h.project || '—'}</td>
                <td>৳ ${fmtN(h.investment)}</td>
                <td style="color:var(--clr-primary-500);font-weight:700">৳ ${fmtN(h.profit)}</td>
                <td style="font-size:.8rem">${fmtDT(h.date)}</td>
                <td><span class="badge badge-${h.status === 'distributed' ? 'paid' : 'pending'}">${h.status === 'distributed' ? 'বণ্টিত' : 'প্রক্রিয়াধীন'}</span></td>
              </tr>`).join('')}
            </tbody></table></div>` :
          `<div class="empty-state" style="padding:30px"><div class="empty-state-icon">📈</div><div class="empty-state-title">এখনো মুনাফা বণ্টন হয়নি</div><div class="empty-state-sub">প্রথম মুনাফা বণ্টনের পর এখানে দেখাবে।</div></div>`}
      </div>
    </div>`;
}
