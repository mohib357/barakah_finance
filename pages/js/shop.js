// C: \Project\Barakah_Finance\pages\js\shop.js

// ═══ DB helpers (same pattern as main db.js) ═══
const ShopDB = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),

    getProducts() {
        return this.get('bf_products') || DEFAULT_PRODUCTS;
    },
    getOrders() { return this.get('bf_orders') || []; },
    addOrder(o) {
        const arr = this.getOrders();
        arr.push(o);
        this.set('bf_orders', arr);
        return o;
    },
    getSession() { return this.get('bf_session'); },
};

// ═══ DEFAULT PRODUCTS (fallback if admin hasn't set any) ═══
const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Samsung Galaxy A15', category: 'মোবাইল', price: 18000, images: [], emoji: '📱', description: '৬.৫ ইঞ্চি Super AMOLED ডিসপ্লে, ৫০০০ mAh ব্যাটারি, ৫০MP ট্রিপল ক্যামেরা, ১২৮GB স্টোরেজ। দৈনন্দিন ব্যবহারের জন্য আদর্শ।', inStock: true, featured: true },
    { id: 'p2', name: 'Walton রেফ্রিজারেটর ২৫০L', category: 'ইলেকট্রনিক্স', price: 35000, images: [], emoji: '🧊', description: 'ওয়ালটন ২৫০ লিটার ডাবল ডোর রেফ্রিজারেটর। বিদ্যুৎ সাশ্রয়ী A++ রেটিং। ১০ বছরের কম্প্রেসার ওয়ারেন্টি।', inStock: true, featured: true },
    { id: 'p3', name: 'Hero Splendor Plus মোটরসাইকেল', category: 'মোটরযান', price: 125000, images: [], emoji: '🏍️', description: 'হিরো স্প্লেন্ডার প্লাস — জ্বালানি সাশ্রয়ী ১০০cc ইঞ্জিন। মাইলেজ ৮০+ কিমি/লিটার। বিশ্বস্ত ব্র্যান্ড।', inStock: false, featured: false },
    { id: 'p4', name: 'Singer ইলেকট্রিক সেলাই মেশিন', category: 'গৃহস্থালি', price: 12000, images: [], emoji: '🧵', description: 'সিঙ্গার ইলেকট্রিক সেলাই মেশিন। গৃহিণীদের জন্য আদর্শ। ১৫ প্যাটার্ন সেলাই সুবিধা। সহজে পরিচালনযোগ্য।', inStock: true, featured: true },
    { id: 'p5', name: 'HP Laptop 15s Core i3', category: 'কম্পিউটার', price: 55000, images: [], emoji: '💻', description: 'HP 15s Intel Core i3 12th Gen, ৮GB RAM, ৫১২GB SSD, ১৫.৬" FHD ডিসপ্লে। ছাত্রছাত্রী ও পেশাদারদের জন্য।', inStock: true, featured: false },
    { id: 'p6', name: 'Rangs টেলিভিশন ৪৩"', category: 'ইলেকট্রনিক্স', price: 32000, images: [], emoji: '📺', description: 'Rangs 43 ইঞ্চি Android Smart TV। 4K UHD ডিসপ্লে, বিল্টইন WiFi, YouTube, Netflix সাপোর্ট।', inStock: true, featured: false },
];

// ═══ STATE ═══
let currentFilter = 'all';
let selectedProduct = null;
let cart = JSON.parse(localStorage.getItem('bf_cart') || '[]');

// ═══ CALC EMI ═══
function calcEmi(price) {
    const total = price * 1.10;
    const perInstall = total / 6;
    const profit = price * 0.10;
    return { total: Math.round(total), perInstall: Math.round(perInstall), profit: Math.round(profit), down: Math.round(perInstall) };
}
function fmtBn(n) {
    return '৳' + Number(n).toLocaleString('bn');
}
function bnNum(n) {
    return String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}

