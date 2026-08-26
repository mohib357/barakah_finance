// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — ADMIN MEMBER MODULE
// ═══════════════════════════════════════════════════════════

// ── Member List ──
async function renderMemberList(el) {
  const content = el || document.getElementById('adminContent');
  let members = [], users = [];
  try {
    const [mr, ur] = await Promise.allSettled([apiFetch('/members'), apiFetch('/users')]);
    if (mr.status === 'fulfilled') members = mr.value?.members || [];
    if (ur.status === 'fulfilled') users   = ur.value?.users   || [];
  } catch (_) {}
  if (!members.length && typeof DB !== 'undefined') members = JSON.parse(localStorage.getItem('bf_members') || '[]');

  const enriched = members.map(m => {
    const u = users.find(x => x.id === m.userId) || {};
    return { ...m, name: u.name || m.name || '—', phone: u.phone || m.phone || '—', email: u.email || '' };
  });
  window._membersData = enriched;

  content.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-icon stat-icon-green">👥</div><div class="stat-val">${members.length}</div><div class="stat-lbl">মোট সদস্য</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-blue">✅</div><div class="stat-val">${members.filter(m=>m.status==='active').length}</div><div class="stat-lbl">সক্রিয়</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon-gold">⏳</div><div class="stat-val">${members.filter(m=>m.status==='pending').length}</div><div class="stat-lbl">পেন্ডিং</div></div>
    </div>
    <div class="admin-card">
      <div class="card-title">👥 সদস্য তালিকা
        <button class="btn btn-primary btn-sm ml-auto" onclick="gotoPage('member-add')">+ নতুন সদস্য</button>
      </div>
      <div class="search-bar">
        <div class="search-input-wrap" style="flex:1"><span class="search-icon">🔍</span>
          <input class="search-input" id="mlSearch" placeholder="নাম, আইডি, মোবাইল..." oninput="filterMemberList()"/>
        </div>
        <select class="filter-select" id="mlStatus" onchange="filterMemberList()">
          <option value="">সব</option><option value="active">সক্রিয়</option><option value="pending">পেন্ডিং</option>
        </select>
        <select class="filter-select" id="mlType" onchange="filterMemberList()">
          <option value="">সব ধরন</option><option value="monthly_savings">মাসিক</option><option value="onetime">এককালীন</option><option value="project">প্রজেক্ট</option>
        </select>
        <button class="btn btn-ghost btn-sm" onclick="exportMembersCSV()">📥 CSV</button>
      </div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>ছবি</th><th>আইডি</th><th>নাম</th><th>মোবাইল</th><th>ধরন</th><th>মোট জমা</th><th>ইউনিট</th><th>যোগদান</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr>
        </thead><tbody id="memberTbody"></tbody></table>
      </div>
    </div>`;

  renderMemberRows(enriched);
}

function renderMemberRows(data) {
  const tbody = document.getElementById('memberTbody');
  if (!tbody) return;
  const invLabels = { monthly_savings:'মাসিক সঞ্চয়', onetime:'এককালীন', project:'প্রজেক্ট' };
  const unitVal = getSettings().unitValue || 2000;

  tbody.innerHTML = data.map(m => {
    const savings = (typeof DB !== 'undefined') ? (DB.getSavings?.() || []).filter(s=>s.userId===m.userId) : [];
    const total   = savings.reduce((a,s)=>a+(s.amount||0),0);
    const units   = (total/unitVal).toFixed(2);
    return `<tr>
      <td><div class="avatar avatar-sm" style="background:${randomAdminColor(m.name)}">${(m.name||'ব')[0]}</div></td>
      <td><code style="font-size:.78rem">${m.memberID||'—'}</code></td>
      <td style="font-weight:600">${m.name}</td>
      <td>${m.phone||'—'}</td>
      <td><span style="font-size:.78rem">${invLabels[m.investType]||m.investType||'—'}</span></td>
      <td style="font-weight:700">${fmtMoney(total)}</td>
      <td>${units}</td>
      <td style="font-size:.78rem">${fmtDate(m.joinDate||m.createdAt)}</td>
      <td>${statusBadge(m.status)}</td>
      <td>
        <button class="btn btn-sm btn-ghost" onclick="viewMemberModal('${m.id}')">👁️</button>
        <button class="btn btn-sm btn-primary" onclick="gotoPage('member-payment');setTimeout(()=>prefillMemberPayment('${m.memberID}'),500)">💵</button>
        <button class="btn btn-sm btn-ghost" onclick="editMember('${m.id}')">✏️</button>
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো সদস্য নেই।</td></tr>`;
}

function filterMemberList() {
  const q = (document.getElementById('mlSearch')?.value||'').toLowerCase();
  const s = document.getElementById('mlStatus')?.value||'';
  const t = document.getElementById('mlType')?.value||'';
  const filtered = (window._membersData||[]).filter(m =>
    (!q || (m.name||'').toLowerCase().includes(q) || (m.memberID||'').toLowerCase().includes(q) || (m.phone||'').includes(q)) &&
    (!s || m.status === s) &&
    (!t || m.investType === t)
  );
  renderMemberRows(filtered);
}

function exportMembersCSV() {
  const data = window._membersData || [];
  const rows = [['আইডি','নাম','মোবাইল','বিনিয়োগ ধরন','মোট জমা','ইউনিট','যোগদান','স্ট্যাটাস']];
  data.forEach(m => rows.push([m.memberID||'',m.name||'',m.phone||'',m.investType||'','','',m.joinDate||'',m.status||'']));
  const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv'}));
  a.download = 'members.csv'; a.click();
}

function viewMemberModal(id) {
  const m = (window._membersData||[]).find(x=>x.id===id);
  if (!m) return;
  const savings = (typeof DB!=='undefined') ? (DB.getSavings?.()|| []).filter(s=>s.userId===m.userId) : [];
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal modal-lg">
      <div class="modal-head"><h3>👤 সদস্য প্রোফাইল</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="modal-body">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
          <div class="avatar avatar-lg" style="background:${randomAdminColor(m.name)}">${(m.name||'ব')[0]}</div>
          <div>
            <div style="font-size:1.2rem;font-weight:700;color:var(--text-primary)">${m.name}</div>
            <code style="color:var(--clr-gold-500)">${m.memberID||'—'}</code>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.88rem;margin-bottom:16px">
          ${pRow('মোবাইল',m.phone)} ${pRow('যোগদান',fmtDate(m.joinDate||m.createdAt))}
          ${pRow('বিনিয়োগ ধরন',m.investType||'—')} ${pRow('স্ট্যাটাস',m.status||'—')}
          ${pRow('নমিনি',m.nomineeName||'—')} ${pRow('নমিনি মোবাইল',m.nomineePhone||'—')}
        </div>
        <h4 style="margin-bottom:8px">সঞ্চয় ইতিহাস</h4>
        <div class="table-wrap" style="max-height:200px;overflow-y:auto">
          <table><thead><tr><th>মাস</th><th>পরিমাণ</th><th>লেট ফি</th><th>তারিখ</th></tr></thead>
          <tbody>${savings.map(s=>`<tr><td>${s.month||'—'}</td><td>${fmtMoney(s.amount)}</td><td>${s.lateFee?fmtMoney(s.lateFee):'—'}</td><td>${fmtDate(s.date||s.createdAt)}</td></tr>`).join('')||'<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:12px">কোনো সঞ্চয় নেই</td></tr>'}</tbody>
          </table>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="this.closest('.modal-overlay').remove()">বন্ধ</button>
        <button class="btn btn-primary btn-sm" onclick="gotoPage('member-payment');setTimeout(()=>prefillMemberPayment('${m.memberID}'),400);this.closest('.modal-overlay').remove()">💵 পেমেন্ট</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function pRow(l,v) { return `<div style="padding:8px;background:var(--bg-surface-2);border-radius:8px"><div style="font-size:.72rem;color:var(--text-muted);margin-bottom:2px">${l}</div><div style="font-weight:600">${v||'—'}</div></div>`; }

function editMember(id) { showToast('এডিট পেনেলটি শীঘ্রই আসছে।', 'info'); }

// ── Add New Member ──
async function renderMemberAdd(el) {
  const content = el || document.getElementById('adminContent');
  let users = [], projects = [];
  try {
    const [ur, pr] = await Promise.allSettled([apiFetch('/users'), apiFetch('/projects')]);
    if (ur.status === 'fulfilled') users    = (ur.value?.users||[]).filter(u=>!u.memberID);
    if (pr.status === 'fulfilled') projects = pr.value?.projects||[];
  } catch (_) {}

  const members  = JSON.parse(localStorage.getItem('bf_members')||'[]');
  const lastID   = members.length ? members[members.length-1].memberID : '000000';
  const nextID   = String(parseInt(lastID||0)+1).padStart(6,'0');

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">➕ নতুন সদস্য যোগ করুন</div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">সদস্য আইডি <span class="req">*</span> <small style="color:var(--text-muted)">(সর্বশেষ: ${lastID})</small></label>
          <input class="form-input" id="ma-id" value="${nextID}" oninput="checkMemberID(this.value)"/>
          <p class="form-hint" id="ma-id-hint"></p>
        </div>
        <div class="form-group"><label class="form-label">বিদ্যমান ব্যবহারকারী</label>
          <select class="form-select" id="ma-user" onchange="fillMemberFromUser()">
            <option value="">— নতুন তৈরি করুন —</option>
            ${users.map(u=>`<option value="${u.id}">${u.name} (${u.phone||'—'})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">নাম <span class="req">*</span></label><input class="form-input" id="ma-name" placeholder="পূর্ণ নাম"/></div>
        <div class="form-group"><label class="form-label">মোবাইল <span class="req">*</span></label><input class="form-input" id="ma-phone" placeholder="01XXXXXXXXX"/></div>
      </div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">পিতার নাম</label><input class="form-input" id="ma-father"/></div>
        <div class="form-group"><label class="form-label">যোগদানের তারিখ</label><input type="date" class="form-input" id="ma-joinDate" value="${new Date().toISOString().split('T')[0]}"/></div>
      </div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">নমিনির নাম <span class="req">*</span></label><input class="form-input" id="ma-nomName"/></div>
        <div class="form-group"><label class="form-label">নমিনি মোবাইল</label><input class="form-input" id="ma-nomPhone"/></div>
      </div>
      <div class="two-col">
        <div class="form-group"><label class="form-label">নমিনি সম্পর্ক</label>
          <select class="form-select" id="ma-nomRel"><option>স্বামী</option><option>স্ত্রী</option><option>পিতা</option><option>মাতা</option><option>পুত্র</option><option>কন্যা</option></select>
        </div>
        <div class="form-group"><label class="form-label">বিনিয়োগের ধরন <span class="req">*</span></label>
          <select class="form-select" id="ma-invType" onchange="toggleInvFields()">
            <option value="monthly_savings">মাসিক সঞ্চয়</option>
            <option value="onetime">এককালীন বিনিয়োগ</option>
            <option value="project">প্রজেক্ট বিনিয়োগ</option>
          </select>
        </div>
      </div>
      <div id="ma-monthly-fields">
        <div class="form-group"><label class="form-label">শুরুর মাস</label><input type="month" class="form-input" id="ma-startMonth" value="${new Date().toISOString().slice(0,7)}"/></div>
      </div>
      <div id="ma-onetime-fields" style="display:none">
        <div class="two-col">
          <div class="form-group"><label class="form-label">বিনিয়োগের পরিমাণ (৳)</label><input type="number" class="form-input" id="ma-amount" placeholder="২০০০"/></div>
          <div class="form-group"><label class="form-label">ফরম ফি (৳)</label><input type="number" class="form-input" id="ma-formFee" value="${getSettings().formFee||100}" readonly/></div>
        </div>
      </div>
      <div id="ma-project-fields" style="display:none">
        <div class="two-col">
          <div class="form-group"><label class="form-label">প্রজেক্ট</label>
            <select class="form-select" id="ma-project">
              <option value="">— বেছে নিন —</option>
              ${projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">পরিমাণ (৳)</label><input type="number" class="form-input" id="ma-projAmount" placeholder="৫০০০"/></div>
        </div>
      </div>
      <div class="nav-btns" style="padding-top:16px;border-top:1px solid var(--border-light)">
        <button class="btn btn-ghost" onclick="gotoPage('member-list')">বাতিল</button>
        <button class="btn btn-primary btn-lg" onclick="saveMember()">✅ সদস্য সংরক্ষণ করুন</button>
      </div>
    </div>`;
}

function toggleInvFields() {
  const t = document.getElementById('ma-invType')?.value;
  document.getElementById('ma-monthly-fields').style.display = t === 'monthly_savings' ? '' : 'none';
  document.getElementById('ma-onetime-fields').style.display = t === 'onetime' ? '' : 'none';
  document.getElementById('ma-project-fields').style.display = t === 'project' ? '' : 'none';
}

async function checkMemberID(val) {
  const hint = document.getElementById('ma-id-hint');
  if (!val) { if (hint) hint.textContent = ''; return; }
  try {
    const r = await apiFetch(`/members/check-id/${val}`);
    if (hint) hint.innerHTML = r?.available ? '✅ উপলব্ধ' : '❌ এই আইডি ব্যবহৃত';
  } catch (_) {
    const members = JSON.parse(localStorage.getItem('bf_members')||'[]');
    const taken = members.some(m=>m.memberID===val);
    if (hint) hint.innerHTML = taken ? '❌ এই আইডি ব্যবহৃত' : '✅ উপলব্ধ';
  }
}

function fillMemberFromUser() {
  const uid = document.getElementById('ma-user')?.value;
  if (!uid) return;
  const users = typeof DB !== 'undefined' ? DB.getUsers() : [];
  const u = users.find(x=>x.id===uid);
  if (!u) return;
  const set = (id,v)=>{ const el=document.getElementById(id); if(el&&v) el.value=v; };
  set('ma-name', u.name); set('ma-phone', u.phone); set('ma-father', u.fatherName||'');
}

async function saveMember() {
  const id   = document.getElementById('ma-id')?.value.trim();
  const name = document.getElementById('ma-name')?.value.trim();
  const phone= document.getElementById('ma-phone')?.value.trim();
  const nom  = document.getElementById('ma-nomName')?.value.trim();
  if (!id||!name||!phone||!nom) { showToast('বাধ্যতামূলক তথ্য পূরণ করুন।','error'); return; }

  const member = {
    memberID:    id,
    userId:      document.getElementById('ma-user')?.value || null,
    name, phone,
    fatherName:  document.getElementById('ma-father')?.value,
    joinDate:    document.getElementById('ma-joinDate')?.value,
    nomineeName: nom,
    nomineePhone:document.getElementById('ma-nomPhone')?.value,
    nomineeRelation: document.getElementById('ma-nomRel')?.value,
    investType:  document.getElementById('ma-invType')?.value,
    startMonth:  document.getElementById('ma-startMonth')?.value,
    amount:      parseFloat(document.getElementById('ma-amount')?.value)||0,
    projectId:   document.getElementById('ma-project')?.value,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: adminSession?.id,
  };

  try {
    await apiPost('/members', member);
    showToast('সদস্য সংরক্ষিত হয়েছে!', 'success');
    gotoPage('member-list'); return;
  } catch (_) {}

  // Offline
  const members = JSON.parse(localStorage.getItem('bf_members')||'[]');
  members.push({ id: 'M-'+Date.now(), ...member });
  localStorage.setItem('bf_members', JSON.stringify(members));
  showToast('সদস্য সংরক্ষিত (অফলাইন)।', 'success');
  gotoPage('member-list');
}

// ── Member Payment Collection ──
async function renderMemberPayment(el) {
  const content = el || document.getElementById('adminContent');
  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">💵 সদস্য পেমেন্ট সংগ্রহ</div>
      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
        <input class="form-input" id="mpSearch" placeholder="আইডি, নাম বা মোবাইল..." style="flex:1;min-width:200px"/>
        <button class="btn btn-primary" onclick="findMemberForPayment()">🔍 খুঁজুন</button>
      </div>
      <div id="mpProfile"></div>
      <div id="mpPayForm" style="display:none">
        <h4 style="margin-bottom:12px">পেমেন্ট করুন</h4>
        <div id="mpPayOrders" style="margin-bottom:14px"></div>
        <div class="two-col">
          <div class="form-group"><label class="form-label">পরিমাণ (৳)</label><input type="number" class="form-input" id="mpAmount"/></div>
          <div class="form-group"><label class="form-label">পেমেন্ট পদ্ধতি</label>
            <select class="form-select" id="mpMethod"><option value="cash">ক্যাশ</option><option value="bkash">বিকাশ</option><option value="nagad">নগদ</option><option value="rocket">রকেট</option><option value="bank">ব্যাংক</option></select>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:14px">
          <label class="form-check"><input type="checkbox" id="mpSendSMS" checked/> SMS পাঠান</label>
        </div>
        <button class="btn btn-primary btn-lg" onclick="collectMemberPayment()">💰 পেমেন্ট সংগ্রহ করুন</button>
      </div>
    </div>`;
}

let _mpCurrentMember = null;

async function findMemberForPayment() {
  const q = document.getElementById('mpSearch')?.value.trim();
  if (!q) { showToast('আইডি বা নাম দিন।', 'error'); return; }
  const wrap = document.getElementById('mpProfile');
  wrap.innerHTML = '<div class="spinner" style="margin:16px auto"></div>';

  let member = null;
  try {
    const r = await apiFetch(`/members?q=${encodeURIComponent(q)}`);
    member = r?.members?.[0] || r?.member;
  } catch (_) {}
  if (!member) {
    const local = JSON.parse(localStorage.getItem('bf_members')||'[]');
    member = local.find(m=>m.memberID===q||(m.name||'').toLowerCase().includes(q.toLowerCase())||(m.phone||'').includes(q));
  }
  if (!member) { wrap.innerHTML = `<p style="color:var(--clr-danger)">সদস্য পাওয়া যায়নি।</p>`; return; }

  _mpCurrentMember = member;
  const savings = (typeof DB!=='undefined') ? (DB.getSavings?.()|| []).filter(s=>s.userId===member.userId) : [];
  const total   = savings.reduce((a,s)=>a+(s.amount||0),0);

  wrap.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;padding:16px;background:var(--bg-surface-2);border-radius:12px;margin-bottom:16px">
      <div class="avatar avatar-md" style="background:${randomAdminColor(member.name)}">${(member.name||'ব')[0]}</div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:1rem">${member.name}</div>
        <div style="font-size:.8rem;color:var(--text-muted)">ID: ${member.memberID} · ${member.phone||'—'}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:.78rem;color:var(--text-muted)">মোট জমা</div>
        <div style="font-weight:800;color:var(--clr-primary-500)">${fmtMoney(total)}</div>
      </div>
    </div>`;

  document.getElementById('mpPayForm').style.display = '';
  document.getElementById('mpAmount').value = getSettings().monthlySavings || 2000;
  const ordersWrap = document.getElementById('mpPayOrders');
  ordersWrap.innerHTML = `<p style="font-size:.85rem;color:var(--text-muted);margin-bottom:8px">পে-অর্ডার: মাসিক সঞ্চয় — ${new Date().toLocaleDateString('bn-BD',{year:'numeric',month:'long'})}</p>`;
}

function prefillMemberPayment(memberID) {
  const inp = document.getElementById('mpSearch');
  if (inp) { inp.value = memberID; findMemberForPayment(); }
}

async function collectMemberPayment() {
  if (!_mpCurrentMember) { showToast('আগে সদস্য খুঁজুন।', 'error'); return; }
  const amount  = parseFloat(document.getElementById('mpAmount')?.value)||0;
  const method  = document.getElementById('mpMethod')?.value||'cash';
  const sendSMS = document.getElementById('mpSendSMS')?.checked;
  if (amount <= 0) { showToast('সঠিক পরিমাণ দিন।', 'error'); return; }

  const now = new Date().toISOString();
  const month = now.slice(0,7);

  let receiptNum = 'M-00001';
  try {
    const data = {
      userId: _mpCurrentMember.userId || _mpCurrentMember.id,
      memberId: _mpCurrentMember.id,
      amount, method, month,
      sendSMS, date: now,
    };
    const r = await apiPost('/savings', data);
    receiptNum = r?.receiptNumber || receiptNum;
    showToast('পেমেন্ট সংগ্রহ হয়েছে!', 'success');
  } catch (_) {
    if (typeof DB !== 'undefined') {
      DB.addSaving?.({ id:'S-'+Date.now(), userId:_mpCurrentMember.userId, memberId:_mpCurrentMember.id, amount, method, month, date:now, createdAt:now });
    }
    showToast('পেমেন্ট সংরক্ষিত (অফলাইন)।', 'success');
  }

  printReceipt({
    receiptNo: receiptNum,
    name: _mpCurrentMember.name,
    memberId: _mpCurrentMember.memberID,
    items: [{ label:`মাসিক সঞ্চয় — ${month}`, amount }],
    total: amount,
    method: method === 'cash' ? 'ক্যাশ' : method,
    date: now,
    collectedBy: adminSession?.name,
  });
}

// ── Applications ──
async function renderApplications(el) {
  const content = el || document.getElementById('adminContent');
  let apps = [];
  try { const r = await apiFetch('/applications'); apps = r?.applications || []; } catch (_) {}
  if (!apps.length) apps = (typeof DB!=='undefined') ? (DB.get?.('bf_applications')||[]) : [];

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">📝 সদস্য আবেদন তালিকা <span class="badge badge-warning ml-auto">${apps.filter(a=>a.status==='pending').length} পেন্ডিং</span></div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>আবেদন আইডি</th><th>নাম</th><th>মোবাইল</th><th>বিনিয়োগ ধরন</th><th>তারিখ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr>
        </thead><tbody>
          ${apps.length ? apps.map(a=>`<tr>
            <td><code style="font-size:.75rem">${a.applicationId||a.id?.slice(0,8)||'—'}</code></td>
            <td style="font-weight:600">${a.personalInfo?.nameBn||a.name||'—'}</td>
            <td>${a.personalInfo?.phone||a.phone||'—'}</td>
            <td>${a.investment?.type||a.investType||'—'}</td>
            <td style="font-size:.78rem">${fmtDate(a.submittedAt||a.createdAt)}</td>
            <td>${statusBadge(a.status)}</td>
            <td>
              <button class="btn btn-sm btn-ghost" onclick="viewApplication('${a.id||a.applicationId}')">👁️</button>
              ${a.status==='pending'?`<button class="btn btn-sm btn-primary" onclick="approveApp('${a.id||a.applicationId}')">✅</button><button class="btn btn-sm btn-danger" onclick="rejectApp('${a.id||a.applicationId}')">❌</button>`:''}
            </td>
          </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো আবেদন নেই।</td></tr>'}
        </tbody></table>
      </div>
    </div>`;
  window._appsData = apps;
}

function viewApplication(id) { showToast('বিস্তারিত পেনেলটি শীঘ্রই আসছে।', 'info'); }
async function approveApp(id) {
  showConfirm('আবেদন অনুমোদন','এই আবেদনটি অনুমোদন করবেন?', async () => {
    try { await apiPatch(`/applications/${id}`, { status:'approved' }); showToast('অনুমোদিত!','success'); renderApplications(); }
    catch(_) { showToast('ব্যর্থ।','error'); }
  });
}
async function rejectApp(id) {
  const reason = prompt('প্রত্যাখ্যানের কারণ:');
  if (!reason) return;
  try { await apiPatch(`/applications/${id}`, { status:'rejected', rejectReason: reason }); showToast('প্রত্যাখ্যাত।','success'); renderApplications(); }
  catch (_) { showToast('ব্যর্থ।','error'); }
}

// ── Member Due ──
async function renderMemberDue(el) {
  const content = el || document.getElementById('adminContent');
  let dueList = [];
  try { const r = await apiFetch('/reports/defaulters/' + new Date().toISOString().slice(0,7)); dueList = r?.defaulters || []; } catch (_) {}

  content.innerHTML = `
    <div class="admin-card">
      <div class="card-title">⚠️ সদস্য ডিউ রিপোর্ট <button class="btn btn-sm btn-ghost ml-auto" onclick="window.print()">🖨️ প্রিন্ট</button></div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>আইডি</th><th>নাম</th><th>মোবাইল</th><th>ডিউ পরিমাণ</th><th>মাস</th><th>অ্যাকশন</th></tr>
        </thead><tbody>
          ${dueList.length ? dueList.map(d=>`<tr>
            <td><code>${d.memberID||'—'}</code></td>
            <td style="font-weight:600">${d.name||'—'}</td>
            <td>${d.phone||'—'}</td>
            <td style="font-weight:700;color:var(--clr-danger)">${fmtMoney(d.dueAmount||2000)}</td>
            <td>${d.month||new Date().toISOString().slice(0,7)}</td>
            <td><button class="btn btn-sm btn-primary" onclick="gotoPage('member-payment');setTimeout(()=>prefillMemberPayment('${d.memberID}'),400)">💵 পেমেন্ট</button></td>
          </tr>`).join('') : `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">কোনো ডিউ নেই। 🎉</td></tr>`}
        </tbody></table>
      </div>
    </div>`;
}

// ── Helper ──
function randomAdminColor(str) {
  const colors = ['#1D9E75','#639922','#BA7517','#185FA5','#3B6D11','#0F6E56','#854F0B','#3C3489','#993C1D','#972B56'];
  let h = 0; for (let c of (str||'')) h = c.charCodeAt(0)+((h<<5)-h);
  return colors[Math.abs(h)%colors.length];
}
