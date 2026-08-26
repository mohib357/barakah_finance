// panel-client.js — ক্লাইন্ট মডিউল

function renderClientList(el) {
    const clients = getClients();
    const installments = getInstallments();
    const enriched = clients.map(c => {
        const inst = installments.filter(i => i.clientId === c.id);
        const paid = inst.filter(i => i.status === 'paid').reduce((s,i) => s+(i.paidAmount||0), 0);
        return { ...c, totalPaid: paid, remaining: (c.totalPayable||0) - paid };
    });
    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${clients.length}</div><div class="stat-lbl">মোট</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#10b981;">${clients.filter(c=>c.status==='active').length}</div><div class="stat-lbl">সক্রিয়</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#60a5fa;">${clients.filter(c=>c.status==='paid').length}</div><div class="stat-lbl">পরিশোধিত</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b;">${fmtMoney(enriched.reduce((s,c)=>s+(c.remaining||0),0))}</div><div class="stat-lbl">মোট বাকি</div></div>
    </div>
    <div class="card">
      <div class="card-title">🛒 ক্লাইন্ট তালিকা
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="gotoPage('client-add')">+ নতুন ক্লাইন্ট</button>
      </div>
      <div class="search-bar">
        <input class="search-input" id="cl-search" placeholder="নাম, আইডি বা মোবাইল..." oninput="filterClientTable()">
        <select class="filter-select" id="cl-status" onchange="filterClientTable()">
          <option value="">সব</option><option value="active">সক্রিয়</option>
          <option value="paid">পরিশোধিত</option>
        </select>
        <button class="btn-secondary btn-sm" onclick="exportClientsCSV()">📥 CSV</button>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>আইডি</th><th>নাম</th><th>পণ্য</th><th>মোট মূল্য</th><th>পরিশোধ</th><th>বাকি</th><th>ক্রয়ের তারিখ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
        <tbody id="clTbody"></tbody></table>
      </div>
    </div>`;
    window._clientsData = enriched;
    renderClientRows(enriched);
}

function renderClientRows(data) {
    const tbody = document.getElementById('clTbody');
    if (!tbody) return;
    tbody.innerHTML = data.map(c => `
      <tr>
        <td><code style="font-size:11px;">${c.clientID || '—'}</code></td>
        <td>${c.name}</td>
        <td>${c.productName || '—'}</td>
        <td>${fmtMoney(c.totalPayable)}</td>
        <td>${fmtMoney(c.totalPaid)}</td>
        <td style="color:${c.remaining>0?'#f87171':'#6ee7b7'};">${fmtMoney(c.remaining)}</td>
        <td>${fmtDate(c.purchaseDate)}</td>
        <td><span class="status-badge ${c.status==='paid'?'badge-paid':'badge-active'}">${c.status==='paid'?'পরিশোধিত':'সক্রিয়'}</span></td>
        <td>
          <button class="btn-sm btn-secondary" onclick="viewClient('${c.id}')">👁️</button>
          <button class="btn-sm btn-secondary" onclick="gotoPage('client-payment');setTimeout(()=>prefillClientPayment('${c.clientID}'),400)">💵</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;color:rgba(255,255,255,0.3);padding:20px;">কোনো ক্লাইন্ট নেই।</td></tr>';
}

function filterClientTable() {
    const q = (document.getElementById('cl-search')?.value||'').toLowerCase();
    const s = document.getElementById('cl-status')?.value||'';
    const filtered = (window._clientsData||[]).filter(c=>
        (!q||(c.name||'').toLowerCase().includes(q)||(c.clientID||'').includes(q)||(c.phone||'').includes(q))&&
        (!s||c.status===s)
    );
    renderClientRows(filtered);
}