// ═══ RENDER PRODUCTS ═══
function renderProducts() {
    const products = ShopDB.getProducts();
    const search = document.getElementById('searchInput').value.trim().toLowerCase();
    const sort = document.getElementById('sortSel').value;

    let filtered = products.filter(p => {
        const matchCat = currentFilter === 'all' || p.category === currentFilter;
        const matchSearch = !search || p.name.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search) || (p.category || '').includes(search);
        return matchCat && matchSearch;
    });

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name, 'bn'));
    else filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    document.getElementById('productCount').textContent = `মোট ${bnNum(filtered.length)} টি পণ্য`;

    const grid = document.getElementById('productsGrid');
    if (!filtered.length) {
        grid.innerHTML = '<div class="no-products" style="grid-column:1/-1"><div class="icon">📦</div><p>কোনো পণ্য পাওয়া যায়নি।</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const emi = calcEmi(p.price);
        const imgSrc = (p.images && p.images[0]) ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />` : '';
        const emoji = p.emoji || '📦';
        return `
    <div class="product-card">
        <div class="product-img-wrap">
            ${imgSrc}
            ${!imgSrc ? `<span class="product-img-placeholder">${emoji}</span>` : ''}
            <span class="${p.inStock ? 'stock-badge in-stock' : 'stock-badge out-stock'}">${p.inStock ? '✅ আছে' : '❌ নেই'}</span>
            ${p.featured ? '<span class="featured-badge">⭐ ফিচার্ড</span>' : ''}
        </div>
        <div class="product-body">
            <div class="product-cat">${p.category || 'পণ্য'}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-desc">${p.description || ''}</div>
            <div class="price-block">
                <div class="price-main">${fmtBn(p.price)}</div>
                <div class="price-emi">কিস্তি: <span>${fmtBn(emi.perInstall)} × ৬</span> (১০% লাভ)</div>
            </div>
            <div class="product-actions">
                <button class="btn-detail" onclick="openDetail('${p.id}')">বিস্তারিত</button>
                <button class="btn-order" onclick="openOrder('${p.id}')" ${!p.inStock ? 'disabled' : ''}>
                    ${p.inStock ? '🛒 অর্ডার' : 'স্টকে নেই'}
                </button>
            </div>
        </div>
    </div>`;
    }).join('');
}

// ═══ CATEGORIES ═══
function renderCategories() {
    const products = ShopDB.getProducts();
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    const div = document.getElementById('catFilters');
    div.innerHTML = cats.map(c => `<button class="fcat" onclick="setFilter('${c}',this)">${c}</button>`).join('');
}

function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.fcat').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
}

// ═══ DETAIL MODAL ═══
function openDetail(id) {
    const products = ShopDB.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;
    selectedProduct = p;
    const emi = calcEmi(p.price);

    // Image
    const mainBox = document.getElementById('mainImgBox');
    document.getElementById('mainImgEmoji').textContent = p.emoji || '📦';
    const thumbRow = document.getElementById('thumbRow');
    thumbRow.innerHTML = '';
    if (p.images && p.images.length) {
        mainBox.innerHTML = `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=font-size:4rem>${p.emoji ||\"📦\"}</span>'" /> `;
p.images.forEach((img, i) => {
    thumbRow.innerHTML += `< img src = "${img}" class="thumb ${i === 0 ? 'active' : ''}" onclick = "setMainImg('${img}',this)" onerror = "this.style.display='none'" /> `;
});
  }

document.getElementById('detailCat').textContent = p.category || '';
document.getElementById('detailName').textContent = p.name;
document.getElementById('detailPrice').textContent = fmtBn(p.price);
document.getElementById('detailDesc').textContent = p.description || '';
document.getElementById('detailStock').innerHTML = p.inStock ? '<span style="color:#065F46;font-weight:700;">✅ স্টকে আছে</span>' : '<span style="color:#dc2626;font-weight:700;">❌ স্টকে নেই</span>';
document.getElementById('detailOrderBtn').disabled = !p.inStock;

document.getElementById('emiBreakdown').innerHTML = `
            < div class="emi-row" ><span>পণ্যের মূল্য</span><span>${fmtBn(p.price)}</span></div >
    <div class="emi-row"><span>১০% লাভ</span><span>${fmtBn(emi.profit)}</span></div>
    <div class="emi-row"><span>মোট পরিশোধযোগ্য</span><span>${fmtBn(emi.total)}</span></div>
    <div class="emi-row"><span>১ম কিস্তি (ডাউন)</span><span>${fmtBn(emi.down)}</span></div>
    <div class="emi-row"><span>বাকি ৫ কিস্তি</span><span>${fmtBn(emi.perInstall)} × ৫</span></div>
        `;

document.getElementById('detailModal').classList.add('open');
}

function setMainImg(src, thumb) {
    const mainBox = document.getElementById('mainImgBox');
    mainBox.innerHTML = `< img src = "${src}" style = "width:100%;height:100%;object-fit:cover;" /> `;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

function closeDetail() {
    document.getElementById('detailModal').classList.remove('open');
}

function openOrderFromDetail() {
    closeDetail();
    if (selectedProduct) openOrder(selectedProduct.id);
}

// ═══ ORDER MODAL ═══
function openOrder(id) {
    const products = ShopDB.getProducts();
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (!p.inStock) { toast('এই পণ্যটি এখন স্টকে নেই।', '#e53e3e'); return; }
    selectedProduct = p;
    const emi = calcEmi(p.price);

    document.getElementById('orderSummary').innerHTML = `
            < div class="srow" ><span>পণ্য</span><span>${p.name}</span></div >
    <div class="srow"><span>বাজারমূল্য</span><span>${fmtBn(p.price)}</span></div>
    <div class="srow"><span>১০% লাভ</span><span>${fmtBn(emi.profit)}</span></div>
    <div class="srow"><span>মোট পরিশোধযোগ্য</span><span>${fmtBn(emi.total)}</span></div>
    <div class="srow"><span>প্রতি কিস্তি (৬ টি)</span><span>${fmtBn(emi.perInstall)} × ৬</span></div>
        `;

    // Pre-fill if logged in
    const session = ShopDB.getSession();
    if (session) {
        document.getElementById('ord-name').value = session.name || '';
        document.getElementById('ord-phone').value = session.phone || '';
        document.getElementById('ord-nid').value = session.memberID || '';
    }

    document.getElementById('orderAlert').classList.add('hidden');
    document.getElementById('orderModal').classList.add('open');
}

function closeOrder() {
    document.getElementById('orderModal').classList.remove('open');
}

function submitOrder() {
    const name = document.getElementById('ord-name').value.trim();
    const phone = document.getElementById('ord-phone').value.trim();
    const nid = document.getElementById('ord-nid').value.trim();
    const address = document.getElementById('ord-address').value.trim();
    const al = document.getElementById('orderAlert');

    if (!name || !phone || !nid || !address) {
        al.className = 'aalert aalert-err'; al.textContent = 'তারকা চিহ্নিত সকল তথ্য পূরণ করুন।'; al.classList.remove('hidden'); return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
        al.className = 'aalert aalert-err'; al.textContent = 'সঠিক মোবাইল নম্বর দিন।'; al.classList.remove('hidden'); return;
    }

    const emi = calcEmi(selectedProduct.price);
    const order = {
        id: 'ORD-' + Date.now().toString(36).toUpperCase(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        price: selectedProduct.price,
        totalPayable: emi.total,
        perInstall: emi.perInstall,
        customerName: name,
        customerPhone: phone,
        nid, address,
        witness: document.getElementById('ord-witness').value.trim(),
        note: document.getElementById('ord-note').value.trim(),
        status: 'pending',
        statusStep: 0,
        submittedAt: new Date().toISOString(),
    };

    ShopDB.addOrder(order);
    closeOrder();
    showMyOrder(order);
    toast(`✅ আবেদন জমা হয়েছে! আইডি: ${ order.id } `, '#065F46');

    // Clear form
    ['ord-name', 'ord-phone', 'ord-nid', 'ord-address', 'ord-witness', 'ord-note'].forEach(id => { document.getElementById(id).value = ''; });
}

// ═══ ORDER STATUS ═══
const ORDER_STEPS = ['আবেদন জমা', 'কমিটি পর্যালোচনা', 'অনুমোদন', 'পণ্য সংগ্রহ', 'বিতরণ', 'সম্পন্ন'];

function showMyOrder(order) {
    document.getElementById('myOrdersBar').classList.remove('hidden');
    document.getElementById('latestOrderInfo').innerHTML = `
            < strong > ${ order.productName }</strong > | আইডি: ${ order.id } | মূল্য: ${ fmtBn(order.price) } | অবস্থা: <span style="color:var(--gold);font-weight:700;">পেন্ডিং</span>
        `;
    const steps = document.getElementById('trackSteps');
    steps.innerHTML = ORDER_STEPS.map((s, i) => `
            < div class="track-step" >
      <div class="ts-dot ${i === order.statusStep ? 'current' : i < order.statusStep ? 'done' : ''}">${i < order.statusStep ? '✓' : i + 1}</div>
      <div class="ts-label">${s}</div>
    </div > `).join('');
}

function loadMyOrders() {
    const orders = ShopDB.getOrders();
    const session = ShopDB.getSession();
    if (!orders.length) return;
    const latest = session ? orders.filter(o => o.customerPhone === session.phone).slice(-1)[0] : orders.slice(-1)[0];
    if (latest) showMyOrder(latest);
}

// ═══ CART ═══
function toggleCart(e) {
    if (e) e.preventDefault();
    document.getElementById('cartSidebar').classList.toggle('open');
    renderCart();
}

function addToCart(productId) {
    const products = ShopDB.getProducts();
    const p = products.find(x => x.id === productId);
    if (!p || !p.inStock) return;
    const existing = cart.find(c => c.id === productId);
    if (existing) { toast('পণ্যটি ইতিমধ্যে কার্টে আছে।', '#C9A227'); return; }
    cart.push({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || '📦' });
    saveCart();
    updateCartCount();
    toast(`"${p.name}" কার্টে যোগ হয়েছে ✅`);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart();
    updateCartCount();
    renderCart();
}

function saveCart() { localStorage.setItem('bf_cart', JSON.stringify(cart)); }

function updateCartCount() {
    document.getElementById('cartCount').textContent = cart.length || '0';
}

function renderCart() {
    const el = document.getElementById('cartItems');
    if (!cart.length) {
        el.innerHTML = '<div class="empty-cart"><div class="icon">🛒</div><p>কার্ট খালি</p></div>';
        document.getElementById('cartTotal').textContent = '৳০';
        return;
    }
    let total = 0;
    el.innerHTML = cart.map(item => {
        total += item.price;
        return `< div class="cart-item" >
      <div class="cart-item-img">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmtBn(item.price)}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div > `;
    }).join('');
    document.getElementById('cartTotal').textContent = fmtBn(total);
}

function checkoutCart() {
    if (!cart.length) { toast('কার্ট খালি!', '#e53e3e'); return; }
    // Open order modal for first item or combined
    const products = ShopDB.getProducts();
    const first = products.find(p => p.id === cart[0].id);
    if (first) { toggleCart({ preventDefault: () => { } }); openOrder(first.id); }
}

// ═══ TOAST ═══
function toast(msg, color = '#065F46') {
    const ex = document.querySelector('.toast-msg');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'toast-msg'; t.style.background = color; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 3500);
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    renderProducts();
    updateCartCount();
    loadMyOrders();
});