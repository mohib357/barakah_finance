// C:\Project\Barakah_Finance\pages\js\dashboard.js

let currentUser = null;
let activePanel = '';

document.addEventListener('DOMContentLoaded', function () {
    currentUser = DB.getSession();
    if (!currentUser || !currentUser.verified) {
        alert('দয়া করে প্রথমে লগইন করুন।');
        window.location.href = '../index.html';
        return;
    }
    initDashboard();
});

function initDashboard() {
    const avatarEl = document.getElementById('sb-avatar');
    const nameEl = document.getElementById('sb-name');
    if (avatarEl) avatarEl.textContent = (currentUser.name || 'ব')[0];
    if (nameEl) nameEl.textContent = currentUser.name || 'ব্যবহারকারী';

    const pct = calcProfileComplete();
    const pctEl = document.getElementById('sb-complete-pct');
    const fillEl = document.getElementById('sb-complete-fill');
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';

    const roleBadge = document.getElementById('sb-role-badge');
    if (roleBadge) {
        if (currentUser.role === 'admin') { roleBadge.textContent = 'অ্যাডমিন'; roleBadge.className = 'sb-role role-admin'; }
        else if (currentUser.role === 'member') { roleBadge.textContent = 'সদস্য'; roleBadge.className = 'sb-role role-member'; }
        else { roleBadge.textContent = 'গ্রাহক'; roleBadge.className = 'sb-role role-customer'; }
    }
    buildNav();
    showPanel('panel-overview');
}

function buildNav() {
    const nav = document.getElementById('sb-nav');
    const common = [
        { id: 'panel-overview', icon: '📊', label: 'ওভারভিউ' },
        { id: 'panel-profile', icon: '👤', label: 'আমার প্রোফাইল' },
        { id: 'panel-orders', icon: '🛒', label: 'আমার অর্ডার' },
    ];
    const member = [
        { id: 'panel-savings', icon: '💰', label: 'সঞ্চয় বিবরণ' },
        { id: 'panel-loans', icon: '🤝', label: 'করজে হাসানা' },
    ];
    const admin = [
        { id: 'panel-admin', icon: '🛡️', label: 'অ্যাডমিন প্যানেল' },
        { id: 'panel-all-users', icon: '👥', label: 'সকল ব্যবহারকারী' },
        { id: 'panel-all-savings', icon: '💰', label: 'সঞ্চয় হিসাব' },
        { id: 'panel-all-loans', icon: '🤝', label: 'করজে হাসানা' },
    ];

    let html = '<div class="sb-section">মূল মেনু</div>';
    common.forEach(function (item) {
        html += '<a class="sb-item" data-panel="' + item.id + '" onclick="showPanel(\'' + item.id + '\')">' +
            '<span class="icon">' + item.icon + '</span>' + item.label + '</a>';
    });

    if (currentUser.role === 'member' || currentUser.role === 'admin') {
        html += '<div class="sb-section">সদস্য সেবা</div>';
        member.forEach(function (item) {
            html += '<a class="sb-item" data-panel="' + item.id + '" onclick="showPanel(\'' + item.id + '\')">' +
                '<span class="icon">' + item.icon + '</span>' + item.label + '</a>';
        });
    }

    if (currentUser.role === 'admin') {
        html += '<div class="sb-section">অ্যাডমিন</div>';
        admin.forEach(function (item) {
            html += '<a class="sb-item" data-panel="' + item.id + '" onclick="showPanel(\'' + item.id + '\')">' +
                '<span class="icon">' + item.icon + '</span>' + item.label + '</a>';
        });
        html += '<a class="sb-item" href="../admin/admin.html"><span class="icon">📋</span>সদস্য আবেদন</a>';
        html += '<a class="sb-item" href="../admin/shop_admin.html"><span class="icon">🏬</span>শপ অ্যাডমিন</a>';
    }
    nav.innerHTML = html;
}

