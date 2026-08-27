// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — MEMBER LEDGER JS
// ═══════════════════════════════════════════════════════════

// Avoid const redeclaration conflict with api.js
const _LEDGER_API = (typeof API !== 'undefined') ? API : 'http://localhost:3001/api';
let currentUser = null;
let _entries = [];

document.addEventListener('DOMContentLoaded', initLedger);

function initLedger() {
  currentUser = (typeof DB !== 'undefined') ? DB.getSession() : null;
  if (!currentUser) { window.location.href = '../index.html'; return; }
  // Default date range: last 6 months
  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const toEl   = document.getElementById('ledgerTo');
  const fromEl = document.getElementById('ledgerFrom');
  if (fromEl) fromEl.value = from.toISOString().split('T')[0];
  if (toEl)   toEl.value   = now.toISOString().split('T')[0];
  loadLedger();
}

async function loadLedger() {
  const type = document.getElementById('ledgerType')?.value || '';
  const from = document.getElementById('ledgerFrom')?.value || '';
  const to   = document.getElementById('ledgerTo')?.value   || '';

  let entries = [];

  // Try server
  try {
    const params = new URLSearchParams({ userId: currentUser.id });
    if (type) params.set('type', type);
    if (from) params.set('from', from);
    if (to)   params.set('to', to);
    const res = await fetch(`${_LEDGER_API}/ledger?${params}`, {
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('bf_token') || '') },
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) { const d = await res.json(); entries = d.entries || d.ledger || []; }
  } catch (_) {}

  // Fallback: build from localStorage
  if (!entries.length) {
    const savings = (typeof DB !== 'undefined') ? DB.getSavings().filter(s => s.userId === currentUser.id) : [];
    const loans   = (typeof DB !== 'undefined') ? DB.getLoans().filter(l => l.userId === currentUser.id) : [];
    const orders  = (typeof DB !== 'undefined') ? DB.getOrders().filter(o => o.customerId === currentUser.id) : [];

    savings.forEach(s => entries.push({
      date: s.date || s.createdAt, type: 'income', category: 'savings',
      description: `মাসিক সঞ্চয় — ${s.month || ''}`,
      amount: s.amount || 0, receiptNumber: s.receiptNumber || ''
    }));
    loans.forEach(l => {
      if (l.status === 'disbursed' || l.status === 'active') {
        entries.push({ date: l.disbursedAt || l.createdAt, type: 'expense', category: 'loan', description: 'করজ গ্রহণ — ' + (l.reason || ''), amount: l.amount || 0 });
      }
      (l.payments || []).forEach(p => entries.push({ date: p.date, type: 'income', category: 'loan_payment', description: 'করজ পরিশোধ', amount: p.amount || 0 }));
    });
    orders.forEach(o => entries.push({
      date: o.createdAt, type: 'expense', category: 'installment',
      description: `পণ্য অর্ডার — ${o.productName || ''}`, amount: o.salePrice || o.price || 0
    }));
  }

  // Apply filters
  if (type) entries = entries.filter(e => e.type === type || e.category === type);
  if (from) entries = entries.filter(e => (e.date || '') >= from);
  if (to)   entries = entries.filter(e => (e.date || '') <= to + 'T23:59:59');

  _entries = entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  renderLedger(_entries);
  updateStats(_entries);
}

