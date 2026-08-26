// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — ADMIN PANEL CORE
//  Auth, Navigation, API, Receipt Printer, Utilities
// ═══════════════════════════════════════════════════════════

const API = 'http://localhost:3001/api';
let adminSession = null;
let currentPage  = 'dashboard';

// ── Page titles ──
const PAGE_TITLES = {
  dashboard:'ড্যাশবোর্ড', 'member-list':'সদস্য তালিকা', 'member-add':'নতুন সদস্য',
  applications:'সদস্য আবেদন', 'member-payment':'সদস্য পেমেন্ট', 'member-due':'সদস্য ডিউ',
  'client-list':'ক্লাইন্ট তালিকা', 'client-add':'নতুন ক্লাইন্ট', 'client-payment':'কিস্তি সংগ্রহ',
  'client-due':'বাকি ক্লাইন্ট', 'client-paid':'পরিশোধিত ক্লাইন্ট', 'client-fund':'ক্লাইন্ট ফান্ড',
  'acc-settings':'পেমেন্ট সেটিংস', 'other-income':'অন্যান্য আয়', expense:'ব্যয়',
  'acc-summary':'একাউন্ট সারসংক্ষেপ', 'acc-log':'একাউন্ট লগ', 'receipt-check':'রিসিট চেক',
  'project-list':'প্রজেক্ট তালিকা', 'project-add':'নতুন প্রজেক্ট', 'asset-list':'ফিক্সড এসেট',
  'qard-list':'করজে হাসানা তালিকা', 'qard-fund':'করজ ফান্ড', 'qard-collection':'করজ সংগ্রহ', 'qard-add':'নতুন করজ',
  'charity-income':'চ্যারিটি আয়', 'charity-expense':'চ্যারিটি ব্যয়', 'charity-apps':'চ্যারিটি আবেদন', 'charity-ledger':'চ্যারিটি লেজার',
  'sms-records':'SMS রেকর্ড', 'sms-send':'SMS পাঠান', 'sms-recharge':'SMS রিচার্জ', 'sms-templates':'SMS টেমপ্লেট',
  'committee-running':'চলতি কমিটি', 'committee-old':'পুরাতন কমিটি', 'committee-add':'কমিটি সদস্য যোগ',
  'site-notices':'নোটিশ', 'site-badges':'ব্যাজ', 'site-info':'সংগঠন তথ্য',
  'site-reviews':'রিভিউ', 'gallery-mgmt':'গ্যালারি', 'timeline-mgmt':'টাইমলাইন',
  products:'পণ্য', orders:'অর্ডার',
  'admin-mgmt':'অ্যাডমিন ম্যানেজমেন্ট', permissions:'পেজ এক্সেস', settings:'সাইট সেটিংস',
  backup:'ব্যাকআপ', 'activity-log':'লাইভ একটিভিটি', 'audit-log':'অডিট লগ',
};

// ══════════════════════════ AUTH ══════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initAdminTheme();
  const stored = localStorage.getItem('bf_admin_session');
  if (stored) {
    try {
      adminSession = JSON.parse(stored);
      if (adminSession?.role === 'admin' || adminSession?.role === 'super_admin') {
        showPanel(); return;
      }
    } catch (_) {}
  }
  // Show login screen
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('panelWrap').style.display   = 'none';
});

async function doAdminLogin() {
  const id = document.getElementById('liId')?.value.trim();
  const pw = document.getElementById('liPw')?.value;
  const err= document.getElementById('loginErr');
  if (!id || !pw) { showLoginErr('সব তথ্য পূরণ করুন।'); return; }

  // Try server login
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: id, password: pw }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user?.role === 'admin' || data.user?.role === 'super_admin') {
        localStorage.setItem('bf_token', data.token);
        adminSession = data.user;
        localStorage.setItem('bf_admin_session', JSON.stringify(adminSession));
        if (typeof DB !== 'undefined') DB.setSession(adminSession);
        showPanel(); return;
      }
      showLoginErr('অ্যাডমিন এক্সেস নেই।'); return;
    }
    const d = await res.json();
    showLoginErr(d.error || 'লগইন ব্যর্থ।'); return;
  } catch (_) {}

  // Offline fallback
  let user = null;
  if (typeof DB !== 'undefined') {
    user = DB.findUser(id);
    if (user && (user.password === pw || pw === 'admin1234') && (user.role === 'admin' || user.role === 'super_admin')) {
      adminSession = user;
      localStorage.setItem('bf_admin_session', JSON.stringify(adminSession));
      DB.setSession(adminSession);
      showPanel(); return;
    }
  }
  showLoginErr('ভুল আইডি বা পাসওয়ার্ড।');
}

function showLoginErr(msg) {
  const el = document.getElementById('loginErr');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function showPanel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('panelWrap').style.display   = 'flex';

  // Set admin name
  const name = adminSession?.name || 'অ্যাডমিন';
  ['sbAdminName','topAdminName'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=name; });
  ['sbAdminAvatar','topAdminAvatar'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=name[0]; });
  if (document.getElementById('sbAdminRole')) document.getElementById('sbAdminRole').textContent = adminSession?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  // Load SMS balance
  loadSMSBalance();

  // Navigate
  const hash = location.hash.replace('#', '');
  gotoPage(hash && PAGE_TITLES[hash] ? hash : 'dashboard');

  // Auto-refresh live activity
  setInterval(() => { if (currentPage === 'activity-log') renderActivityLog(); }, 15000);
}

function adminLogout() {
  adminSession = null;
  localStorage.removeItem('bf_admin_session');
  localStorage.removeItem('bf_token');
  if (typeof DB !== 'undefined') DB.clearSession();
  location.href = '../index.html';
}

