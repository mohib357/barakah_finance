// panel-core.js — Admin Panel Core Logic

const API = 'http://localhost:3001/api';
let currentPage = 'dashboard';
let adminSession = null;

// ════ AUTH ════
function doAdminLogin() {
    const id = document.getElementById('li-id').value.trim();
    const pw = document.getElementById('li-pw').value;
    const err = document.getElementById('loginErr');
    if (!id || !pw) { showLoginErr('সব তথ্য পূরণ করুন।'); return; }

    // Check via localStorage (DB fallback)
    const user = DB.findUser(id);
    if (!user || user.password !== pw && !checkBcrypt(pw, user.password)) {
        showLoginErr('ভুল আইডি বা পাসওয়ার্ড।'); return;
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
        showLoginErr('আপনার অ্যাডমিন অ্যাক্সেস নেই।'); return;
    }
    adminSession = user;
    DB.setSession(user);
    localStorage.setItem('bf_admin_session', JSON.stringify(user));
    document.getElementById('loginModal').classList.add('hidden');
    initPanel();
}

function checkBcrypt(plain, hash) {
    // Simple demo check; real app uses bcrypt
    return plain === 'admin1234' && hash;
}

function adminLogout() {
    adminSession = null;
    localStorage.removeItem('bf_admin_session');
    DB.clearSession();
    location.href = '../index.html';
}

function showLoginErr(msg) {
    const el = document.getElementById('loginErr');
    el.textContent = msg;
    el.classList.remove('hidden');
}

// ════ INIT ════
function initPanel() {
    const stored = localStorage.getItem('bf_admin_session');
    if (!stored) { document.getElementById('loginModal').classList.remove('hidden'); return; }
    adminSession = JSON.parse(stored);
    if (!adminSession || (adminSession.role !== 'admin' && adminSession.role !== 'super_admin')) {
        document.getElementById('loginModal').classList.remove('hidden'); return;
    }

    // Update UI
    const name = adminSession.name || 'অ্যাডমিন';
    document.getElementById('sbUname').textContent = name;
    document.getElementById('sbRole').textContent = adminSession.role === 'super_admin' ? 'Super Admin' : 'Admin';
    document.getElementById('sbAvatar').textContent = name[0] || 'অ';
    document.getElementById('topbarAdmin').textContent = name;
    document.getElementById('loadingScreen').style.display = 'none';

    // Load SMS balance
    loadSMSBalance();

    // Auto-open page from hash
    const hash = location.hash.replace('#', '');
    if (hash) gotoPage(hash);
    else gotoPage('dashboard');

    // Auto-refresh activity every 30s
    setInterval(() => {
        if (currentPage === 'activity-log') renderActivityLog();
    }, 30000);
}

