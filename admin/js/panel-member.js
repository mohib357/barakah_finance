// panel-member.js — সদস্য মডিউল

function renderMemberList(el) {
    const members = getMembers();
    const users = DB.getUsers();
    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${members.length}</div><div class="stat-lbl">মোট</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#10b981;">${members.filter(m=>m.status==='active').length}</div><div class="stat-lbl">সক্রিয়</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b;">${members.filter(m=>m.status==='pending').length}</div><div class="stat-lbl">পেন্ডিং</div></div>
    </div>
    <div class="card">
      <div class="card-title">👥 সদস্য তালিকা
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="gotoPage('member-add')">+ নতুন সদস্য</button>
      </div>
      <div class="search-bar">
        <input class="search-input" id="mlSearch" placeholder="নাম, আইডি, মোবাইল..." oninput="filterMemberTable()">
        <select class="filter-select" id="mlStatus" onchange="filterMemberTable()">
          <option value="">সব স্ট্যাটাস</option>
          <option value="active">সক্রিয়</option>
          <option value="pending">পেন্ডিং</option>
        </select>
        <button class="btn-secondary btn-sm" onclick="exportMembersCSV()">📥 CSV</button>
      </div>
      <div class="table-wrap">
        <table id="memberTable">
          <thead><tr><th>ছবি</th><th>আইডি</th><th>নাম</th><th>মোবাইল</th><th>বিনিয়োগ ধরন</th><th>মোট জমা</th><th>ইউনিট</th><th>যোগদান</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
          <tbody id="memberTbody"></tbody>
        </table>
      </div>
    </div>`;
    window._membersData = members.map(m => {
        const user = users.find(u => u.id === m.userId) || {};
        const savings = (DB.getSavings ? DB.getSavings() : []).filter(s => s.userId === m.userId);
        const totalDeposit = savings.reduce((s, v) => s + (v.amount || 0), 0);
        const unitValue = (getSettings().unitValue || 2000);
        const units = (totalDeposit / unitValue).toFixed(2);
        return { ...m, name: user.name || m.name || '—', phone: user.phone || m.phone, totalDeposit, units };
    });
    renderMemberRows(window._membersData);
}

function renderMemberRows(data) {
    const tbody = document.getElementById('memberTbody');
    if (!tbody) return;
    tbody.innerHTML = data.map(m => `
      <tr>
        <td><div style="width:32px;height:32px;border-radius:50%;background:#1D9E75;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;">${(m.name||'ব')[0]}</div></td>
        <td><code style="font-size:11px;">${m.memberID || '—'}</code></td>
        <td>${m.name}</td>
        <td>${m.phone || '—'}</td>
        <td><span style="font-size:11px;">${m.investType === 'monthly_savings' ? 'মাসিক সঞ্চয়' : m.investType === 'onetime' ? 'এককালীন' : 'প্রজেক্ট'}</span></td>
        <td>${fmtMoney(m.totalDeposit)}</td>
        <td>${m.units}</td>
        <td>${fmtDate(m.joinDate)}</td>
        <td><span class="status-badge ${m.status === 'active' ? 'badge-active' : 'badge-pending'}">${m.status === 'active' ? 'সক্রিয়' : 'পেন্ডিং'}</span></td>
        <td>
          <button class="btn-sm btn-secondary" onclick="viewMember('${m.id}')">👁️</button>
          <button class="btn-sm btn-secondary" onclick="gotoPage('member-payment');setTimeout(()=>prefillMemberPayment('${m.memberID}'),400)">💵</button>
        </td>
      </tr>`).join('') || '<tr><td colspan="10" style="text-align:center;color:rgba(255,255,255,0.3);padding:20px;">কোনো সদস্য নেই।</td></tr>';
}

function filterMemberTable() {
    const q = (document.getElementById('mlSearch')?.value || '').toLowerCase();
    const s = document.getElementById('mlStatus')?.value || '';
    const filtered = (window._membersData || []).filter(m =>
        (!q || (m.name || '').toLowerCase().includes(q) || (m.memberID || '').toLowerCase().includes(q) || (m.phone || '').includes(q)) &&
        (!s || m.status === s)
    );
    renderMemberRows(filtered);
}

function viewMember(id) {
    const m = (window._membersData || []).find(x => x.id === id);
    if (!m) return;
    const savings = (DB.getSavings ? DB.getSavings() : []).filter(s => s.userId === m.userId);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="modal">
      <div class="modal-head"><h3>👤 সদস্য প্রোফাইল</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="modal-body">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
          <div style="width:60px;height:60px;border-radius:50%;background:#1D9E75;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;">${(m.name||'ব')[0]}</div>
          <div><div style="font-size:17px;font-weight:700;color:#fff;">${m.name}</div>
          <div style="font-size:12px;color:var(--gold);">${m.memberID || '—'}</div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;margin-bottom:16px;">
          <div><b>মোবাইল:</b> ${m.phone || '—'}</div>
          <div><b>যোগদান:</b> ${fmtDate(m.joinDate)}</div>
          <div><b>বিনিয়োগ ধরন:</b> ${m.investType || '—'}</div>
          <div><b>স্ট্যাটাস:</b> ${m.status}</div>
          <div><b>মোট জমা:</b> ${fmtMoney(m.totalDeposit)}</div>
          <div><b>ইউনিট:</b> ${m.units}</div>
          <div><b>নমিনির নাম:</b> ${m.nomineeName || '—'}</div>
          <div><b>নমিনি মোবাইল:</b> ${m.nomineePhone || '—'}</div>
        </div>
        <div><b>সঞ্চয় ইতিহাস:</b>
          <div class="table-wrap" style="max-height:150px;overflow-y:auto;margin-top:8px;">
            <table><thead><tr><th>মাস</th><th>পরিমাণ</th><th>লেট ফি</th><th>তারিখ</th></tr></thead>
            <tbody>${savings.map(s => `<tr><td>${s.month||'—'}</td><td>${fmtMoney(s.amount)}</td><td>${fmtMoney(s.lateFee||0)}</td><td>${fmtDate(s.date)}</td></tr>`).join('') || '<tr><td colspan="4" style="color:rgba(255,255,255,0.3);">কোনো সঞ্চয় নেই।</td></tr>'}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-footer"><button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বন্ধ</button></div>
    </div>`;
    document.body.appendChild(modal);
}