function showPanel(id) {
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.sb-item').forEach(function (b) { b.classList.remove('active'); });
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('active');
    const navItem = document.querySelector('.sb-item[data-panel="' + id + '"]');
    if (navItem) navItem.classList.add('active');
    activePanel = id;
    const titles = {
        'panel-overview': 'ওভারভিউ', 'panel-savings': 'সঞ্চয় বিবরণ', 'panel-loans': 'করজে হাসানা',
        'panel-orders': 'আমার অর্ডার', 'panel-profile': 'প্রোফাইল', 'panel-admin': 'অ্যাডমিন প্যানেল',
        'panel-all-users': 'সকল ব্যবহারকারী', 'panel-all-savings': 'সঞ্চয় হিসাব', 'panel-all-loans': 'করজে হাসানা',
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = titles[id] || 'ড্যাশবোর্ড';
    closeSidebar();
    if (id === 'panel-overview') loadOverview();
    if (id === 'panel-savings') loadSavings();
    if (id === 'panel-loans') loadLoans();
    if (id === 'panel-orders') loadOrders();
    if (id === 'panel-profile') loadProfile();
    if (id === 'panel-admin') loadAdminPanel();
    if (id === 'panel-all-users') renderAllUsers();
    if (id === 'panel-all-savings') loadAllSavings();
    if (id === 'panel-all-loans') loadAllLoans();
}

function loadOverview() {
    const savings = DB.getSavings().filter(function (s) { return s.userId === currentUser.id; });
    const loans = DB.getLoans().filter(function (l) { return l.userId === currentUser.id; });
    const orders = DB.getOrders().filter(function (o) { return o.customerPhone === currentUser.phone; });
    const totalSavings = savings.reduce(function (a, s) { return a + (s.amount || 0); }, 0);
    const activeLoans = loans.filter(function (l) { return l.status === 'active'; });
    const pct = calcProfileComplete();
    const isAdmin = currentUser.role === 'admin';
    const allSavings = DB.getSavings();
    const allUsers = DB.getUsers().filter(function (u) { return u.verified; });
    const allOrders = DB.getOrders();

    const statsEl = document.getElementById('overview-stats');
    if (statsEl) {
        statsEl.innerHTML = isAdmin ?
            '<div class="stat-card"><div class="sc-icon sc-green">👥</div><div class="sc-val">' + allUsers.length + '</div><div class="sc-lbl">মোট ব্যবহারকারী</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-gold">💰</div><div class="sc-val">৳' + allSavings.reduce(function (a, s) { return a + (s.amount || 0); }, 0).toLocaleString('bn') + '</div><div class="sc-lbl">মোট সঞ্চয়</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-blue">🛒</div><div class="sc-val">' + allOrders.length + '</div><div class="sc-lbl">মোট অর্ডার</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-red">🤝</div><div class="sc-val">' + DB.getLoans().filter(function (l) { return l.status === 'active'; }).length + '</div><div class="sc-lbl">সক্রিয় করজ</div></div>'
            :
            '<div class="stat-card"><div class="sc-icon sc-green">💰</div><div class="sc-val">৳' + totalSavings.toLocaleString('bn') + '</div><div class="sc-lbl">মোট সঞ্চয়</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-gold">📅</div><div class="sc-val">' + savings.length + '</div><div class="sc-lbl">সঞ্চয় এন্ট্রি</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-blue">🤝</div><div class="sc-val">' + activeLoans.length + '</div><div class="sc-lbl">সক্রিয় করজ</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-red">🛒</div><div class="sc-val">' + orders.length + '</div><div class="sc-lbl">আমার অর্ডার</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-green">✅</div><div class="sc-val">' + pct + '%</div><div class="sc-lbl">প্রোফাইল সম্পন্নতা</div></div>';
    }

    const months = [];
    for (var i = 5; i >= 0; i--) {
        var d = new Date(); d.setMonth(d.getMonth() - i);
        months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('bn-BD', { month: 'short' }) });
    }
    const chartData = months.map(function (m) {
        const mSv = isAdmin ? DB.getSavings().filter(function (s) { return s.month === m.key; }) : savings.filter(function (s) { return s.month === m.key; });
        return { label: m.label, val: mSv.reduce(function (a, s) { return a + (s.amount || 0); }, 0) };
    });
    const maxVal = Math.max.apply(null, chartData.map(function (d) { return d.val; }).concat([1]));
    const chartEl = document.getElementById('savings-chart');
    if (chartEl) {
        chartEl.innerHTML = chartData.map(function (d) {
            return '<div class="savings-bar-wrap">' +
                '<div class="savings-bar" style="height:' + Math.max(4, (d.val / maxVal * 100)) + 'px;" title="৳' + d.val.toLocaleString() + '"></div>' +
                '<div class="savings-bar-lbl">' + d.label + '</div></div>';
        }).join('');
    }

    const acts = [];
    savings.slice(-3).reverse().forEach(function (s) { acts.push({ icon: '💰', text: 'সঞ্চয়: ৳' + s.amount, date: s.date }); });
    orders.slice(-2).reverse().forEach(function (o) { acts.push({ icon: '🛒', text: 'অর্ডার: ' + o.productName, date: o.submittedAt }); });
    const actEl = document.getElementById('recent-activity');
    if (actEl) {
        actEl.innerHTML = acts.length ? acts.map(function (a) {
            return '<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #f0f4f1;">' +
                '<span>' + a.icon + '</span><div><div style="font-size:13px;">' + a.text + '</div>' +
                '<div style="font-size:11px;color:var(--text-muted);">' + (a.date ? new Date(a.date).toLocaleDateString('bn-BD') : '') + '</div></div></div>';
        }).join('') : '<div style="color:var(--text-muted);font-size:13px;padding:12px 0;">কোনো কার্যক্রম নেই</div>';
    }
}

