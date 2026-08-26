// panel-pages.js — Page Router

function renderPage(pageId) {
    const content = document.getElementById('pageContent');
    switch (pageId) {
        case 'dashboard': renderDashboard(content); break;
        case 'member-list': renderMemberList(content); break;
        case 'member-add': renderMemberAdd(content); break;
        case 'applications': renderApplications(content); break;
        case 'client-list': renderClientList(content); break;
        case 'client-add': renderClientAdd(content); break;
        case 'client-fund': renderClientFund(content); break;
        case 'paid-clients': renderPaidClients(content); break;
        case 'due-clients': renderDueClients(content); break;
        case 'product-ledger': renderProductLedger(content); break;
        case 'acc-settings': renderAccSettings(content); break;
        case 'member-payment': renderMemberPayment(content); break;
        case 'client-payment': renderClientPayment(content); break;
        case 'other-income': renderOtherIncome(content); break;
        case 'expense': renderExpense(content); break;
        case 'acc-summary': renderAccSummary(content); break;
        case 'member-due-report': renderMemberDueReport(content); break;
        case 'client-due-report': renderClientDueReport(content); break;
        case 'acc-log': renderAccLog(content); break;
        case 'qard-list': renderQardList(content); break;
        case 'qard-fund': renderQardFund(content); break;
        case 'qard-collection': renderQardCollection(content); break;
        case 'qard-add': renderQardAdd(content); break;
        case 'charity-income': renderCharityIncome(content); break;
        case 'charity-expense': renderCharityExpense(content); break;
        case 'charity-apps': renderCharityApps(content); break;
        case 'charity-ledger': renderCharityLedger(content); break;
        case 'sms-records': renderSMSRecords(content); break;
        case 'sms-send': renderSMSSend(content); break;
        case 'sms-recharge': renderSMSRecharge(content); break;
        case 'sms-templates': renderSMSTemplates(content); break;
        case 'committee-running': renderCommitteeRunning(content); break;
        case 'committee-old': renderCommitteeOld(content); break;
        case 'committee-add': renderCommitteeAdd(content); break;
        case 'committee-rules': renderCommitteeRules(content); break;
        case 'project-list': case 'project-running': renderProjectList(content, pageId); break;
        case 'project-add': renderProjectAdd(content); break;
        case 'asset-list': renderAssetList(content); break;
        case 'asset-add': renderAssetAdd(content); break;
        case 'activity-log': renderActivityLog(content); break;
        case 'reviews': renderReviews(content); break;
        case 'gallery-mgmt': renderGalleryMgmt(content); break;
        case 'timeline-mgmt': renderTimelineMgmt(content); break;
        case 'website-content': renderWebsiteContent(content); break;
        case 'site-info': renderSiteInfo(content); break;
        case 'admin-mgmt': renderAdminMgmt(content); break;
        case 'permissions': renderPermissions(content); break;
        case 'products': renderProductsMgmt(content); break;
        case 'orders': renderOrdersMgmt(content); break;
        case 'shop-settings': renderShopSettings(content); break;
        case 'economy-calendar': renderEconomyCalendar(content); break;
        case 'profit-distribution': renderProfitDistribution(content); break;
        case 'withdrawals': renderWithdrawals(content); break;
        case 'fund-transfers': renderFundTransfers(content); break;
        case 'profit-history': renderProfitHistory(content); break;
        default: content.innerHTML = `<div class="card"><div class="card-title">⚠️ পেজ পাওয়া যায়নি: ${pageId}</div></div>`;
    }
}

