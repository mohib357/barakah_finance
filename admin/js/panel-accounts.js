// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — ADMIN ACCOUNTS MODULE
//  Income, Expense, Reports, Receipt
// ═══════════════════════════════════════════════════════════

// ── Other Income ──
async function renderOtherIncome(el) {
  const content = el || document.getElementById('adminContent');
  let income = [];
  try { const r = await apiFetch('/accounts/income'); income = r?.income || []; } catch (_) {}

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">📥 অন্যান্য আয়
        <button class="btn btn-primary btn-sm ml-auto" onclick="showIncomeModal()">+ আয় যোগ করুন</button>
      </div>
      <div class="search-bar" style="margin-bottom:12px">
        <select class="filter-select" id="incCat" onchange="filterIncomeList()">
          <option value="">সব ক্যাটাগরি</option>
          <option>ডোনেশন</option><option>ব্যবসায়িক আয়</option><option>সদস্য চাঁদা</option><option>অন্যান্য</option>
        </select>
        <input type="date" class="form-input" id="incFrom" style="width:140px" onchange="filterIncomeList()"/>
        <input type="date" class="form-input" id="incTo"   style="width:140px" onchange="filterIncomeList()"/>
      </div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>রিসিট নং</th><th>ক্যাটাগরি</th><th>বিবরণ</th><th>পরিমাণ</th><th>তারিখ</th><th>পদ্ধতি</th><th>অ্যাকশন</th></tr>
        </thead><tbody id="incomeTbody">${renderIncomeRows(income)}</tbody></table>
      </div>
    </div>
    ${incomeModal()}`;
  window._incomeData = income;
}

function renderIncomeRows(rows) {
  if (!rows.length) return `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো আয় নেই।</td></tr>`;
  return rows.filter(i=>!i.deleted).map(i=>`<tr>
    <td><code style="font-size:.75rem">${i.receiptNumber||'—'}</code></td>
    <td><span class="badge badge-green" style="font-size:.72rem">${i.category||'—'}</span></td>
    <td style="font-size:.82rem;color:var(--text-muted)">${i.description||'—'}</td>
    <td style="font-weight:700;color:var(--clr-success)">${fmtMoney(i.amount)}</td>
    <td style="font-size:.78rem">${fmtDate(i.date)}</td>
    <td style="font-size:.78rem">${i.paymentMethod||'ক্যাশ'}</td>
    <td>
      <button class="btn btn-sm btn-ghost" onclick="editIncome('${i.id}')">✏️</button>
      <button class="btn btn-sm btn-ghost" style="color:var(--clr-danger)" onclick="deleteIncome('${i.id}')">🗑️</button>
    </td>
  </tr>`).join('');
}

function incomeModal() {
  return `<div class="modal-overlay hidden" id="incomeModal">
    <div class="modal modal-sm">
      <div class="modal-head"><h3>📥 আয় যোগ করুন</h3><button class="modal-close" onclick="document.getElementById('incomeModal').classList.add('hidden')">✕</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">ক্যাটাগরি <span class="req">*</span></label>
          <select class="form-select" id="imCat">
            <option>ডোনেশন</option><option>ব্যবসায়িক আয়</option><option>সদস্য চাঁদা</option><option>অন্যান্য</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">পরিমাণ (৳) <span class="req">*</span></label><input type="number" class="form-input" id="imAmt" placeholder="১০০০"/></div>
        <div class="form-group"><label class="form-label">তারিখ</label><input type="date" class="form-input" id="imDate" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="form-group"><label class="form-label">বিবরণ</label><textarea class="form-textarea" id="imDesc" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">পেমেন্ট পদ্ধতি</label>
          <select class="form-select" id="imMethod"><option value="cash">ক্যাশ</option><option value="bkash">বিকাশ</option><option value="nagad">নগদ</option><option value="bank">ব্যাংক</option></select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('incomeModal').classList.add('hidden')">বাতিল</button>
        <button class="btn btn-primary btn-sm" onclick="saveIncome()">সংরক্ষণ করুন</button>
      </div>
    </div>
  </div>`;
}

function showIncomeModal() { document.getElementById('incomeModal')?.classList.remove('hidden'); }

async function saveIncome() {
  const data = {
    category:      document.getElementById('imCat')?.value,
    amount:        parseFloat(document.getElementById('imAmt')?.value)||0,
    date:          document.getElementById('imDate')?.value,
    description:   document.getElementById('imDesc')?.value,
    paymentMethod: document.getElementById('imMethod')?.value,
  };
  if (!data.amount || !data.category) { showToast('ক্যাটাগরি ও পরিমাণ দিন।','error'); return; }
  try {
    await apiPost('/accounts/income', data);
    document.getElementById('incomeModal')?.classList.add('hidden');
    showToast('আয় সংরক্ষিত!','success');
    renderOtherIncome(document.getElementById('adminContent'));
  } catch (e) { showToast(e.message||'ব্যর্থ।','error'); }
}

function filterIncomeList() {
  const cat  = document.getElementById('incCat')?.value||'';
  const from = document.getElementById('incFrom')?.value||'';
  const to   = document.getElementById('incTo')?.value||'';
  let data = window._incomeData||[];
  if (cat)  data = data.filter(i=>i.category===cat);
  if (from) data = data.filter(i=>(i.date||'')>=from);
  if (to)   data = data.filter(i=>(i.date||'')<=to);
  const tbody = document.getElementById('incomeTbody');
  if (tbody) tbody.innerHTML = renderIncomeRows(data);
}

function editIncome(id) { showToast('এডিট সুবিধা শীঘ্রই আসছে।','info'); }
async function deleteIncome(id) {
  const reason = prompt('মুছে ফেলার কারণ লিখুন:');
  if (!reason) return;
  try { await apiDel(`/accounts/income/${id}`, { reason }); showToast('মুছে ফেলা হয়েছে।','success'); renderOtherIncome(document.getElementById('adminContent')); }
  catch(_) { showToast('ব্যর্থ।','error'); }
}

// ── Expense ──
async function renderExpense(el) {
  const content = el || document.getElementById('adminContent');
  let expense = [], categories = [];
  try { const r = await apiFetch('/accounts/expense'); expense = r?.expense||[]; categories = r?.categories||[]; } catch (_) {}

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">📤 ব্যয় ব্যবস্থাপনা
        <button class="btn btn-primary btn-sm ml-auto" onclick="showExpenseModal()">+ ব্যয় যোগ করুন</button>
      </div>
      <div class="search-bar" style="margin-bottom:12px">
        <select class="filter-select" id="expCat" onchange="filterExpenseList()">
          <option value="">সব ক্যাটাগরি</option>
          ${['অফিস ব্যয়','যাতায়াত','বেতন','মার্কেটিং','রক্ষণাবেক্ষণ','অন্যান্য'].map(c=>`<option>${c}</option>`).join('')}
        </select>
        <input type="date" class="form-input" id="expFrom" style="width:140px" onchange="filterExpenseList()"/>
        <input type="date" class="form-input" id="expTo"   style="width:140px" onchange="filterExpenseList()"/>
      </div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>রিসিট নং</th><th>ক্যাটাগরি</th><th>বিবরণ</th><th>পরিমাণ</th><th>তারিখ</th><th>পদ্ধতি</th><th>অ্যাকশন</th></tr>
        </thead><tbody id="expenseTbody">${renderExpenseRows(expense)}</tbody></table>
      </div>
    </div>
    ${expenseModal()}`;
  window._expenseData = expense;
}

