// C: \Project\Barakah_Finance\admin\js\shop_admin.js

// ═══ DB ═══
const A = {
    get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    genID: (p = 'X') => p + '-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 5).toUpperCase(),
};

const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Samsung Galaxy A15', category: 'মোবাইল', price: 18000, emoji: '📱', description: '৬.৫ ইঞ্চি AMOLED ডিসপ্লে, ৫০০০mAh ব্যাটারি, ১২৮GB।', inStock: true, featured: true, images: [] },
    { id: 'p2', name: 'Walton রেফ্রিজারেটর ২৫০L', category: 'ইলেকট্রনিক্স', price: 35000, emoji: '🧊', description: 'ডাবল ডোর, বিদ্যুৎ সাশ্রয়ী A++ রেটিং।', inStock: true, featured: true, images: [] },
    { id: 'p3', name: 'Hero Splendor Plus', category: 'মোটরযান', price: 125000, emoji: '🏍️', description: '১০০cc ইঞ্জিন, ৮০+ কিমি মাইলেজ।', inStock: false, featured: false, images: [] },
    { id: 'p4', name: 'Singer সেলাই মেশিন', category: 'গৃহস্থালি', price: 12000, emoji: '🧵', description: 'ইলেকট্রিক, ১৫ প্যাটার্ন।', inStock: true, featured: true, images: [] },
    { id: 'p5', name: 'HP Laptop 15s i3', category: 'কম্পিউটার', price: 55000, emoji: '💻', description: 'Core i3, 8GB RAM, 512GB SSD.', inStock: true, featured: false, images: [] },
    { id: 'p6', name: 'Rangs 43" Smart TV', category: 'ইলেকট্রনিক্স', price: 32000, emoji: '📺', description: '4K UHD, Android Smart, WiFi.', inStock: true, featured: false, images: [] },
];

const DEFAULT_BADGES = [
    { id: 'b1', key: 'members', label: 'মোট সদস্য', icon: '👥', show: true, clickable: true },
    { id: 'b2', key: 'savings', label: 'মোট সঞ্চয়', icon: '💰', show: true, clickable: true },
    { id: 'b3', key: 'loans', label: 'করজে হাসানা', icon: '🤝', show: true, clickable: true },
    { id: 'b4', key: 'services', label: 'আমাদের সেবা', icon: '🌟', show: true, clickable: true },
];

const DEFAULT_NOTICES = [
    { id: 'n1', text: '🌙 বারাকাহ ফাইন্যান্সে আপনাকে স্বাগতম! সুদমুক্ত লেনদেনে সমৃদ্ধি সবার।', style: 'bold', color: '#F5D061', active: true },
    { id: 'n2', text: '📢 নতুন সদস্যদের জন্য বিশেষ সুবিধা: আবেদন ফি মাত্র ১০০ টাকা!', style: 'normal', color: '#fff', active: true },
    { id: 'n3', text: '💰 করজে হাসানা: আপদকালীন প্রয়োজনে বিনা সুদে সর্বোচ্চ ১৫,০০০ টাকা।', style: 'italic', color: '#a7f3d0', active: true },
];

function getProducts() { return A.get('bf_products') || DEFAULT_PRODUCTS; }
function saveProducts(arr) { A.set('bf_products', arr); }
function getOrders() { return A.get('bf_orders') || []; }
function saveOrders(arr) { A.set('bf_orders', arr); }
function getBadges() { return A.get('bf_badges') || DEFAULT_BADGES; }
function saveBadges(arr) { A.set('bf_badges', arr); }
function getNotices() { return A.get('bf_notices') || DEFAULT_NOTICES; }
function saveNotices(arr) { A.set('bf_notices', arr); }

// ═══ TABS ═══
function switchTab(name, btn) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    btn.classList.add('active');
    if (name === 'products') renderProductTable();
    if (name === 'orders') renderOrderTable();
    if (name === 'badges') renderBadgeTable();
    if (name === 'notices') renderNoticeTable();
}

// ═══ STATS ═══
function updateStats() {
    document.getElementById('stat-products').textContent = getProducts().length;
    document.getElementById('stat-orders').textContent = getOrders().length;
    document.getElementById('stat-badges').textContent = getBadges().length;
    document.getElementById('stat-notices').textContent = getNotices().length;
}