function viewClient(id) {
    const c = (window._clientsData||[]).find(x=>x.id===id);
    if(!c) return;
    const installments = getInstallments().filter(i=>i.clientId===id).sort((a,b)=>a.installmentNumber-b.installmentNumber);
    const m = document.createElement('div');
    m.className='modal-overlay';
    m.innerHTML=`
    <div class="modal">
      <div class="modal-head"><h3>🛒 ক্লাইন্ট বিস্তারিত</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:16px;">
          <div><b>আইডি:</b> ${c.clientID}</div><div><b>নাম:</b> ${c.name}</div>
          <div><b>মোবাইল:</b> ${c.phone||'—'}</div><div><b>পিতার নাম:</b> ${c.fatherName||'—'}</div>
          <div><b>ঠিকানা:</b> ${c.address||'—'}</div><div><b>NID:</b> ${c.nid||'—'}</div>
          <div><b>পণ্য:</b> ${c.productName||'—'}</div><div><b>ক্রয়মূল্য:</b> ${fmtMoney(c.purchasePrice)}</div>
          <div><b>ডাউনপেমেন্ট:</b> ${fmtMoney(c.downPayment)}</div><div><b>লাভ:</b> ${fmtMoney(c.profitAmount)}</div>
          <div><b>মোট বিক্রয়মূল্য:</b> ${fmtMoney(c.salePrice)}</div><div><b>কিস্তির সংখ্যা:</b> ${c.installmentCount}</div>
          <div><b>জামিনদার:</b> ${c.guarantorMemberId||'—'}</div><div><b>স্বাক্ষী:</b> ${c.witnessName||'—'}</div>
        </div>
        <div><b>কিস্তি সময়সূচী:</b>
          <div class="table-wrap" style="max-height:200px;overflow-y:auto;margin-top:8px;">
            <table><thead><tr><th>কিস্তি</th><th>দেওয়ার তারিখ</th><th>পরিমাণ</th><th>পরিশোধ</th><th>বাকি</th><th>স্ট্যাটাস</th></tr></thead>
            <tbody>${installments.map(i=>`<tr>
              <td>${i.installmentNumber}</td><td>${fmtDate(i.dueDate)}</td>
              <td>${fmtMoney(i.dueAmount)}</td><td>${fmtMoney(i.paidAmount||0)}</td>
              <td>${fmtMoney(i.remainingAmount)}</td>
              <td><span class="status-badge badge-${i.status==='paid'?'paid':i.status==='overdue'?'overdue':'pending'}">${i.status}</span></td>
            </tr>`).join('')}</tbody></table>
          </div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বন্ধ</button></div>
    </div>`;
    document.body.appendChild(m);
}