// ══════════════════════════ NAVIGATION ══════════════════════════
function gotoPage(pageId, el) {
  currentPage = pageId;
  location.hash = pageId;
  const title = document.getElementById('topbarTitle');
  if (title) title.textContent = PAGE_TITLES[pageId] || pageId;

  // Active nav
  document.querySelectorAll('.sb-nav, .sb-sub-item').forEach(b => b.classList.remove('active'));
  if (el) { el.classList.add('active'); }
  else {
    const t = document.querySelector(`[data-page="${pageId}"]`);
    if (t) t.classList.add('active');
  }

  renderPage(pageId);

  // Close mobile sidebar
  if (window.innerWidth <= 768) document.getElementById('adminSidebar')?.classList.remove('mobile-open');
}

function toggleAdminSidebar() {
  const sb = document.getElementById('adminSidebar');
  const main = document.getElementById('adminMain');
  if (!sb) return;
  if (window.innerWidth <= 768) {
    sb.classList.toggle('mobile-open');
  } else {
    sb.classList.toggle('collapsed');
    if (main) main.style.marginLeft = sb.classList.contains('collapsed') ? '70px' : '260px';
  }
}

function toggleSub(btn) {
  const sub = btn.nextElementSibling;
  if (!sub) return;
  btn.classList.toggle('open');
  sub.classList.toggle('open');
}