// ════ DASHBOARD ════
function renderDashboard(el) {
    const users = DB.getUsers();
    const members = getMembers();
    const clients = getClients();
    const installments = getInstallments();
    const loans = getLoans();
    const savings = DB.getSavings ? DB.getSavings() : [];
    const applications = JSON.parse(localStorage.getItem('bf_applications') || '[]');
    const qardApps = getQardApps();
    const settings = getSettings();

    const totalSavings = savings.reduce((s, v) => s + (v.amount || 0), 0);
    const totalLoanGiven = loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.amount || 0), 0);
    const clientsDue = clients.filter(c => {
        const inst = installments.filter(i => i.clientId === c.id && i.status !== 'paid');
        return inst.length > 0;
    });
    const pendingApps = applications.filter(a => a.status === 'pending');
    const pendingQard = qardApps.filter(q => q.status === 'pending');

    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card" onclick="gotoPage('member-list')">
        <div class="stat-val">${members.length}</div><div class="stat-lbl">মোট সদস্য</div>
      </div>
      <div class="stat-card" onclick="gotoPage('client-list')">
        <div class="stat-val">${clients.length}</div><div class="stat-lbl">মোট ক্লাইন্ট</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#10b981;">${fmtMoney(totalSavings)}</div><div class="stat-lbl">মোট সঞ্চয়</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#f59e0b;">${fmtMoney(totalLoanGiven)}</div><div class="stat-lbl">সক্রিয় করজ</div>
      </div>
      <div class="stat-card" onclick="gotoPage('applications')">
        <div class="stat-val" style="color:#f59e0b;">${pendingApps.length}</div><div class="stat-lbl">পেন্ডিং আবেদন</div>
      </div>
      <div class="stat-card" onclick="gotoPage('due-clients')">
        <div class="stat-val" style="color:#ef4444;">${clientsDue.length}</div><div class="stat-lbl">ডিউ ক্লাইন্ট</div>
      </div>
      <div class="stat-card" onclick="gotoPage('qard-add')">
        <div class="stat-val" style="color:#c084fc;">${pendingQard.length}</div><div class="stat-lbl">পেন্ডিং করজ</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">${users.length}</div><div class="stat-lbl">রেজিস্টার্ড ব্যবহারকারী</div>
      </div>
    </div>

    <!-- Pending Actions -->
    <div class="card">
      <div class="card-title">⚡ Pending Actions</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
        ${pendingApps.length ? `<div class="stat-card" onclick="gotoPage('applications')" style="border-color:rgba(245,158,11,0.3);">
          <div style="font-size:22px;">📩</div>
          <div style="font-size:14px;color:#f59e0b;font-weight:600;">${pendingApps.length} সদস্য আবেদন</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);">অনুমোদন দরকার</div>
        </div>` : ''}
        ${pendingQard.length ? `<div class="stat-card" onclick="gotoPage('qard-list')" style="border-color:rgba(192,132,252,0.3);">
          <div style="font-size:22px;">🤝</div>
          <div style="font-size:14px;color:#c084fc;font-weight:600;">${pendingQard.length} করজ আবেদন</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);">পর্যালোচনা দরকার</div>
        </div>` : ''}
        ${clientsDue.length ? `<div class="stat-card" onclick="gotoPage('due-clients')" style="border-color:rgba(239,68,68,0.3);">
          <div style="font-size:22px;">⚠️</div>
          <div style="font-size:14px;color:#ef4444;font-weight:600;">${clientsDue.length} ডিউ ক্লাইন্ট</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.4);">কিস্তি বাকি</div>
        </div>` : ''}
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="card">
      <div class="card-title">🔴 সাম্প্রতিক কার্যক্রম <button class="btn-sm btn-secondary" onclick="gotoPage('activity-log')" style="margin-left:auto;">সব দেখুন →</button></div>
      <div id="recentActivity">
        ${getAuditLog().slice(0, 10).map(a => `
          <div class="activity-item">
            <div class="activity-dot dot-gold"></div>
            <div class="activity-text"><b>${a.userName || 'System'}</b> — ${a.action} (${a.module})</div>
            <div class="activity-time">${fmtDate(a.date)}</div>
          </div>`).join('') || '<p style="color:rgba(255,255,255,0.3);font-size:12px;">কোনো কার্যক্রম নেই।</p>'}
      </div>
    </div>`;
}

// ════ APPLICATIONS (Membership) ════
function renderApplications(el) {
    const apps = JSON.parse(localStorage.getItem('bf_applications') || '[]').sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${apps.length}</div><div class="stat-lbl">মোট</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b;">${apps.filter(a=>a.status==='pending').length}</div><div class="stat-lbl">পেন্ডিং</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#10b981;">${apps.filter(a=>a.status==='approved').length}</div><div class="stat-lbl">অনুমোদিত</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#ef4444;">${apps.filter(a=>a.status==='rejected').length}</div><div class="stat-lbl">প্রত্যাখ্যাত</div></div>
    </div>
    <div class="card">
      <div class="card-title">📩 সদস্য আবেদন তালিকা</div>
      <div class="search-bar">
        <input class="search-input" id="appSearch" placeholder="নাম, NID বা আইডি..." oninput="filterAppsTable()">
        <select class="filter-select" id="appFilter" onchange="filterAppsTable()">
          <option value="">সব</option>
          <option value="pending">পেন্ডিং</option>
          <option value="approved">অনুমোদিত</option>
          <option value="rejected">প্রত্যাখ্যাত</option>
        </select>
        <button class="btn-secondary btn-sm" onclick="exportAppsCSV()">📥 CSV</button>
      </div>
      <div class="table-wrap">
        <table id="appsTable">
          <thead><tr><th>আইডি</th><th>নাম</th><th>NID</th><th>মোবাইল</th><th>তারিখ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
          <tbody id="appsTbody">${renderAppsRows(apps)}</tbody>
        </table>
      </div>
    </div>`;
    window._appsData = apps;
}

