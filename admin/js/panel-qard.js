// panel-qard.js — Qard-e-Hasana Module

function renderQardList(el) {
    const loans = getLoans();
    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${loans.length}</div><div class="stat-lbl">মোট</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#10b981;">${loans.filter(l=>l.status==='active').length}</div><div class="stat-lbl">সক্রিয়</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b;">${loans.filter(l=>l.status==='pending').length}</div><div class="stat-lbl">পেন্ডিং</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#60a5fa;">${loans.filter(l=>l.status==='paid').length}</div><div class="stat-lbl">পরিশোধিত</div></div>
    </div>
    <div class="card">
      <div class="card-title">🤝 করজে হাসানা তালিকা
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="gotoPage('qard-add')">+ নতুন করজ</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>আইডি</th><th>নাম</th><th>পরিমাণ</th><th>বাকি</th><th>মেয়াদ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${loans.map(l=>`<tr>
          <td><code style="font-size:10px;">${l.id.split('-').pop()}</code></td>
          <td>${l.userName||'—'}</td>
          <td>${fmtMoney(l.amount)}</td>
          <td style="color:${(l.remaining||0)>0?'#f87171':'#6ee7b7'};">${fmtMoney(l.remaining||0)}</td>
          <td>${l.months||'—'} মাস</td>
          <td><span class="status-badge badge-${l.status==='active'?'active':l.status==='paid'?'paid':l.status==='rejected'?'rejected':'pending'}">${l.status}</span></td>
          <td>
            <button class="btn-sm btn-secondary" onclick="viewQard('${l.id}')">👁️</button>
            ${l.status==='pending'?`<button class="btn-sm btn-success" onclick="approveQard('${l.id}')">✅</button><button class="btn-sm btn-danger" onclick="rejectQard('${l.id}')">❌</button>`:''}
            ${l.status==='active'&&(l.remaining||0)>0?`<button class="btn-sm btn-primary" onclick="gotoPage('qard-collection');setTimeout(()=>prefillQardPayment('${l.id}'),400)">💵</button>`:''}
          </td>
        </tr>`).join('')||'<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো করজ নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function approveQard(id) {
    const loans = getLoans();
    const idx = loans.findIndex(l=>l.id===id);
    if(idx<0) return;
    loans[idx].status = 'active';
    loans[idx].approvedAt = new Date().toISOString();
    loans[idx].approvedBy = adminSession?.id;
    if(DB.set) DB.set(DB.KEYS.LOANS, loans);
    else localStorage.setItem('bf_loans', JSON.stringify(loans));

    // Qard fund deduction
    const qi = getCharityIncome().filter(c=>c.category!=='qard_disbursement');
    // Log charity expense
    const ce = getCharityExpense();
    ce.push({id:'qd-'+Date.now(),category:'qard_disbursement',amount:loans[idx].amount,date:new Date().toISOString(),description:`করজ বিতরণ — ${loans[idx].userName}`,addedBy:adminSession?.id});
    saveCharityExpense(ce);

    addAuditLog('APPROVE_QARD','qard',`Loan: ${id}, Amount: ${loans[idx].amount}`);
    showToast('করজ অনুমোদন দেওয়া হয়েছে।');
    renderPage('qard-list');
}

function rejectQard(id) {
    const reason = prompt('প্রত্যাখ্যানের কারণ:');
    if(!reason) return;
    const loans = getLoans();
    const idx = loans.findIndex(l=>l.id===id);
    if(idx<0) return;
    loans[idx].status = 'rejected';
    loans[idx].rejectReason = reason;
    if(DB.set) DB.set(DB.KEYS.LOANS, loans); else localStorage.setItem('bf_loans', JSON.stringify(loans));
    addAuditLog('REJECT_QARD','qard',`Loan: ${id}, Reason: ${reason}`);
    showToast('প্রত্যাখ্যান করা হয়েছে।');
    renderPage('qard-list');
}

function viewQard(id) {
    const l = getLoans().find(x=>x.id===id);
    if(!l) return;
    const m=document.createElement('div');
    m.className='modal-overlay';
    m.innerHTML=`<div class="modal"><div class="modal-head"><h3>🤝 করজে হাসানা বিস্তারিত</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
        <div><b>নাম:</b> ${l.userName||'—'}</div>
        <div><b>পরিমাণ:</b> ${fmtMoney(l.amount)}</div>
        <div><b>বাকি:</b> ${fmtMoney(l.remaining||0)}</div>
        <div><b>কারণ:</b> ${l.reason||'—'}</div>
        <div><b>জামিনদার:</b> ${l.guarantor||'—'}</div>
        <div><b>মেয়াদ:</b> ${l.months||'—'} মাস</div>
        <div><b>স্ট্যাটাস:</b> ${l.status}</div>
        <div><b>তারিখ:</b> ${fmtDate(l.createdAt)}</div>
      </div>
      ${l.payments&&l.payments.length?`<div style="margin-top:14px;"><b>পেমেন্ট ইতিহাস:</b>
        <div class="table-wrap" style="max-height:150px;overflow-y:auto;margin-top:6px;">
          <table><thead><tr><th>পরিমাণ</th><th>তারিখ</th><th>নোট</th></tr></thead>
          <tbody>${l.payments.map(p=>`<tr><td>${fmtMoney(p.amount)}</td><td>${fmtDate(p.date)}</td><td>${p.note||'—'}</td></tr>`).join('')}</tbody></table>
        </div></div>`:''}
    </div>
    <div class="modal-footer"><button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বন্ধ</button></div>
    </div>`;
    document.body.appendChild(m);
}

function renderQardFund(el) {
    const loans = getLoans().filter(l=>l.status==='active');
    const totalActive = loans.reduce((s,l)=>s+(l.amount||0),0);
    const charityBal = getCharityIncome().reduce((s,c)=>s+(c.amount||0),0) - getCharityExpense().reduce((s,e)=>s+(e.amount||0),0);
    el.innerHTML = `
    <div class="card">
      <div class="card-title">💰 করজে হাসানা ফান্ড</div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-val">${fmtMoney(charityBal)}</div><div class="stat-lbl">ফান্ড ব্যালেন্স</div></div>
        <div class="stat-card"><div class="stat-val" style="color:#f59e0b;">${fmtMoney(totalActive)}</div><div class="stat-lbl">বিতরণকৃত</div></div>
        <div class="stat-card"><div class="stat-val" style="color:#10b981;">${fmtMoney(charityBal-totalActive)}</div><div class="stat-lbl">এভেইলেবল</div></div>
      </div>
      <div class="alert alert-info">💡 করজে হাসানা ফান্ড চ্যারিটি ফান্ড থেকে পরিচালিত হয়। নতুন ফান্ড যোগ করতে চ্যারিটি ফান্ডরেজিং সেকশন ব্যবহার করুন।</div>
    </div>`;
}

function renderQardCollection(el) {
    el.innerHTML = `
    <div class="card">
      <div class="card-title">💵 করজ সংগ্রহ</div>
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <input class="search-input" id="qc-search" placeholder="নাম বা করজ আইডি..." style="flex:1;">
        <button class="btn-primary" onclick="findQardForPayment()">🔍 খুঁজুন</button>
      </div>
      <div id="qc-profile"></div>
    </div>`;
}

function prefillQardPayment(loanId) {
    const input = document.getElementById('qc-search');
    if(input) { input.value = loanId; findQardForPayment(); }
}

function findQardForPayment() {
    const q = (document.getElementById('qc-search')?.value||'').toLowerCase();
    const loans = getLoans();
    const l = loans.find(x=>x.id.toLowerCase()===q||(x.userName||'').toLowerCase().includes(q));
    const div = document.getElementById('qc-profile');
    if(!l){div.innerHTML='<div class="alert alert-error">পাওয়া যায়নি।</div>';return;}

    div.innerHTML = `
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:700;color:#fff;">${l.userName} <code style="font-size:11px;color:var(--gold);">${l.id.substring(0,12)}</code></div>
      <div style="display:flex;gap:14px;margin-top:8px;">
        <span>মোট: <b>${fmtMoney(l.amount)}</b></span>
        <span>বাকি: <b style="color:#ef4444;">${fmtMoney(l.remaining||0)}</b></span>
        <span>স্ট্যাটাস: <b>${l.status}</b></span>
      </div>
    </div>
    ${l.status==='active'&&(l.remaining||0)>0?`
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px;">
      <div class="form-row">
        <div class="form-group"><label>পরিমাণ (৳) *</label><input class="form-input" type="number" id="qp-amount" value="${l.remaining||0}" max="${l.remaining||0}"></div>
        <div class="form-group"><label>মেথড</label>
          <select class="form-select" id="qp-method"><option value="cash">নগদ</option><option value="bkash">বিকাশ</option><option value="bank">ব্যাংক</option></select>
        </div>
      </div>
      <div class="form-group"><label>নোট</label><input class="form-input" id="qp-note"></div>
      <button class="btn-primary" onclick="collectQardPayment('${l.id}','${l.userName||''}')">💳 পেমেন্ট নিন</button>
    </div>`:'<div class="alert alert-info">এই করজ সক্রিয় নেই বা পরিশোধিত।</div>'}`;
}

function collectQardPayment(loanId, loanName) {
    const amount = parseFloat(document.getElementById('qp-amount').value)||0;
    const method = document.getElementById('qp-method').value;
    const note = document.getElementById('qp-note').value;
    if(!amount){showToast('পরিমাণ দিন।','error');return;}

    const loans = getLoans();
    const idx = loans.findIndex(l=>l.id===loanId);
    if(idx<0){showToast('পাওয়া যায়নি।','error');return;}

    const newRemaining = Math.max(0,(loans[idx].remaining||0)-amount);
    if(!loans[idx].payments) loans[idx].payments=[];
    loans[idx].payments.push({amount,note,method,date:new Date().toISOString(),collectedBy:adminSession?.id});
    loans[idx].remaining = newRemaining;
    if(newRemaining<=0) loans[idx].status='paid';

    if(DB.set) DB.set(DB.KEYS.LOANS, loans); else localStorage.setItem('bf_loans',JSON.stringify(loans));

    // Charity income (repayment returns to fund)
    const ci = getCharityIncome();
    ci.push({id:'qr-'+Date.now(),category:'qard_repayment',amount,date:new Date().toISOString(),description:`করজ পরিশোধ — ${loanName}`,addedBy:adminSession?.id});
    saveCharityIncome(ci);

    const receiptNo = generateReceiptNo('Q');
    saveReceipt(receiptNo,'qard',{loanId,loanName,amount,method});
    addAuditLog('COLLECT_QARD_PAYMENT','qard',`Loan: ${loanId}, Amount: ${amount}`);
    printReceipt({receiptNo,name:loanName,id:loanId.substring(0,12),items:[{label:'করজ পরিশোধ',amount}],total:amount,method,date:new Date().toISOString(),collectedBy:adminSession?.name});
    showToast(`পেমেন্ট সফল। রসিদ: ${receiptNo}`);
    findQardForPayment();
}

// ════ CREATE QARD ════
function renderQardAdd(el) {
    const members = getMembers();
    const qardApps = getQardApps().filter(q=>q.status==='pending');
    el.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchQardTab('new',this)">➕ নতুন করজ</button>
      <button class="tab-btn" onclick="switchQardTab('apps',this)">📩 পেন্ডিং আবেদন (${qardApps.length})</button>
    </div>

    <div id="qard-tab-new">
    <div class="card">
      <div class="card-title">🤝 নতুন করজে হাসানা তৈরি</div>
      <div class="form-group"><label>সদস্য সার্চ করুন</label>
        <div style="display:flex;gap:8px;"><input class="search-input" id="qa-search" placeholder="নাম, আইডি বা মোবাইল..." style="flex:1;"><button class="btn-secondary" onclick="findMemberForQard()">🔍</button></div>
        <div id="qa-member-info" style="margin-top:8px;"></div>
      </div>
      <input type="hidden" id="qa-member-id">
      <div class="form-row">
        <div class="form-group"><label>পরিমাণ (৳) * সর্বোচ্চ ${fmtMoney(getSettings().maxLoan||15000)}</label>
          <input class="form-input" type="number" id="qa-amount" max="${getSettings().maxLoan||15000}"></div>
        <div class="form-group"><label>মেয়াদ (মাস)</label>
          <select class="form-select" id="qa-months">
            <option value="3">৩</option><option value="4">৪</option>
            <option value="5">৫</option><option value="6">৬</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>কারণ *</label><textarea class="form-textarea" id="qa-reason" rows="2"></textarea></div>
      <div class="form-group"><label>জামিনদার</label>
        <select class="form-select" id="qa-guarantor">
          <option value="">— সিলেক্ট করুন —</option>
          ${members.map(m=>`<option value="${m.id}">${m.name} (${m.memberID})</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>করজ গ্রহণের তারিখ</label><input class="form-input" type="date" id="qa-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div style="display:flex;gap:10px;"><button class="btn-primary" onclick="createQard()">✅ করজ অনুমোদন দিন</button></div>
      <div id="qa-alert" class="alert" style="display:none;margin-top:10px;"></div>
    </div>
    </div>

    <div id="qard-tab-apps" style="display:none;">
    <div class="card">
      <div class="card-title">📩 পেন্ডিং করজ আবেদন</div>
      <div class="table-wrap"><table>
        <thead><tr><th>নাম</th><th>পরিমাণ</th><th>মেয়াদ</th><th>কারণ</th><th>জামিনদার</th><th>তারিখ</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${qardApps.map(q=>`<tr>
          <td>${q.name||'—'}</td><td>${fmtMoney(q.amount)}</td><td>${q.months||'—'} মাস</td>
          <td>${(q.reason||'').substring(0,30)}</td><td>${q.guarantor||'—'}</td>
          <td>${fmtDate(q.date)}</td>
          <td>
            <button class="btn-sm btn-success" onclick="approveQardApp('${q.id}')">✅ অনুমোদন</button>
            <button class="btn-sm btn-danger" onclick="rejectQardApp('${q.id}')">❌</button>
          </td>
        </tr>`).join('')||'<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো আবেদন নেই।</td></tr>'}
        </tbody></table></div>
    </div>
    </div>`;
}

function switchQardTab(tab, btn) {
    document.getElementById('qard-tab-new').style.display = tab==='new'?'block':'none';
    document.getElementById('qard-tab-apps').style.display = tab==='apps'?'block':'none';
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    if(btn) btn.classList.add('active');
}

function findMemberForQard() {
    const q = (document.getElementById('qa-search')?.value||'').toLowerCase();
    const m = getMembers().find(x=>(x.name||'').toLowerCase().includes(q)||(x.memberID||'').toLowerCase()===q||(x.phone||'').includes(q));
    const div = document.getElementById('qa-member-info');
    if(!m){div.innerHTML='<div class="alert alert-error">সদস্য পাওয়া যায়নি।</div>';return;}
    document.getElementById('qa-member-id').value = m.id;
    div.innerHTML=`<div class="alert alert-success">✅ ${m.name} (${m.memberID}) — ${m.phone||'—'}</div>`;
}

function createQard() {
    const alert = document.getElementById('qa-alert');
    const memberId = document.getElementById('qa-member-id').value;
    const amount = parseFloat(document.getElementById('qa-amount').value)||0;
    const months = document.getElementById('qa-months').value;
    const reason = document.getElementById('qa-reason').value.trim();
    const settings = getSettings();

    if(!memberId||!amount||!reason){alert.style.display='block';alert.className='alert alert-error';alert.textContent='সব তথ্য দিন।';return;}
    if(amount>settings.maxLoan){alert.style.display='block';alert.className='alert alert-error';alert.textContent=`সর্বোচ্চ ${fmtMoney(settings.maxLoan)} টাকা।`;return;}

    const m = getMembers().find(x=>x.id===memberId);
    const loans = getLoans();
    const loanId = 'QH-'+String(loans.length+1).padStart(3,'0')+'-'+Date.now().toString(36).toUpperCase();
    const now = new Date().toISOString();
    loans.push({
        id:loanId, userId:m?.userId, userName:m?.name||'—', memberID:m?.memberID,
        amount, remaining:amount, reason, guarantor:document.getElementById('qa-guarantor').value,
        months:parseInt(months), startMonth:document.getElementById('qa-date').value,
        status:'active', payments:[], createdAt:now, createdBy:adminSession?.id
    });

    if(DB.set) DB.set(DB.KEYS.LOANS,loans); else localStorage.setItem('bf_loans',JSON.stringify(loans));

    // Charity expense (disbursement)
    const ce = getCharityExpense();
    ce.push({id:'qd-'+Date.now(),category:'qard_disbursement',amount,date:now,description:`করজ বিতরণ — ${m?.name||'—'}`,addedBy:adminSession?.id});
    saveCharityExpense(ce);

    addAuditLog('CREATE_QARD','qard',`ID: ${loanId}, Amount: ${amount}`);
    showToast('করজে হাসানা তৈরি ও বিতরণ সম্পন্ন।');
    gotoPage('qard-list');
}

function approveQardApp(id) {
    const apps = getQardApps();
    const idx = apps.findIndex(a=>a.id===id);
    if(idx<0) return;
    apps[idx].status='approved';
    apps[idx].approvedAt=new Date().toISOString();
    apps[idx].approvedBy=adminSession?.id;
    saveQardApps(apps);
    showToast('আবেদন অনুমোদিত।');
    renderPage('qard-add');
}

function rejectQardApp(id) {
    const reason = prompt('প্রত্যাখ্যানের কারণ:');
    if(!reason) return;
    const apps = getQardApps();
    const idx = apps.findIndex(a=>a.id===id);
    if(idx>=0){apps[idx].status='rejected';apps[idx].rejectReason=reason;saveQardApps(apps);}
    showToast('প্রত্যাখ্যান করা হয়েছে।');
    renderPage('qard-add');
}