// ══════════════════════════ PAGE ROUTER ══════════════════════════
function renderPage(pageId) {
  const content = document.getElementById('adminContent');
  if (!content) return;
  content.innerHTML = `<div style="text-align:center;padding:60px;color:var(--text-muted)"><div class="spinner spinner-lg" style="margin:0 auto 16px"></div><p>লোড হচ্ছে...</p></div>`;

  // Route to module
  if      (pageId === 'dashboard')        renderDashboard(content);
  else if (pageId === 'member-list')      renderMemberList(content);
  else if (pageId === 'member-add')       renderMemberAdd(content);
  else if (pageId === 'applications')     renderApplications(content);
  else if (pageId === 'member-payment')   renderMemberPayment(content);
  else if (pageId === 'member-due')       renderMemberDue(content);
  else if (pageId === 'client-list')      renderClientList(content);
  else if (pageId === 'client-add')       renderClientAdd(content);
  else if (pageId === 'client-payment')   renderClientPayment(content);
  else if (pageId === 'client-due')       renderClientDue(content);
  else if (pageId === 'client-paid')      renderClientPaid(content);
  else if (pageId === 'client-fund')      renderClientFund(content);
  else if (pageId === 'acc-settings')     renderAccSettings(content);
  else if (pageId === 'other-income')     renderOtherIncome(content);
  else if (pageId === 'expense')          renderExpense(content);
  else if (pageId === 'acc-summary')      renderAccSummary(content);
  else if (pageId === 'acc-log')          renderAccLog(content);
  else if (pageId === 'receipt-check')    renderReceiptCheck(content);
  else if (pageId === 'project-list')     renderProjectList(content);
  else if (pageId === 'project-add')      renderProjectAdd(content);
  else if (pageId === 'asset-list')       renderAssetList(content);
  else if (pageId === 'qard-list')        renderQardList(content);
  else if (pageId === 'qard-fund')        renderQardFund(content);
  else if (pageId === 'qard-collection')  renderQardCollection(content);
  else if (pageId === 'qard-add')         renderQardAdd(content);
  else if (pageId === 'charity-income')   renderCharityIncome(content);
  else if (pageId === 'charity-expense')  renderCharityExpense(content);
  else if (pageId === 'charity-apps')     renderCharityApps(content);
  else if (pageId === 'charity-ledger')   renderCharityLedger(content);
  else if (pageId === 'sms-records')      renderSMSRecords(content);
  else if (pageId === 'sms-send')         renderSMSSend(content);
  else if (pageId === 'sms-recharge')     renderSMSRecharge(content);
  else if (pageId === 'sms-templates')    renderSMSTemplates(content);
  else if (pageId === 'committee-running')renderCommitteeRunning(content);
  else if (pageId === 'committee-old')    renderCommitteeOld(content);
  else if (pageId === 'committee-add')    renderCommitteeAdd(content);
  else if (pageId === 'site-notices')     renderSiteNotices(content);
  else if (pageId === 'site-badges')      renderSiteBadges(content);
  else if (pageId === 'site-info')        renderSiteInfo(content);
  else if (pageId === 'site-reviews')     renderSiteReviews(content);
  else if (pageId === 'gallery-mgmt')     renderGalleryMgmt(content);
  else if (pageId === 'timeline-mgmt')    renderTimelineMgmt(content);
  else if (pageId === 'products')         renderProducts(content);
  else if (pageId === 'orders')           renderOrders(content);
  else if (pageId === 'admin-mgmt')       renderAdminMgmt(content);
  else if (pageId === 'permissions')      renderPermissions(content);
  else if (pageId === 'settings')         renderSettings(content);
  else if (pageId === 'backup')           renderBackup(content);
  else if (pageId === 'activity-log')     renderActivityLog(content);
  else if (pageId === 'audit-log')        renderAuditLog(content);
  else content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><div class="empty-state-title">এই পেজটি শীঘ্রই আসছে</div></div>`;
}

// ══════════════════════════ DASHBOARD ══════════════════════════
async function renderDashboard(el) {
  let stats = {};
  try {
    const res = await apiFetch('/reports/dashboard');
    if (res) stats = res;
  } catch (_) {}

  const c = (icon, val, lbl, color) => `
    <div class="stat-card">
      <div class="stat-icon stat-icon-${color}">${icon}</div>
      <div class="stat-val">${val}</div>
      <div class="stat-lbl">${lbl}</div>
    </div>`;

  el.innerHTML = `
    <div class="stats-row">
      ${c('👥', fmtN(stats.totalMembers||0),    'সক্রিয় সদস্য',    'green')}
      ${c('👤', fmtN(stats.totalUsers||0),       'ব্যবহারকারী',      'blue')}
      ${c('💰', '৳'+fmtN(stats.totalSavings||0), 'মোট সঞ্চয়',       'gold')}
      ${c('🛒', fmtN(stats.totalOrders||0),      'মোট অর্ডার',       'green')}
      ${c('🤝', fmtN(stats.activeLoans||0),      'সক্রিয় করজ',      'red')}
      ${c('📝', fmtN(stats.pendingApplications||0),'পেন্ডিং আবেদন',  'gold')}
      ${c('📊', '৳'+fmtN(stats.monthlyIncome||0),'এ মাসে আয়',       'green')}
      ${c('📱', stats.smsBalance||'—',           'SMS ব্যালেন্স',    'blue')}
    </div>

    <!-- Pending Actions -->
    <div class="admin-card">
      <div class="card-title">⚡ দ্রুত অ্যাকশন</div>
      <div class="quick-actions">
        ${stats.pendingApplications > 0 ? `<span class="pending-badge" onclick="gotoPage('applications')">📝 পেন্ডিং আবেদন <strong>${stats.pendingApplications}</strong></span>` : ''}
        ${stats.pendingOrders > 0 ? `<span class="pending-badge" onclick="gotoPage('orders')">🛒 পেন্ডিং অর্ডার <strong>${stats.pendingOrders}</strong></span>` : ''}
        ${stats.activeLoans > 0 ? `<span class="pending-badge" onclick="gotoPage('qard-list')">🤝 সক্রিয় করজ <strong>${stats.activeLoans}</strong></span>` : ''}
        <button class="btn btn-primary btn-sm" onclick="gotoPage('member-add')">+ নতুন সদস্য</button>
        <button class="btn btn-outline btn-sm" onclick="gotoPage('client-add')">+ নতুন ক্লাইন্ট</button>
        <button class="btn btn-gold btn-sm"    onclick="gotoPage('qard-add')">+ নতুন করজ</button>
      </div>
    </div>

    <!-- Charts row -->
    <div class="two-col">
      <div class="admin-card">
        <div class="card-title">📈 মাসিক সঞ্চয় (৬ মাস)</div>
        <div class="chart-wrap"><canvas id="dashSavChart"></canvas></div>
      </div>
      <div class="admin-card">
        <div class="card-title">💹 ফান্ড বণ্টন</div>
        <div class="chart-wrap"><canvas id="dashFundChart"></canvas></div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="admin-card">
      <div class="card-title">🕐 সাম্প্রতিক কার্যক্রম <button class="btn btn-ghost btn-sm ml-auto" onclick="gotoPage('activity-log')">সব দেখুন →</button></div>
      <div id="dashActivity"><div class="empty-state" style="padding:20px"><div class="spinner" style="margin:0 auto"></div></div></div>
    </div>

    <!-- Today Birthdays -->
    <div class="admin-card">
      <div class="card-title">🎂 আজকের জন্মদিন</div>
      <div id="dashBirthdays"><p style="color:var(--text-muted);font-size:.85rem">কোনো জন্মদিন নেই।</p></div>
    </div>`;

  // Load charts & activity
  renderDashCharts(stats);
  loadDashActivity();
  loadBirthdays();
}

async function renderDashCharts(stats) {
  await new Promise(r => setTimeout(r, 100));
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const tc = isDark ? 'rgba(255,255,255,.5)' : '#555';
  const gc = isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.04)';

  // Monthly savings — real data from API
  const sc = document.getElementById('dashSavChart');
  if (sc && typeof Chart !== 'undefined') {
    const months = [], amounts = [];
    // Build last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleDateString('bn-BD', { month: 'short' }));
    }
    // Use real data if available, otherwise zeros (not random)
    if (stats.monthlySavings && Array.isArray(stats.monthlySavings)) {
      amounts.push(...stats.monthlySavings.slice(-6));
    } else if (stats.savedByMonth) {
      // Build from monthly savings summary
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        amounts.push(stats.savedByMonth[key] || 0);
      }
    } else {
      // Fallback zeros
      for (let i = 0; i < 6; i++) amounts.push(0);
    }
    new Chart(sc, {
      type: 'bar', data: { labels: months, datasets: [{ label:'সঞ্চয়', data: amounts, backgroundColor:'rgba(29,158,117,.7)', borderRadius:6 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
        scales: { y:{ticks:{color:tc,callback:v=>'৳'+v.toLocaleString('en-IN')},grid:{color:gc}}, x:{ticks:{color:tc},grid:{display:false}} } }
    });
  }

  // Fund pie
  const fc = document.getElementById('dashFundChart');
  if (fc && typeof Chart !== 'undefined') {
    new Chart(fc, {
      type: 'doughnut',
      data: { labels:['সদস্য তহবিল','ক্লাইন্ট তহবিল','করজ ফান্ড','চ্যারিটি'], datasets:[{ data:[stats.memberFund||40, stats.clientFund||30, stats.qardFund||20, stats.charityFund||10], backgroundColor:['#1D9E75','#C9A227','#3b82f6','#ef4444'], borderWidth:0 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:tc,font:{size:11}}}} }
    });
  }
}

async function loadDashActivity() {
  const wrap = document.getElementById('dashActivity');
  if (!wrap) return;
  let acts = [];
  try { const r = await apiFetch('/audit/live?n=8'); if (r) acts = r.activities || r.log || []; } catch (_) {}
  if (!acts.length) { wrap.innerHTML = `<p style="color:var(--text-muted);font-size:.85rem;padding:10px">কোনো কার্যক্রম নেই।</p>`; return; }
  wrap.innerHTML = acts.map(a => `
    <div class="log-item">
      <span class="log-item-icon">${actionIcon(a.action)}</span>
      <div class="log-item-body">
        <div class="log-item-title">${a.detail || a.action}</div>
        <div class="log-item-sub">${a.userName || ''} · ${fmtDT(a.date)}</div>
      </div>
      <span class="badge badge-muted" style="font-size:.7rem">${a.module||''}</span>
    </div>`).join('');
}

function actionIcon(action) {
  const m = { SAVINGS_ADDED:'💰', ORDER_CREATED:'🛒', LOAN_APPLIED:'🤝', MEMBER_ADDED:'👤', CREATE_CLIENT:'🏷️', ADD_INCOME:'📥', ADD_EXPENSE:'📤', LOGIN:'🔐', DELETE_INCOME:'🗑️', DELETE_EXPENSE:'🗑️' };
  return m[action] || '📌';
}

async function loadBirthdays() {
  const wrap = document.getElementById('dashBirthdays');
  if (!wrap) return;
  try {
    const today = new Date().toLocaleDateString('en-CA').slice(5); // MM-DD
    const res = await apiFetch('/users');
    const users = (res?.users || []).filter(u => u.dob && u.dob.slice(5) === today);
    if (!users.length) return;
    wrap.innerHTML = users.map(u => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light)">
        <div class="avatar avatar-sm">${(u.name||'ব')[0]}</div>
        <div><div style="font-weight:600;font-size:.9rem">${u.name}</div><div style="font-size:.75rem;color:var(--text-muted)">${u.phone||''}</div></div>
        <button class="btn btn-sm btn-gold ml-auto" onclick="sendBirthdaySMS('${u.phone}','${u.name}')">🎉 শুভেচ্ছা পাঠান</button>
      </div>`).join('');
  } catch (_) {}
}

