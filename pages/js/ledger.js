// ── ডিফল্ট ডেটা (API ছাড়া) ──
const API_BASE = 'http://localhost:3001/api';
let TOKEN = localStorage.getItem('bf_token') || '';
let serverOnline = false;
let allLedger = [], allSavings = [], allLoans = [], allMembers = [];
let selectedLoanId = null;

// সার্ভার চেক
async function checkServer() {
    try {
        const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
        serverOnline = r.ok;
    } catch { serverOnline = false; }
}

// API কল
async function api(path, opts = {}) {
    try {
        const r = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${TOKEN}` },
            ...opts
        });
        return await r.json();
    } catch { return null; }
}

// ── ট্যাব সুইচ ──
function showTab(name, btn) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.getElementById('panel-' + name).classList.add('active');
    btn.classList.add('active');
    if (name === 'savings') loadSavings();
    if (name === 'loans') loadLoans();
    if (name === 'reports') { loadChart(); loadMemberReport(); }
    if (name === 'balance') loadBalanceSheet();
}

// ── সারসংক্ষেপ ──
async function loadSummary() {
    if (serverOnline) {
        const data = await api('/ledger');
        if (data) {
            document.getElementById('s-income').textContent = '৳' + fmtNum(data.balance.totalIncome);
            document.getElementById('s-expense').textContent = '৳' + fmtNum(data.balance.totalExpense);
            const net = data.balance.net;
            const el = document.getElementById('s-net');
            el.textContent = '৳' + fmtNum(Math.abs(net));
            el.className = 'value ' + (net >= 0 ? 'net-pos' : 'net-neg');
            allLedger = data.entries || [];
        }
    } else {
        // localStorage ফলব্যাক
        const sv = DB.getSavings();
        const total = sv.reduce((a, s) => a + (s.amount || 0), 0);
        document.getElementById('s-income').textContent = '৳' + fmtNum(total);
        document.getElementById('s-savings').textContent = '৳' + fmtNum(total);
        allLedger = [];
    }
    // সঞ্চয় মোট
    const sv = serverOnline ? (await api('/savings'))?.stats?.total : DB.getSavings().reduce((a, s) => a + s.amount, 0);
    if (sv !== null && sv !== undefined) document.getElementById('s-savings').textContent = '৳' + fmtNum(typeof sv === 'number' ? sv : sv || 0);
    renderLedgerTable();
}

// ── লেজার ──
function renderLedgerTable() {
    const typeF = document.getElementById('f-type').value;
    const catF = document.getElementById('f-cat').value;
    const monthF = document.getElementById('f-month').value;

    let entries = allLedger.slice();
    if (typeF) entries = entries.filter(e => e.type === typeF);
    if (catF) entries = entries.filter(e => e.category === catF);
    if (monthF) entries = entries.filter(e => e.date?.startsWith(monthF));

    const catLabels = { savings: 'সঞ্চয়', late_fee: 'বিলম্ব ফি', loan_repayment: 'করজ পরিশোধ', profit: 'মুনাফা', donation: 'অনুদান', loan_disbursed: 'করজ প্রদান', operational: 'পরিচালন', purchase: 'ক্রয়', other_income: 'অন্যান্য আয়', other_expense: 'অন্যান্য ব্যয়', manual: 'ম্যানুয়াল' };
    const tbody = document.getElementById('ledger-tbody');
    if (!entries.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px;">কোনো এন্ট্রি নেই</td></tr>'; return; }

    tbody.innerHTML = entries.map(e => `<tr>
            <td style="font-size:11px;">${e.date ? new Date(e.date).toLocaleDateString('bn-BD') : '—'}</td>
            <td><span class="badge badge-${e.type}">${e.type === 'income' ? '↑ আয়' : '↓ ব্যয়'}</span></td>
            <td>${catLabels[e.category] || e.category}</td>
            <td>${e.description || '—'}</td>
            <td style="font-weight:700;color:${e.type === 'income' ? 'var(--income)' : 'var(--expense)'};">৳${fmtNum(e.amount)}</td>
            <td>${e.manual ? `<button class="btn btn-red btn-sm" onclick="deleteLedger('${e.id}')">🗑️</button>` : '<span style="color:#aaa;font-size:11px;">স্বয়ং</span>'}</td>
        </tr>`).join('');
}

async function filterLedger() { renderLedgerTable(); }

async function addLedgerEntry() {
    const type = document.getElementById('e-type').value;
    const category = document.getElementById('e-cat').value;
    const amount = parseFloat(document.getElementById('e-amount').value);
    const description = document.getElementById('e-desc').value.trim();
    const note = document.getElementById('e-note').value.trim();
    if (!amount || !description) { toast('পরিমাণ ও বিবরণ দিন', '#e53e3e'); return; }

    if (serverOnline) {
        const data = await api('/ledger', { method: 'POST', body: JSON.stringify({ type, category, amount, description, note }) });
        if (data) { toast('এন্ট্রি যোগ হয়েছে ✅'); loadSummary(); }
    } else {
        toast('সার্ভার অফলাইন', '#e53e3e');
    }
}

async function deleteLedger(id) {
    if (!confirm('এই এন্ট্রি মুছবেন?')) return;
    await api(`/ledger/${id}`, { method: 'DELETE' });
    toast('মুছে দেওয়া হয়েছে', '#e53e3e');
    loadSummary();
}

// ── সঞ্চয় ──
async function loadSavings() {
    const userF = document.getElementById('sv-filter-user').value;
    const monthF = document.getElementById('sv-filter-month').value;

    let savings = [], total = 0;
    if (serverOnline) {
        const data = userF ? await api(`/savings/user/${userF}`) : await api('/savings');
        savings = data?.savings || [];
        total = data?.stats?.total || data?.total || savings.reduce((a, s) => a + s.amount, 0);
    } else {
        savings = DB.getSavings();
        if (userF) savings = savings.filter(s => s.userId === userF);
        total = savings.reduce((a, s) => a + s.amount, 0);
    }
    if (monthF) savings = savings.filter(s => s.month === monthF);
    allSavings = savings;

    document.getElementById('sv-total-badge').textContent = 'মোট: ৳' + fmtNum(total);

    const tbody = document.getElementById('savings-tbody');
    if (!savings.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">কোনো সঞ্চয় নেই</td></tr>'; return; }
    tbody.innerHTML = savings.slice().reverse().map(s => `<tr>
            <td>${s.userName || '—'}</td>
            <td>${s.month || '—'}</td>
            <td style="color:var(--income);font-weight:700;">৳${fmtNum(s.amount)}</td>
            <td>${s.lateFee ? `<span class="badge badge-pending">৳${s.lateFee}</span>` : '—'}</td>
            <td style="font-size:11px;">${s.note || '—'}</td>
            <td style="font-size:11px;">${s.date ? new Date(s.date).toLocaleDateString('bn-BD') : '—'}</td>
            <td><button class="btn btn-red btn-sm" onclick="deleteSaving('${s.id}')">🗑️</button></td>
        </tr>`).join('');
}

async function addSaving() {
    const userId = document.getElementById('sv-user').value;
    const month = document.getElementById('sv-month').value;
    const amount = parseFloat(document.getElementById('sv-amount').value);
    const note = document.getElementById('sv-note').value.trim();
    const lateFlag = document.getElementById('sv-late').value === 'true';
    if (!userId || !month || !amount) { toast('সকল তথ্য পূরণ করুন', '#e53e3e'); return; }

    if (serverOnline) {
        const data = await api('/savings', { method: 'POST', body: JSON.stringify({ userId, month, amount, note, lateFlag }) });
        if (data?.entry) { toast('সঞ্চয় এন্ট্রি যোগ হয়েছে ✅'); loadSavings(); loadSummary(); }
        else if (data?.error) toast(data.error, '#e53e3e');
    } else {
        const users = DB.getUsers();
        const user = users.find(u => u.id === userId);
        const entry = { id: 'sv-' + Date.now(), userId, userName: user?.name || '—', month, amount, note, lateFlag, lateFee: lateFlag ? 100 : 0, date: new Date().toISOString() };
        const arr = DB.getSavings(); arr.push(entry);
        DB.set(DB.KEYS.SAVINGS, arr);
        toast('সঞ্চয় এন্ট্রি যোগ হয়েছে (অফলাইন) ✅');
        loadSavings();
    }
}

async function deleteSaving(id) {
    if (!confirm('মুছবেন?')) return;
    if (serverOnline) { await api(`/savings/${id}`, { method: 'DELETE' }); }
    else { DB.set(DB.KEYS.SAVINGS, DB.getSavings().filter(s => s.id !== id)); }
    toast('মুছে দেওয়া হয়েছে', '#e53e3e');
    loadSavings();
}

async function loadMissing() {
    const month = document.getElementById('sv-filter-month').value || new Date().toISOString().slice(0, 7);
    let missing = [];
    if (serverOnline) {
        const data = await api(`/savings/missing/${month}`);
        missing = data?.missing || [];
    } else {
        const members = DB.getUsers().filter(u => u.role === 'member');
        const paid = DB.getSavings().filter(s => s.month === month).map(s => s.userId);
        missing = members.filter(m => !paid.includes(m.id));
    }
    document.getElementById('missing-card').style.display = 'block';
    document.getElementById('missing-title').textContent = `⚠️ ${month} মাসে যারা এখনো দেননি (${missing.length} জন)`;
    document.getElementById('missing-tbody').innerHTML = missing.length
        ? missing.map(m => `<tr><td>${m.name}</td><td>${m.memberID || '—'}</td><td>${m.phone}</td>
                <td><button class="btn btn-green btn-sm" onclick="quickAddSaving('${m.id}','${m.name}','${month}')">+ যোগ করুন</button></td></tr>`).join('')
        : '<tr><td colspan="4" style="text-align:center;color:#065F46;padding:16px;">✅ সবাই জমা দিয়েছেন</td></tr>';
}

function quickAddSaving(userId, name, month) {
    document.getElementById('sv-user').value = userId;
    document.getElementById('sv-month').value = month;
    document.getElementById('sv-amount').value = 2000;
    document.getElementById('missing-card').style.display = 'none';
    toast(`${name} এর জন্য ফর্ম পূরণ হয়েছে`, '#065F46');
    showTab('savings', document.querySelectorAll('.tab')[1]);
}

// ── করজে হাসানা ──
async function loadLoans() {
    let loans = [];
    if (serverOnline) {
        const data = await api('/loans');
        loans = data?.loans || [];
    } else {
        loans = DB.getLoans();
        const users = DB.getUsers();
        loans = loans.map(l => ({ ...l, userName: users.find(u => u.id === l.userId)?.name || l.userName || '—' }));
    }
    allLoans = loans;

    const statusMap = { pending: '<span class="badge badge-pending">পেন্ডিং</span>', active: '<span class="badge badge-active">সক্রিয়</span>', paid: '<span class="badge badge-paid">পরিশোধিত</span>', rejected: '<span class="badge" style="background:#fee2e2;color:#991b1b">বাতিল</span>' };
    const tbody = document.getElementById('loans-tbody');
    if (!loans.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:20px;">কোনো করজ নেই</td></tr>'; return; }

    tbody.innerHTML = loans.slice().reverse().map(l => `<tr>
            <td>${l.userName}</td>
            <td style="font-weight:700;">৳${fmtNum(l.amount)}</td>
            <td style="color:${l.remaining > 0 ? 'var(--expense)' : 'var(--income)'};">৳${fmtNum(l.remaining || 0)}</td>
            <td style="font-size:11px;">${l.reason || '—'}</td>
            <td>${statusMap[l.status] || l.status}</td>
            <td style="font-size:11px;">${l.createdAt ? new Date(l.createdAt).toLocaleDateString('bn-BD') : '—'}</td>
            <td>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${l.status === 'pending' ? `<button class="btn btn-green btn-sm" onclick="updateLoan('${l.id}','active')">✅ অনুমোদন</button><button class="btn btn-red btn-sm" onclick="updateLoan('${l.id}','rejected')">❌</button>` : ''}
                    ${l.status === 'active' ? `<button class="btn btn-gold btn-sm" onclick="openPayment('${l.id}',${l.remaining})">💳 পরিশোধ</button>` : ''}
                </div>
            </td>
        </tr>`).join('');
}

async function updateLoan(id, status) {
    if (serverOnline) { await api(`/loans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
    else { const loans = DB.getLoans(); const idx = loans.findIndex(l => l.id === id); if (idx >= 0) loans[idx].status = status; DB.set(DB.KEYS.LOANS, loans); }
    toast('অবস্থা আপডেট হয়েছে ✅');
    loadLoans();
}

function openPayment(id, remaining) {
    selectedLoanId = id;
    document.getElementById('pay-amount').value = remaining;
    document.getElementById('pay-note').value = '';
    document.getElementById('payment-modal').style.display = 'flex';
}
function closePayment() { document.getElementById('payment-modal').style.display = 'none'; selectedLoanId = null; }

async function submitPayment() {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const note = document.getElementById('pay-note').value;
    if (!amount) { toast('পরিমাণ দিন', '#e53e3e'); return; }
    if (serverOnline) { await api(`/loans/${selectedLoanId}/payment`, { method: 'POST', body: JSON.stringify({ amount, note }) }); }
    toast('পরিশোধ রেকর্ড হয়েছে ✅');
    closePayment(); loadLoans();
}

// ── রিপোর্ট ──
async function loadChart() {
    const year = document.getElementById('chart-year').value;
    let months = [];
    if (serverOnline) {
        const data = await api(`/ledger/monthly-summary?year=${year}`);
        months = data?.months || [];
    }
    if (!months.length) {
        const sv = DB.getSavings();
        for (let m = 1; m <= 12; m++) {
            const mk = `${year}-${String(m).padStart(2, '0')}`;
            const inc = sv.filter(s => s.month === mk).reduce((a, s) => a + s.amount, 0);
            months.push({ month: mk, income: inc, expense: 0 });
        }
    }
    const maxVal = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);
    const monthNames = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    document.getElementById('monthly-chart').innerHTML = months.map((m, i) => `
            <div class="chart-bar-g">
                <div style="display:flex;gap:2px;align-items:flex-end;height:120px;">
                    <div class="bar-income" style="width:14px;height:${Math.max(4, m.income / maxVal * 110)}px;" title="আয়: ৳${fmtNum(m.income)}"></div>
                    <div class="bar-expense" style="width:14px;height:${Math.max(4, m.expense / maxVal * 110)}px;" title="ব্যয়: ৳${fmtNum(m.expense)}"></div>
                </div>
                <div class="bar-lbl">${monthNames[i]}</div>
            </div>`).join('');
}