function renderExpenseRows(rows) {
  if (!rows.length) return `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো ব্যয় নেই।</td></tr>`;
  return rows.filter(e=>!e.deleted).map(e=>`<tr>
    <td><code style="font-size:.75rem">${e.receiptNumber||'—'}</code></td>
    <td><span class="badge badge-danger" style="font-size:.72rem">${e.category||'—'}</span></td>
    <td style="font-size:.82rem;color:var(--text-muted)">${e.description||e.description||'—'}</td>
    <td style="font-weight:700;color:var(--clr-danger)">${fmtMoney(e.amount)}</td>
    <td style="font-size:.78rem">${fmtDate(e.date)}</td>
    <td style="font-size:.78rem">${e.paymentMethod||'ক্যাশ'}</td>
    <td>
      <button class="btn btn-sm btn-ghost" onclick="editExpense('${e.id}')">✏️</button>
      <button class="btn btn-sm btn-ghost" style="color:var(--clr-danger)" onclick="deleteExpense('${e.id}')">🗑️</button>
    </td>
  </tr>`).join('');
}

function expenseModal() {
  return `<div class="modal-overlay hidden" id="expenseModal">
    <div class="modal modal-sm">
      <div class="modal-head"><h3>📤 ব্যয় যোগ করুন</h3><button class="modal-close" onclick="document.getElementById('expenseModal').classList.add('hidden')">✕</button></div>
      <div class="modal-body">
        <div class="form-group"><label class="form-label">ক্যাটাগরি <span class="req">*</span></label>
          <select class="form-select" id="emCat">
            <option>অফিস ব্যয়</option><option>যাতায়াত</option><option>বেতন</option><option>মার্কেটিং</option><option>রক্ষণাবেক্ষণ</option><option>অন্যান্য</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">পরিমাণ (৳) <span class="req">*</span></label><input type="number" class="form-input" id="emAmt" placeholder="৫০০"/></div>
        <div class="form-group"><label class="form-label">তারিখ</label><input type="date" class="form-input" id="emDate" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="form-group"><label class="form-label">বিবরণ <span class="req">*</span></label><textarea class="form-textarea" id="emDesc" rows="2"></textarea></div>
        <div class="form-group"><label class="form-label">পেমেন্ট পদ্ধতি</label>
          <select class="form-select" id="emMethod"><option value="cash">ক্যাশ</option><option value="bkash">বিকাশ</option><option value="bank">ব্যাংক</option></select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('expenseModal').classList.add('hidden')">বাতিল</button>
        <button class="btn btn-danger btn-sm" onclick="saveExpense()">সংরক্ষণ করুন</button>
      </div>
    </div>
  </div>`;
}