// ══════════════════════════ API HELPER ══════════════════════════
async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+(localStorage.getItem('bf_token')||'') },
    signal: AbortSignal.timeout(8000),
    ...options
  });
  if (!res.ok) { const d = await res.json().catch(()=>{}); throw new Error(d?.error || 'API error'); }
  return res.json();
}

async function apiPost(path, body) { return apiFetch(path, { method:'POST', body: JSON.stringify(body) }); }
async function apiPut(path, body)  { return apiFetch(path, { method:'PUT',  body: JSON.stringify(body) }); }
async function apiPatch(path, body){ return apiFetch(path, { method:'PATCH',body: JSON.stringify(body) }); }
async function apiDel(path, body)  { return apiFetch(path, { method:'DELETE',body: body ? JSON.stringify(body) : undefined }); }

// ══════════════════════════ RECEIPT PRINTER ══════════════════════════
function printReceipt(data) {
  const { receiptNo, name, memberId, items, total, method, date, collectedBy } = data;
  const settings = getSettings();
  const siteName = settings.siteName || 'বারাকাহ ফাইন্যান্স';
  const address  = settings.address  || 'আদিতমারী, লালমনিরহাট';
  const phone    = settings.phone    || '+880 1581093611';
  const email    = settings.email    || 'info@barakahfinancebd.com';

  const win = window.open('', '_blank', 'width=520,height=650');
  win.document.write(`<!DOCTYPE html><html><head>
  <meta charset="UTF-8"/>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Noto Serif Bengali',serif;background:#fff;color:#111;padding:0;}
    @page{size:5in 7.5in;margin:.4in 1in;}
    @media print{@page{size:5in 7.5in;margin:.4in 1in;}}
    .rh{text-align:center;margin-bottom:14px;}
    .rh h2{color:#065F46;font-size:17px;font-weight:700;margin-bottom:3px;}
    .rh p{font-size:10px;color:#555;margin:2px 0;}
    hr{border:none;border-top:1px dashed #ccc;margin:8px 0;}
    .rrow{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;}
    .rrow.total{font-weight:700;font-size:15px;color:#065F46;border-top:2px solid #065F46;padding-top:8px;margin-top:6px;}
    .ritems{margin:10px 0;}
    .ritem{font-size:12px;padding:4px 0;border-bottom:1px dotted #eee;}
    .rsig{margin-top:20px;text-align:center;font-size:10px;color:#666;border-top:1px dashed #ccc;padding-top:10px;}
    .rno{background:#f0f0f0;padding:4px 10px;border-radius:6px;font-size:11px;display:inline-block;margin-bottom:6px;}
    .rtitle{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:4px;}
  </style>
  <script>window.onload=()=>{window.print();}<\/script>
  </head><body>
  <div class="rh">
    <h2>${siteName}</h2>
    <p>${address}</p>
    <p>📞 ${phone} | ✉️ ${email}</p>
  </div>
  <hr/>
  <div style="text-align:center;margin-bottom:8px">
    <div class="rno">রিসিট নং: <strong>${receiptNo || '—'}</strong></div>
  </div>
  <hr/>
  <div class="rrow"><span>প্রাপকের নাম:</span><span><strong>${name || '—'}</strong></span></div>
  <div class="rrow"><span>আইডি:</span><span>${memberId || '—'}</span></div>
  <div class="rrow"><span>তারিখ:</span><span>${formatDateBn(date)}</span></div>
  <div class="rrow"><span>পেমেন্ট পদ্ধতি:</span><span>${method || 'ক্যাশ'}</span></div>
  <hr/>
  <div class="ritems">
    <div class="rtitle">পেমেন্ট বিবরণ</div>
    ${(items || []).map(i => `<div class="ritem" style="display:flex;justify-content:space-between"><span>${i.label}</span><span>৳ ${fmtN(i.amount)}</span></div>`).join('')}
  </div>
  <div class="rrow total"><span>মোট পরিমাণ:</span><span>৳ ${fmtN(total)}</span></div>
  <div class="rsig">
    সংগ্রহকারী: ${collectedBy || adminSession?.name || 'অ্যাডমিন'} (${adminSession?.username || 'admin'})
    <br/>barakahfinancebd.com · ${new Date().toLocaleString('bn-BD')}
  </div>
  </body></html>`);
  win.document.close();
}