function exportClientsCSV() {
    const data = window._clientsData||[];
    const rows=[['আইডি','নাম','মোবাইল','পণ্য','মোট মূল্য','পরিশোধ','বাকি','তারিখ','স্ট্যাটাস']];
    data.forEach(c=>rows.push([c.clientID,c.name,c.phone,c.productName,c.totalPayable,c.totalPaid,c.remaining,c.purchaseDate,c.status]));
    const csv=rows.map(r=>r.map(c=>`"${c||''}"`).join(',')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='clients.csv';a.click();
}

// ════ ADD NEW CLIENT ════
function renderClientAdd(el) {
    const members = getMembers();
    const settings = getSettings();
    el.innerHTML = `
    <div class="card">
      <div class="card-title">➕ নতুন ক্লাইন্ট তৈরি করুন</div>
      <div class="form-row">
        <div class="form-group"><label>ক্লাইন্ট আইডি *</label>
          <input class="form-input" id="ca-id" value="${nextClientID()}" oninput="checkClientID(this.value)">
          <div id="ca-id-hint" style="font-size:11px;margin-top:3px;"></div>
        </div>
        <div class="form-group"><label>ক্রয়ের তারিখ *</label><input class="form-input" type="date" id="ca-date" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>নাম *</label><input class="form-input" id="ca-name"></div>
        <div class="form-group"><label>পিতার নাম</label><input class="form-input" id="ca-fname"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>মোবাইল *</label><input class="form-input" id="ca-phone"></div>
        <div class="form-group"><label>NID নং</label><input class="form-input" id="ca-nid"></div>
      </div>
      <div class="form-group"><label>ঠিকানা</label><input class="form-input" id="ca-addr"></div>

      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:14px 0;">
        <div style="font-size:13px;color:var(--gold);margin-bottom:12px;">📦 পণ্য ও কিস্তির তথ্য</div>
        <div class="form-row">
          <div class="form-group"><label>পণ্যের নাম</label><input class="form-input" id="ca-product"></div>
          <div class="form-group"><label>ক্রয়মূল্য (৳) *</label><input class="form-input" type="number" id="ca-cost" oninput="updateClientCalc()"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>ডাউনপেমেন্ট (৳)</label><input class="form-input" type="number" id="ca-down" value="0" oninput="updateClientCalc()"></div>
          <div class="form-group"><label>কিস্তির সংখ্যা *</label>
            <select class="form-select" id="ca-n" onchange="updateClientCalc()">
              <option value="3">৩</option><option value="6" selected>৬</option>
              <option value="9">৯</option><option value="12">১২</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>হিসাবের পদ্ধতি</label>
            <select class="form-select" id="ca-method" onchange="updateClientCalc()">
              <option value="A">Method A: সম্পূর্ণ মূল্যের উপর</option>
              <option value="B" selected>Method B: অর্থায়িত অংশের উপর (শরিয়াহ)</option>
              <option value="C">Method C: কাস্টম</option>
            </select>
          </div>
          <div class="form-group"><label>লাভের হার (%) *</label><input class="form-input" type="number" id="ca-rate" value="${settings.profitMargin||10}" oninput="updateClientCalc()"></div>
        </div>
        <div id="ca-custom-field" style="display:none;">
          <div class="form-group"><label>কাস্টম লাভ (টাকা বা %)</label><input class="form-input" id="ca-custom" placeholder="5000 বা 15%" oninput="updateClientCalc()"></div>
        </div>
        <div class="calc-preview" id="ca-preview" style="display:none;"></div>
        <div id="ca-schedule" style="display:none;margin-top:12px;"></div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin-bottom:14px;">
        <div style="font-size:13px;color:var(--gold);margin-bottom:12px;">🤝 জামিনদার ও স্বাক্ষী</div>
        <div class="form-row">
          <div class="form-group"><label>জামিনদার (সদস্য সিলেক্ট করুন)</label>
            <select class="form-select" id="ca-guarantor">
              <option value="">— সিলেক্ট করুন —</option>
              ${members.map(m=>`<option value="${m.id}">${m.name} (${m.memberID})</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>স্বাক্ষীর নাম *</label><input class="form-input" id="ca-witness-name"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>স্বাক্ষীর মোবাইল *</label><input class="form-input" id="ca-witness-phone"></div>
          <div class="form-group"><label>স্বাক্ষীর ঠিকানা</label><input class="form-input" id="ca-witness-addr"></div>
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn-primary" onclick="saveNewClient()">💾 ক্লাইন্ট সেভ করুন</button>
        <button class="btn-secondary" onclick="gotoPage('client-list')">বাতিল</button>
      </div>
      <div id="ca-alert" class="alert" style="display:none;margin-top:12px;"></div>
    </div>`;

    document.getElementById('ca-method').addEventListener('change', () => {
        document.getElementById('ca-custom-field').style.display = document.getElementById('ca-method').value === 'C' ? 'block' : 'none';
    });
}

function nextClientID() {
    const clients = getClients();
    if (!clients.length) return '000001';
    const nums = clients.map(c => parseInt(c.clientID) || 0);
    return String(Math.max(...nums) + 1).padStart(6, '0');
}

function checkClientID(val) {
    const hint = document.getElementById('ca-id-hint');
    if (!val) { hint.textContent = ''; return; }
    const exists = getClients().find(c => c.clientID === val);
    hint.style.color = exists ? '#ef4444' : '#10b981';
    hint.textContent = exists ? '❌ ইতিমধ্যে ব্যবহৃত।' : '✅ এভেইলেবল।';
}

function updateClientCalc() {
    const cost = parseFloat(document.getElementById('ca-cost')?.value) || 0;
    const down = parseFloat(document.getElementById('ca-down')?.value) || 0;
    const n = parseInt(document.getElementById('ca-n')?.value) || 6;
    const rate = parseFloat(document.getElementById('ca-rate')?.value) || 10;
    const method = document.getElementById('ca-method')?.value || 'B';
    const preview = document.getElementById('ca-preview');
    const schedule = document.getElementById('ca-schedule');
    if (!cost) { preview.style.display = 'none'; schedule.style.display = 'none'; return; }

    let salePrice, profitAmount;
    if (method === 'B') {
        const financed = cost - down;
        profitAmount = financed * (rate / 100);
        salePrice = cost + profitAmount;
    } else if (method === 'C') {
        const custom = document.getElementById('ca-custom')?.value || '';
        if (custom.includes('%')) { profitAmount = cost * (parseFloat(custom) / 100); }
        else { profitAmount = parseFloat(custom) || 0; }
        salePrice = cost + profitAmount;
    } else {
        profitAmount = cost * (rate / 100);
        salePrice = cost + profitAmount;
    }

    const remaining = salePrice - down;
    const baseInstall = Math.floor(remaining / n);
    const lastInstall = remaining - baseInstall * (n - 1);

    preview.style.display = 'block';
    preview.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;">
      <div><div class="cv">${fmtMoney(profitAmount)}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">লাভ</div></div>
      <div><div class="cv">${fmtMoney(salePrice)}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">মোট বিক্রয়মূল্য</div></div>
      <div><div class="cv">${fmtMoney(remaining)}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">ডাউন বাদে বাকি</div></div>
      <div><div class="cv">${fmtMoney(baseInstall)}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">মাসিক কিস্তি</div></div>
    </div>`;

    // Schedule
    const startDate = new Date(document.getElementById('ca-date')?.value || new Date());
    let rows = '';
    for (let i = 1; i <= n; i++) {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const amt = i === n ? Math.round(lastInstall) : baseInstall;
        rows += `<tr><td>${i}${i===1?' (ডাউন মাস)':''}</td><td>${d.toLocaleDateString('bn-BD')}</td><td>${fmtMoney(amt)}</td></tr>`;
    }
    schedule.style.display = 'block';
    schedule.innerHTML = `<div style="font-size:12px;color:var(--gold);margin-bottom:6px;">কিস্তি সময়সূচী প্রিভিউ:</div>
    <div class="table-wrap"><table><thead><tr><th>কিস্তি</th><th>তারিখ</th><th>পরিমাণ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function saveNewClient() {
    const alert = document.getElementById('ca-alert');
    const clientID = document.getElementById('ca-id').value.trim();
    const name = document.getElementById('ca-name').value.trim();
    const phone = document.getElementById('ca-phone').value.trim();
    const cost = parseFloat(document.getElementById('ca-cost').value) || 0;
    const n = parseInt(document.getElementById('ca-n').value) || 6;
    const witnessName = document.getElementById('ca-witness-name').value.trim();
    const witnessPhone = document.getElementById('ca-witness-phone').value.trim();

    if (!clientID || !name || !phone || !cost || !witnessName || !witnessPhone) {
        alert.style.display = 'block'; alert.className = 'alert alert-error';
        alert.textContent = 'সব বাধ্যতামূলক তথ্য পূরণ করুন।'; return;
    }
    if (getClients().find(c => c.clientID === clientID)) {
        alert.style.display = 'block'; alert.className = 'alert alert-error';
        alert.textContent = 'এই আইডি ইতিমধ্যে ব্যবহৃত।'; return;
    }

    const down = parseFloat(document.getElementById('ca-down').value) || 0;
    const rate = parseFloat(document.getElementById('ca-rate').value) || 10;
    const method = document.getElementById('ca-method').value;
    const purchaseDate = document.getElementById('ca-date').value;

    let salePrice, profitAmount;
    if (method === 'B') {
        const financed = cost - down;
        profitAmount = financed * (rate / 100);
        salePrice = cost + profitAmount;
    } else if (method === 'C') {
        const custom = document.getElementById('ca-custom').value || '';
        profitAmount = custom.includes('%') ? cost * (parseFloat(custom) / 100) : parseFloat(custom) || 0;
        salePrice = cost + profitAmount;
    } else {
        profitAmount = cost * (rate / 100);
        salePrice = cost + profitAmount;
    }

    const remaining = salePrice - down;
    const baseInstall = Math.floor(remaining / n);
    const lastInstall = remaining - baseInstall * (n - 1);

    const clientId = 'CL-' + Date.now();
    const now = new Date().toISOString();

    const client = {
        id: clientId, clientID, name,
        fatherName: document.getElementById('ca-fname').value,
        phone, address: document.getElementById('ca-addr').value,
        nid: document.getElementById('ca-nid').value,
        productName: document.getElementById('ca-product').value,
        purchaseDate, purchasePrice: cost, downPayment: down,
        profitRate: rate, calcMethod: method, profitAmount,
        salePrice, totalPayable: salePrice, installmentCount: n,
        guarantorMemberId: document.getElementById('ca-guarantor').value || null,
        witnessName, witnessPhone, witnessAddress: document.getElementById('ca-witness-addr').value,
        status: 'active', createdAt: now, createdBy: adminSession?.id
    };

    // Generate installments
    const startDate = new Date(purchaseDate);
    const installments = getInstallments();
    for (let i = 1; i <= n; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const dueAmount = i === n ? Math.round(lastInstall) : baseInstall;
        installments.push({
            id: 'INST-' + Date.now() + '-' + i, clientId,
            installmentNumber: i, dueAmount,
            dueDate: dueDate.toISOString().split('T')[0],
            paidAmount: 0, remainingAmount: dueAmount,
            status: 'upcoming', paymentDate: null, createdAt: now
        });
    }

    const clients = getClients();
    clients.push(client);
    saveClients(clients);
    saveInstallments(installments);

    addAuditLog('CREATE_CLIENT', 'clients', `ClientID: ${clientID}, Name: ${name}, SalePrice: ${salePrice}`);
    showToast('ক্লাইন্ট তৈরি সফল।');
    gotoPage('client-list');
}

// ════ CLIENT PAYMENT ════
function renderClientPayment(el) {
    el.innerHTML = `
    <div class="card">
      <div class="card-title">💵 ক্লাইন্ট কিস্তি সংগ্রহ</div>
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <input class="search-input" id="cp-search" placeholder="ক্লাইন্ট আইডি বা নাম..." style="flex:1;">
        <button class="btn-primary" onclick="findClientForPayment()">🔍 খুঁজুন</button>
      </div>
      <div id="cp-profile"></div>
    </div>`;
}

function prefillClientPayment(clientID) {
    const input = document.getElementById('cp-search');
    if (input) { input.value = clientID; findClientForPayment(); }
}

function findClientForPayment() {
    const q = (document.getElementById('cp-search')?.value||'').toLowerCase();
    const clients = getClients();
    const c = clients.find(x => (x.clientID||'').toLowerCase()===q || (x.name||'').toLowerCase().includes(q));
    const div = document.getElementById('cp-profile');
    if (!c) { div.innerHTML = '<div class="alert alert-error">ক্লাইন্ট পাওয়া যায়নি।</div>'; return; }

    const installments = getInstallments().filter(i => i.clientId === c.id).sort((a,b) => a.installmentNumber - b.installmentNumber);
    const totalPaid = installments.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.paidAmount||0), 0);

    div.innerHTML = `
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;">${c.name} <code style="font-size:11px;color:var(--gold);">${c.clientID}</code></div>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:10px;">${c.phone||'—'} | ${c.productName||'—'} | মোট: ${fmtMoney(c.salePrice)}</div>
      <div style="display:flex;gap:14px;">
        <span style="font-size:12px;">পরিশোধ: <b style="color:#10b981;">${fmtMoney(totalPaid)}</b></span>
        <span style="font-size:12px;">বাকি: <b style="color:#ef4444;">${fmtMoney((c.salePrice||0)-totalPaid)}</b></span>
      </div>
    </div>
    <div style="font-size:13px;color:var(--gold);margin-bottom:10px;">কিস্তি নির্বাচন করুন:</div>
    ${installments.map(inst => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid ${inst.status==='paid'?'rgba(16,185,129,0.2)':inst.status==='overdue'?'rgba(239,68,68,0.3)':'rgba(255,255,255,0.08)'};border-radius:8px;margin-bottom:6px;">
        <div style="flex:1;">
          <div style="font-size:13px;color:#fff;">কিস্তি #${inst.installmentNumber} — ${fmtDate(inst.dueDate)}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);">মোট: ${fmtMoney(inst.dueAmount)} | পরিশোধ: ${fmtMoney(inst.paidAmount||0)} | বাকি: ${fmtMoney(inst.remainingAmount)}</div>
        </div>
        <span class="status-badge badge-${inst.status==='paid'?'paid':inst.status==='overdue'?'overdue':'pending'}">${inst.status==='paid'?'✅ পরিশোধিত':inst.status==='overdue'?'⚠️ মেয়াদোত্তীর্ণ':'পেন্ডিং'}</span>
        ${inst.status!=='paid'?`<button class="btn-sm btn-primary" onclick="showInstPayModal('${c.id}','${inst.id}','${c.name}','${c.clientID}',${inst.installmentNumber},${inst.remainingAmount})">💵 কিস্তি নিন</button>`:''}
      </div>`).join('')}`;
}

function showInstPayModal(clientId, instId, clientName, clientID, num, remaining) {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `
    <div class="modal" style="max-width:420px;">
      <div class="modal-head"><h3>💵 কিস্তি #${num} পেমেন্ট</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="modal-body">
        <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:12px;">${clientName} (${clientID})</div>
        <div class="form-group"><label>পরিমাণ (৳) * বাকি: ${fmtMoney(remaining)}</label>
          <input class="form-input" id="ip-amount" type="number" value="${remaining}" max="${remaining}"></div>
        <div class="form-group"><label>পেমেন্ট মেথড</label>
          <select class="form-select" id="ip-method">
            <option value="cash">নগদ</option><option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ MFS</option><option value="bank">ব্যাংক</option>
          </select>
        </div>
        <div class="form-group"><label>নোট</label><input class="form-input" id="ip-note"></div>
        <label style="display:flex;gap:6px;align-items:center;font-size:12px;cursor:pointer;margin-bottom:12px;">
          <input type="checkbox" id="ip-sms" checked> SMS পাঠান
        </label>
      </div>
      <div class="modal-footer">
        <button class="btn-primary" onclick="collectInstallment('${clientId}','${instId}','${clientName}','${clientID}',${num})">💳 পেমেন্ট নিন</button>
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বাতিল</button>
      </div>
    </div>`;
    document.body.appendChild(m);
}

function collectInstallment(clientId, instId, clientName, clientID, num) {
    const amount = parseFloat(document.getElementById('ip-amount').value) || 0;
    const method = document.getElementById('ip-method').value;
    const note = document.getElementById('ip-note').value;
    if (!amount) { showToast('পরিমাণ দিন।', 'error'); return; }

    const installments = getInstallments();
    const idx = installments.findIndex(i => i.id === instId);
    if (idx < 0) { showToast('কিস্তি পাওয়া যায়নি।', 'error'); return; }

    const inst = installments[idx];
    const newPaid = (inst.paidAmount || 0) + amount;
    const newRemaining = Math.max(0, inst.dueAmount - newPaid);
    const newStatus = newRemaining <= 0 ? 'paid' : 'partially_paid';

    installments[idx] = { ...inst, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus, paymentDate: new Date().toISOString() };
    saveInstallments(installments);

    // Check if all paid
    const allInstallments = installments.filter(i => i.clientId === clientId);
    if (allInstallments.every(i => i.status === 'paid')) {
        const clients = getClients();
        const ci = clients.findIndex(c => c.id === clientId);
        if (ci >= 0) { clients[ci].status = 'paid'; saveClients(clients); }
    }

    const receiptNo = generateReceiptNo('C');
    const now = new Date().toISOString();
    saveReceipt(receiptNo, 'client_installment', { clientId, clientID, clientName, instId, amount, method });

    // Ledger
    const incomes = getIncomeEntries();
    incomes.push({ id: 'inc-' + Date.now(), category: 'client_installment', amount, date: now, description: `ক্লাইন্ট কিস্তি #${num} — ${clientName} (${clientID})`, receiptNo, paymentMethod: method, addedBy: adminSession?.id });
    saveIncome(incomes);

    addAuditLog('COLLECT_CLIENT_INSTALLMENT', 'accounts', `Client: ${clientID}, Inst: #${num}, Amount: ${amount}`);

    printReceipt({
        receiptNo, name: clientName, id: clientID,
        items: [{ label: `কিস্তি #${num}`, amount }],
        total: amount, method, date: now, collectedBy: adminSession?.name
    });

    showToast(`কিস্তি পেমেন্ট সফল। রসিদ: ${receiptNo}`);
    document.querySelector('.modal-overlay')?.remove();
    findClientForPayment();
}

// ════ DUE / PAID CLIENTS ════
function renderDueClients(el) {
    const clients = getClients().filter(c => c.status === 'active');
    const installments = getInstallments();
    const now = new Date();
    const dueList = [];
    clients.forEach(c => {
        const pendingInst = installments.filter(i => i.clientId === c.id && i.status !== 'paid');
        pendingInst.forEach(inst => {
            const dueDate = new Date(inst.dueDate);
            if (dueDate <= now || inst.status === 'overdue') {
                dueList.push({ ...inst, clientName: c.name, clientPhone: c.phone, clientIDStr: c.clientID });
            }
        });
    });
    el.innerHTML = `
    <div class="card">
      <div class="card-title">⚠️ ডিউ ক্লাইন্ট তালিকা (${dueList.length})</div>
      <div class="table-wrap"><table>
        <thead><tr><th>রসিদ</th><th>আইডি</th><th>নাম</th><th>মোবাইল</th><th>মোট</th><th>পরিশোধ</th><th>বাকি</th><th>ডিউ তারিখ</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${dueList.map(d=>`<tr>
          <td>—</td><td>${d.clientIDStr}</td><td>${d.clientName}</td><td>${d.clientPhone||'—'}</td>
          <td>${fmtMoney(d.dueAmount)}</td><td>${fmtMoney(d.paidAmount||0)}</td>
          <td style="color:#ef4444;">${fmtMoney(d.remainingAmount)}</td>
          <td style="color:#f87171;">${fmtDate(d.dueDate)}</td>
          <td><button class="btn-sm btn-primary" onclick="gotoPage('client-payment');setTimeout(()=>prefillClientPayment('${d.clientIDStr}'),400)">💵</button></td>
        </tr>`).join('')||'<tr><td colspan="9" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো ডিউ নেই।</td></tr>'}
        </tbody></table></div>
      <button class="btn-secondary btn-sm" style="margin-top:10px;" onclick="window.print()">🖨️ A4 প্রিন্ট</button>
    </div>`;
}

function renderPaidClients(el) {
    const clients = getClients().filter(c => c.status === 'paid');
    el.innerHTML = `
    <div class="card">
      <div class="card-title">✅ পরিশোধিত ক্লাইন্ট তালিকা (${clients.length})</div>
      <div class="table-wrap"><table>
        <thead><tr><th>আইডি</th><th>নাম</th><th>পণ্য</th><th>মোট মূল্য</th><th>ক্রয়ের তারিখ</th></tr></thead>
        <tbody>${clients.map(c=>`<tr>
          <td>${c.clientID}</td><td>${c.name}</td><td>${c.productName||'—'}</td>
          <td>${fmtMoney(c.salePrice)}</td><td>${fmtDate(c.purchaseDate)}</td>
        </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.3);">কেউ নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function renderClientFund(el) {
    const clients = getClients();
    const totalGiven = clients.reduce((s,c)=>s+(c.purchasePrice||0),0);
    const installments = getInstallments();
    const totalCollected = installments.filter(i=>i.status==='paid').reduce((s,i)=>s+(i.paidAmount||0),0);
    const totalDue = installments.filter(i=>i.status!=='paid').reduce((s,i)=>s+(i.remainingAmount||0),0);
    const settings = getSettings();
    el.innerHTML = `
    <div class="card">
      <div class="card-title">💰 ক্লাইন্ট তহবিল</div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-val">${fmtMoney(settings.clientFund||1000000)}</div><div class="stat-lbl">নির্ধারিত তহবিল</div></div>
        <div class="stat-card"><div class="stat-val" style="color:#f59e0b;">${fmtMoney(totalGiven)}</div><div class="stat-lbl">মোট বিতরণ</div></div>
        <div class="stat-card"><div class="stat-val" style="color:#10b981;">${fmtMoney(totalCollected)}</div><div class="stat-lbl">মোট সংগ্রহ</div></div>
        <div class="stat-card"><div class="stat-val" style="color:#ef4444;">${fmtMoney(totalDue)}</div><div class="stat-lbl">মোট বাকি</div></div>
      </div>
      <div class="form-group"><label>তহবিল পরিমাণ পরিবর্তন করুন (৳)</label>
        <input class="form-input" type="number" id="cf-amount" value="${settings.clientFund||1000000}">
      </div>
      <div class="form-group"><label>কারণ</label><input class="form-input" id="cf-reason" placeholder="কেন পরিবর্তন করছেন"></div>
      <button class="btn-primary" onclick="saveClientFund()">💾 আপডেট করুন</button>
    </div>`;
}

function saveClientFund() {
    const amount = parseFloat(document.getElementById('cf-amount').value) || 0;
    const reason = document.getElementById('cf-reason').value;
    const settings = getSettings();
    settings.clientFund = amount;
    if (DB.set) DB.set(DB.KEYS.SETTINGS, settings);
    else localStorage.setItem('bf_site_settings', JSON.stringify(settings));
    addAuditLog('UPDATE_CLIENT_FUND', 'clients', `Amount: ${amount}, Reason: ${reason}`);
    showToast('তহবিল আপডেট হয়েছে।');
}

function renderProductLedger(el) {
    const incomes = getIncomeEntries().filter(i => i.category === 'client_installment');
    const clients = getClients();
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📒 পণ্য সার্ভিস লেজার</div>
      <div class="table-wrap"><table>
        <thead><tr><th>রসিদ নং</th><th>ক্লাইন্ট</th><th>বিবরণ</th><th>পরিমাণ</th><th>তারিখ</th></tr></thead>
        <tbody>${incomes.slice(0, 100).map(i=>`<tr>
          <td><code style="font-size:10px;">${i.receiptNo||'—'}</code></td>
          <td>${(i.description||'').substring(0,30)}</td>
          <td>${(i.description||'').substring(0,50)}</td>
          <td style="color:#10b981;">${fmtMoney(i.amount)}</td>
          <td>${fmtDate(i.date)}</td>
        </tr>`).join('')||'<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো এন্ট্রি নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}