function renderAppsRows(apps) {
    return apps.map(a => `
      <tr>
        <td><code style="font-size:10px;">${a.id}</code></td>
        <td>${a.applicantNameBn || a.name || '—'}</td>
        <td>${a.nidNumber || '—'}</td>
        <td>${(a.phones && a.phones[0]) || a.phone || '—'}</td>
        <td>${fmtDate(a.submittedAt)}</td>
        <td><span class="status-badge ${a.status === 'approved' ? 'badge-approved' : a.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}">${a.status === 'approved' ? 'অনুমোদিত' : a.status === 'rejected' ? 'প্রত্যাখ্যাত' : 'পেন্ডিং'}</span></td>
        <td>
          <button class="btn-sm btn-secondary" onclick="viewApp('${a.id}')">👁️</button>
          ${a.status === 'pending' ? `
            <button class="btn-sm btn-success" onclick="approveApp('${a.id}')">✅</button>
            <button class="btn-sm btn-danger" onclick="rejectApp('${a.id}')">❌</button>` : ''}
        </td>
      </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:rgba(255,255,255,0.3);padding:20px;">কোনো আবেদন নেই।</td></tr>';
}

function filterAppsTable() {
    const q = document.getElementById('appSearch')?.value.toLowerCase() || '';
    const f = document.getElementById('appFilter')?.value || '';
    const apps = window._appsData || [];
    const filtered = apps.filter(a => {
        const match = !q || (a.applicantNameBn || '').toLowerCase().includes(q) || (a.nidNumber || '').includes(q) || (a.id || '').toLowerCase().includes(q);
        const statusMatch = !f || a.status === f;
        return match && statusMatch;
    });
    document.getElementById('appsTbody').innerHTML = renderAppsRows(filtered);
}

function approveApp(id) {
    const apps = JSON.parse(localStorage.getItem('bf_applications') || '[]');
    const idx = apps.findIndex(a => a.id === id);
    if (idx < 0) return;
    const mid = prompt('সদস্য আইডি দিন (যেমন: 000001):');
    if (!mid) return;
    apps[idx].status = 'approved';
    apps[idx].memberID = mid;
    apps[idx].approvedAt = new Date().toISOString();
    apps[idx].approvedBy = adminSession?.id;
    localStorage.setItem('bf_applications', JSON.stringify(apps));
    addAuditLog('APPROVE_APPLICATION', 'applications', `App: ${id}, MemberID: ${mid}`);
    showToast('অনুমোদন দেওয়া হয়েছে।');
    renderPage('applications');
}

function rejectApp(id) {
    const reason = prompt('প্রত্যাখ্যানের কারণ লিখুন:');
    if (!reason) return;
    const apps = JSON.parse(localStorage.getItem('bf_applications') || '[]');
    const idx = apps.findIndex(a => a.id === id);
    if (idx < 0) return;
    apps[idx].status = 'rejected';
    apps[idx].rejectReason = reason;
    apps[idx].rejectedAt = new Date().toISOString();
    localStorage.setItem('bf_applications', JSON.stringify(apps));
    addAuditLog('REJECT_APPLICATION', 'applications', `App: ${id}, Reason: ${reason}`);
    showToast('প্রত্যাখ্যান করা হয়েছে।');
    renderPage('applications');
}

function viewApp(id) {
    const apps = JSON.parse(localStorage.getItem('bf_applications') || '[]');
    const a = apps.find(x => x.id === id);
    if (!a) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-head"><h3>📋 আবেদন বিস্তারিত</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
          <div><b>নাম (বাংলা):</b> ${a.applicantNameBn || '—'}</div>
          <div><b>নাম (ইংরেজি):</b> ${a.applicantNameEn || '—'}</div>
          <div><b>পিতার নাম:</b> ${a.fatherNameBn || '—'}</div>
          <div><b>NID:</b> ${a.nidNumber || '—'}</div>
          <div><b>মোবাইল:</b> ${(a.phones && a.phones[0]) || a.phone || '—'}</div>
          <div><b>লিঙ্গ:</b> ${a.gender || '—'}</div>
          <div><b>জন্ম তারিখ:</b> ${fmtDate(a.dob)}</div>
          <div><b>পেশা:</b> ${a.occupation || '—'}</div>
          <div><b>ঠিকানা:</b> ${a.address || '—'}</div>
          <div><b>স্ট্যাটাস:</b> ${a.status}</div>
          <div><b>আবেদনের তারিখ:</b> ${fmtDate(a.submittedAt)}</div>
          ${a.memberID ? `<div><b>সদস্য আইডি:</b> ${a.memberID}</div>` : ''}
          ${a.rejectReason ? `<div><b>প্রত্যাখ্যানের কারণ:</b> ${a.rejectReason}</div>` : ''}
        </div>
      </div>
      <div class="modal-footer">
        ${a.status === 'pending' ? `<button class="btn-success" onclick="approveApp('${a.id}');this.closest('.modal-overlay').remove()">✅ অনুমোদন</button>
        <button class="btn-danger" onclick="rejectApp('${a.id}');this.closest('.modal-overlay').remove()">❌ প্রত্যাখ্যান</button>` : ''}
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বন্ধ</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
}

function exportAppsCSV() {
    const apps = window._appsData || [];
    const rows = [['আইডি', 'নাম', 'NID', 'মোবাইল', 'তারিখ', 'স্ট্যাটাস']];
    apps.forEach(a => rows.push([a.id, a.applicantNameBn || '', a.nidNumber || '', (a.phones && a.phones[0]) || '', a.submittedAt || '', a.status || '']));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'applications.csv'; a.click();
}

// ════ PRODUCT MANAGEMENT ════
function renderProductsMgmt(el) {
    const products = DB.getProducts ? DB.getProducts() : [];
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📦 পণ্য তালিকা
        <button class="btn-primary btn-sm" style="margin-left:auto;" onclick="showAddProductModal()">+ পণ্য যোগ</button>
      </div>
      <div class="table-wrap">
        <table><thead><tr><th>নাম</th><th>ক্যাটাগরি</th><th>মূল্য</th><th>স্টক</th><th>Featured</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${products.map(p => `
          <tr>
            <td>${p.emoji || '📦'} ${p.name}</td>
            <td>${p.category || '—'}</td>
            <td>${fmtMoney(p.price)}</td>
            <td><span class="status-badge ${p.inStock ? 'badge-active' : 'badge-inactive'}">${p.inStock ? 'আছে' : 'নেই'}</span></td>
            <td>${p.featured ? '⭐' : '—'}</td>
            <td>
              <button class="btn-sm btn-secondary" onclick="editProduct('${p.id}')">✏️</button>
              <button class="btn-sm btn-danger" onclick="deleteProduct('${p.id}')">🗑️</button>
            </td>
          </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো পণ্য নেই।</td></tr>'}
        </tbody></table>
      </div>
    </div>`;
}

function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
    <div class="modal"><div class="modal-head"><h3>📦 নতুন পণ্য</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>পণ্যের নাম *</label><input class="form-input" id="pd-name" placeholder="নাম"></div>
      <div class="form-row">
        <div class="form-group"><label>ক্যাটাগরি</label><input class="form-input" id="pd-cat" placeholder="মোবাইল, ইলেকট্রনিক্স..."></div>
        <div class="form-group"><label>মূল্য (৳)</label><input class="form-input" type="number" id="pd-price"></div>
      </div>
      <div class="form-group"><label>বিবরণ</label><textarea class="form-textarea" id="pd-desc"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>ইমোজি</label><input class="form-input" id="pd-emoji" placeholder="📱"></div>
        <div class="form-group"><label>স্টক</label>
          <select class="form-select" id="pd-stock"><option value="true">আছে</option><option value="false">নেই</option></select>
        </div>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">
        <input type="checkbox" id="pd-featured"> Featured পণ্য
      </label>
    </div>
    <div class="modal-footer"><button class="btn-primary" onclick="saveNewProduct()">সেভ করুন</button><button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বাতিল</button></div>
    </div>`;
    document.body.appendChild(modal);
}

function saveNewProduct() {
    const name = document.getElementById('pd-name').value.trim();
    if (!name) { showToast('নাম দিন।', 'error'); return; }
    const products = DB.getProducts ? DB.getProducts() : [];
    const p = {
        id: 'p' + Date.now(), name,
        category: document.getElementById('pd-cat').value,
        price: parseFloat(document.getElementById('pd-price').value) || 0,
        description: document.getElementById('pd-desc').value,
        emoji: document.getElementById('pd-emoji').value || '📦',
        inStock: document.getElementById('pd-stock').value === 'true',
        featured: document.getElementById('pd-featured').checked,
        images: [], createdAt: new Date().toISOString()
    };
    products.push(p);
    if (DB.saveProducts) DB.saveProducts(products);
    addAuditLog('ADD_PRODUCT', 'products', `Product: ${name}`);
    showToast('পণ্য যোগ হয়েছে।');
    document.querySelector('.modal-overlay').remove();
    renderPage('products');
}

function deleteProduct(id) {
    showConfirm('পণ্য মুছুন', 'এই পণ্য মুছে ফেলবেন?', () => {
        const products = (DB.getProducts ? DB.getProducts() : []).filter(p => p.id !== id);
        if (DB.saveProducts) DB.saveProducts(products);
        showToast('পণ্য মুছে গেছে।');
        renderPage('products');
    });
}

// ════ ORDERS ════
function renderOrdersMgmt(el) {
    const orders = DB.getOrders ? DB.getOrders() : [];
    el.innerHTML = `
    <div class="card">
      <div class="card-title">🛒 অর্ডার তালিকা</div>
      <div class="table-wrap"><table>
        <thead><tr><th>অর্ডার আইডি</th><th>পণ্য</th><th>গ্রাহক</th><th>মোবাইল</th><th>মূল্য</th><th>তারিখ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${orders.map(o => `
          <tr>
            <td><code style="font-size:10px;">${o.id}</code></td>
            <td>${o.productName || '—'}</td>
            <td>${o.customerName || '—'}</td>
            <td>${o.customerPhone || '—'}</td>
            <td>${fmtMoney(o.price)}</td>
            <td>${fmtDate(o.submittedAt)}</td>
            <td><span class="status-badge badge-${o.status === 'approved' ? 'approved' : o.status === 'pending' ? 'pending' : 'inactive'}">${o.status || '—'}</span></td>
            <td>
              <button class="btn-sm btn-success" onclick="updateOrderStatus('${o.id}','approved')">✅</button>
              <button class="btn-sm btn-danger" onclick="updateOrderStatus('${o.id}','rejected')">❌</button>
            </td>
          </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো অর্ডার নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function updateOrderStatus(id, status) {
    const orders = DB.getOrders ? DB.getOrders() : [];
    const idx = orders.findIndex(o => o.id === id);
    if (idx < 0) return;
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    if (DB.saveOrders) DB.saveOrders(orders);
    else localStorage.setItem('bf_orders', JSON.stringify(orders));
    addAuditLog('UPDATE_ORDER_STATUS', 'orders', `Order: ${id}, Status: ${status}`);
    showToast('স্ট্যাটাস আপডেট হয়েছে।');
    renderPage('orders');
}

// ════ SITE INFO ════
function renderSiteInfo(el) {
    const s = getSettings();
    el.innerHTML = `
    <div class="card">
      <div class="card-title">🏢 সাংগঠনিক তথ্য</div>
      <div class="form-row">
        <div class="form-group"><label>সংগঠনের নাম</label><input class="form-input" id="si-name" value="${s.siteName || ''}"></div>
        <div class="form-group"><label>স্লোগান</label><input class="form-input" id="si-slogan" value="${s.slogan || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>মোবাইল</label><input class="form-input" id="si-phone" value="${s.phone || ''}"></div>
        <div class="form-group"><label>ইমেইল</label><input class="form-input" id="si-email" value="${s.email || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>ওয়েবসাইট</label><input class="form-input" id="si-web" value="${s.website || ''}"></div>
        <div class="form-group"><label>ঠিকানা</label><input class="form-input" id="si-addr" value="${s.address || ''}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Facebook Page URL</label><input class="form-input" id="si-fb" value="${s.fbPageUrl || ''}"></div>
        <div class="form-group"><label>Unit Value (৳)</label><input class="form-input" type="number" id="si-unit" value="${s.unitValue || 2000}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Monthly Savings (৳)</label><input class="form-input" type="number" id="si-msav" value="${s.monthlySavings || 2000}"></div>
        <div class="form-group"><label>Late Fee (৳/unit)</label><input class="form-input" type="number" id="si-lfee" value="${s.lateFee || 100}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Profit Margin (%)</label><input class="form-input" type="number" id="si-profit" value="${s.profitMargin || 10}"></div>
        <div class="form-group"><label>Max Qard (৳)</label><input class="form-input" type="number" id="si-maxloan" value="${s.maxLoan || 15000}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Member Profit Share (%)</label><input class="form-input" type="number" id="si-mshare" value="${s.memberProfitShare || 60}"></div>
        <div class="form-group"><label>Charity Share (%)</label><input class="form-input" type="number" id="si-cshare" value="${s.charityShare || 5}"></div>
      </div>
      <button class="btn-primary" onclick="saveSiteInfo()">💾 সেভ করুন</button>
    </div>`;
}

function saveSiteInfo() {
    const s = getSettings();
    const updated = {
        ...s,
        siteName: document.getElementById('si-name').value,
        slogan: document.getElementById('si-slogan').value,
        phone: document.getElementById('si-phone').value,
        email: document.getElementById('si-email').value,
        website: document.getElementById('si-web').value,
        address: document.getElementById('si-addr').value,
        fbPageUrl: document.getElementById('si-fb').value,
        unitValue: parseFloat(document.getElementById('si-unit').value) || 2000,
        monthlySavings: parseFloat(document.getElementById('si-msav').value) || 2000,
        lateFee: parseFloat(document.getElementById('si-lfee').value) || 100,
        profitMargin: parseFloat(document.getElementById('si-profit').value) || 10,
        maxLoan: parseFloat(document.getElementById('si-maxloan').value) || 15000,
        memberProfitShare: parseFloat(document.getElementById('si-mshare').value) || 60,
        charityShare: parseFloat(document.getElementById('si-cshare').value) || 5,
    };
    if (DB.saveSetting) { Object.keys(updated).forEach(k => DB.saveSetting(k, updated[k])); }
    else { localStorage.setItem('bf_site_settings', JSON.stringify(updated)); }
    addAuditLog('UPDATE_SITE_INFO', 'settings', 'সাংগঠনিক তথ্য আপডেট');
    showToast('সেভ হয়েছে।');
}

// ════ REVIEWS ════
function renderReviews(el) {
// ════ REVIEWS ════
async function renderReviews(el) {
    el.innerHTML = '<div class="spinner" style="margin:30px auto"></div>';
    let reviews = [], stats = {};
    try {
        const r = await apiFetch('/reviews');
        reviews = r?.reviews || [];
        stats = r?.stats || {};
    } catch (_) {
        reviews = getReviews ? getReviews() : [];
    }
    reviews = reviews.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    const statusFilter = ['', 'pending', 'approved', 'rejected', 'hidden'];
    const statusLabels = { '':'সব', pending:'পেন্ডিং', approved:'প্রকাশিত', rejected:'প্রত্যাখ্যাত', hidden:'লুকানো' };
    window._reviewsData = reviews;

    el.innerHTML = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-val">${stats.total||reviews.length}</div><div class="stat-lbl">মোট</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#f59e0b">${stats.pending||reviews.filter(r=>r.status==='pending').length}</div><div class="stat-lbl">পেন্ডিং</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#10b981">${stats.approved||reviews.filter(r=>r.status==='approved').length}</div><div class="stat-lbl">প্রকাশিত</div></div>
      <div class="stat-card"><div class="stat-val" style="color:#ef4444">${stats.rejected||reviews.filter(r=>r.status==='rejected').length}</div><div class="stat-lbl">প্রত্যাখ্যাত</div></div>
    </div>
    <div class="admin-card">
      <div class="card-title">⭐ রিভিউ ব্যবস্থাপনা</div>
      <div class="search-bar" style="margin-bottom:12px">
        <select class="filter-select" id="rvStatus" onchange="filterReviews()">
          ${statusFilter.map(s=>`<option value="${s}">${statusLabels[s]}</option>`).join('')}
        </select>
        <input class="search-input" id="rvSearch" placeholder="নাম বা বিষয়..." oninput="filterReviews()">
      </div>
      <div class="table-wrap">
        <table><thead>
          <tr><th>নাম</th><th>রেটিং</th><th>মতামত</th><th>তারিখ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr>
        </thead><tbody id="reviewsTbody">${renderReviewRows(reviews)}</tbody></table>
      </div>
    </div>`;
}

function renderReviewRows(reviews) {
    if (!reviews.length) return '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px">কোনো রিভিউ নেই।</td></tr>';
    const statusBadge = { approved:'badge-active', pending:'badge-pending', rejected:'badge-danger', hidden:'badge-gold' };
    const statusLabel = { approved:'প্রকাশিত', pending:'পেন্ডিং', rejected:'প্রত্যাখ্যাত', hidden:'লুকানো' };
    return reviews.map(r => `<tr>
      <td>${r.name||'অনামী'}</td>
      <td>${'★'.repeat(r.rating||r.stars||5)}${'☆'.repeat(5-(r.rating||r.stars||5))}</td>
      <td style="font-size:.82rem;color:var(--text-muted);max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(r.content||r.text||'').substring(0,80)}</td>
      <td style="font-size:.78rem">${fmtDate(r.createdAt||r.date)}</td>
      <td><span class="badge ${statusBadge[r.status]||'badge-pending'}">${statusLabel[r.status]||r.status}</span></td>
      <td style="display:flex;gap:4px;flex-wrap:wrap">
        ${r.status!=='approved'?`<button class="btn btn-sm btn-ghost" style="color:#10b981" onclick="updateReviewStatus('${r.id}','approved')">✅</button>`:''}
        ${r.status!=='hidden'?`<button class="btn btn-sm btn-ghost" onclick="updateReviewStatus('${r.id}','hidden')">🙈</button>`:''}
        ${r.status!=='rejected'?`<button class="btn btn-sm btn-ghost" style="color:#ef4444" onclick="updateReviewStatus('${r.id}','rejected')">❌</button>`:''}
        <button class="btn btn-sm btn-ghost" style="color:#ef4444" onclick="deleteReview('${r.id}')">🗑️</button>
      </td>
    </tr>`).join('');
}

function filterReviews() {
    const q = (document.getElementById('rvSearch')?.value||'').toLowerCase();
    const s = document.getElementById('rvStatus')?.value||'';
    const filtered = (window._reviewsData||[]).filter(r =>
        (!s || r.status===s) &&
        (!q || (r.name||'').toLowerCase().includes(q) || (r.content||r.text||'').toLowerCase().includes(q))
    );
    const tbody = document.getElementById('reviewsTbody');
    if (tbody) tbody.innerHTML = renderReviewRows(filtered);
}

async function updateReviewStatus(id, status) {
    try {
        await apiPatch(`/reviews/${id}`, { status });
        showToast(status==='approved'?'প্রকাশিত হয়েছে।':status==='hidden'?'লুকানো হয়েছে।':'প্রত্যাখ্যাত হয়েছে।', 'success');
        renderReviews(document.getElementById('adminContent'));
    } catch (_) {
        // localStorage fallback
        const reviews = getReviews ? getReviews() : [];
        const idx = reviews.findIndex(r => r.id === id);
        if (idx>=0) { reviews[idx].status = status; if (typeof saveReviews === 'function') saveReviews(reviews); }
        renderReviews(document.getElementById('adminContent'));
    }
}

async function deleteReview(id) {
    if (!confirm('রিভিউ মুছে ফেলতে চান?')) return;
    try {
        await apiDelete(`/reviews/${id}`);
        showToast('রিভিউ মুছে ফেলা হয়েছে।', 'success');
    } catch (_) {}
    renderReviews(document.getElementById('adminContent'));
}

// ════ SHOP SETTINGS ════
function renderShopSettings(el) {
    el.innerHTML = `<div class="card"><div class="card-title">⚙️ শপ সেটিংস</div>
    <a href="../admin/shop_admin.html" class="btn-primary" style="display:inline-block;margin-bottom:16px;">🔗 Shop Admin প্যানেল খুলুন</a>
    <p style="font-size:13px;color:rgba(255,255,255,0.5);">পণ্য, অর্ডার, ব্যাজ ও নোটিশ ব্যবস্থাপনার জন্য Shop Admin প্যানেল ব্যবহার করুন।</p>
    </div>`;
}

// ════ ADMIN MANAGEMENT ════
function renderAdminMgmt(el) {
    const users = DB.getUsers().filter(u => u.role === 'admin' || u.role === 'super_admin');
    el.innerHTML = `
    <div class="card">
      <div class="card-title">👤 অ্যাডমিন ব্যবস্থাপনা</div>
      <div class="table-wrap"><table>
        <thead><tr><th>নাম</th><th>ইউজারনেম</th><th>মোবাইল</th><th>ভূমিকা</th><th>তৈরির তারিখ</th><th>শেষ লগইন</th><th>স্ট্যাটাস</th></tr></thead>
        <tbody>${users.map(u => `<tr>
          <td>${u.name || '—'}</td>
          <td>${u.username || '—'}</td>
          <td>${u.phone || '—'}</td>
          <td>${u.role || '—'}</td>
          <td>${fmtDate(u.createdAt)}</td>
          <td>${fmtDate(u.lastLogin)}</td>
          <td><span class="status-badge ${u.verified !== false ? 'badge-active' : 'badge-inactive'}">${u.verified !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span></td>
        </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;">কেউ নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

// ════ PERMISSIONS ════
// (Delegated to panel-core.js renderPermissions which has full API implementation)

// ════ ECONOMY CALENDAR ════
function renderEconomyCalendar(el) {
    const notices = DB.getNotices ? DB.getNotices() : [];
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📅 নোটিশ ব্যবস্থাপনা (ইকোনমি ক্যালেন্ডার)</div>
      <div style="margin-bottom:14px;">
        <button class="btn-primary btn-sm" onclick="showAddNoticeModal()">+ নতুন নোটিশ</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>নোটিশ</th><th>স্টাইল</th><th>রঙ</th><th>স্ট্যাটাস</th><th>অ্যাকশন</th></tr></thead>
        <tbody>${notices.map(n => `<tr>
          <td>${(n.text || '').substring(0, 60)}...</td>
          <td>${n.style || 'normal'}</td>
          <td><span style="background:${n.color || '#fff'};color:#000;padding:2px 8px;border-radius:4px;font-size:10px;">${n.color || '#fff'}</span></td>
          <td><span class="status-badge ${n.active ? 'badge-active' : 'badge-inactive'}">${n.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span></td>
          <td>
            <button class="btn-sm btn-secondary" onclick="toggleNotice('${n.id}','${!n.active}')">${n.active ? 'বন্ধ' : 'চালু'}</button>
            <button class="btn-sm btn-danger" onclick="deleteNotice('${n.id}')">🗑️</button>
          </td>
        </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:rgba(255,255,255,0.3);">কোনো নোটিশ নেই।</td></tr>'}
        </tbody></table></div>
    </div>`;
}

function showAddNoticeModal() {
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal"><div class="modal-head"><h3>📢 নতুন নোটিশ</h3><button onclick="this.closest('.modal-overlay').remove()">✕</button></div>
    <div class="modal-body">
      <div class="form-group"><label>নোটিশ টেক্সট *</label><textarea class="form-textarea" id="nt-text"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label>স্টাইল</label><select class="form-select" id="nt-style"><option value="normal">Normal</option><option value="bold">Bold</option><option value="italic">Italic</option></select></div>
        <div class="form-group"><label>রঙ</label><input class="form-input" type="color" id="nt-color" value="#F5D061"></div>
      </div>
    </div>
    <div class="modal-footer"><button class="btn-primary" onclick="saveNotice()">সেভ</button><button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">বাতিল</button></div>
    </div>`;
    document.body.appendChild(m);
}

function saveNotice() {
    const text = document.getElementById('nt-text').value.trim();
    if (!text) { showToast('নোটিশ লিখুন।', 'error'); return; }
    const notices = DB.getNotices ? DB.getNotices() : [];
    notices.push({ id: 'n-' + Date.now(), text, style: document.getElementById('nt-style').value, color: document.getElementById('nt-color').value, active: true });
    if (DB.saveNotices) DB.saveNotices(notices);
    addAuditLog('ADD_NOTICE', 'notices', `Notice: ${text.substring(0, 30)}`);
    showToast('নোটিশ যোগ হয়েছে।');
    document.querySelector('.modal-overlay').remove();
    renderPage('economy-calendar');
}

function toggleNotice(id, active) {
    const notices = DB.getNotices ? DB.getNotices() : [];
    const idx = notices.findIndex(n => n.id === id);
    if (idx >= 0) { notices[idx].active = active === 'true'; if (DB.saveNotices) DB.saveNotices(notices); }
    renderPage('economy-calendar');
}

function deleteNotice(id) {
    showConfirm('নোটিশ মুছুন', 'এই নোটিশটি মুছে ফেলবেন?', () => {
        const notices = (DB.getNotices ? DB.getNotices() : []).filter(n => n.id !== id);
        if (DB.saveNotices) DB.saveNotices(notices);
        showToast('মুছে গেছে।');
        renderPage('economy-calendar');
    });
}

// ════ GALLERY MANAGEMENT ════
function renderGalleryMgmt(el) {
    const gallery = getGallery();
    el.innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn active" onclick="switchGMTab('photos',this)">📷 ছবি (${gallery.photos.length})</button>
      <button class="tab-btn" onclick="switchGMTab('videos',this)">🎬 ভিডিও (${gallery.videos.length})</button>
      <button class="tab-btn" onclick="switchGMTab('events',this)">📅 ইভেন্ট (${gallery.events.length})</button>
    </div>
    <div id="gm-tab-photos">
      <div class="card">
        <div class="card-title">📷 ছবি যোগ করুন</div>
        <div class="form-row">
          <div class="form-group"><label>ছবির URL *</label><input class="form-input" id="gm-photo-url" placeholder="https://..."></div>
          <div class="form-group"><label>শিরোনাম</label><input class="form-input" id="gm-photo-title" placeholder="ছবির শিরোনাম"></div>
        </div>
        <button class="btn-primary" onclick="addGalleryPhoto()">ছবি যোগ করুন</button>
      </div>
      <div class="card">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
          ${gallery.photos.map((p, i) => `<div style="position:relative;aspect-ratio:1;background:#050d07;border-radius:8px;overflow:hidden;border:1px solid var(--border);">
            ${p.url ? `<img src="${p.url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : ''}
            <button onclick="removeGalleryItem('photos',${i})" style="position:absolute;top:4px;right:4px;background:rgba(239,68,68,0.8);border:none;color:#fff;border-radius:4px;cursor:pointer;font-size:11px;padding:2px 6px;">✕</button>
            <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);font-size:10px;padding:3px 6px;color:#fff;">${p.title || ''}</div>
          </div>`).join('') || '<p style="color:rgba(255,255,255,0.3);font-size:12px;">কোনো ছবি নেই।</p>'}
        </div>
      </div>
    </div>
    <div id="gm-tab-videos" style="display:none;">
      <div class="card">
        <div class="card-title">🎬 YouTube ভিডিও যোগ করুন</div>
        <div class="form-row">
          <div class="form-group"><label>YouTube Video ID *</label><input class="form-input" id="gm-yt-id" placeholder="dQw4w9WgXcQ"></div>
          <div class="form-group"><label>শিরোনাম</label><input class="form-input" id="gm-yt-title" placeholder="ভিডিও শিরোনাম"></div>
        </div>
        <button class="btn-primary" onclick="addGalleryVideo()">ভিডিও যোগ করুন</button>
      </div>
    </div>
    <div id="gm-tab-events" style="display:none;">
      <div class="card">
        <div class="card-title">📅 ইভেন্ট যোগ করুন</div>
        <div class="form-row">
          <div class="form-group"><label>ইভেন্টের নাম *</label><input class="form-input" id="gm-ev-title"></div>
          <div class="form-group"><label>তারিখ</label><input class="form-input" type="date" id="gm-ev-date"></div>
        </div>
        <div class="form-group"><label>বিবরণ</label><textarea class="form-textarea" id="gm-ev-desc"></textarea></div>
        <button class="btn-primary" onclick="addGalleryEvent()">ইভেন্ট যোগ করুন</button>
      </div>
    </div>`;
}

function switchGMTab(tab, btn) {
    document.querySelectorAll('[id^="gm-tab-"]').forEach(t => t.style.display = 'none');
    document.getElementById('gm-tab-' + tab).style.display = 'block';
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function addGalleryPhoto() {
    const url = document.getElementById('gm-photo-url').value.trim();
    if (!url) { showToast('URL দিন।', 'error'); return; }
    const g = getGallery();
    g.photos.push({ url, title: document.getElementById('gm-photo-title').value, type: 'photo', addedAt: new Date().toISOString() });
    saveGallery(g);
    showToast('ছবি যোগ হয়েছে।');
    renderPage('gallery-mgmt');
}

function addGalleryVideo() {
    const ytId = document.getElementById('gm-yt-id').value.trim();
    if (!ytId) { showToast('Video ID দিন।', 'error'); return; }
    const g = getGallery();
    g.videos.push({ ytId, title: document.getElementById('gm-yt-title').value, type: 'video', addedAt: new Date().toISOString() });
    saveGallery(g);
    showToast('ভিডিও যোগ হয়েছে।');
    renderPage('gallery-mgmt');
}

function addGalleryEvent() {
    const title = document.getElementById('gm-ev-title').value.trim();
    if (!title) { showToast('নাম দিন।', 'error'); return; }
    const g = getGallery();
    if (!g.events) g.events = [];
    g.events.push({ title, date: document.getElementById('gm-ev-date').value, desc: document.getElementById('gm-ev-desc').value, addedAt: new Date().toISOString() });
    saveGallery(g);
    showToast('ইভেন্ট যোগ হয়েছে।');
    renderPage('gallery-mgmt');
}

function removeGalleryItem(type, idx) {
    const g = getGallery();
    g[type].splice(idx, 1);
    saveGallery(g);
    showToast('মুছে গেছে।');
    renderPage('gallery-mgmt');
}

// ════ TIMELINE MANAGEMENT ════
function renderTimelineMgmt(el) {
    const posts = getPosts().sort((a, b) => new Date(b.date) - new Date(a.date));
    el.innerHTML = `
    <div class="card">
      <div class="card-title">📅 টাইমলাইন পোস্ট ব্যবস্থাপনা</div>
      <div class="form-group"><label>পোস্ট লিখুন</label><textarea class="form-textarea" id="tl-text" rows="3" placeholder="নতুন পোস্ট..."></textarea></div>
      <div class="form-group"><label>ছবির URL (ঐচ্ছিক)</label><input class="form-input" id="tl-img" placeholder="https://..."></div>
      <button class="btn-primary" onclick="publishTimelinePost()">📤 প্রকাশ করুন</button>
    </div>
    <div class="card">
      <div class="card-title">পোস্ট তালিকা (${posts.length})</div>
      ${posts.map(p => `<div style="border-bottom:1px solid var(--border);padding:12px 0;display:flex;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-size:12px;color:rgba(255,255,255,0.8);">${(p.text || '').substring(0, 100)}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:4px;">${fmtDate(p.date)}</div>
        </div>
        <button class="btn-sm btn-danger" onclick="deletePost('${p.id}')">🗑️</button>
      </div>`).join('') || '<p style="color:rgba(255,255,255,0.3);font-size:12px;">কোনো পোস্ট নেই।</p>'}
    </div>`;
}

function publishTimelinePost() {
    const text = document.getElementById('tl-text').value.trim();
    if (!text) { showToast('পোস্ট লিখুন।', 'error'); return; }
    const posts = getPosts();
    posts.unshift({ id: 'post-' + Date.now(), text, imgUrl: document.getElementById('tl-img').value.trim(), type: 'manual', date: new Date().toISOString(), reactions: [], comments: [] });
    savePosts(posts);
    showToast('পোস্ট প্রকাশিত হয়েছে।');
    renderPage('timeline-mgmt');
}

function deletePost(id) {
    showConfirm('পোস্ট মুছুন', 'এই পোস্ট মুছে ফেলবেন?', () => {
        const posts = getPosts().filter(p => p.id !== id);
        savePosts(posts);
        showToast('মুছে গেছে।');
        renderPage('timeline-mgmt');
    });
}

// ════ WEBSITE CONTENT ════
function renderWebsiteContent(el) {
    el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
      ${[
        { icon: '📢', title: 'নোটিশ', page: 'economy-calendar' },
        { icon: '🖼️', title: 'গ্যালারি', page: 'gallery-mgmt' },
        { icon: '📅', title: 'টাইমলাইন', page: 'timeline-mgmt' },
        { icon: '⭐', title: 'রিভিউ', page: 'reviews' },
        { icon: '📦', title: 'পণ্য', page: 'products' },
        { icon: '🏢', title: 'সাংগঠনিক তথ্য', page: 'site-info' },
        { icon: '🏛️', title: 'কমিটি', page: 'committee-running' },
        { icon: '👥', title: 'সদস্য প্রোফাইল', page: 'member-list' },
      ].map(item => `<div class="card" style="cursor:pointer;text-align:center;" onclick="gotoPage('${item.page}')">
        <div style="font-size:32px;margin-bottom:8px;">${item.icon}</div>
        <div style="font-size:14px;color:var(--gold-light);">${item.title}</div>
      </div>`).join('')}
    </div>`;
}