// ═══ EMI CALC ═══
function calcEmi(price) {
    const total = Math.round(price * 1.10);
    const perInstall = Math.round(total / 6);
    return { total, perInstall, profit: Math.round(price * 0.10) };
}
function fmtBn(n) { return '৳' + Number(n).toLocaleString('bn'); }

// ═══ PRODUCTS ═══
function renderProductTable() {
    const search = (document.getElementById('pSearch')?.value || '').toLowerCase();
    let products = getProducts().filter(p =>
        !search || p.name.toLowerCase().includes(search) || (p.category || '').toLowerCase().includes(search)
    );
    const tb = document.getElementById('productTableBody');
    if (!products.length) { tb.innerHTML = '<tr><td colspan="8" class="text-center text-gray-500 py-6">কোনো পণ্য নেই</td></tr>'; return; }
    tb.innerHTML = products.map(p => {
        const emi = calcEmi(p.price);
        return `<tr>
        <td class="text-xl">${p.emoji || '📦'}</td>
        <td class="font-semibold">${p.name}</td>
        <td><span class="tag" style="background:rgba(6,95,70,0.3);color:#a7f3d0;">${p.category || '—'}</span></td>
        <td>${fmtBn(p.price)}</td>
        <td class="text-yellow-400">${fmtBn(emi.perInstall)}</td>
        <td><span class="tag ${p.inStock ? 'tag-ok' : 'tag-no'}">${p.inStock ? '✅ আছে' : '❌ নেই'}</span></td>
        <td>${p.featured ? '<span class="tag tag-feat">⭐ হ্যাঁ</span>' : '<span style="color:#666;">না</span>'}</td>
        <td>
            <div class="flex gap-1">
                <button onclick="editProduct('${p.id}')" class="btn-y text-xs py-1 px-2">✏️ সম্পাদনা</button>
                <button onclick="deleteProduct('${p.id}')" class="btn-r text-xs py-1 px-2">🗑️</button>
                <button onclick="toggleStock('${p.id}')" class="btn-g text-xs py-1 px-2">${p.inStock ? 'স্টক বন্ধ' : 'স্টক চালু'}</button>
            </div>
        </td>
    </tr>`;
    }).join('');
}

let productModal_editing = false;
function openProductModal(id = null) {
    productModal_editing = !!id;
    document.getElementById('productModalTitle').textContent = id ? 'পণ্য সম্পাদনা' : 'নতুন পণ্য যোগ করুন';
    if (id) {
        const p = getProducts().find(x => x.id === id);
        if (!p) return;
        document.getElementById('p-name').value = p.name;
        document.getElementById('p-cat').value = p.category || '';
        document.getElementById('p-price').value = p.price;
        document.getElementById('p-emoji').value = p.emoji || '';
        document.getElementById('p-desc').value = p.description || '';
        document.getElementById('p-images').value = (p.images || []).join(', ');
        document.getElementById('p-instock').checked = !!p.inStock;
        document.getElementById('p-featured').checked = !!p.featured;
        document.getElementById('p-edit-id').value = id;
        previewEmi();
    } else {
        ['p-name', 'p-cat', 'p-emoji', 'p-desc', 'p-images'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('p-price').value = '';
        document.getElementById('p-instock').checked = true;
        document.getElementById('p-featured').checked = false;
        document.getElementById('p-edit-id').value = '';
        document.getElementById('emiPreview').classList.add('hidden');
    }
    document.getElementById('productModal').classList.remove('hidden');
}
function closeProductModal() { document.getElementById('productModal').classList.add('hidden'); }

function previewEmi() {
    const price = parseFloat(document.getElementById('p-price').value) || 0;
    if (!price) { document.getElementById('emiPreview').classList.add('hidden'); return; }
    const { total, perInstall, profit } = calcEmi(price);
    document.getElementById('emiPreviewRows').innerHTML = `
    <div style="display:flex;justify-content:space-between;"><span>মূল মূল্য:</span><span>${fmtBn(price)}</span></div>
    <div style="display:flex;justify-content:space-between;"><span>লাভ (১০%):</span><span>${fmtBn(profit)}</span></div>
    <div style="display:flex;justify-content:space-between;font-weight:700;color:#F5D061;"><span>মোট:</span><span>${fmtBn(total)}</span></div>
    <div style="display:flex;justify-content:space-between;"><span>প্রতি কিস্তি (৬টি):</span><span>${fmtBn(perInstall)}</span></div>
    `;
    document.getElementById('emiPreview').classList.remove('hidden');
}

function saveProduct() {
    const name = document.getElementById('p-name').value.trim();
    const cat = document.getElementById('p-cat').value.trim();
    const price = parseFloat(document.getElementById('p-price').value);
    if (!name || !cat || !price) { toast('নাম, ক্যাটাগরি ও মূল্য পূরণ করুন।', '#e53e3e'); return; }

    const products = getProducts();
    const editId = document.getElementById('p-edit-id').value;
    const images = document.getElementById('p-images').value.split(',').map(s => s.trim()).filter(Boolean);

    const product = {
        id: editId || A.genID('P'),
        name, category: cat, price,
        emoji: document.getElementById('p-emoji').value.trim() || '📦',
        description: document.getElementById('p-desc').value.trim(),
        images, inStock: document.getElementById('p-instock').checked,
        featured: document.getElementById('p-featured').checked,
    };

    if (editId) {
        const idx = products.findIndex(p => p.id === editId);
        if (idx >= 0) products[idx] = product;
    } else {
        products.push(product);
    }

    saveProducts(products);
    closeProductModal();
    renderProductTable();
    updateStats();
    toast(editId ? 'পণ্য আপডেট হয়েছে ✅' : 'নতুন পণ্য যোগ হয়েছে ✅');
}

function editProduct(id) { openProductModal(id); }

function deleteProduct(id) {
    if (!confirm('এই পণ্যটি মুছে দেবেন?')) return;
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderProductTable();
    updateStats();
    toast('পণ্য মুছে দেওয়া হয়েছে।', '#e53e3e');
}

function toggleStock(id) {
    const products = getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx >= 0) products[idx].inStock = !products[idx].inStock;
    saveProducts(products);
    renderProductTable();
    toast('স্টক অবস্থা আপডেট হয়েছে।');
}