function exportMembersCSV() {
    const data = window._membersData || [];
    const rows = [['আইডি','নাম','মোবাইল','বিনিয়োগ','মোট জমা','ইউনিট','যোগদান','স্ট্যাটাস']];
    data.forEach(m => rows.push([m.memberID||'',m.name||'',m.phone||'',m.investType||'',m.totalDeposit||0,m.units||0,m.joinDate||'',m.status||'']));
    const csv = rows.map(r => r.map(c=>`"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='members.csv'; a.click();
}

// ════ ADD NEW MEMBER ════
function renderMemberAdd(el) {
    const users = DB.getUsers().filter(u => !u.memberID);
    const projects = getProjects();
    const settings = getSettings();
    const lastMemberID = getMembers().length ? getMembers()[getMembers().length - 1].memberID : '000000';

    el.innerHTML = `
    <div class="card">
      <div class="card-title">➕ নতুন সদস্য যোগ করুন</div>
      <div class="form-row">
        <div class="form-group"><label>সদস্য আইডি * <small style="color:rgba(255,255,255,0.4);">(সর্বশেষ: ${lastMemberID})</small></label>
          <input class="form-input" id="ma-id" placeholder="000001" oninput="checkMemberID(this.value)" value="${nextMemberID()}">
          <div id="ma-id-hint" style="font-size:11px;margin-top:3px;"></div>
        </div>
        <div class="form-group"><label>বিদ্যমান ব্যবহারকারী সিলেক্ট করুন</label>
          <select class="form-select" id="ma-user" onchange="fillMemberFromUser()">
            <option value="">— নতুন যোগ করুন —</option>
            ${users.map(u => `<option value="${u.id}">${u.name} (${u.phone || '—'})</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>নাম *</label><input class="form-input" id="ma-name" placeholder="পূর্ণ নাম"></div>
        <div class="form-group"><label>মোবাইল *</label><input class="form-input" id="ma-phone" placeholder="01XXXXXXXXX"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>পিতার নাম</label><input class="form-input" id="ma-fname"></div>
        <div class="form-group"><label>ঠিকানা</label><input class="form-input" id="ma-addr"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>লিঙ্গ</label><select class="form-select" id="ma-gender"><option value="male">পুরুষ</option><option value="female">মহিলা</option></select></div>
        <div class="form-group"><label>যোগদানের তারিখ *</label><input class="form-input" type="date" id="ma-join" value="${new Date().toISOString().split('T')[0]}"></div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:14px 0;">
        <div style="font-size:13px;color:var(--gold);margin-bottom:12px;">💰 বিনিয়োগ তথ্য</div>
        <div class="form-group"><label>বিনিয়োগের ধরন *</label>
          <select class="form-select" id="ma-invest-type" onchange="toggleInvestFields()">
            <option value="monthly_savings">মাসিক সঞ্চয় (প্রতি মাসে)</option>
            <option value="onetime">এককালীন বিনিয়োগ</option>
            <option value="project">প্রজেক্ট বিনিয়োগ</option>
          </select>
        </div>
        <div id="ma-onetime-field" style="display:none;">
          <div class="form-group"><label>এককালীন পরিমাণ (৳)</label><input class="form-input" type="number" id="ma-invest-amount" oninput="updateInvestPreview()"></div>
        </div>
        <div id="ma-project-field" style="display:none;">
          <div class="form-group"><label>প্রজেক্ট সিলেক্ট করুন</label>
            <select class="form-select" id="ma-project">${projects.map(p=>`<option value="${p.id}">${p.name}</option>`).join('') || '<option>কোনো প্রজেক্ট নেই</option>'}</select>
          </div>
          <div class="form-group"><label>বিনিয়োগের পরিমাণ (৳)</label><input class="form-input" type="number" id="ma-project-amount" oninput="updateInvestPreview()"></div>
        </div>
        <div class="calc-preview" id="investPreview" style="display:none;"></div>
        <div class="form-row" style="margin-top:10px;">
          <div class="form-group"><label>ফরম ফি (৳)</label><input class="form-input" type="number" id="ma-form-fee" value="${settings.formFee || 100}"></div>
          <div class="form-group"><label>পেমেন্ট মেথড</label>
            <select class="form-select" id="ma-pay-method">
              <option value="cash">নগদ</option>
              <option value="bkash">বিকাশ</option>
              <option value="bank">ব্যাংক</option>
            </select>
          </div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:14px 0;">
        <div style="font-size:13px;color:var(--gold);margin-bottom:12px;">👤 নমিনির তথ্য</div>
        <div class="form-row">
          <div class="form-group"><label>নমিনির নাম *</label><input class="form-input" id="ma-nom-name"></div>
          <div class="form-group"><label>সম্পর্ক *</label><input class="form-input" id="ma-nom-rel" placeholder="স্ত্রী, পুত্র, পিতা..."></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>নমিনির মোবাইল *</label><input class="form-input" id="ma-nom-phone"></div>
          <div class="form-group"><label>নমিনির ঠিকানা</label><input class="form-input" id="ma-nom-addr"></div>
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button class="btn-primary" onclick="saveMember()">💾 সদস্য সেভ করুন</button>
        <button class="btn-secondary" onclick="gotoPage('member-list')">বাতিল</button>
      </div>
      <div id="ma-alert" class="alert" style="display:none;margin-top:12px;"></div>
    </div>`;
}

function nextMemberID() {
    const members = getMembers();
    if (!members.length) return '000001';
    const nums = members.map(m => parseInt(m.memberID) || 0);
    return String(Math.max(...nums) + 1).padStart(6, '0');
}

function checkMemberID(val) {
    const hint = document.getElementById('ma-id-hint');
    if (!val) { hint.textContent = ''; return; }
    const exists = getMembers().find(m => m.memberID === val);
    hint.style.color = exists ? '#ef4444' : '#10b981';
    hint.textContent = exists ? '❌ এই আইডি ইতিমধ্যে ব্যবহৃত।' : '✅ এভেইলেবল।';
}

function fillMemberFromUser() {
    const uid = document.getElementById('ma-user').value;
    if (!uid) return;
    const user = DB.getUsers().find(u => u.id === uid);
    if (!user) return;
    document.getElementById('ma-name').value = user.name || '';
    document.getElementById('ma-phone').value = user.phone || '';
    document.getElementById('ma-addr').value = user.address || '';
}

function toggleInvestFields() {
    const type = document.getElementById('ma-invest-type').value;
    document.getElementById('ma-onetime-field').style.display = type === 'onetime' ? 'block' : 'none';
    document.getElementById('ma-project-field').style.display = type === 'project' ? 'block' : 'none';
    updateInvestPreview();
}

function updateInvestPreview() {
    const type = document.getElementById('ma-invest-type').value;
    const settings = getSettings();
    const unitValue = settings.unitValue || 2000;
    const prev = document.getElementById('investPreview');
    let amount = 0;
    if (type === 'onetime') amount = parseFloat(document.getElementById('ma-invest-amount')?.value) || 0;
    else if (type === 'project') amount = parseFloat(document.getElementById('ma-project-amount')?.value) || 0;
    else amount = settings.monthlySavings || 2000;

    if (amount > 0) {
        const units = (amount / unitValue).toFixed(2);
        prev.style.display = 'block';
        prev.innerHTML = `<div style="display:flex;gap:20px;flex-wrap:wrap;">
          <div><div class="cv">${fmtMoney(amount)}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">বিনিয়োগের পরিমাণ</div></div>
          <div><div class="cv">${units}</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">ইউনিট</div></div>
        </div>`;
    } else {
        prev.style.display = 'none';
    }
}

function saveMember() {
    const alert = document.getElementById('ma-alert');
    const memberID = document.getElementById('ma-id').value.trim();
    const name = document.getElementById('ma-name').value.trim();
    const phone = document.getElementById('ma-phone').value.trim();
    const nomName = document.getElementById('ma-nom-name').value.trim();
    const nomRel = document.getElementById('ma-nom-rel').value.trim();
    const nomPhone = document.getElementById('ma-nom-phone').value.trim();

    if (!memberID || !name || !phone || !nomName || !nomRel || !nomPhone) {
        alert.style.display = 'block'; alert.className = 'alert alert-error';
        alert.textContent = 'সব বাধ্যতামূলক তথ্য পূরণ করুন।'; return;
    }
    if (getMembers().find(m => m.memberID === memberID)) {
        alert.style.display = 'block'; alert.className = 'alert alert-error';
        alert.textContent = 'এই আইডি ইতিমধ্যে ব্যবহৃত।'; return;
    }

    const uid = document.getElementById('ma-user').value;
    const investType = document.getElementById('ma-invest-type').value;
    const member = {
        id: 'M-' + Date.now(),
        userId: uid || null,
        memberID, name, phone,
        fatherName: document.getElementById('ma-fname').value,
        address: document.getElementById('ma-addr').value,
        gender: document.getElementById('ma-gender').value,
        joinDate: document.getElementById('ma-join').value,
        investType,
        investAmount: parseFloat(document.getElementById('ma-invest-amount')?.value || document.getElementById('ma-project-amount')?.value || 0) || 0,
        investProject: document.getElementById('ma-project')?.value || null,
        formFee: parseFloat(document.getElementById('ma-form-fee').value) || 100,
        paymentMethod: document.getElementById('ma-pay-method').value,
        nomineeName: nomName, nomineeRelation: nomRel, nomineePhone: nomPhone,
        nomineeAddress: document.getElementById('ma-nom-addr').value,
        status: 'active', units: 0,
        createdAt: new Date().toISOString(), createdBy: adminSession?.id
    };

    const members = getMembers();
    members.push(member);
    saveMembers(members);

    // Update user role if linked
    if (uid) {
        const users = DB.getUsers();
        const idx = users.findIndex(u => u.id === uid);
        if (idx >= 0) { users[idx].role = 'member'; users[idx].memberID = memberID; DB.saveUsers(users); }
    }

    addAuditLog('CREATE_MEMBER', 'members', `MemberID: ${memberID}, Name: ${name}`);
    showToast('সদস্য তৈরি সফল।');
    gotoPage('member-list');
}

// ════ MEMBER PAYMENT ════
function renderMemberPayment(el) {
    const members = getMembers();
    const settings = getSettings();
    el.innerHTML = `
    <div class="card">
      <div class="card-title">💵 সদস্য পেমেন্ট সংগ্রহ</div>
      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <input class="search-input" id="mp-search" placeholder="সদস্য আইডি বা নাম বা মোবাইল..." style="flex:1;">
        <button class="btn-primary" onclick="findMemberForPayment()">🔍 খুঁজুন</button>
      </div>
      <div id="mp-profile" style="display:none;"></div>
    </div>`;
}

function prefillMemberPayment(memberID) {
    const input = document.getElementById('mp-search');
    if (input) { input.value = memberID; findMemberForPayment(); }
}

function findMemberForPayment() {
    const q = document.getElementById('mp-search').value.trim().toLowerCase();
    if (!q) return;
    const members = getMembers();
    const m = members.find(mem =>
        (mem.memberID || '').toLowerCase() === q ||
        (mem.name || '').toLowerCase().includes(q) ||
        (mem.phone || '').includes(q)
    );
    const profileDiv = document.getElementById('mp-profile');
    if (!m) { profileDiv.style.display = 'block'; profileDiv.innerHTML = '<div class="alert alert-error">সদস্য পাওয়া যায়নি।</div>'; return; }

    const savings = (DB.getSavings ? DB.getSavings() : []).filter(s => s.userId === m.userId || s.memberID === m.memberID);
    const totalDeposit = savings.reduce((s, v) => s + (v.amount || 0), 0);
    const settings = getSettings();
    const currentMonth = new Date().toISOString().substring(0, 7);
    const paidThisMonth = savings.find(s => s.month === currentMonth);

    profileDiv.style.display = 'block';
    profileDiv.innerHTML = `
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:48px;height:48px;border-radius:50%;background:#1D9E75;display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;">${(m.name||'ব')[0]}</div>
        <div><div style="font-size:15px;font-weight:700;color:#fff;">${m.name}</div>
        <div style="font-size:11px;color:var(--gold);">${m.memberID} | ${m.phone || '—'}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">
        <div class="stat-card" style="padding:10px;"><div class="stat-val" style="font-size:16px;">${fmtMoney(totalDeposit)}</div><div class="stat-lbl">মোট জমা</div></div>
        <div class="stat-card" style="padding:10px;"><div class="stat-val" style="font-size:16px;color:${paidThisMonth?'#10b981':'#ef4444'};">${paidThisMonth ? '✅ পরিশোধিত' : '❌ বাকি'}</div><div class="stat-lbl">এই মাস</div></div>
        <div class="stat-card" style="padding:10px;"><div class="stat-val" style="font-size:16px;">${savings.length}</div><div class="stat-lbl">মোট এন্ট্রি</div></div>
      </div>
    </div>

    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;">
      <div style="font-size:13px;color:var(--gold);margin-bottom:12px;">💵 নতুন পেমেন্ট</div>
      <div class="form-row">
        <div class="form-group"><label>মাস *</label><input class="form-input" type="month" id="mpp-month" value="${currentMonth}"></div>
        <div class="form-group"><label>পরিমাণ (৳) *</label><input class="form-input" type="number" id="mpp-amount" value="${settings.monthlySavings || 2000}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>পেমেন্ট মেথড</label>
          <select class="form-select" id="mpp-method">
            <option value="cash">নগদ</option><option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ MFS</option><option value="bank">ব্যাংক</option>
          </select>
        </div>
        <div class="form-group"><label>নোট</label><input class="form-input" id="mpp-note" placeholder="ঐচ্ছিক"></div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <label style="display:flex;gap:6px;align-items:center;font-size:12px;cursor:pointer;">
          <input type="checkbox" id="mpp-sms" checked> SMS পাঠান
        </label>
      </div>
      <button class="btn-primary" onclick="collectMemberPayment('${m.id}','${m.memberID}','${m.name}','${m.userId||''}','${m.phone||''}')">💳 পেমেন্ট নিন</button>
    </div>

    <div style="margin-top:16px;">
      <div style="font-size:13px;color:var(--gold);margin-bottom:8px;">📜 পেমেন্ট ইতিহাস</div>
      <div class="table-wrap" style="max-height:200px;overflow-y:auto;">
        <table><thead><tr><th>মাস</th><th>পরিমাণ</th><th>লেট ফি</th><th>তারিখ</th><th>রসিদ</th></tr></thead>
        <tbody>${savings.slice(0, 20).map(s => `<tr>
          <td>${s.month || '—'}</td><td>${fmtMoney(s.amount)}</td><td>${fmtMoney(s.lateFee||0)}</td>
          <td>${fmtDate(s.date)}</td><td><code style="font-size:10px;">${s.receiptNo || '—'}</code></td>
        </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো ইতিহাস নেই।</td></tr>'}
        </tbody></table>
      </div>
    </div>`;
}

function collectMemberPayment(memberId, memberID, memberName, userId, phone) {
    const month = document.getElementById('mpp-month').value;
    const amount = parseFloat(document.getElementById('mpp-amount').value) || 0;
    const method = document.getElementById('mpp-method').value;
    const note = document.getElementById('mpp-note').value;
    const sendSMS = document.getElementById('mpp-sms').checked;

    if (!month || !amount) { showToast('মাস ও পরিমাণ দিন।', 'error'); return; }

    const settings = getSettings();
    const dueDay = settings.savingsDueDay || 15;
    const today = new Date();
    const isLate = today.getDate() > dueDay && today.toISOString().substring(0, 7) === month;
    const lateFee = isLate ? (settings.lateFee || 100) : 0;

    const receiptNo = generateReceiptNo('M');
    const now = new Date().toISOString();

    // Save savings entry
    const savings = DB.getSavings ? DB.getSavings() : [];
    savings.push({
        id: 'sv-' + Date.now(), userId, memberID, memberId,
        month, amount, lateFee, method, note,
        receiptNo, lateFlag: isLate,
        date: now, addedBy: adminSession?.id
    });
    if (DB.set) DB.set(DB.KEYS.SAVINGS, savings);
    else localStorage.setItem('bf_savings', JSON.stringify(savings));

    saveReceipt(receiptNo, 'member_savings', { memberId, memberID, memberName, month, amount, lateFee, method });

    // Ledger entry
    const incomes = getIncomeEntries();
    incomes.push({ id: 'inc-' + Date.now(), category: 'member_savings', amount, date: now, description: `মাসিক সঞ্চয় — ${memberName} (${memberID}) — ${month}`, receiptNo, paymentMethod: method, addedBy: adminSession?.id });
    saveIncome(incomes);

    // Charity: late fee goes to charity fund
    if (lateFee > 0) {
        const ci = getCharityIncome();
        ci.push({ id: 'ch-' + Date.now(), category: 'late_fee', amount: lateFee, date: now, description: `বিলম্ব ফি — ${memberName} (${memberID}) — ${month}`, addedBy: adminSession?.id });
        saveCharityIncome(ci);
    }

    addAuditLog('COLLECT_MEMBER_PAYMENT', 'accounts', `Member: ${memberID}, Month: ${month}, Amount: ${amount}`);

    // Print receipt
    printReceipt({
        receiptNo, name: memberName, id: memberID,
        items: [
            { label: `মাসিক সঞ্চয় (${month})`, amount },
            ...(lateFee > 0 ? [{ label: 'বিলম্ব ফি', amount: lateFee }] : [])
        ],
        total: amount + lateFee, method, date: now, collectedBy: adminSession?.name
    });

    showToast(`পেমেন্ট সফল। রসিদ: ${receiptNo}${isLate ? ' (বিলম্ব ফি সহ)' : ''}`);
    findMemberForPayment();
}