// ════ NAVIGATION ════
function gotoPage(pageId, el) {
    currentPage = pageId;
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    else {
        const target = document.querySelector(`[data-page="${pageId}"]`);
        if (target) target.classList.add('active');
    }

    // Update topbar title
    const titles = {
        dashboard: 'ড্যাশবোর্ড', 'member-list': 'সদস্য তালিকা', 'member-add': 'নতুন সদস্য',
        applications: 'সদস্য আবেদন', 'client-list': 'ক্লাইন্ট তালিকা', 'client-add': 'নতুন ক্লাইন্ট',
        'client-fund': 'ক্লাইন্ট তহবিল', 'paid-clients': 'পরিশোধিত ক্লাইন্ট',
        'due-clients': 'বাকি ক্লাইন্ট', 'product-ledger': 'পণ্য লেজার',
        'acc-settings': 'একাউন্ট সেটিংস', 'member-payment': 'সদস্য পেমেন্ট',
        'client-payment': 'ক্লাইন্ট কিস্তি', 'other-income': 'অন্যান্য আয়',
        expense: 'ব্যয়', 'acc-summary': 'একাউন্ট সারসংক্ষেপ',
        'member-due-report': 'সদস্য ডিউ রিপোর্ট', 'client-due-report': 'ক্লাইন্ট ডিউ রিপোর্ট',
        'acc-log': 'একাউন্ট লগ', 'qard-list': 'করজে হাসানা তালিকা',
        'qard-fund': 'করজে হাসানা ফান্ড', 'qard-collection': 'করজ সংগ্রহ',
        'qard-add': 'নতুন করজ', 'charity-income': 'চ্যারিটি আয়',
        'charity-expense': 'চ্যারিটি ব্যয়', 'charity-apps': 'চ্যারিটি আবেদন',
        'charity-ledger': 'চ্যারিটি লেজার', 'sms-records': 'SMS রেকর্ড',
        'sms-send': 'SMS পাঠান', 'sms-recharge': 'SMS রিচার্জ',
        'sms-templates': 'SMS টেমপ্লেট', 'committee-running': 'চলতি কমিটি',
        'committee-old': 'পুরাতন কমিটি', 'committee-add': 'কমিটি সদস্য যোগ',
        'committee-rules': 'কমিটি রুলস', 'project-list': 'প্রজেক্ট তালিকা',
        'project-running': 'চলমান প্রজেক্ট', 'project-add': 'নতুন প্রজেক্ট',
        'asset-list': 'এসেট তালিকা', 'asset-add': 'নতুন এসেট',
        'activity-log': 'লাইভ একটিভিটি', reviews: 'রিভিউ ব্যবস্থাপনা',
        'gallery-mgmt': 'গ্যালারি', 'timeline-mgmt': 'টাইমলাইন',
        'website-content': 'ওয়েবসাইট কন্টেন্ট', 'site-info': 'সাংগঠনিক তথ্য',
        'admin-mgmt': 'অ্যাডমিন ব্যবস্থাপনা', permissions: 'পেজ অ্যাক্সেস',
        products: 'পণ্য', orders: 'অর্ডার', 'shop-settings': 'শপ সেটিংস',
        'economy-calendar': 'ইকোনমি ক্যালেন্ডার',
    };
    document.getElementById('topbarTitle').textContent = titles[pageId] || pageId;
    location.hash = pageId;

    // Render the page
    renderPage(pageId);

    // On mobile, close sidebar
    if (window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    if (window.innerWidth <= 900) {
        sb.classList.toggle('mobile-open');
    } else {
        sb.classList.toggle('collapsed');
        document.getElementById('mainWrap').classList.toggle('expanded');
    }
}

function toggleSubMenu(el) {
    const sub = el.nextElementSibling;
    if (!sub) return;
    el.classList.toggle('open');
    sub.classList.toggle('open');
}

// ════ DATA HELPERS ════
function getMembers() { return JSON.parse(localStorage.getItem('bf_members') || '[]'); }
function saveMembers(d) { localStorage.setItem('bf_members', JSON.stringify(d)); }
function getClients() { return JSON.parse(localStorage.getItem('bf_clients') || '[]'); }
function saveClients(d) { localStorage.setItem('bf_clients', JSON.stringify(d)); }
function getInstallments() { return JSON.parse(localStorage.getItem('bf_installments') || '[]'); }
function saveInstallments(d) { localStorage.setItem('bf_installments', JSON.stringify(d)); }
function getPayments() { return JSON.parse(localStorage.getItem('bf_payments_all') || '[]'); }
function savePayments(d) { localStorage.setItem('bf_payments_all', JSON.stringify(d)); }
function getReceipts() { return JSON.parse(localStorage.getItem('bf_receipts') || '[]'); }
function saveReceipts(d) { localStorage.setItem('bf_receipts', JSON.stringify(d)); }
function getIncomeEntries() { return JSON.parse(localStorage.getItem('bf_income_entries') || '[]'); }
function saveIncome(d) { localStorage.setItem('bf_income_entries', JSON.stringify(d)); }
function getExpenseEntries() { return JSON.parse(localStorage.getItem('bf_expense_entries') || '[]'); }
function saveExpense(d) { localStorage.setItem('bf_expense_entries', JSON.stringify(d)); }
function getLoans() { return DB.getLoans ? DB.getLoans() : JSON.parse(localStorage.getItem('bf_loans') || '[]'); }
function getQardApps() { return JSON.parse(localStorage.getItem('bf_qard_apps') || '[]'); }
function saveQardApps(d) { localStorage.setItem('bf_qard_apps', JSON.stringify(d)); }
function getCharityIncome() { return JSON.parse(localStorage.getItem('bf_charity_income') || '[]'); }
function saveCharityIncome(d) { localStorage.setItem('bf_charity_income', JSON.stringify(d)); }
function getCharityExpense() { return JSON.parse(localStorage.getItem('bf_charity_expense') || '[]'); }
function saveCharityExpense(d) { localStorage.setItem('bf_charity_expense', JSON.stringify(d)); }
function getCharityApps() { return JSON.parse(localStorage.getItem('bf_charity_apps') || '[]'); }
function getProjects() { return JSON.parse(localStorage.getItem('bf_projects') || '[]'); }
function saveProjects(d) { localStorage.setItem('bf_projects', JSON.stringify(d)); }
function getAssets() { return JSON.parse(localStorage.getItem('bf_assets') || '[]'); }
function saveAssets(d) { localStorage.setItem('bf_assets', JSON.stringify(d)); }
function getSMSRecords() { return JSON.parse(localStorage.getItem('bf_sms_records') || '[]'); }
function getSMSTemplates() { return JSON.parse(localStorage.getItem('bf_sms_templates') || DEFAULT_SMS_TEMPLATES); }
function getSMSBalance() { const r=JSON.parse(localStorage.getItem('bf_sms_recharge')||'[]'); const u=getSMSRecords().length; return r.reduce((s,x)=>s+(x.amount||0),0)-u; }
function getCommittee() { return JSON.parse(localStorage.getItem('bf_committee') || '[]'); }
function saveCommittee(d) { localStorage.setItem('bf_committee', JSON.stringify(d)); }
function getSettings() { return DB ? DB.getSettings() : JSON.parse(localStorage.getItem('bf_site_settings') || '{}'); }
function getAuditLog() { return JSON.parse(localStorage.getItem('bf_audit_log') || '[]'); }
function addAuditLog(action, module, detail) {
    const log = getAuditLog();
    log.unshift({ id: 'al-'+Date.now(), action, module, detail, userId: adminSession?.id, userName: adminSession?.name, date: new Date().toISOString() });
    localStorage.setItem('bf_audit_log', JSON.stringify(log.slice(0, 500)));
}
function getReviews() { return JSON.parse(localStorage.getItem('bf_reviews') || '[]'); }
function saveReviews(d) { localStorage.setItem('bf_reviews', JSON.stringify(d)); }
function getGallery() { return JSON.parse(localStorage.getItem('bf_gallery') || '{"photos":[],"videos":[],"events":[]}'); }
function saveGallery(d) { localStorage.setItem('bf_gallery', JSON.stringify(d)); }
function getPosts() { return JSON.parse(localStorage.getItem('bf_posts') || '[]'); }
function savePosts(d) { localStorage.setItem('bf_posts', JSON.stringify(d)); }

const DEFAULT_SMS_TEMPLATES = JSON.stringify([
    { id:'t1', name:'পেমেন্ট গ্রহণ', template:'প্রিয় {name}, আপনার {amount} টাকা গ্রহণ করা হয়েছে। রসিদ: {receipt_id}। — বারাকাহ ফাইন্যান্স' },
    { id:'t2', name:'কিস্তি স্মরণ', template:'প্রিয় {name}, আপনার {amount} টাকার কিস্তি {due_date} তারিখে দেওয়ার কথা। — বারাকাহ ফাইন্যান্স' },
    { id:'t3', name:'সদস্যপদ অনুমোদন', template:'অভিনন্দন {name}! আপনার সদস্যপদ অনুমোদিত। আইডি: {member_id}। — বারাকাহ ফাইন্যান্স' },
]);

// ════ RECEIPT ════
function generateReceiptNo(prefix) {
    const receipts = getReceipts();
    const count = receipts.filter(r => r.num && r.num.startsWith(prefix)).length;
    return `${prefix}-${String(count + 1).padStart(5, '0')}`;
}

function saveReceipt(num, type, data) {
    const receipts = getReceipts();
    receipts.push({ num, type, data, issuedAt: new Date().toISOString(), issuedBy: adminSession?.id });
    saveReceipts(receipts);
}

// ════ TOAST ════
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast';
    t.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.4)' : type === 'warning' ? 'rgba(245,158,11,0.4)' : 'rgba(201,162,39,0.4)';
    t.style.display = 'block';
    setTimeout(() => t.classList.add('hidden'), 3500);
}