function showExpenseModal() { document.getElementById('expenseModal')?.classList.remove('hidden'); }

async function saveExpense() {
  const data = {
    category:      document.getElementById('emCat')?.value,
    amount:        parseFloat(document.getElementById('emAmt')?.value)||0,
    date:          document.getElementById('emDate')?.value,
    description:   document.getElementById('emDesc')?.value,
    paymentMethod: document.getElementById('emMethod')?.value,
  };
  if (!data.amount||!data.description) { showToast('পরিমাণ ও বিবরণ দিন।','error'); return; }
  try {
    await apiPost('/accounts/expense', data);
    document.getElementById('expenseModal')?.classList.add('hidden');
    showToast('ব্যয় সংরক্ষিত!','success');
    renderExpense(document.getElementById('adminContent'));
  } catch(e) { showToast(e.message||'ব্যর্থ।','error'); }
}

function filterExpenseList() {
  const cat=document.getElementById('expCat')?.value||'',from=document.getElementById('expFrom')?.value||'',to=document.getElementById('expTo')?.value||'';
  let data=window._expenseData||[];
  if(cat)  data=data.filter(e=>e.category===cat);
  if(from) data=data.filter(e=>(e.date||'')>=from);
  if(to)   data=data.filter(e=>(e.date||'')<=to);
  const tbody=document.getElementById('expenseTbody'); if(tbody) tbody.innerHTML=renderExpenseRows(data);
}

function editExpense(id) { showToast('এডিট সুবিধা শীঘ্রই আসছে।','info'); }
async function deleteExpense(id) {
  const reason=prompt('মুছে ফেলার কারণ:'); if(!reason) return;
  try { await apiDel(`/accounts/expense/${id}`,{reason}); showToast('মুছে ফেলা হয়েছে।','success'); renderExpense(document.getElementById('adminContent')); }
  catch(_){showToast('ব্যর্থ।','error');}
}