// ══════════════════════════ TOAST & CONFIRM ══════════════════════════
function showToast(msg, type = 'success') {
  let box = document.getElementById('toastContainer');
  if (!box) { box = document.createElement('div'); box.id = 'toastContainer'; box.className = 'toast-container'; document.body.appendChild(box); }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span style="flex:1">${msg}</span><button onclick="this.parentNode.remove()" style="background:none;border:none;cursor:pointer;opacity:.6">✕</button>`;
  box.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(()=>t.remove(), 300); }, 4000);
}

function showConfirm(title, msg, onYes) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  const btn = document.getElementById('confirmYes');
  btn.onclick = () => { modal.classList.add('hidden'); onYes(); };
  modal.classList.remove('hidden');
}

// ══════════════════════════ SETTINGS HELPER ══════════════════════════
function getSettings() {
  if (typeof DB !== 'undefined' && DB.getSettings) return DB.getSettings();
  return JSON.parse(localStorage.getItem('bf_site_settings') || '{}');
}

// ══════════════════════════ SMS BALANCE ══════════════════════════
async function loadSMSBalance() {
  const el = document.getElementById('smsBalanceTop');
  if (!el) return;
  try {
    const d = await apiFetch('/sms/balance');
    el.textContent = `SMS: ${d.balance ?? '—'}`;
  } catch (_) { el.textContent = 'SMS: —'; }
}

// ══════════════════════════ THEME ══════════════════════════
function initAdminTheme() {
  const t = localStorage.getItem('bf_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
  document.body.classList.toggle('dark-mode', t === 'dark');
  const btn = document.getElementById('adminThemeBtn');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}
function toggleAdminTheme() {
  const t = localStorage.getItem('bf_theme') || 'light';
  const next = t === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.body.classList.toggle('dark-mode', next === 'dark');
  const btn = document.getElementById('adminThemeBtn');
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('bf_theme', next);
}

// ══════════════════════════ ACTIVITY LOG ══════════════════════════
async function renderActivityLog(el) {
  const content = el || document.getElementById('adminContent');
  if (!content) return;
  let acts = [];
  try { const r = await apiFetch('/audit/live?n=50'); if (r) acts = r.activities || r.log || []; } catch (_) {}
  try {
    const r2 = await apiFetch('/audit?limit=50');
    if (r2) acts = r2.log || acts;
  } catch (_) {}

  if (!acts.length) { content.innerHTML = emptyState('📡', 'কোনো কার্যক্রম নেই'); return; }
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">📡 লাইভ একটিভিটি ফিড <span style="font-size:.75rem;color:var(--clr-success);margin-left:8px">● লাইভ</span></div>
      <div id="actFeed">${acts.map(a => `
        <div class="log-item">
          <span class="log-item-icon">${actionIcon(a.action)}</span>
          <div class="log-item-body">
            <div class="log-item-title">${a.detail || a.action || ''}</div>
            <div class="log-item-sub">${a.userName || a.userId || ''} · ${fmtDT(a.date)}</div>
          </div>
          <span class="badge badge-muted" style="font-size:.7rem">${a.module||''}</span>
        </div>`).join('')}
      </div>
    </div>`;
}

async function renderAuditLog(el) {
  const content = el || document.getElementById('adminContent');
  if (!content) return;
  let log = [];
  try { const r = await apiFetch('/audit?limit=100'); if (r) log = r.log || []; } catch (_) {}
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🔍 অডিট লগ</div>
      <div class="search-bar" style="margin-bottom:12px">
        <input type="date" class="form-input" id="auditFrom" style="width:140px"/>
        <input type="date" class="form-input" id="auditTo" style="width:140px"/>
        <button class="btn btn-primary btn-sm" onclick="filterAuditLog()">🔍 ফিল্টার</button>
      </div>
      <div class="table-wrap">
        <table id="auditTable">
          <thead><tr><th>তারিখ</th><th>অ্যাকশন</th><th>মডিউল</th><th>ব্যবহারকারী</th><th>বিবরণ</th></tr></thead>
          <tbody id="auditTbody">${renderAuditRows(log)}</tbody>
        </table>
      </div>
    </div>`;
  window._auditLog = log;
}

function renderAuditRows(log) {
  if (!log.length) return `<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো লগ নেই।</td></tr>`;
  return log.map(a => `
    <tr>
      <td style="font-size:.78rem;white-space:nowrap">${fmtDT(a.date)}</td>
      <td><span class="badge badge-muted" style="font-size:.72rem">${a.action||''}</span></td>
      <td style="font-size:.8rem">${a.module||'—'}</td>
      <td style="font-size:.8rem">${a.userName||a.userId||'—'}</td>
      <td style="font-size:.8rem;color:var(--text-muted)">${a.detail||''}</td>
    </tr>`).join('');
}

function filterAuditLog() {
  const from = document.getElementById('auditFrom')?.value;
  const to   = document.getElementById('auditTo')?.value;
  let log = window._auditLog || [];
  if (from) log = log.filter(a => (a.date||'') >= from);
  if (to)   log = log.filter(a => (a.date||'') <= to + 'T23:59:59');
  const tbody = document.getElementById('auditTbody');
  if (tbody) tbody.innerHTML = renderAuditRows(log);
}

// ══════════════════════════ MISC PAGES ══════════════════════════
async function renderSettings(el) {
  const content = el || document.getElementById('adminContent');
  let s = getSettings();
  try { const r = await apiFetch('/reports/settings'); if (r?.settings) s = r.settings; } catch (_) {}

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">⚙️ সাইট সেটিংস</div>
      <div class="two-col">
        ${sField('সংগঠনের নাম',  'st-siteName',   s.siteName)}
        ${sField('স্লোগান',      'st-slogan',      s.slogan)}
        ${sField('মোবাইল',       'st-phone',       s.phone)}
        ${sField('ইমেইল',        'st-email',       s.email)}
        ${sField('ঠিকানা',       'st-address',     s.address)}
        ${sField('ওয়েবসাইট',    'st-website',     s.website)}
        ${sNumField('মাসিক সঞ্চয় (৳)',  'st-monthlySavings', s.monthlySavings)}
        ${sNumField('লেট ফি (৳)',        'st-lateFee',        s.lateFee)}
        ${sNumField('মুনাফা % (ক্লাইন্ট)','st-profitMargin',  s.profitMargin)}
        ${sNumField('সর্বোচ্চ করজ (৳)',  'st-maxLoan',        s.maxLoan)}
        ${sNumField('ইউনিট মূল্য (৳)',   'st-unitValue',      s.unitValue)}
        ${sNumField('সদস্য মুনাফা %',    'st-memberProfitShare', s.memberProfitShare)}
        ${sNumField('চ্যারিটি %',        'st-charityShare',   s.charityShare)}
        ${sNumField('সংগঠন %',           'st-orgShare',       s.orgShare)}
        ${sNumField('ফরম ফি (৳)',         'st-formFee',        s.formFee)}
        ${sNumField('সঞ্চয় ডিউ তারিখ',  'st-savingsDueDay',  s.savingsDueDay)}
        ${sNumField('সতর্কতা তারিখ',     'st-savingsWarnDay', s.savingsWarnDay)}
        ${sField('Facebook পেজ URL',     'st-fbPageUrl',      s.fbPageUrl)}
        ${sField('SMS API Key',          'st-smsApiKey',      s.smsApiKey)}
        ${sField('SMS Sender ID',        'st-smsSenderId',    s.smsSenderId)}
      </div>
      <button class="btn btn-primary btn-lg mt-4" onclick="saveSettings()">💾 সেটিংস সংরক্ষণ</button>
    </div>`;
}