// ════ CONFIRM ════
function showConfirm(title, msg, onYes) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMsg').textContent = msg;
    const yBtn = document.getElementById('confirmYes');
    yBtn.onclick = () => { onYes(); document.getElementById('confirmModal').classList.add('hidden'); };
    document.getElementById('confirmModal').classList.remove('hidden');
}

// ════ PRINT RECEIPT ════
function printReceipt(data) {
    const { receiptNo, name, id, items, total, method, date, collectedBy } = data;
    const settings = getSettings();
    const win = window.open('', '_blank', 'width=500,height=600');
    win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      body{font-family:'Noto Serif Bengali',serif;margin:0;padding:20px;background:#fff;color:#111;}
      .rh{text-align:center;margin-bottom:12px;}
      .rh h2{color:#065F46;font-size:16px;margin-bottom:2px;}
      .rh p{font-size:10px;color:#555;margin:1px 0;}
      hr{border:none;border-top:1px dashed #ccc;margin:8px 0;}
      .rrow{display:flex;justify-content:space-between;font-size:12px;margin:3px 0;}
      .rrow.total{font-weight:700;font-size:14px;color:#065F46;border-top:1px solid #eee;padding-top:6px;margin-top:4px;}
      .rsig{margin-top:18px;font-size:10px;color:#555;text-align:center;border-top:1px dashed #ccc;padding-top:8px;}
      @media print{@page{size:5in 7.5in;margin:0.4in 1in;}}
    </style>
    <script>window.onload=()=>window.print();<\/script></head><body>
    <div class="rh">
      <h2>${settings.siteName || 'বারাকাহ ফাইন্যান্স'}</h2>
      <p>${settings.address || 'আদিতমারী, লালমনিরহাট'}</p>
      <p>📞 ${settings.phone || ''} | 🌐 ${settings.website || ''}</p>
    </div>
    <hr>
    <div class="rrow"><span>রসিদ নং:</span><span><b>${receiptNo}</b></span></div>
    <div class="rrow"><span>তারিখ:</span><span>${new Date(date).toLocaleDateString('bn-BD')}</span></div>
    <div class="rrow"><span>নাম:</span><span>${name}</span></div>
    ${id ? `<div class="rrow"><span>আইডি:</span><span>${id}</span></div>` : ''}
    <hr>
    ${(items || []).map(i => `<div class="rrow"><span>${i.label}</span><span>৳${Number(i.amount).toLocaleString('bn')}</span></div>`).join('')}
    <div class="rrow total"><span>মোট</span><span>৳${Number(total).toLocaleString('bn')}</span></div>
    <div class="rrow" style="font-size:11px;color:#777;"><span>পদ্ধতি:</span><span>${method || 'নগদ'}</span></div>
    <div class="rsig">সংগ্রহকারী: ${collectedBy || adminSession?.name || '—'} | ${settings.website || ''}</div>
    </body></html>`);
    win.document.close();
}

// ════ SMS ════
function loadSMSBalance() {
    const bal = getSMSBalance();
    document.getElementById('smsBal').textContent = `📱 ${bal} SMS`;
}

// ════ DATE HELPERS ════
function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('bn-BD'); } catch { return d; }
}
function fmtMoney(n) {
    if (n === null || n === undefined) return '৳০';
    return '৳' + Number(n).toLocaleString('bn');
}
function fmtDateBD(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { return d; }
}

// ════ INIT ON LOAD ════
document.addEventListener('DOMContentLoaded', initPanel);