// ── Account Summary ──
async function renderAccSummary(el) {
  const content = el || document.getElementById('adminContent');
  let summary = {};
  try { const r = await apiFetch('/accounts/report/summary'); summary = r || {}; } catch (_) {}

  const totalIncome  = summary.totalIncome  || 0;
  const totalExpense = summary.totalExpense || 0;
  const netBalance   = totalIncome - totalExpense;

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-icon stat-icon-green">📥</div><div class="stat-val" style="color:var(--clr-success)">${fmtMoney(totalIncome)}</div><div class="stat-lbl">মোট আয়</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-red">📤</div><div class="stat-val" style="color:var(--clr-danger)">${fmtMoney(totalExpense)}</div><div class="stat-lbl">মোট ব্যয়</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-${netBalance>=0?'gold':'red'}">💵</div><div class="stat-val" style="color:${netBalance>=0?'var(--clr-success)':'var(--clr-danger)'}">${fmtMoney(netBalance)}</div><div class="stat-lbl">নিট ব্যালেন্স</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-blue">💰</div><div class="stat-val">${fmtMoney(summary.totalSavings||0)}</div><div class="stat-lbl">মোট সঞ্চয়</div></div>
    </div>
    <div class="two-col">
      <div class="admin-card">
        <div class="card-title">📊 ক্যাটাগরি ওয়াইজ আয়</div>
        ${(summary.incomeByCategory||[]).map(c=>`
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:.88rem">
            <span>${c.category}</span><strong style="color:var(--clr-success)">${fmtMoney(c.total)}</strong>
          </div>`).join('')||'<p style="color:var(--text-muted)">ডেটা নেই।</p>'}
      </div>
      <div class="admin-card">
        <div class="card-title">📊 ক্যাটাগরি ওয়াইজ ব্যয়</div>
        ${(summary.expenseByCategory||[]).map(c=>`
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);font-size:.88rem">
            <span>${c.category}</span><strong style="color:var(--clr-danger)">${fmtMoney(c.total)}</strong>
          </div>`).join('')||'<p style="color:var(--text-muted)">ডেটা নেই।</p>'}
      </div>
    </div>`;
}

// ── Accounts Log ──
async function renderAccLog(el) {
  const content = el || document.getElementById('adminContent');
  let log = [];
  try { const r = await apiFetch('/accounts/log'); log = r?.log || []; } catch (_) {}

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">📋 একাউন্ট লগ</div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>তারিখ</th><th>অ্যাকশন</th><th>মডিউল</th><th>পরিমাণ</th><th>ব্যবহারকারী</th><th>কারণ</th></tr>
        </thead><tbody>
          ${log.length ? log.map(l=>`<tr>
            <td style="font-size:.78rem">${fmtDT(l.date)}</td>
            <td><span class="badge badge-muted" style="font-size:.7rem">${l.action||'—'}</span></td>
            <td style="font-size:.78rem">${l.module||'—'}</td>
            <td style="font-weight:600">${l.amount?fmtMoney(l.amount):''}</td>
            <td style="font-size:.78rem">${l.userName||l.userId||'—'}</td>
            <td style="font-size:.78rem;color:var(--text-muted)">${l.reason||l.detail||'—'}</td>
          </tr>`).join('') : '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো লগ নেই।</td></tr>'}
        </tbody></table>
      </div>
    </div>`;
}