// ═══ ORDERS ═══
let orderFilter = 'all', selectedOrderId = null;

function setOrderFilter(f, btn) {
    orderFilter = f;
    document.querySelectorAll('#tab-orders .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrderTable();
}

function renderOrderTable() {
    let orders = getOrders();
    if (orderFilter !== 'all') orders = orders.filter(o => o.status === orderFilter);
    const tb = document.getElementById('orderTableBody');
    if (!orders.length) { tb.innerHTML = '<tr><td colspan="8" class="text-center text-gray-500 py-6">কোনো অর্ডার নেই</td></tr>'; return; }

    tb.innerHTML = orders.slice().reverse().map(o => {
        const statusMap = { pending: 'tag-pend', approved: 'tag-ok', rejected: 'tag-no', processing: 'tag-feat', delivered: 'tag-ok' };
        const statusLabel = { pending: 'পেন্ডিং', approved: 'অনুমোদিত', rejected: 'বাতিল', processing: 'প্রসেসিং', delivered: 'বিতরিত' };
        const date = o.submittedAt ? new Date(o.submittedAt).toLocaleDateString('bn-BD') : '—';
        return `<tr>
        <td class="font-mono text-xs text-yellow-300">${o.id}</td>
        <td class="font-semibold text-xs">${o.productName || '—'}</td>
        <td>${o.customerName || '—'}</td>
        <td class="text-xs">${o.customerPhone || '—'}</td>
        <td>${fmtBn(o.totalPayable || 0)}</td>
        <td class="text-xs">${date}</td>
        <td><span class="tag ${statusMap[o.status] || 'tag-pend'}">${statusLabel[o.status] || o.status}</span></td>
        <td><button onclick="openOrderDetail('${o.id}')" class="btn-g text-xs py-1 px-2">বিস্তারিত</button></td>
    </tr>`;
    }).join('');
}

function openOrderDetail(id) {
    selectedOrderId = id;
    const o = getOrders().find(x => x.id === id);
    if (!o) return;
    const emi = calcEmi(o.price || 0);
    document.getElementById('statusStepSel').value = o.statusStep || 0;
    document.getElementById('orderDetailContent').innerHTML = `
    <div class="grid grid-cols-2 gap-2 text-xs mb-4">
        <div><span class="text-emerald-400">অর্ডার আইডি:</span><br /><strong class="text-yellow-300">${o.id}</strong></div>
        <div><span class="text-emerald-400">তারিখ:</span><br />${o.submittedAt ? new Date(o.submittedAt).toLocaleDateString('bn-BD') : '—'}</div>
        <div><span class="text-emerald-400">পণ্য:</span><br />${o.productName || '—'}</div>
        <div><span class="text-emerald-400">মূল্য:</span><br />${fmtBn(o.price || 0)}</div>
        <div><span class="text-emerald-400">মোট পরিশোধযোগ্য:</span><br />${fmtBn(o.totalPayable || emi.total)}</div>
        <div><span class="text-emerald-400">প্রতি কিস্তি:</span><br />${fmtBn(o.perInstall || emi.perInstall)} × ৬</div>
    </div>
    <div class="bg-black/20 rounded-lg p-3 text-xs mb-3">
        <p class="text-emerald-400 font-bold mb-1">গ্রাহকের তথ্য</p>
        <div class="grid grid-cols-2 gap-1">
            <div><span class="text-emerald-500">নাম:</span> ${o.customerName || '—'}</div>
            <div><span class="text-emerald-500">মোবাইল:</span> ${o.customerPhone || '—'}</div>
            <div><span class="text-emerald-500">NID:</span> ${o.nid || '—'}</div>
            <div><span class="text-emerald-500">ঠিকানা:</span> ${o.address || '—'}</div>
            <div class="col-span-2"><span class="text-emerald-500">স্বাক্ষী:</span> ${o.witness || '—'}</div>
            <div class="col-span-2"><span class="text-emerald-500">মন্তব্য:</span> ${o.note || '—'}</div>
        </div>
    </div>
    `;
    document.getElementById('orderDetailModal').classList.remove('hidden');
}

function updateOrderStatus(status) {
    if (!selectedOrderId) return;
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === selectedOrderId);
    if (idx >= 0) {
        orders[idx].status = status;
        if (status === 'approved') orders[idx].statusStep = 2;
        if (status === 'rejected') orders[idx].statusStep = 0;
        if (status === 'processing') orders[idx].statusStep = 3;
    }
    saveOrders(orders);
    document.getElementById('orderDetailModal').classList.add('hidden');
    renderOrderTable();
    toast('অর্ডার অবস্থা আপডেট হয়েছে: ' + status);
}