async function loadMemberReport() {
    let report = [];
    if (serverOnline) {
        const data = await api('/reports/member-savings');
        report = data?.report || [];
    } else {
        const members = DB.getUsers().filter(u => u.role === 'member');
        const savings = DB.getSavings();
        report = members.map(m => {
            const ms = savings.filter(s => s.userId === m.id);
            return { name: m.name, memberID: m.memberID, totalSaved: ms.reduce((a, s) => a + s.amount, 0), monthCount: ms.length, lastPayment: ms.slice(-1)[0]?.date };
        });
    }
    const tbody = document.getElementById('member-report-tbody');
    tbody.innerHTML = report.length
        ? report.map(r => `<tr>
                <td>${r.name}</td>
                <td>${r.memberID || '—'}</td>
                <td style="color:var(--income);font-weight:700;">৳${fmtNum(r.totalSaved)}</td>
                <td>${r.monthCount} মাস</td>
                <td style="font-size:11px;">${r.lastPayment ? new Date(r.lastPayment).toLocaleDateString('bn-BD') : '—'}</td>
              </tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">কোনো ডেটা নেই</td></tr>';
}

// ── ব্যালেন্স শিট ──
async function loadBalanceSheet() {
    if (!serverOnline) {
        const sv = DB.getSavings().reduce((a, s) => a + s.amount, 0);
        const loans = DB.getLoans();
        const outstanding = loans.filter(l => l.status === 'active').reduce((a, l) => a + l.remaining, 0);
        document.getElementById('assets-tbody').innerHTML = `<tr><td style="padding:8px;">মোট সঞ্চয় তহবিল</td><td style="font-weight:700;color:var(--income);">৳${fmtNum(sv)}</td></tr><tr><td style="padding:8px;">চলমান করজ</td><td>৳${fmtNum(outstanding)}</td></tr>`;
        document.getElementById('liab-tbody').innerHTML = `<tr><td style="padding:8px;">সদস্যদের জমা</td><td style="font-weight:700;color:var(--expense);">৳${fmtNum(sv)}</td></tr>`;
        document.getElementById('bs-income').textContent = '৳' + fmtNum(sv);
        document.getElementById('bs-net').textContent = '৳' + fmtNum(sv - outstanding);
        return;
    }
    const data = await api('/ledger/balance-sheet');
    if (!data) return;
    document.getElementById('assets-tbody').innerHTML = Object.entries(data.assets).map(([k, v]) => `<tr><td style="padding:8px;">${k}</td><td style="font-weight:700;color:var(--income);">৳${fmtNum(v)}</td></tr>`).join('');
    document.getElementById('liab-tbody').innerHTML = Object.entries(data.liabilities).map(([k, v]) => `<tr><td style="padding:8px;">${k}</td><td style="font-weight:700;color:var(--expense);">৳${fmtNum(v)}</td></tr>`).join('');
    document.getElementById('bs-income').textContent = '৳' + fmtNum(data.income.total);
    document.getElementById('bs-expense').textContent = '৳' + fmtNum(data.expense.total);
    const net = data.net;
    const el = document.getElementById('bs-net');
    el.textContent = '৳' + fmtNum(Math.abs(net));
    el.style.color = net >= 0 ? 'var(--income)' : 'var(--expense)';
}

// ── CSV এক্সপোর্ট ──
function exportLedgerCSV() {
    const headers = ['তারিখ', 'ধরন', 'ক্যাটাগরি', 'বিবরণ', 'পরিমাণ'];
    const rows = allLedger.map(e => [
        e.date ? new Date(e.date).toLocaleDateString() : '', e.type, e.category, e.description, e.amount
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'ledger-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
}

// ── হেল্পার ──
function fmtNum(n) { return Number(n || 0).toLocaleString('bn'); }

function toast(msg, color = '#065F46') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.background = color; t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3500);
}

// ── সদস্য ড্রপডাউন লোড ──
function loadMemberDropdowns() {
    const members = DB.getUsers().filter(u => ['member', 'admin'].includes(u.role) && u.id !== 'ADMIN-001');
    const sel = document.getElementById('sv-user');
    const filterSel = document.getElementById('sv-filter-user');
    const opt = members.map(m => `<option value="${m.id}">${m.name} (${m.phone})</option>`).join('');
    sel.innerHTML = '<option value="">-- সদস্য নির্বাচন --</option>' + opt;
    filterSel.innerHTML = '<option value="">সকল সদস্য</option>' + opt;
}

// ── ইনিট ──
document.addEventListener('DOMContentLoaded', async () => {
    // অ্যাডমিন চেক
    const session = DB.getSession();
    if (!session || session.role !== 'admin') {
        alert('শুধুমাত্র অ্যাডমিনের অ্যাক্সেস আছে');
        window.location.href = '../index.html';
        return;
    }
    TOKEN = localStorage.getItem('bf_token') || '';
    await checkServer();
    loadMemberDropdowns();
    await loadSummary();
    renderLedgerTable();
    document.getElementById('sv-month').value = new Date().toISOString().slice(0, 7);
});