function loadSavings() {
    const savings = DB.getSavings().filter(function (s) { return s.userId === currentUser.id; });
    const total = savings.reduce(function (a, s) { return a + (s.amount || 0); }, 0);
    const badgeEl = document.getElementById('savings-total-badge');
    if (badgeEl) badgeEl.textContent = 'মোট: ৳' + total.toLocaleString('bn');
    const tb = document.getElementById('savings-table');
    if (!tb) return;
    if (!savings.length) { tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px;">কোনো সঞ্চয় এন্ট্রি নেই</td></tr>'; return; }
    tb.innerHTML = savings.slice().reverse().map(function (s, i) {
        return '<tr><td>' + (savings.length - i) + '</td><td>' + (s.month || '—') + '</td>' +
            '<td style="color:var(--dark-green);font-weight:700;">৳' + (s.amount || 0).toLocaleString('bn') + '</td>' +
            '<td>' + (s.date ? new Date(s.date).toLocaleDateString('bn-BD') : '—') + '</td>' +
            '<td><span class="tag tag-ok">✅ জমা</span></td></tr>';
    }).join('');
}

function loadLoans() {
    const loans = DB.getLoans().filter(function (l) { return l.userId === currentUser.id; });
    const tb = document.getElementById('loans-table');
    if (!tb) return;
    if (!loans.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">কোনো করজ নেই</td></tr>'; return; }
    const statusMap = { active: '<span class="tag tag-pend">চলমান</span>', paid: '<span class="tag tag-ok">পরিশোধিত</span>', pending: '<span class="tag tag-blue">পেন্ডিং</span>', rejected: '<span class="tag tag-no">বাতিল</span>' };
    tb.innerHTML = loans.slice().reverse().map(function (l) {
        return '<tr><td style="font-size:11px;color:#888;">' + l.id + '</td>' +
            '<td>৳' + (l.amount || 0).toLocaleString('bn') + '</td>' +
            '<td>৳' + (l.remaining || l.amount || 0).toLocaleString('bn') + '</td>' +
            '<td>' + (l.reason || '—') + '</td>' +
            '<td>' + (statusMap[l.status] || l.status) + '</td>' +
            '<td>' + (l.createdAt ? new Date(l.createdAt).toLocaleDateString('bn-BD') : '—') + '</td></tr>';
    }).join('');
}

function submitLoan() {
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const reason = document.getElementById('loan-reason').value.trim();
    const start = document.getElementById('loan-start').value;
    if (!amount || !reason || !start) { toast('সকল প্রয়োজনীয় তথ্য পূরণ করুন।', '#e53e3e'); return; }
    if (amount > 15000) { toast('সর্বোচ্চ ১৫,০০০ টাকা আবেদন করা যাবে।', '#e53e3e'); return; }
    const loans = DB.getLoans();
    loans.push({
        id: DB.genID('LOAN'), userId: currentUser.id, userName: currentUser.name,
        amount: amount, remaining: amount, reason: reason,
        guarantor: document.getElementById('loan-guarantor').value.trim(),
        startMonth: start, months: 3, status: 'pending', createdAt: new Date().toISOString(),
    });
    DB.set(DB.KEYS.LOANS, loans);
    loadLoans();
    toast('করজে হাসানা আবেদন জমা হয়েছে! ✅');
    ['loan-amount', 'loan-reason', 'loan-start', 'loan-guarantor'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
}

function loadOrders() {
    const orders = DB.getOrders().filter(function (o) { return o.customerPhone === currentUser.phone || o.nid === currentUser.nid; });
    const tb = document.getElementById('orders-table');
    if (!tb) return;
    const ORDER_STEPS = ['আবেদন জমা', 'কমিটি পর্যালোচনা', 'অনুমোদন', 'পণ্য সংগ্রহ', 'বিতরণ', 'সম্পন্ন'];
    const statusMap = { pending: '<span class="tag tag-pend">পেন্ডিং</span>', approved: '<span class="tag tag-ok">অনুমোদিত</span>', rejected: '<span class="tag tag-no">বাতিল</span>', processing: '<span class="tag tag-blue">প্রসেসিং</span>', delivered: '<span class="tag tag-ok">বিতরিত</span>' };
    if (!orders.length) { tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">কোনো অর্ডার নেই</td></tr>'; return; }
    tb.innerHTML = orders.slice().reverse().map(function (o) {
        return '<tr><td style="font-size:11px;color:#888;">' + o.id + '</td>' +
            '<td>' + (o.productName || '—') + '</td>' +
            '<td>৳' + (o.price || 0).toLocaleString('bn') + '</td>' +
            '<td>৳' + (o.perInstall || 0).toLocaleString('bn') + ' × ৬</td>' +
            '<td style="font-size:12px;">' + (ORDER_STEPS[o.statusStep || 0]) + '</td>' +
            '<td>' + (statusMap[o.status] || o.status) + '</td>' +
            '<td>' + (o.submittedAt ? new Date(o.submittedAt).toLocaleDateString('bn-BD') : '—') + '</td></tr>';
    }).join('');
}

function calcProfileComplete() {
    var u = currentUser;
    var fields = [u.name, u.phone, u.email, u.dob, u.job, u.address, u.nid, u.username];
    return Math.round((fields.filter(function (f) { return f && f.length > 0; }).length / fields.length) * 100);
}

function calcProfileCompleteFor(u) {
    var fields = [u.name, u.phone, u.email, u.dob, u.job, u.address, u.nid, u.username];
    return Math.round((fields.filter(function (f) { return f && f.length > 0; }).length / fields.length) * 100);
}

function loadProfile() {
    var u = currentUser;
    var map = { 'pf-name': u.name, 'pf-uname': u.username, 'pf-phone': u.phone, 'pf-email': u.email, 'pf-dob': u.dob, 'pf-job': u.job, 'pf-address': u.address, 'pf-nid': u.nid };
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) el.value = map[id] || ''; });
    var refEl = document.getElementById('pf-referral');
    if (refEl) {
        var ref = u.referral ? DB.getUsers().find(function (x) { return x.id === u.referral; }) : null;
        refEl.value = ref ? ref.name : 'নেই';
    }
    var pct = calcProfileComplete();
    var ringNum = document.getElementById('ring-num');
    var ringProg = document.getElementById('ring-progress');
    var nameDisp = document.getElementById('profile-name-display');
    var roleDisp = document.getElementById('profile-role-display');
    var idDisp = document.getElementById('profile-id-display');
    if (ringNum) ringNum.textContent = pct + '%';
    if (ringProg) ringProg.style.strokeDashoffset = 251.2 - (251.2 * pct / 100);
    if (nameDisp) nameDisp.textContent = u.name || '—';
    if (roleDisp) roleDisp.textContent = ({ admin: 'অ্যাডমিন', member: 'সদস্য', user: 'ব্যবহারকারী', customer: 'গ্রাহক' }[u.role] || u.role);
    if (idDisp) idDisp.textContent = u.memberID ? 'সদস্য আইডি: ' + u.memberID : 'আইডি: ' + u.id.slice(0, 12);
    var checkItems = [
        { label: 'নাম', done: !!u.name }, { label: 'মোবাইল', done: !!u.phone }, { label: 'ইমেইল', done: !!u.email },
        { label: 'জন্ম তারিখ', done: !!u.dob }, { label: 'পেশা', done: !!u.job }, { label: 'ঠিকানা', done: !!u.address }, { label: 'এনআইডি', done: !!u.nid },
    ];
    var checkEl = document.getElementById('completion-checklist');
    if (checkEl) {
        checkEl.innerHTML = checkItems.map(function (c) {
            return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;">' +
                '<span>' + (c.done ? '✅' : '⬜') + '</span>' +
                '<span style="color:' + (c.done ? 'var(--dark-green)' : 'var(--text-muted)') + ';">' + c.label + '</span></div>';
        }).join('');
    }
}

function saveProfile() {
    var users = DB.getUsers();
    var idx = users.findIndex(function (u) { return u.id === currentUser.id; });
    if (idx < 0) { toast('ব্যবহারকারী পাওয়া যায়নি।', '#e53e3e'); return; }
    var newPass = document.getElementById('pf-pass').value;
    users[idx].name = document.getElementById('pf-name').value.trim() || users[idx].name;
    users[idx].email = document.getElementById('pf-email').value.trim() || users[idx].email;
    users[idx].dob = document.getElementById('pf-dob').value;
    users[idx].job = document.getElementById('pf-job').value.trim();
    users[idx].address = document.getElementById('pf-address').value.trim();
    users[idx].nid = document.getElementById('pf-nid').value.trim();
    if (newPass) {
        if (newPass.length < 8 || !/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
            toast('পাসওয়ার্ড ৮+ অক্ষর, সংখ্যা ও লেটার থাকতে হবে।', '#e53e3e'); return;
        }
        users[idx].password = newPass;
    }
    users[idx].profileComplete = calcProfileCompleteFor(users[idx]);
    DB.saveUsers(users);
    currentUser = users[idx];
    DB.setSession(currentUser);
    loadProfile();
    toast('প্রোফাইল সংরক্ষিত হয়েছে ✅');
    document.getElementById('pf-pass').value = '';
}

function loadAdminPanel() {
    var apps = JSON.parse(localStorage.getItem('bf_applications') || '[]');
    var products = DB.getProducts();
    var orders = DB.getOrders();
    var users = DB.getUsers().filter(function (u) { return u.verified; });
    var savings = DB.getSavings();
    var loans = DB.getLoans();
    ['aq-apps', 'aq-products', 'aq-orders', 'aq-users', 'aq-savings', 'aq-loans'].forEach(function (id, i) {
        var el = document.getElementById(id); if (!el) return;
        var vals = [apps.length + ' টি আবেদন', products.length + ' টি পণ্য', orders.length + ' টি অর্ডার',
        users.length + ' জন', '৳' + savings.reduce(function (a, s) { return a + (s.amount || 0); }, 0).toLocaleString('bn'),
        loans.filter(function (l) { return l.status === 'active'; }).length + ' টি সক্রিয়'];
        el.textContent = vals[i];
    });
    var adminStats = document.getElementById('admin-stats');
    if (adminStats) {
        adminStats.innerHTML =
            '<div class="stat-card"><div class="sc-icon sc-green">👥</div><div class="sc-val">' + users.length + '</div><div class="sc-lbl">মোট ব্যবহারকারী</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-gold">📋</div><div class="sc-val">' + apps.filter(function (a) { return a.status === 'pending'; }).length + '</div><div class="sc-lbl">পেন্ডিং আবেদন</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-blue">🛒</div><div class="sc-val">' + orders.filter(function (o) { return o.status === 'pending'; }).length + '</div><div class="sc-lbl">পেন্ডিং অর্ডার</div></div>' +
            '<div class="stat-card"><div class="sc-icon sc-red">🤝</div><div class="sc-val">৳' + loans.filter(function (l) { return l.status === 'active'; }).reduce(function (a, l) { return a + (l.remaining || l.amount || 0); }, 0).toLocaleString('bn') + '</div><div class="sc-lbl">মোট করজ বাকি</div></div>';
    }
    var tb = document.getElementById('admin-recent-apps'); if (!tb) return;
    var recApps = apps.slice().reverse().slice(0, 5);
    var statMap = { pending: '<span class="tag tag-pend">পেন্ডিং</span>', approved: '<span class="tag tag-ok">অনুমোদিত</span>', rejected: '<span class="tag tag-no">বাতিল</span>' };
    tb.innerHTML = recApps.length ? recApps.map(function (a) {
        return '<tr><td>' + (a.applicantNameBn || '—') + '</td><td style="font-size:12px;">' + (a.nidNumber || '—') + '</td>' +
            '<td style="font-size:12px;">' + ((a.phones || [])[0] || '—') + '</td>' +
            '<td>' + (statMap[a.status] || a.status) + '</td>' +
            '<td style="font-size:12px;">' + (a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('bn-BD') : '—') + '</td></tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">কোনো আবেদন নেই</td></tr>';
}

function renderAllUsers() {
    if (currentUser.role !== 'admin') return;
    var search = (document.getElementById('user-search')?.value || '').toLowerCase();
    var users = DB.getUsers();
    if (search) users = users.filter(function (u) { return (u.name || '').toLowerCase().includes(search) || (u.phone || '').includes(search) || (u.username || '').includes(search); });
    var tb = document.getElementById('all-users-table'); if (!tb) return;
    var roleMap = { admin: 'অ্যাডমিন', member: 'সদস্য', user: 'ব্যবহারকারী', customer: 'গ্রাহক' };
    tb.innerHTML = users.length ? users.map(function (u) {
        return '<tr><td>' + (u.name || '—') + '</td><td><code>' + (u.username || '—') + '</code></td>' +
            '<td>' + (u.phone || '—') + '</td><td>' + (u.email || '—') + '</td>' +
            '<td><span class="tag ' + (u.role === 'admin' ? 'tag-pend' : u.role === 'member' ? 'tag-ok' : 'tag-blue') + '">' + (roleMap[u.role] || u.role) + '</span></td>' +
            '<td><div class="prog-bar" style="width:80px;"><div class="prog-fill" style="width:' + (u.profileComplete || 0) + '%"></div></div>' +
            '<span style="font-size:10px;color:#888;">' + (u.profileComplete || 0) + '%</span></td>' +
            '<td><select onchange="changeUserRole(\'' + u.id + '\',this.value)" style="font-size:11px;padding:3px;border:1px solid #d1fae5;border-radius:4px;">' +
            '<option value="user"' + (u.role === 'user' ? ' selected' : '') + '>ব্যবহারকারী</option>' +
            '<option value="customer"' + (u.role === 'customer' ? ' selected' : '') + '>গ্রাহক</option>' +
            '<option value="member"' + (u.role === 'member' ? ' selected' : '') + '>সদস্য</option>' +
            '<option value="admin"' + (u.role === 'admin' ? ' selected' : '') + '>অ্যাডমিন</option>' +
            '</select></td></tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">কোনো ব্যবহারকারী নেই</td></tr>';
}

function changeUserRole(userId, newRole) {
    var users = DB.getUsers();
    var idx = users.findIndex(function (u) { return u.id === userId; });
    if (idx >= 0) { users[idx].role = newRole; DB.saveUsers(users); toast('ভূমিকা পরিবর্তন হয়েছে ✅'); }
}

function loadAllSavings() {
    var users = DB.getUsers().filter(function (u) { return u.verified && u.role !== 'admin'; });
    var sel = document.getElementById('sv-user');
    if (sel) sel.innerHTML = '<option value="">-- সদস্য নির্বাচন --</option>' +
        users.map(function (u) { return '<option value="' + u.id + '">' + u.name + ' (' + u.phone + ')</option>'; }).join('');
    renderSavingsTable();
}

function addSavingEntry() {
    var userId = document.getElementById('sv-user').value;
    var month = document.getElementById('sv-month').value;
    var amount = parseFloat(document.getElementById('sv-amount').value);
    var note = document.getElementById('sv-note').value.trim();
    if (!userId || !month || !amount) { toast('সকল প্রয়োজনীয় তথ্য পূরণ করুন।', '#e53e3e'); return; }
    var savings = DB.getSavings();
    savings.push({ id: DB.genID('SV'), userId: userId, month: month, amount: amount, note: note, date: new Date().toISOString() });
    DB.set(DB.KEYS.SAVINGS, savings);
    renderSavingsTable();
    toast('সঞ্চয় এন্ট্রি যোগ হয়েছে ✅');
}

function renderSavingsTable() {
    var savings = DB.getSavings(), users = DB.getUsers();
    var total = savings.reduce(function (a, s) { return a + (s.amount || 0); }, 0);
    var badgeEl = document.getElementById('total-savings-badge');
    if (badgeEl) badgeEl.textContent = 'মোট: ৳' + total.toLocaleString('bn');
    var tb = document.getElementById('all-savings-table'); if (!tb) return;
    tb.innerHTML = savings.length ? savings.slice().reverse().map(function (s) {
        var u = users.find(function (x) { return x.id === s.userId; });
        return '<tr><td>' + (u ? u.name : '—') + '</td><td>' + (s.month || '—') + '</td>' +
            '<td>৳' + (s.amount || 0).toLocaleString('bn') + '</td><td>' + (s.note || '—') + '</td>' +
            '<td>' + (s.date ? new Date(s.date).toLocaleDateString('bn-BD') : '—') + '</td>' +
            '<td><button onclick="deleteSaving(\'' + s.id + '\')" style="background:#fee2e2;border:none;padding:3px 8px;border-radius:4px;cursor:pointer;font-size:11px;color:#991b1b;">🗑️</button></td></tr>';
    }).join('') : '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">কোনো সঞ্চয় নেই</td></tr>';
}

function deleteSaving(id) {
    if (!confirm('এই এন্ট্রি মুছবেন?')) return;
    DB.set(DB.KEYS.SAVINGS, DB.getSavings().filter(function (s) { return s.id !== id; }));
    renderSavingsTable();
    toast('মুছে দেওয়া হয়েছে।', '#e53e3e');
}

function loadAllLoans() {
    var loans = DB.getLoans(), users = DB.getUsers();
    var tb = document.getElementById('all-loans-table'); if (!tb) return;
    var statusMap = { active: '<span class="tag tag-pend">চলমান</span>', paid: '<span class="tag tag-ok">পরিশোধিত</span>', pending: '<span class="tag tag-blue">পেন্ডিং</span>', rejected: '<span class="tag tag-no">বাতিল</span>' };
    tb.innerHTML = loans.length ? loans.slice().reverse().map(function (l) {
        var u = users.find(function (x) { return x.id === l.userId; });
        return '<tr><td style="font-size:11px;">' + l.id + '</td><td>' + (u ? u.name : l.userName || '—') + '</td>' +
            '<td>৳' + (l.amount || 0).toLocaleString('bn') + '</td><td>৳' + (l.remaining || l.amount || 0).toLocaleString('bn') + '</td>' +
            '<td>' + (l.reason || '—') + '</td><td>' + (statusMap[l.status] || l.status) + '</td>' +
            '<td><select onchange="updateLoanStatus(\'' + l.id + '\',this.value)" style="font-size:11px;padding:3px;border:1px solid #d1fae5;border-radius:4px;">' +
            '<option value="pending"' + (l.status === 'pending' ? ' selected' : '') + '>পেন্ডিং</option>' +
            '<option value="active"' + (l.status === 'active' ? ' selected' : '') + '>অনুমোদিত</option>' +
            '<option value="paid"' + (l.status === 'paid' ? ' selected' : '') + '>পরিশোধিত</option>' +
            '<option value="rejected"' + (l.status === 'rejected' ? ' selected' : '') + '>বাতিল</option>' +
            '</select></td></tr>';
    }).join('') : '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">কোনো করজ নেই</td></tr>';
}

function updateLoanStatus(id, status) {
    var loans = DB.getLoans();
    var idx = loans.findIndex(function (l) { return l.id === id; });
    if (idx >= 0) { loans[idx].status = status; if (status === 'paid') loans[idx].remaining = 0; DB.set(DB.KEYS.LOANS, loans); toast('অবস্থা আপডেট হয়েছে ✅'); }
}

function doLogout() {
    DB.clearSession();
    localStorage.removeItem('bf_remember');
    window.location.href = '../index.html';
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlayBg').classList.toggle('show'); }
function closeSidebar() { document.getElementById('sidebar').classList.remove('open'); document.getElementById('overlayBg').classList.remove('show'); }

function toast(msg, color) {
    color = color || '#065F46';
    var t = document.getElementById('toast');
    t.textContent = msg; t.style.background = color; t.style.display = 'block';
    setTimeout(function () { t.style.display = 'none'; }, 3500);
}