// panel-accounts.js — Accounts Module

function renderAccSettings(el) {
    const rules = JSON.parse(localStorage.getItem('bf_pay_order_rules') || '[]');
    el.innerHTML = `
    <div class="card">
      <div class="card-title">⚙️ পে-অর্ডার রুলস
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="showAddRuleModal()">+ নতুন রুল</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>নাম</th><th>পরিমাণ (৳)</th><th>পুনরাবৃত্তি</th><th>বিবরণ</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${rules.map(r => `<tr>
          <td>${r.name}</td><td>${fmtMoney(r.amount)}</td>
          <td>${r.isRecurring ? 'হ্যাঁ ('+r.period+')' : 'না'}</td>
          <td>${r.description||'—'}</td>
          <td><button class="btn-sm btn-danger" onclick="deletePayRule('${r.id}')">🗑️</button></td>
        </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো রুল নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function showAddRuleModal() {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal" style="max-width:420px;">
    <div class="modal-head"><h3>পে-অর্ডার রুল যোগ করুন</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>রুলের নাম *</label><input class="form-input" id="pr-name"></div>
      <div class="form-group"><label>পরিমাণ (৳)</label><input class="form-input" type="number" id="pr-amount"></div>
      <div class="form-group"><label>পুনরাবৃত্তি</label>
        <select class="form-select" id="pr-recurring"><option value="false">না (এককালীন)</option><option value="true">হ্যাঁ (মাসিক)</option></select></div>
      <div class="form-group"><label>বিবরণ</label><textarea class="form-textarea" id="pr-desc"></textarea></div>
    </div>
    <div class="modal-footer">
      <button class="btn-primary" onclick="savePayRule()">সেভ</button>
      <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বাতিল</button>
    </div></div>`;
    document.body.appendChild(m);
}

function savePayRule() {
    const name = document.getElementById('pr-name').value.trim();
    if (!name) { showToast('নাম দিন।', 'error'); return; }
    const rules = JSON.parse(localStorage.getItem('bf_pay_order_rules') || '[]');
    rules.push({
        id: 'pr-' + Date.now(), name, description: document.getElementById('pr-desc').value,
        amount: parseFloat(document.getElementById('pr-amount').value) || 0,
        isRecurring: document.getElementById('pr-recurring').value === 'true',
        period: document.getElementById('pr-recurring').value === 'true' ? 'monthly' : '',
        active: true
    });
    localStorage.setItem('bf_pay_order_rules', JSON.stringify(rules));
    document.querySelector('.modal-overlay').remove();
    showToast('রুল যোগ হয়েছে।');
    renderPage('acc-settings');
}

function deletePayRule(id) {
    const rules = JSON.parse(localStorage.getItem('bf_pay_order_rules') || '[]').filter(r => r.id !== id);
    localStorage.setItem('bf_pay_order_rules', JSON.stringify(rules));
    renderPage('acc-settings');
}

// ════ OTHER INCOME ════
function renderOtherIncome(el) {
    const incomes = getIncomeEntries().filter(i => i.category !== 'member_savings' && i.category !== 'client_installment');
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📈 অন্যান্য আয়
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="showAddIncomeModal()">+ আয় যোগ</button>
      </div>
      <div class="search-bar">
        <input class="search-input" id="oi-from" type="date" placeholder="থেকে">
        <input class="search-input" id="oi-to" type="date" placeholder="পর্যন্ত">
        <button class="btn-secondary btn-sm" onclick="renderOtherIncome(document.getElementById('pageContent'))">🔍 ফিল্টার</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>রসিদ নং</th><th>ক্যাটাগরি</th><th>বিবরণ</th><th>পরিমাণ</th><th>তারিখ</th><th>মেথড</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${incomes.slice(0, 100).map(i => `<tr>
          <td><code style="font-size:10px;">${i.receiptNo || '—'}</code></td>
          <td>${i.category}</td>
          <td>${(i.description || '').substring(0, 40)}</td>
          <td style="color:#10b981;">${fmtMoney(i.amount)}</td>
          <td>${fmtDate(i.date)}</td>
          <td>${i.paymentMethod || 'নগদ'}</td>
          <td><button class="btn-sm btn-danger" onclick="deleteIncome('${i.id}')">🗑️</button></td>
        </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো আয় নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function showAddIncomeModal() {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal" style="max-width:440px;">
    <div class="modal-head"><h3>📈 আয় যোগ করুন</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>ক্যাটাগরি *</label>
        <input class="form-input" list="income-cats" id="ai-cat" placeholder="ক্যাটাগরি লিখুন বা সিলেক্ট করুন">
        <datalist id="income-cats">
          <option value="donation"><option value="project_income"><option value="product_sale">
          <option value="other">
        </datalist></div>
      <div class="form-group"><label>পরিমাণ (৳) *</label><input class="form-input" type="number" id="ai-amount"></div>
      <div class="form-group"><label>তারিখ *</label><input class="form-input" type="date" id="ai-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>বিবরণ</label><textarea class="form-textarea" id="ai-desc"></textarea></div>
      <div class="form-group"><label>পেমেন্ট মেথড</label>
        <select class="form-select" id="ai-method">
          <option value="cash">নগদ</option><option value="bkash">বিকাশ</option>
          <option value="nagad">নগদ MFS</option><option value="bank">ব্যাংক</option>
        </select></div>
    </div>
    <div class="modal-footer">
      <button class="btn-primary" onclick="saveIncomeEntry()">সেভ</button>
      <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বাতিল</button>
    </div></div>`;
    document.body.appendChild(m);
}

function saveIncomeEntry() {
    const category = document.getElementById('ai-cat').value.trim();
    const amount = parseFloat(document.getElementById('ai-amount').value) || 0;
    const date = document.getElementById('ai-date').value;
    if (!category || !amount || !date) { showToast('সব তথ্য দিন।', 'error'); return; }
    const receiptNo = generateReceiptNo('I');
    const now = new Date().toISOString();
    const incomes = getIncomeEntries();
    incomes.unshift({ id: 'inc-' + Date.now(), category, amount, date, description: document.getElementById('ai-desc').value, paymentMethod: document.getElementById('ai-method').value, receiptNo, addedBy: adminSession?.id, createdAt: now });
    saveIncome(incomes);
    saveReceipt(receiptNo, 'income', { category, amount, date });
    addAuditLog('ADD_INCOME', 'accounts', `Category: ${category}, Amount: ${amount}`);
    showToast('আয় যোগ হয়েছে।');
    document.querySelector('.modal-overlay').remove();
    renderPage('other-income');
}

function deleteIncome(id) {
    showConfirm('আয় মুছুন', 'এই আয় এন্ট্রি মুছবেন?', () => {
        const incomes = getIncomeEntries().filter(i => i.id !== id);
        saveIncome(incomes);
        addAuditLog('DELETE_INCOME', 'accounts', `ID: ${id}`);
        renderPage('other-income');
    });
}

// ════ EXPENSE ════
function renderExpense(el) {
    const expenses = getExpenseEntries().filter(e => !e.deleted);
    const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📉 ব্যয় তালিকা <span style="font-size:13px;color:#ef4444;">(মোট: ${fmtMoney(totalExp)})</span>
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="showAddExpenseModal()">+ ব্যয় যোগ</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>রসিদ নং</th><th>ক্যাটাগরি</th><th>সাব ক্যাটাগরি</th><th>পরিমাণ</th><th>তারিখ</th><th>বিবরণ</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${expenses.slice(0, 100).map(e => `<tr>
          <td><code style="font-size:10px;">${e.receiptNo || '—'}</code></td>
          <td>${e.category}</td><td>${e.subCategory || '—'}</td>
          <td style="color:#ef4444;">${fmtMoney(e.amount)}</td>
          <td>${fmtDate(e.date)}</td>
          <td>${(e.description || '').substring(0, 40)}</td>
          <td><button class="btn-sm btn-danger" onclick="deleteExpenseEntry('${e.id}')">🗑️</button></td>
        </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো ব্যয় নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function showAddExpenseModal() {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal" style="max-width:440px;">
    <div class="modal-head"><h3>📉 ব্যয় যোগ করুন</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div class="form-row">
        <div class="form-group"><label>ক্যাটাগরি *</label><input class="form-input" id="ae-cat" list="exp-cats" placeholder="ক্যাটাগরি">
          <datalist id="exp-cats"><option value="office"><option value="salary"><option value="travel"><option value="miscellaneous"></datalist>
        </div>
        <div class="form-group"><label>সাব ক্যাটাগরি</label><input class="form-input" id="ae-subcat"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>পরিমাণ (৳) *</label><input class="form-input" type="number" id="ae-amount"></div>
        <div class="form-group"><label>তারিখ *</label><input class="form-input" type="date" id="ae-date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="form-group"><label>বিবরণ</label><textarea class="form-textarea" id="ae-desc"></textarea></div>
      <div class="form-group"><label>পেমেন্ট মেথড</label>
        <select class="form-select" id="ae-method"><option value="cash">নগদ</option><option value="bkash">বিকাশ</option><option value="bank">ব্যাংক</option></select></div>
    </div>
    <div class="modal-footer">
      <button class="btn-primary" onclick="saveExpenseEntry()">সেভ</button>
      <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বাতিল</button>
    </div></div>`;
    document.body.appendChild(m);
}

function saveExpenseEntry() {
    const cat = document.getElementById('ae-cat').value.trim();
    const amount = parseFloat(document.getElementById('ae-amount').value) || 0;
    const date = document.getElementById('ae-date').value;
    if (!cat || !amount || !date) { showToast('সব তথ্য দিন।', 'error'); return; }
    const receiptNo = generateReceiptNo('E');
    const expenses = getExpenseEntries();
    expenses.unshift({ id: 'exp-' + Date.now(), category: cat, subCategory: document.getElementById('ae-subcat').value, amount, date, description: document.getElementById('ae-desc').value, paymentMethod: document.getElementById('ae-method').value, receiptNo, addedBy: adminSession?.id, createdAt: new Date().toISOString() });
    saveExpense(expenses);
    addAuditLog('ADD_EXPENSE', 'accounts', `Category: ${cat}, Amount: ${amount}`);
    showToast('ব্যয় যোগ হয়েছে।');
    document.querySelector('.modal-overlay').remove();
    renderPage('expense');
}

function deleteExpenseEntry(id) {
    showConfirm('ব্যয় মুছুন', 'এই ব্যয় এন্ট্রি মুছবেন?', () => {
        const expenses = getExpenseEntries();
        const idx = expenses.findIndex(e => e.id === id);
        if (idx >= 0) { expenses[idx].deleted = true; expenses[idx].deletedAt = new Date().toISOString(); saveExpense(expenses); }
        addAuditLog('DELETE_EXPENSE', 'accounts', `ID: ${id}`);
        renderPage('expense');
    });
}

// ════ ACCOUNT SUMMARY ════
function renderAccSummary(el) {
    const all = [...getIncomeEntries(), ...(DB.getSavings?DB.getSavings():[]).map(s=>({...s,category:'member_savings',type:'income',amount:s.amount}))];
    const totalIncome = getIncomeEntries().reduce((s,i)=>s+(i.amount||0),0) + (DB.getSavings?DB.getSavings():[]).reduce((s,i)=>s+(i.amount||0),0);
    const totalExpense = getExpenseEntries().filter(e=>!e.deleted).reduce((s,e)=>s+(e.amount||0),0);
    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val" style="color:#10b981;">${fmtMoney(totalIncome)}</div><div class="stat-lbl">মোট আয়</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#ef4444;">${fmtMoney(totalExpense)}</div><div class="stat-lbl">মোট ব্যয়</div></div>
      <div class="stat-card"><div class="stat-val" style="color:${totalIncome-totalExpense>=0?'#10b981':'#ef4444'};">${fmtMoney(totalIncome-totalExpense)}</div><div class="stat-lbl">নেট ব্যালেন্স</div></div>
    </div>
    <div class="card">
      <div class="card-title">📊 আয়-ব্যয় সারসংক্ষেপ</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div><div style="font-size:13px;color:var(--gold);margin-bottom:8px;">আয়ের ক্যাটাগরি:</div>
          ${Object.entries(getIncomeEntries().reduce((acc,i)=>{acc[i.category]=(acc[i.category]||0)+i.amount;return acc;},{})).map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span>${k}</span><span style="color:#10b981;">${fmtMoney(v)}</span></div>`).join('') || '<p style="color:rgba(255,255,255,0.3);font-size:12px;">কোনো আয় নেই।</p>'}
        </div>
        <div><div style="font-size:13px;color:var(--gold);margin-bottom:8px;">ব্যয়ের ক্যাটাগরি:</div>
          ${Object.entries(getExpenseEntries().filter(e=>!e.deleted).reduce((acc,e)=>{acc[e.category]=(acc[e.category]||0)+e.amount;return acc;},{})).map(([k,v])=>`<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.05);"><span>${k}</span><span style="color:#ef4444;">${fmtMoney(v)}</span></div>`).join('') || '<p style="color:rgba(255,255,255,0.3);font-size:12px;">কোনো ব্যয় নেই।</p>'}
        </div>
      </div>
    </div>`;
}

// ════ DUE REPORTS ════
function renderMemberDueReport(el) {
    const members = getMembers().filter(m=>m.status==='active'&&m.investType==='monthly_savings');
    const savings = DB.getSavings?DB.getSavings():[];
    const settings = getSettings();
    const currentMonth = new Date().toISOString().substring(0,7);
    const dueList = members.filter(m=>!savings.find(s=>s.userId===m.userId&&s.month===currentMonth));
    el.innerHTML = `
    <div class="card">
      <div class="card-title">⚠️ সদস্য ডিউ রিপোর্ট — ${currentMonth} (${dueList.length} জন)
        <button class="btn-secondary btn-sm" style="margin-left:auto;" onclick="window.print()">🖨️ প্রিন্ট</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>আইডি</th><th>নাম</th><th>মোবাইল</th><th>ডিউ পরিমাণ</th><th>শেষ তারিখ</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${dueList.map(m=>`<tr>
          <td>${m.memberID}</td><td>${m.name||'—'}</td><td>${m.phone||'—'}</td>
          <td style="color:#ef4444;">${fmtMoney(settings.monthlySavings||2000)}</td>
          <td>${currentMonth}-${settings.savingsDueDay||15}</td>
          <td><button class="btn-sm btn-primary" onclick="gotoPage('member-payment');setTimeout(()=>prefillMemberPayment('${m.memberID}'),400)">💵</button></td>
        </tr>`).join('')||'<tr><td colspan="6" style="text-align:center;color:#10b981;">সবাই পরিশোধ করেছেন ✅</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function renderClientDueReport(el) {
    const installments = getInstallments();
    const clients = getClients();
    const now = new Date();
    const dueList = installments.filter(i=>i.status!=='paid'&&new Date(i.dueDate)<=now).map(i=>{
        const c=clients.find(x=>x.id===i.clientId)||{};
        return {...i,clientName:c.name,clientPhone:c.phone,clientIDStr:c.clientID};
    });
    el.innerHTML = `
    <div class="card">
      <div class="card-title">⚠️ ক্লাইন্ট ডিউ রিপোর্ট (${dueList.length})
        <button class="btn-secondary btn-sm" style="margin-left:auto;" onclick="window.print()">🖨️ প্রিন্ট</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>আইডি</th><th>নাম</th><th>মোবাইল</th><th>মোট পাওনা</th><th>পরিশোধ</th><th>বাকি</th><th>শেষ তারিখ</th></tr></thead>
        <tbody>${dueList.map(d=>`<tr>
          <td>${d.clientIDStr||'—'}</td><td>${d.clientName||'—'}</td><td>${d.clientPhone||'—'}</td>
          <td>${fmtMoney(d.dueAmount)}</td><td>${fmtMoney(d.paidAmount||0)}</td>
          <td style="color:#ef4444;">${fmtMoney(d.remainingAmount)}</td>
          <td style="color:#f87171;">${fmtDate(d.dueDate)}</td>
        </tr>`).join('')||'<tr><td colspan="7" style="text-align:center;color:#10b981;">কোনো ডিউ নেই ✅</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function renderAccLog(el) {
    const log = getAuditLog().filter(l => ['ADD_INCOME','ADD_EXPENSE','COLLECT_MEMBER_PAYMENT','COLLECT_CLIENT_INSTALLMENT','DELETE_INCOME','DELETE_EXPENSE','UPDATE_CLIENT_FUND'].includes(l.action));
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📜 একাউন্ট লগ (${log.length})</div>
      <div class="table-wrap"><table>
        <thead><tr><th>কার্যক্রম</th><th>মডিউল</th><th>বিবরণ</th><th>কে করেছে</th><th>তারিখ</th></tr></thead>
        <tbody>${log.slice(0,100).map(l=>`<tr>
          <td><code style="font-size:10px;">${l.action}</code></td>
          <td>${l.module||'—'}</td>
          <td>${(l.detail||'').substring(0,50)}</td>
          <td>${l.userName||'—'}</td>
          <td>${fmtDate(l.date)}</td>
        </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো লগ নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}