// ── Receipt Check ──
async function renderReceiptCheck(el) {
  const content = el || document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🔍 রিসিট যাচাই</div>
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
        <input class="form-input" id="rcNum" placeholder="রিসিট নং যেমন M-00001 বা C-00001" style="flex:1"/>
        <button class="btn btn-primary" onclick="checkReceiptNum()">🔍 যাচাই করুন</button>
      </div>
      <div id="rcResult"></div>
    </div>`;
}

async function checkReceiptNum() {
  const num = document.getElementById('rcNum')?.value.trim();
  if (!num) { showToast('রিসিট নং দিন।','error'); return; }
  const wrap = document.getElementById('rcResult');
  wrap.innerHTML = '<div class="spinner" style="margin:16px auto"></div>';
  try {
    const r = await apiFetch(`/accounts/receipt/${num}`);
    if (r?.receipt) {
      const rec = r.receipt;
      wrap.innerHTML = `
        <div style="background:var(--bg-surface-2);border-radius:12px;padding:20px">
          <div class="badge badge-${rec.status==='issued'?'success':'warning'}" style="margin-bottom:12px">${rec.status==='issued'?'✅ বৈধ রিসিট':'⚠️ বাতিল রিসিট'}</div>
          <div class="two-col" style="font-size:.88rem">
            ${pRow('রিসিট নং',rec.receiptNumber)} ${pRow('ধরন',rec.type)}
            ${pRow('ইস্যু তারিখ',fmtDT(rec.issuedAt))} ${pRow('ইস্যুকারী',rec.issuedBy||'—')}
          </div>
        </div>`;
    } else {
      wrap.innerHTML = `<p style="color:var(--clr-danger)">রিসিট পাওয়া যায়নি।</p>`;
    }
  } catch(_) { wrap.innerHTML = `<p style="color:var(--clr-danger)">যাচাই ব্যর্থ হয়েছে।</p>`; }
}

// ── Account Settings (Pay Order Rules) ──
async function renderAccSettings(el) {
  const content = el || document.getElementById('adminContent');
  let rules = [];
  try { const r = await apiFetch('/accounts/pay-order-rules'); rules = r?.rules || []; } catch (_) {}

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">⚙️ পেমেন্ট রুলস
        <button class="btn btn-primary btn-sm ml-auto" onclick="showPayRuleModal()">+ রুল যোগ করুন</button>
      </div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>নাম</th><th>পরিমাণ</th><th>পুনরাবৃত্তি</th><th>বিবরণ</th><th>অ্যাকশন</th></tr>
        </thead><tbody>
          ${rules.map(r=>`<tr>
            <td style="font-weight:600">${r.name}</td>
            <td>${fmtMoney(r.amount)}</td>
            <td><span class="badge badge-${r.isRecurring?'info':'muted'}">${r.isRecurring?'মাসিক':'এককালীন'}</span></td>
            <td style="font-size:.82rem;color:var(--text-muted)">${r.description||'—'}</td>
            <td><button class="btn btn-sm btn-ghost" onclick="deletePayRule('${r.id}')">🗑️</button></td>
          </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো রুল নেই।</td></tr>'}
        </tbody></table>
      </div>
    </div>
    <div class="modal-overlay hidden" id="payRuleModal">
      <div class="modal modal-sm">
        <div class="modal-head"><h3>পে-অর্ডার রুল যোগ করুন</h3><button class="modal-close" onclick="document.getElementById('payRuleModal').classList.add('hidden')">✕</button></div>
        <div class="modal-body">
          <div class="form-group"><label class="form-label">রুলের নাম <span class="req">*</span></label><input class="form-input" id="prName" placeholder="যেমন: মাসিক সঞ্চয়"/></div>
          <div class="form-group"><label class="form-label">পরিমাণ (৳)</label><input type="number" class="form-input" id="prAmount" placeholder="২০০০"/></div>
          <div class="form-group"><label class="form-label">ধরন</label>
            <select class="form-select" id="prType"><option value="false">এককালীন</option><option value="true">মাসিক (পুনরাবৃত্তি)</option></select>
          </div>
          <div class="form-group"><label class="form-label">বিবরণ</label><textarea class="form-textarea" id="prDesc" rows="2"></textarea></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('payRuleModal').classList.add('hidden')">বাতিল</button>
          <button class="btn btn-primary btn-sm" onclick="savePayRule()">সংরক্ষণ করুন</button>
        </div>
      </div>
    </div>`;
}

function showPayRuleModal() { document.getElementById('payRuleModal')?.classList.remove('hidden'); }
async function savePayRule() {
  const data = { name:document.getElementById('prName')?.value.trim(), amount:parseFloat(document.getElementById('prAmount')?.value)||0, isRecurring:document.getElementById('prType')?.value==='true', description:document.getElementById('prDesc')?.value };
  if (!data.name) { showToast('নাম দিন।','error'); return; }
  try { await apiPost('/accounts/pay-order-rules', data); document.getElementById('payRuleModal')?.classList.add('hidden'); showToast('রুল সংরক্ষিত!','success'); renderAccSettings(document.getElementById('adminContent')); }
  catch(e) { showToast(e.message||'ব্যর্থ।','error'); }
}
async function deletePayRule(id) {
  showConfirm('রুল মুছুন','এই পে-অর্ডার রুলটি মুছবেন?', async ()=>{
    try { await apiDel(`/accounts/pay-order-rules/${id}`); showToast('মুছে ফেলা হয়েছে।','success'); renderAccSettings(document.getElementById('adminContent')); }
    catch(_){showToast('ব্যর্থ।','error');}
  });
}

// ── Project List, Add, Asset List (stubs) ──
async function renderProjectList(el) {
  const content = el||document.getElementById('adminContent');
  let projects = [];
  try { const r = await apiFetch('/projects'); projects = r?.projects||[]; } catch(_) {}
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🏗️ প্রজেক্ট তালিকা <button class="btn btn-primary btn-sm ml-auto" onclick="gotoPage('project-add')">+ নতুন প্রজেক্ট</button></div>
      <div class="table-wrap"><table><thead><tr><th>নাম</th><th>শুরু</th><th>শেষ</th><th>মূল্য</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
      <tbody>${projects.length?projects.map(p=>`<tr><td style="font-weight:600">${p.name}</td><td>${fmtDate(p.startDate)}</td><td>${fmtDate(p.endDate)}</td><td>${fmtMoney(p.capital||p.amount)}</td><td>${statusBadge(p.status||'active')}</td><td><button class="btn btn-sm btn-ghost" onclick="viewProject('${p.id}')">👁️</button></td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো প্রজেক্ট নেই।</td></tr>'}</tbody>
      </table></div>
    </div>`;
}

function renderProjectAdd(el) {
  const content = el||document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">➕ নতুন প্রজেক্ট</div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">প্রজেক্টের নাম <span class="req">*</span></label><input class="form-input" id="pjName"/></div>
        <div class="form-group"><label class="form-label">প্রজেক্টের ধরন</label><input class="form-input" id="pjType" placeholder="যেমন: ব্যবসা, কৃষি"/></div>
      </div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">মোট মূলধন (৳)</label><input type="number" class="form-input" id="pjCapital"/></div>
        <div class="form-group"><label class="form-label">মেয়াদকাল</label><input class="form-input" id="pjDuration" placeholder="যেমন: ১২ মাস"/></div>
      </div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">শুরুর তারিখ</label><input type="date" class="form-input" id="pjStart" value="${new Date().toISOString().split('T')[0]}"/></div>
        <div class="form-group"><label class="form-label">শেষের তারিখ</label><input type="date" class="form-input" id="pjEnd"/></div>
      </div>
      <div class="form-group"><label class="form-label">স্থান</label><input class="form-input" id="pjLocation"/></div>
      <div class="form-group"><label class="form-label">বিবরণ</label><textarea class="form-textarea" id="pjDesc" rows="3"></textarea></div>
      <div class="nav-btns" style="padding-top:14px;border-top:1px solid var(--border-light)">
        <button class="btn btn-ghost" onclick="gotoPage('project-list')">বাতিল</button>
        <button class="btn btn-primary btn-lg" onclick="saveProject()">✅ প্রজেক্ট সংরক্ষণ করুন</button>
      </div>
    </div>`;
}