function saveStatusStep() {
    if (!selectedOrderId) return;
    const step = parseInt(document.getElementById('statusStepSel').value);
    const orders = getOrders();
    const idx = orders.findIndex(o => o.id === selectedOrderId);
    if (idx >= 0) orders[idx].statusStep = step;
    saveOrders(orders);
    document.getElementById('orderDetailModal').classList.add('hidden');
    renderOrderTable();
    toast('ধাপ আপডেট হয়েছে: ' + step);
}

// ═══ BADGES ═══
function renderBadgeTable() {
    const badges = getBadges();
    const tb = document.getElementById('badgeTableBody');
    if (!badges.length) { tb.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500 py-6">কোনো ব্যাজ নেই</td></tr>'; return; }
    tb.innerHTML = badges.map(b => `<tr>
        <td class="text-2xl">${b.icon || '🏅'}</td>
        <td class="font-semibold">${b.label || '—'}</td>
        <td><code class="text-yellow-300 text-xs">${b.key}</code></td>
        <td><span class="tag ${b.show ? 'tag-ok' : 'tag-no'}">${b.show ? '✅ হ্যাঁ' : '❌ না'}</span></td>
        <td><span class="tag ${b.clickable ? 'tag-feat' : ''}"> ${b.clickable ? '✅ হ্যাঁ' : 'না'}</span></td>
        <td>
            <div class="flex gap-1">
                <button onclick="editBadge('${b.id}')" class="btn-y text-xs py-1 px-2">✏️</button>
                <button onclick="toggleBadgeShow('${b.id}')" class="btn-g text-xs py-1 px-2">${b.show ? 'লুকান' : 'দেখান'}</button>
                <button onclick="deleteBadge('${b.id}')" class="btn-r text-xs py-1 px-2">🗑️</button>
            </div>
        </td>
    </tr>`).join('');
}

function openBadgeModal(id = null) {
    document.getElementById('badgeModalTitle').textContent = id ? 'ব্যাজ সম্পাদনা' : 'নতুন ব্যাজ যোগ করুন';
    if (id) {
        const b = getBadges().find(x => x.id === id);
        if (!b) return;
        document.getElementById('b-icon').value = b.icon || '';
        document.getElementById('b-label').value = b.label || '';
        document.getElementById('b-key').value = b.key || 'members';
        document.getElementById('b-custom-val').value = b.customVal || '';
        document.getElementById('b-show').checked = !!b.show;
        document.getElementById('b-clickable').checked = !!b.clickable;
        document.getElementById('b-edit-id').value = id;
    } else {
        ['b-icon', 'b-label', 'b-custom-val'].forEach(i => document.getElementById(i).value = '');
        document.getElementById('b-key').value = 'members';
        document.getElementById('b-show').checked = true;
        document.getElementById('b-clickable').checked = true;
        document.getElementById('b-edit-id').value = '';
    }
    document.getElementById('badgeModal').classList.remove('hidden');
}
function closeBadgeModal() { document.getElementById('badgeModal').classList.add('hidden'); }

function saveBadge() {
    const icon = document.getElementById('b-icon').value.trim();
    const label = document.getElementById('b-label').value.trim();
    const key = document.getElementById('b-key').value;
    if (!label) { toast('নাম/লেবেল দিন।', '#e53e3e'); return; }
    const badges = getBadges();
    const editId = document.getElementById('b-edit-id').value;
    const badge = {
        id: editId || A.genID('B'), icon, label, key,
        customVal: document.getElementById('b-custom-val').value.trim(),
        show: document.getElementById('b-show').checked,
        clickable: document.getElementById('b-clickable').checked,
    };
    if (editId) { const idx = badges.findIndex(b => b.id === editId); if (idx >= 0) badges[idx] = badge; }
    else badges.push(badge);
    saveBadges(badges);
    closeBadgeModal();
    renderBadgeTable();
    updateStats();
    toast('ব্যাজ সংরক্ষিত ✅');
}

function editBadge(id) { openBadgeModal(id); }
function deleteBadge(id) {
    if (!confirm('এই ব্যাজটি মুছবেন?')) return;
    saveBadges(getBadges().filter(b => b.id !== id));
    renderBadgeTable(); updateStats(); toast('ব্যাজ মুছে দেওয়া হয়েছে।', '#e53e3e');
}
function toggleBadgeShow(id) {
    const badges = getBadges();
    const idx = badges.findIndex(b => b.id === id);
    if (idx >= 0) badges[idx].show = !badges[idx].show;
    saveBadges(badges); renderBadgeTable(); toast('ব্যাজ দৃশ্যমানতা আপডেট হয়েছে।');
}

// ═══ NOTICES ═══
function renderNoticeTable() {
    const notices = getNotices();
    const tb = document.getElementById('noticeTableBody');
    if (!notices.length) { tb.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-6">কোনো নোটিশ নেই</td></tr>'; return; }
    tb.innerHTML = notices.map(n => `<tr>
        <td style="max-width:300px;"><span style="${getNoticeStyle(n)};color:${n.color || '#fff'};">${n.text}</span></td>
        <td><span class="tag" style="background:rgba(100,100,100,0.3);color:#ccc;">${{ bold: 'মোটা', italic: 'বাঁকা', normal: 'সাধারণ', 'bold-italic': 'মোটা+বাঁকা' }[n.style] || n.style}</span></td>
        <td><span style="background:${n.color || '#fff'};width:20px;height:20px;border-radius:50%;display:inline-block;border:1px solid #333;"></span> <code class="text-xs text-gray-400">${n.color || '—'}</code></td>
        <td><span class="tag ${n.active ? 'tag-ok' : 'tag-no'}">${n.active ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}</span></td>
        <td>
            <div class="flex gap-1">
                <button onclick="editNotice('${n.id}')" class="btn-y text-xs py-1 px-2">✏️</button>
                <button onclick="toggleNotice('${n.id}')" class="btn-g text-xs py-1 px-2">${n.active ? 'বন্ধ' : 'চালু'}</button>
                <button onclick="deleteNotice('${n.id}')" class="btn-r text-xs py-1 px-2">🗑️</button>
            </div>
        </td>
    </tr>`).join('');
}

function getNoticeStyle(n) {
    const styles = { bold: 'font-weight:700', italic: 'font-style:italic', 'bold-italic': 'font-weight:700;font-style:italic', normal: '' };
    return styles[n.style] || '';
}

function openNoticeModal(id = null) {
    document.getElementById('noticeModalTitle').textContent = id ? 'নোটিশ সম্পাদনা' : 'নতুন নোটিশ যোগ করুন';
    if (id) {
        const n = getNotices().find(x => x.id === id);
        if (!n) return;
        document.getElementById('n-text').value = n.text || '';
        document.getElementById('n-style').value = n.style || 'normal';
        document.getElementById('n-color').value = n.color || '#ffffff';
        document.getElementById('n-color-hex').value = n.color || '#ffffff';
        document.getElementById('n-active').checked = !!n.active;
        document.getElementById('n-edit-id').value = id;
    } else {
        document.getElementById('n-text').value = '';
        document.getElementById('n-style').value = 'normal';
        document.getElementById('n-color').value = '#ffffff';
        document.getElementById('n-color-hex').value = '#ffffff';
        document.getElementById('n-active').checked = true;
        document.getElementById('n-edit-id').value = '';
    }
    updateNoticePreview();
    document.getElementById('noticeModal').classList.remove('hidden');
}
function closeNoticeModal() { document.getElementById('noticeModal').classList.add('hidden'); }

function updateNoticePreview() {
    const text = document.getElementById('n-text').value || 'পূর্বদর্শন...';
    const color = document.getElementById('n-color').value;
    const style = document.getElementById('n-style').value;
    const styleMap = { bold: 'font-weight:700', italic: 'font-style:italic', 'bold-italic': 'font-weight:700;font-style:italic', normal: '' };
    document.getElementById('n-preview').style.cssText = `color:${color};${styleMap[style] || ''};font-size:13px;font-family:'Noto Serif Bengali',serif;`;
    document.getElementById('n-preview').textContent = text;
}
document.addEventListener('input', e => {
    if (['n-text', 'n-style', 'n-color', 'n-color-hex'].includes(e.target?.id)) updateNoticePreview();
});
function syncColor() {
    const hex = document.getElementById('n-color-hex').value;
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) document.getElementById('n-color').value = hex;
}
function setColor(hex) {
    document.getElementById('n-color').value = hex;
    document.getElementById('n-color-hex').value = hex;
    updateNoticePreview();
}
// sync color picker to hex input
document.addEventListener('change', e => {
    if (e.target?.id === 'n-color') { document.getElementById('n-color-hex').value = e.target.value; updateNoticePreview(); }
});

function saveNotice() {
    const text = document.getElementById('n-text').value.trim();
    if (!text) { toast('নোটিশ টেক্সট লিখুন।', '#e53e3e'); return; }
    const notices = getNotices();
    const editId = document.getElementById('n-edit-id').value;
    const notice = {
        id: editId || A.genID('N'),
        text, style: document.getElementById('n-style').value,
        color: document.getElementById('n-color').value,
        active: document.getElementById('n-active').checked,
    };
    if (editId) { const idx = notices.findIndex(n => n.id === editId); if (idx >= 0) notices[idx] = notice; }
    else notices.push(notice);
    saveNotices(notices);
    closeNoticeModal();
    renderNoticeTable();
    updateStats();
    toast('নোটিশ সংরক্ষিত ✅');
}

function editNotice(id) { openNoticeModal(id); }
function deleteNotice(id) {
    if (!confirm('এই নোটিশটি মুছবেন?')) return;
    saveNotices(getNotices().filter(n => n.id !== id));
    renderNoticeTable(); updateStats(); toast('নোটিশ মুছে দেওয়া হয়েছে।', '#e53e3e');
}
function toggleNotice(id) {
    const notices = getNotices();
    const idx = notices.findIndex(n => n.id === id);
    if (idx >= 0) notices[idx].active = !notices[idx].active;
    saveNotices(notices); renderNoticeTable(); toast('নোটিশ অবস্থা আপডেট হয়েছে।');
}

// ═══ TOAST ═══
function toast(msg, color = '#065F46') {
    const ex = document.querySelector('.toast'); if (ex) ex.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.style.background = color; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    renderProductTable();
});