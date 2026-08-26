// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — USER DASHBOARD JS
// ═══════════════════════════════════════════════════════════

const API = 'http://localhost:3001/api';
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
    const res = await fetch(`${API}/auth/me`, {
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
    const res = await fetch(`${API}/reports/dashboard`, {
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
    const res = await fetch(`${API}/audit/live?n=10`, {
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
    { label: 'পেন্ডিং সদস্য আবেদন', val: stats.pendingApplications, icon: '📝', link: '../admin/admin.html' },
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
    const res = await fetch(`${API}/savings/user/${currentUser.id}`, {
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
    const res = await fetch(`${API}/loans/user/${currentUser.id}`, {
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
    const res = await fetch(`${API}/orders/user/${currentUser.phone}`, {
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
    const res = await fetch(`${API}/users`, {
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
    await fetch(`${API}/users/${userId}/role`, {
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
    const res = await fetch(`${API}/loans`, {
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