function renderLedger(entries) {
  const tbody = document.getElementById('ledgerTbody');
  const totalEl = document.getElementById('ledgerTotal');
  if (!tbody) return;

  if (!entries.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">কোনো লেজার এন্ট্রি নেই।</td></tr>`;
    if (totalEl) totalEl.textContent = '';
    return;
  }

  let totalIn = 0, totalOut = 0;
  const catLabel = { savings:'সঞ্চয়', loan:'করজ', loan_payment:'করজ পরিশোধ', installment:'কিস্তি', income:'আয়', expense:'ব্যয়', client_installment:'ক্লাইন্ট কিস্তি' };
  const catBadge = { savings:'badge-green', loan:'badge-info', loan_payment:'badge-paid', installment:'badge-warning', income:'badge-green', expense:'badge-danger' };

  tbody.innerHTML = entries.map((e, i) => {
    const isIncome = e.type === 'income' || ['savings','loan_payment','client_installment'].includes(e.category);
    if (isIncome) totalIn  += (e.amount || 0);
    else          totalOut += (e.amount || 0);
    return `<tr>
      <td style="font-size:.8rem;color:var(--text-muted)">${i + 1}</td>
      <td style="font-size:.82rem">${fmtDate(e.date)}</td>
      <td><span class="badge ${catBadge[e.category] || 'badge-muted'}" style="font-size:.7rem">${catLabel[e.category] || e.category || e.type}</span></td>
      <td style="font-size:.85rem;color:var(--text-secondary)">${e.description || '—'}</td>
      <td style="font-weight:700;color:var(--clr-success)">${isIncome ? '৳ ' + fmtN(e.amount) : ''}</td>
      <td style="font-weight:700;color:var(--clr-danger)">${!isIncome ? '৳ ' + fmtN(e.amount) : ''}</td>
      <td>${e.receiptNumber ? `<code style="font-size:.75rem">${e.receiptNumber}</code>` : '—'}</td>
    </tr>`;
  }).join('');

  const balance = totalIn - totalOut;
  if (totalEl) totalEl.innerHTML = `মোট আয়: <span style="color:var(--clr-success)">৳ ${fmtN(totalIn)}</span> | মোট ব্যয়: <span style="color:var(--clr-danger)">৳ ${fmtN(totalOut)}</span> | ব্যালেন্স: <strong style="color:${balance>=0?'var(--clr-success)':'var(--clr-danger)'}">৳ ${fmtN(balance)}</strong>`;
}

function updateStats(entries) {
  const statsEl = document.getElementById('ledgerStats');
  if (!statsEl) return;
  const totalIn  = entries.filter(e => e.type === 'income').reduce((a, e) => a + (e.amount || 0), 0);
  const totalOut = entries.filter(e => e.type === 'expense').reduce((a, e) => a + (e.amount || 0), 0);
  const savings  = entries.filter(e => e.category === 'savings').reduce((a, e) => a + (e.amount || 0), 0);
  statsEl.innerHTML = `
    <div class="stat-card"><div class="stat-icon stat-icon-green">⬇️</div><div class="stat-val" style="color:var(--clr-success)">৳ ${fmtN(totalIn)}</div><div class="stat-lbl">মোট আয়</div></div>
    <div class="stat-card"><div class="stat-icon stat-icon-red">⬆️</div><div class="stat-val" style="color:var(--clr-danger)">৳ ${fmtN(totalOut)}</div><div class="stat-lbl">মোট ব্যয়</div></div>
    <div class="stat-card"><div class="stat-icon stat-icon-gold">💰</div><div class="stat-val">৳ ${fmtN(savings)}</div><div class="stat-lbl">মোট সঞ্চয়</div></div>
    <div class="stat-card"><div class="stat-icon stat-icon-blue">📊</div><div class="stat-val">${entries.length}</div><div class="stat-lbl">মোট এন্ট্রি</div></div>`;
}

function fmtN(n) { return Math.round(n || 0).toLocaleString('en-IN'); }
function fmtDate(s) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('bn-BD', { year:'numeric', month:'short', day:'numeric' }); }
  catch { return s; }
}

function printLedger() {
  window.print();
}

function exportCSV() {
  if (!_entries.length) { showToast('কোনো ডেটা নেই।', 'info'); return; }
  const rows = [['তারিখ','ধরন','বিবরণ','আয়','ব্যয়','রিসিট']];
  _entries.forEach(e => {
    const isIn = e.type === 'income' || ['savings','loan_payment'].includes(e.category);
    rows.push([e.date, e.category || e.type, e.description || '', isIn ? e.amount || 0 : '', !isIn ? e.amount || 0 : '', e.receiptNumber || '']);
  });
  const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `ledger_${new Date().toISOString().slice(0,10)}.csv`; a.click();
}