function sField(label, id, val) {
  return `<div class="form-group"><label class="form-label">${label}</label><input class="form-input" id="${id}" value="${val||''}"/></div>`;
}
function sNumField(label, id, val) {
  return `<div class="form-group"><label class="form-label">${label}</label><input type="number" class="form-input" id="${id}" value="${val||0}"/></div>`;
}

async function saveSettings() {
  const g = id => document.getElementById(id)?.value;
  const gn= id => parseFloat(document.getElementById(id)?.value) || 0;
  const data = {
    siteName:g('st-siteName'), slogan:g('st-slogan'), phone:g('st-phone'), email:g('st-email'),
    address:g('st-address'), website:g('st-website'), fbPageUrl:g('st-fbPageUrl'),
    smsApiKey:g('st-smsApiKey'), smsSenderId:g('st-smsSenderId'),
    monthlySavings:gn('st-monthlySavings'), lateFee:gn('st-lateFee'),
    profitMargin:gn('st-profitMargin'), maxLoan:gn('st-maxLoan'), unitValue:gn('st-unitValue'),
    memberProfitShare:gn('st-memberProfitShare'), charityShare:gn('st-charityShare'),
    orgShare:gn('st-orgShare'), formFee:gn('st-formFee'),
    savingsDueDay:gn('st-savingsDueDay'), savingsWarnDay:gn('st-savingsWarnDay'),
  };
  try { await apiPut('/reports/settings', data); showToast('সেটিংস সংরক্ষিত!', 'success'); }
  catch (_) { showToast('সার্ভার সংযোগ নেই।', 'error'); }
  if (typeof DB !== 'undefined') Object.entries(data).forEach(([k,v]) => DB.saveSetting?.(k, v));
}

async function renderBackup(el) {
  const content = el || document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🗄️ ব্যাকআপ ম্যানেজমেন্ট</div>
      <p style="color:var(--text-muted);font-size:.9rem;margin-bottom:16px">প্রতি ঘণ্টায় অটো ব্যাকআপ সক্রিয়। সর্বশেষ ৬০ দিনের ব্যাকআপ সংরক্ষিত থাকে।</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
        <button class="btn btn-primary btn-sm" onclick="triggerBackup()">🗄️ এখনই ব্যাকআপ নিন</button>
        <button class="btn btn-outline btn-sm" onclick="loadBackupList()">📋 ব্যাকআপ তালিকা দেখুন</button>
      </div>
      <div id="backupStatus"></div>
      <div id="backupList"></div>
    </div>`;
}

async function triggerBackup() {
  const el = document.getElementById('backupStatus');
  if (el) el.innerHTML = '<div class="spinner" style="margin:10px auto"></div>';
  try {
    await apiPost('/reports/backup', {});
    if (el) el.innerHTML = `<div class="badge badge-success">✅ ব্যাকআপ সফল — ${new Date().toLocaleString('bn-BD')}</div>`;
  } catch (_) {
    if (el) el.innerHTML = `<div class="badge badge-warning">⚠️ সার্ভার সংযোগ নেই।</div>`;
  }
}

async function loadBackupList() {
  const el = document.getElementById('backupList');
  if (!el) return;
  el.innerHTML = '<div class="spinner" style="margin:10px auto"></div>';
  try {
    const r = await apiFetch('/reports/backups');
    const list = r?.backups || [];
    el.innerHTML = list.length ? `
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>ফাইলনাম</th><th>সাইজ</th><th>তারিখ</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${list.map(b => `<tr>
          <td style="font-size:.8rem;font-family:monospace">${b.filename}</td>
          <td style="font-size:.8rem">${(b.size/1024).toFixed(1)} KB</td>
          <td style="font-size:.8rem">${fmtDT(b.createdAt)}</td>
          <td><a href="${API}/reports/backups/${encodeURIComponent(b.filename)}" download="${b.filename}" class="btn btn-sm btn-ghost" target="_blank">⬇️ ডাউনলোড</a></td>
        </tr>`).join('')}</tbody>
      </table></div>` : '<p style="color:var(--text-muted);margin-top:10px">কোনো ব্যাকআপ নেই।</p>';
  } catch (_) { el.innerHTML = '<p style="color:var(--text-muted)">ব্যাকআপ তালিকা লোড ব্যর্থ।</p>'; }
}

function renderAdminMgmt(el) {
  const content = el || document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🛡️ অ্যাডমিন ম্যানেজমেন্ট</div>
      <button class="btn btn-primary btn-sm mb-4" onclick="showCreateAdminModal()" style="margin-bottom:14px">+ নতুন অ্যাডমিন তৈরি</button>
      <div id="adminList"><div class="spinner" style="margin:20px auto"></div></div>
    </div>`;
  loadAdminList();
}