async function saveProject() {
  const data = {
    name:       document.getElementById('pjName')?.value.trim(),
    type:       document.getElementById('pjType')?.value,
    capital:    parseFloat(document.getElementById('pjCapital')?.value)||0,
    duration:   document.getElementById('pjDuration')?.value,
    startDate:  document.getElementById('pjStart')?.value,
    endDate:    document.getElementById('pjEnd')?.value,
    location:   document.getElementById('pjLocation')?.value,
    description:document.getElementById('pjDesc')?.value,
  };
  if (!data.name) { showToast('প্রজেক্টের নাম দিন।','error'); return; }
  try { await apiPost('/projects', data); showToast('প্রজেক্ট সংরক্ষিত!','success'); gotoPage('project-list'); }
  catch(e) { showToast(e.message||'ব্যর্থ।','error'); }
}

function viewProject(id) { showToast('প্রজেক্ট বিস্তারিত শীঘ্রই আসছে।','info'); }

async function renderAssetList(el) {
  const content = el||document.getElementById('adminContent');
  let assets = [];
  try { const r = await apiFetch('/projects/assets/list'); assets = r?.assets||[]; } catch(_) {}
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">🏢 ফিক্সড এসেট তালিকা <button class="btn btn-primary btn-sm ml-auto" onclick="showAssetForm()">+ নতুন এসেট</button></div>
      <div class="table-wrap"><table><thead><tr><th>নাম</th><th>ক্রয় তারিখ</th><th>মূল্য</th><th>বর্তমান মূল্য</th><th>স্থান</th><th>স্ট্যাটাস</th></tr></thead>
      <tbody>${assets.length?assets.map(a=>`<tr><td style="font-weight:600">${a.name}</td><td>${fmtDate(a.purchaseDate)}</td><td>${fmtMoney(a.purchaseValue)}</td><td>${fmtMoney(a.currentValue||a.purchaseValue)}</td><td>${a.location||'—'}</td><td>${statusBadge(a.status||'active')}</td></tr>`).join(''):'<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো এসেট নেই।</td></tr>'}</tbody>
      </table></div>
    </div>`;
}

function showAssetForm() { showToast('এসেট ফর্ম শীঘ্রই আসছে।','info'); }