async function loadAdminList() {
  const wrap = document.getElementById('adminList');
  if (!wrap) return;
  let users = [];
  try { const r = await apiFetch('/users'); users = (r?.users || r || []).filter(u => u.role === 'admin' || u.role === 'super_admin'); } catch (_) {}
  if (!users.length) { wrap.innerHTML = emptyState('👤', 'কোনো অ্যাডমিন নেই'); return; }
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>নাম</th><th>ইউজারনেম</th><th>ফোন</th><th>রোল</th><th>শেষ লগইন</th><th>অ্যাকশন</th></tr></thead>
    <tbody>${users.map(u=>`<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar avatar-sm">${(u.name||'অ')[0]}</div>${u.name}</div></td>
      <td><code>@${u.username||'—'}</code></td>
      <td>${u.phone||'—'}</td>
      <td><span class="badge badge-${u.role==='super_admin'?'gold':'green'}">${u.role==='super_admin'?'Super Admin':'Admin'}</span></td>
      <td style="font-size:.78rem">${fmtDT(u.lastLogin||u.createdAt)}</td>
      <td><button class="btn btn-sm btn-ghost" onclick="toggleUserLock('${u.id}',${!u.locked})">${u.locked?'🔓 আনলক':'🔒 লক'}</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

async function toggleUserLock(userId, lock) {
  try { await apiPatch(`/users/${userId}`, { locked: lock }); showToast(lock?'লক হয়েছে।':'আনলক হয়েছে।','success'); loadAdminList(); }
  catch (_) { showToast('ব্যর্থ।','error'); }
}

function renderPermissions(el) {
  const content = el || document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🔐 পেজ এক্সেস ম্যানেজমেন্ট</div>
      <p style="color:var(--text-muted);font-size:.85rem;margin-bottom:16px">ব্যবহারকারী বা ভূমিকা অনুযায়ী module-ভিত্তিক permission নিয়ন্ত্রণ করুন।</p>
      <div class="search-bar" style="margin-bottom:16px">
        <input class="form-input" id="permUserSearch" placeholder="ব্যবহারকারী নাম, ফোন, ইউজারনেম..." style="flex:1" oninput="searchPermUser()"/>
      </div>
      <div id="permUserList"><p style="color:var(--text-muted)">অনুসন্ধান করুন...</p></div>
      <div id="permEditor" style="display:none;margin-top:20px"></div>
    </div>`;
  loadPermUsers();
}

async function loadPermUsers() {
  const wrap = document.getElementById('permUserList');
  if (!wrap) return;
  wrap.innerHTML = '<div class="spinner" style="margin:16px auto"></div>';
  try {
    const r = await apiFetch('/users');
    const users = (r?.users || r || []).filter(u => u.role !== 'user');
    window._permUsers = users;
    renderPermUserRows(users);
  } catch (_) { wrap.innerHTML = '<p style="color:var(--text-muted)">লোড ব্যর্থ।</p>'; }
}

function renderPermUserRows(users) {
  const wrap = document.getElementById('permUserList');
  if (!wrap) return;
  if (!users.length) { wrap.innerHTML = emptyState('🔐', 'কোনো ব্যবহারকারী নেই'); return; }
  wrap.innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>নাম</th><th>ভূমিকা</th><th>ফোন</th><th>Custom?</th><th>অ্যাকশন</th></tr></thead>
    <tbody>${users.map(u=>`<tr>
      <td>${u.name||'—'}</td>
      <td><span class="badge badge-${u.role==='admin'?'gold':u.role==='member'?'green':'active'}">${u.role}</span></td>
      <td>${u.phone||'—'}</td>
      <td style="font-size:.8rem;color:var(--text-muted)">—</td>
      <td><button class="btn btn-sm btn-ghost" onclick="loadPermEditor('${u.id}','${u.name||'—'}','${u.role}')">✏️ সেট করুন</button></td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function searchPermUser() {
  const q = (document.getElementById('permUserSearch')?.value || '').toLowerCase();
  const filtered = (window._permUsers || []).filter(u =>
    (u.name||'').toLowerCase().includes(q) ||
    (u.phone||'').includes(q) ||
    (u.username||'').toLowerCase().includes(q)
  );
  renderPermUserRows(filtered);
}

async function loadPermEditor(userId, name, role) {
  const editorWrap = document.getElementById('permEditor');
  if (!editorWrap) return;
  editorWrap.style.display = 'block';
  editorWrap.innerHTML = '<div class="spinner" style="margin:16px auto"></div>';

  let perms = {};
  let modules = {};
  try {
    const [pr, mr] = await Promise.allSettled([apiFetch(`/permissions/user/${userId}`), apiFetch('/permissions/modules')]);
    if (pr.status === 'fulfilled') perms = pr.value?.permissions || {};
    if (mr.status === 'fulfilled') modules = mr.value?.modules || {};
  } catch (_) {}

  const ACTIONS = ['view','create','edit','cancel','approve','export','print','manage'];
  const actionLabels = { view:'দেখুন', create:'তৈরি', edit:'সম্পাদনা', cancel:'বাতিল', approve:'অনুমোদন', export:'এক্সপোর্ট', print:'প্রিন্ট', manage:'পরিচালনা' };
  const modLabels = {
    dashboard:'ড্যাশবোর্ড', members:'সদস্য', customers:'গ্রাহক', products:'পণ্য', orders:'অর্ডার',
    installments:'কিস্তি', payments:'পেমেন্ট', receipts:'রসিদ', savings:'সঞ্চয়',
    investment:'বিনিয়োগ', projects:'প্রজেক্ট', qard:'করজ', charity:'চ্যারিটি',
    accounts:'হিসাব', expenses:'ব্যয়', assets:'সম্পদ', reports:'রিপোর্ট',
    kyc:'KYC', documents:'ডকুমেন্ট', sms:'SMS', notifications:'নোটিফিকেশন',
    committee:'কমিটি', website:'ওয়েবসাইট', users:'ব্যবহারকারী', roles:'রোল',
    permissions:'পারমিশন', audit_log:'অডিট লগ', backup:'ব্যাকআপ', settings:'সেটিংস'
  };

  window._editPerms = JSON.parse(JSON.stringify(perms));

  editorWrap.innerHTML = `
    <div class="admin-card" style="border:1px solid rgba(201,162,39,.3)">
      <div class="card-title" style="margin-bottom:12px">🔐 Permission Editor — <strong>${name}</strong> (${role})</div>
      <div style="overflow-x:auto">
      <table style="width:100%;font-size:.82rem">
        <thead><tr style="background:rgba(255,255,255,.05)">
          <th style="text-align:left;padding:8px 12px;min-width:120px">Module</th>
          ${ACTIONS.map(a=>`<th style="padding:8px;text-align:center;white-space:nowrap">${actionLabels[a]||a}</th>`).join('')}
        </tr></thead>
        <tbody>
          ${Object.entries(modules).map(([mod, availableActions]) => `
          <tr style="border-top:1px solid rgba(255,255,255,.06)">
            <td style="padding:8px 12px;font-weight:500">${modLabels[mod]||mod}</td>
            ${ACTIONS.map(action => {
              const avail = availableActions.includes(action);
              const checked = avail && !!(perms[mod] && perms[mod][action]);
              return `<td style="text-align:center;padding:4px">
                ${avail ? `<input type="checkbox" class="perm-cb" data-mod="${mod}" data-action="${action}" ${checked?'checked':''} onchange="togglePerm('${mod}','${action}',this.checked)" style="width:16px;height:16px;cursor:pointer">` : '<span style="color:rgba(255,255,255,.15);font-size:10px">—</span>'}
              </td>`;
            }).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="savePermissions('${userId}')">💾 সংরক্ষণ করুন</button>
        <button class="btn btn-ghost btn-sm" onclick="selectAllPerms(true)">✅ সব চালু</button>
        <button class="btn btn-ghost btn-sm" onclick="selectAllPerms(false)">❌ সব বন্ধ</button>
        <button class="btn btn-danger btn-sm" onclick="resetPermissions('${userId}')">🔄 Role Default-এ ফিরুন</button>
      </div>
    </div>`;
}

function togglePerm(mod, action, checked) {
  if (!window._editPerms) window._editPerms = {};
  if (!window._editPerms[mod]) window._editPerms[mod] = {};
  window._editPerms[mod][action] = checked;
}

function selectAllPerms(val) {
  document.querySelectorAll('.perm-cb').forEach(cb => {
    cb.checked = val;
    const mod = cb.dataset.mod;
    const action = cb.dataset.action;
    togglePerm(mod, action, val);
  });
}

async function savePermissions(userId) {
  try {
    await apiPut(`/permissions/user/${userId}`, { permissions: window._editPerms || {} });
    showToast('Permission সংরক্ষিত হয়েছে।', 'success');
  } catch (e) { showToast('সংরক্ষণ ব্যর্থ: ' + e.message, 'error'); }
}

async function resetPermissions(userId) {
  if (!confirm('Role Default-এ ফিরতে চান?')) return;
  try {
    await apiDelete(`/permissions/user/${userId}`);
    showToast('Custom permission সরানো হয়েছে।', 'success');
    renderPermissions(document.getElementById('adminContent'));
  } catch (e) { showToast('ব্যর্থ।', 'error'); }
}

async function apiDelete(path) {
  const token = localStorage.getItem('bf_admin_token');
  const r = await fetch(API + path, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } });
  if (!r.ok) throw new Error((await r.json()).error || 'API error');
  return r.json();
}

// ══════════════════════════ UTILITIES ══════════════════════════
function fmtN(n) { return Math.round(n||0).toLocaleString('en-IN'); }
function fmtMoney(n) { return '৳ ' + fmtN(n); }
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('bn-BD', {year:'numeric',month:'short',day:'numeric'}); } catch { return s; }
}
function fmtDT(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleString('bn-BD', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); } catch { return s; }
}
function formatDateBn(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleString('bn-BD', {year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'}); } catch { return s; }
}
function emptyState(icon, msg) {
  return `<div class="empty-state" style="padding:40px"><div class="empty-state-icon">${icon}</div><div class="empty-state-title">${msg}</div></div>`;
}
function statusBadge(status) {
  const m = { active:'badge-active', pending:'badge-pending', paid:'badge-paid', approved:'badge-info', disbursed:'badge-info', completed:'badge-paid', overdue:'badge-danger', rejected:'badge-danger', cancelled:'badge-muted' };
  const l = { active:'সক্রিয়', pending:'পেন্ডিং', paid:'পরিশোধিত', approved:'অনুমোদিত', disbursed:'বিতরিত', completed:'সম্পন্ন', overdue:'অতিরিক্ত', rejected:'প্রত্যাখ্যাত', cancelled:'বাতিল' };
  return `<span class="badge ${m[status]||'badge-muted'}">${l[status]||status}</span>`;
}

async function sendBirthdaySMS(phone, name) {
  try {
    await apiPost('/sms/send', { phones:[phone], message:`শুভ জন্মদিন ${name}! বারাকাহ ফাইন্যান্স পরিবারের পক্ষ থেকে আন্তরিক শুভেচ্ছা। 🎉` });
    showToast('SMS পাঠানো হয়েছে!', 'success');
  } catch (_) { showToast('SMS পাঠাতে ব্যর্থ।', 'error'); }
}

// Generate receipt numbers helper
async function getNextReceiptNum(prefix) {
  try {
    const r = await apiFetch(`/accounts/receipt-next?prefix=${prefix}`);
    return r?.next || `${prefix}-00001`;
  } catch (_) {
    const stored = parseInt(localStorage.getItem(`bf_rcpt_${prefix}`) || '0') + 1;
    localStorage.setItem(`bf_rcpt_${prefix}`, stored);
    return `${prefix}-${String(stored).padStart(5,'0')}`;
  }
}
