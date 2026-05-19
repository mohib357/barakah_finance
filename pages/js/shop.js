// C: \Project\Barakah_Finance\pages\js\shop.js

// ═══ DB helpers ═══
const ShopDB = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
    set: function (k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    getProducts: function () { return this.get('bf_products') || DEFAULT_PRODUCTS; },
    getOrders: function () { return this.get('bf_orders') || []; },
    addOrder: function (o) { const arr = this.getOrders(); arr.push(o); this.set('bf_orders', arr); return o; },
    getSession: function () { return this.get('bf_session'); },
};

// ═══ DEFAULT PRODUCTS ═══
const DEFAULT_PRODUCTS = [
    { id: 'p1', name: 'Samsung Galaxy A15', category: 'মোবাইল', price: 18000, images: [], emoji: '📱', description: '৬.৫ ইঞ্চি Super AMOLED ডিসপ্লে, ৫০০০ mAh ব্যাটারি, ৫০MP ট্রিপল ক্যামেরা, ১২৮GB স্টোরেজ।', inStock: true, featured: true },
    { id: 'p2', name: 'Walton রেফ্রিজারেটর ২৫০L', category: 'ইলেকট্রনিক্স', price: 35000, images: [], emoji: '🧊', description: 'ওয়ালটন ২৫০ লিটার ডাবল ডোর রেফ্রিজারেটর। বিদ্যুৎ সাশ্রয়ী A++ রেটিং।', inStock: true, featured: true },
    { id: 'p3', name: 'Hero Splendor Plus মোটরসাইকেল', category: 'মোটরযান', price: 125000, images: [], emoji: '🏍️', description: 'হিরো স্প্লেন্ডার প্লাস — জ্বালানি সাশ্রয়ী ১০০cc ইঞ্জিন।', inStock: false, featured: false },
    { id: 'p4', name: 'Singer ইলেকট্রিক সেলাই মেশিন', category: 'গৃহস্থালি', price: 12000, images: [], emoji: '🧵', description: 'সিঙ্গার ইলেকট্রিক সেলাই মেশিন। ১৫ প্যাটার্ন সেলাই সুবিধা।', inStock: true, featured: true },
    { id: 'p5', name: 'HP Laptop 15s Core i3', category: 'কম্পিউটার', price: 55000, images: [], emoji: '💻', description: 'HP 15s Intel Core i3, ৮GB RAM, ৫১২GB SSD, ১৫.৬" FHD ডিসপ্লে।', inStock: true, featured: false },
    { id: 'p6', name: 'Rangs টেলিভিশন ৪৩"', category: 'ইলেকট্রনিক্স', price: 32000, images: [], emoji: '📺', description: 'Rangs 43 ইঞ্চি Android Smart TV। 4K UHD, WiFi, YouTube, Netflix সাপোর্ট।', inStock: true, featured: false },
];

// ═══ STATE ═══
let currentFilter = 'all';
let selectedProduct = null;
let cart = JSON.parse(localStorage.getItem('bf_cart') || '[]');

// ═══ CALC EMI ═══
function calcEmi(price) {
    const total = price * 1.10;
    const perInstall = total / 6;
    return {
        total: Math.round(total),
        perInstall: Math.round(perInstall),
        profit: Math.round(price * 0.10),
        down: Math.round(perInstall)
    };
}
function fmtBn(n) { return '৳' + Number(n).toLocaleString('bn'); }
function bnNum(n) { return String(n).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); }

// ═══ RENDER PRODUCTS ═══
function renderProducts() {
    const products = ShopDB.getProducts();
    const searchEl = document.getElementById('searchInput');
    const sortEl = document.getElementById('sortSel');
    const search = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const sort = sortEl ? sortEl.value : 'default';

    let filtered = products.filter(function (p) {
        const matchCat = currentFilter === 'all' || p.category === currentFilter;
        const matchSearch = !search ||
            p.name.toLowerCase().includes(search) ||
            (p.description || '').toLowerCase().includes(search) ||
            (p.category || '').includes(search);
        return matchCat && matchSearch;
    });

    if (sort === 'price-asc') filtered.sort(function (a, b) { return a.price - b.price; });
    else if (sort === 'price-desc') filtered.sort(function (a, b) { return b.price - a.price; });
    else if (sort === 'name') filtered.sort(function (a, b) { return a.name.localeCompare(b.name, 'bn'); });
    else filtered.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });

    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = 'মোট ' + bnNum(filtered.length) + ' টি পণ্য';

    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    if (!filtered.length) {
        grid.innerHTML = '<div class="no-products" style="grid-column:1/-1"><div class="icon">📦</div><p>কোনো পণ্য পাওয়া যায়নি।</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(function (p) {
        const emi = calcEmi(p.price);
        const imgSrc = (p.images && p.images[0])
            ? '<img src="' + p.images[0] + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'" />'
            : '';
        const emoji = p.emoji || '📦';
        return '<div class="product-card">' +
            '<div class="product-img-wrap">' +
            imgSrc +
            (!imgSrc ? '<span class="product-img-placeholder">' + emoji + '</span>' : '') +
            '<span class="' + (p.inStock ? 'stock-badge in-stock' : 'stock-badge out-stock') + '">' + (p.inStock ? '✅ আছে' : '❌ নেই') + '</span>' +
            (p.featured ? '<span class="featured-badge">⭐ ফিচার্ড</span>' : '') +
            '</div>' +
            '<div class="product-body">' +
            '<div class="product-cat">' + (p.category || 'পণ্য') + '</div>' +
            '<div class="product-name">' + p.name + '</div>' +
            '<div class="product-desc">' + (p.description || '') + '</div>' +
            '<div class="price-block">' +
            '<div class="price-main">' + fmtBn(p.price) + '</div>' +
            '<div class="price-emi">কিস্তি: <span>' + fmtBn(emi.perInstall) + ' × ৬</span> (১০% লাভ)</div>' +
            '</div>' +
            '<div class="product-actions">' +
            '<button class="btn-detail" onclick="openDetail(\'' + p.id + '\')">বিস্তারিত</button>' +
            '<button class="btn-order" onclick="openOrder(\'' + p.id + '\')" ' + (!p.inStock ? 'disabled' : '') + '>' +
            (p.inStock ? '🛒 অর্ডার' : 'স্টকে নেই') + '</button>' +
            '</div></div></div>';
    }).join('');
}

// ═══ CATEGORIES ═══
function renderCategories() {
    const products = ShopDB.getProducts();
    const cats = [];
    products.forEach(function (p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
    const div = document.getElementById('catFilters');
    if (!div) return;
    div.innerHTML = cats.map(function (c) {
        return '<button class="fcat" onclick="setFilter(\'' + c + '\',this)">' + c + '</button>';
    }).join('');
}

function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.fcat').forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderProducts();
}

// ═══ DETAIL MODAL ═══
function openDetail(id) {
    const products = ShopDB.getProducts();
    const p = products.find(function (x) { return x.id === id; });
    if (!p) return;
    selectedProduct = p;
    const emi = calcEmi(p.price);

    const mainBox = document.getElementById('mainImgBox');
    const mainEmoji = document.getElementById('mainImgEmoji');
    const thumbRow = document.getElementById('thumbRow');
    if (mainEmoji) mainEmoji.textContent = p.emoji || '📦';
    if (thumbRow) thumbRow.innerHTML = '';

    if (mainBox && p.images && p.images.length) {
        mainBox.innerHTML = '<img src="' + p.images[0] + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;" />';
        if (thumbRow) {
            p.images.forEach(function (img, i) {
                thumbRow.innerHTML += '<img src="' + img + '" class="thumb ' + (i === 0 ? 'active' : '') + '" onclick="setMainImg(\'' + img + '\',this)" onerror="this.style.display=\'none\'" />';
            });
        }
    }

    const detCat = document.getElementById('detailCat');
    const detName = document.getElementById('detailName');
    const detPrice = document.getElementById('detailPrice');
    const detDesc = document.getElementById('detailDesc');
    const detStock = document.getElementById('detailStock');
    const detOrderBtn = document.getElementById('detailOrderBtn');
    const emiBD = document.getElementById('emiBreakdown');

    if (detCat) detCat.textContent = p.category || '';
    if (detName) detName.textContent = p.name;
    if (detPrice) detPrice.textContent = fmtBn(p.price);
    if (detDesc) detDesc.textContent = p.description || '';
    if (detStock) detStock.innerHTML = p.inStock
        ? '<span style="color:#065F46;font-weight:700;">✅ স্টকে আছে</span>'
        : '<span style="color:#dc2626;font-weight:700;">❌ স্টকে নেই</span>';
    if (detOrderBtn) detOrderBtn.disabled = !p.inStock;

    if (emiBD) {
        emiBD.innerHTML =
            '<div class="emi-row"><span>পণ্যের মূল্য</span><span>' + fmtBn(p.price) + '</span></div>' +
            '<div class="emi-row"><span>১০% লাভ</span><span>' + fmtBn(emi.profit) + '</span></div>' +
            '<div class="emi-row"><span>মোট পরিশোধযোগ্য</span><span>' + fmtBn(emi.total) + '</span></div>' +
            '<div class="emi-row"><span>১ম কিস্তি (ডাউন)</span><span>' + fmtBn(emi.down) + '</span></div>' +
            '<div class="emi-row"><span>বাকি ৫ কিস্তি</span><span>' + fmtBn(emi.perInstall) + ' × ৫</span></div>';
    }

    const modal = document.getElementById('detailModal');
    if (modal) modal.classList.add('open');
}

function setMainImg(src, thumb) {
    const mainBox = document.getElementById('mainImgBox');
    if (mainBox) mainBox.innerHTML = '<img src="' + src + '" style="width:100%;height:100%;object-fit:cover;" />';
    document.querySelectorAll('.thumb').forEach(function (t) { t.classList.remove('active'); });
    if (thumb) thumb.classList.add('active');
}

function closeDetail() {
    const m = document.getElementById('detailModal');
    if (m) m.classList.remove('open');
}

function openOrderFromDetail() {
    closeDetail();
    if (selectedProduct) openOrder(selectedProduct.id);
}

// ═══ ORDER MODAL ═══
function openOrder(id) {
    const products = ShopDB.getProducts();
    const p = products.find(function (x) { return x.id === id; });
    if (!p) return;
    if (!p.inStock) { toast('এই পণ্যটি এখন স্টকে নেই।', '#e53e3e'); return; }
    selectedProduct = p;
    const emi = calcEmi(p.price);

    const sumEl = document.getElementById('orderSummary');
    if (sumEl) {
        sumEl.innerHTML =
            '<div class="srow"><span>পণ্য</span><span>' + p.name + '</span></div>' +
            '<div class="srow"><span>বাজারমূল্য</span><span>' + fmtBn(p.price) + '</span></div>' +
            '<div class="srow"><span>১০% লাভ</span><span>' + fmtBn(emi.profit) + '</span></div>' +
            '<div class="srow"><span>মোট পরিশোধযোগ্য</span><span>' + fmtBn(emi.total) + '</span></div>' +
            '<div class="srow"><span>প্রতি কিস্তি (৬ টি)</span><span>' + fmtBn(emi.perInstall) + ' × ৬</span></div>';
    }

    // Pre-fill from session
    const session = ShopDB.getSession();
    if (session) {
        const nameEl = document.getElementById('ord-name');
        const phoneEl = document.getElementById('ord-phone');
        const nidEl = document.getElementById('ord-nid');
        if (nameEl) nameEl.value = session.name || '';
        if (phoneEl) phoneEl.value = session.phone || '';
        if (nidEl) nidEl.value = session.memberID || '';
    }

    const alertEl = document.getElementById('orderAlert');
    if (alertEl) alertEl.classList.add('hidden');
    const modal = document.getElementById('orderModal');
    if (modal) modal.classList.add('open');
}

function closeOrder() {
    const m = document.getElementById('orderModal');
    if (m) m.classList.remove('open');
}

function submitOrder() {
    const name = document.getElementById('ord-name')?.value.trim();
    const phone = document.getElementById('ord-phone')?.value.trim();
    const nid = document.getElementById('ord-nid')?.value.trim();
    const address = document.getElementById('ord-address')?.value.trim();
    const al = document.getElementById('orderAlert');

    if (!name || !phone || !nid || !address) {
        if (al) { al.className = 'aalert aalert-err'; al.textContent = 'তারকা চিহ্নিত সকল তথ্য পূরণ করুন।'; al.classList.remove('hidden'); }
        return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
        if (al) { al.className = 'aalert aalert-err'; al.textContent = 'সঠিক মোবাইল নম্বর দিন।'; al.classList.remove('hidden'); }
        return;
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
        nid: nid,
        address: address,
        witness: document.getElementById('ord-witness')?.value.trim() || '',
        note: document.getElementById('ord-note')?.value.trim() || '',
        status: 'pending',
        statusStep: 0,
        submittedAt: new Date().toISOString(),
    };

    ShopDB.addOrder(order);
    closeOrder();
    showMyOrder(order);
    toast('✅ আবেদন জমা হয়েছে! আইডি: ' + order.id, '#065F46');

    ['ord-name', 'ord-phone', 'ord-nid', 'ord-address', 'ord-witness', 'ord-note'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// ═══ ORDER STATUS TRACKER ═══
const ORDER_STEPS = ['আবেদন জমা', 'কমিটি পর্যালোচনা', 'অনুমোদন', 'পণ্য সংগ্রহ', 'বিতরণ', 'সম্পন্ন'];

function showMyOrder(order) {
    const bar = document.getElementById('myOrdersBar');
    const info = document.getElementById('latestOrderInfo');
    const steps = document.getElementById('trackSteps');
    if (!bar || !info || !steps) return;

    bar.classList.remove('hidden');
    info.innerHTML = '<strong>' + order.productName + '</strong> | আইডি: ' + order.id +
        ' | মূল্য: ' + fmtBn(order.price) + ' | অবস্থা: <span style="color:var(--gold);font-weight:700;">পেন্ডিং</span>';

    steps.innerHTML = ORDER_STEPS.map(function (s, i) {
        const cls = i === order.statusStep ? 'current' : i < order.statusStep ? 'done' : '';
        return '<div class="track-step">' +
            '<div class="ts-dot ' + cls + '">' + (i < order.statusStep ? '✓' : (i + 1)) + '</div>' +
            '<div class="ts-label">' + s + '</div>' +
            '</div>';
    }).join('');
}

function loadMyOrders() {
    const orders = ShopDB.getOrders();
    if (!orders.length) return;
    const session = ShopDB.getSession();
    const latest = session
        ? orders.filter(function (o) { return o.customerPhone === session.phone; }).slice(-1)[0]
        : orders.slice(-1)[0];
    if (latest) showMyOrder(latest);
}

// ═══ CART ═══
function toggleCart(e) {
    if (e) e.preventDefault();
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) sidebar.classList.toggle('open');
    renderCart();
}

function addToCart(productId) {
    const products = ShopDB.getProducts();
    const p = products.find(function (x) { return x.id === productId; });
    if (!p || !p.inStock) return;
    if (cart.find(function (c) { return c.id === productId; })) {
        toast('পণ্যটি ইতিমধ্যে কার্টে আছে।', '#C9A227');
        return;
    }
    cart.push({ id: p.id, name: p.name, price: p.price, emoji: p.emoji || '📦' });
    saveCart();
    updateCartCount();
    toast('"' + p.name + '" কার্টে যোগ হয়েছে ✅');
}

function removeFromCart(id) {
    cart = cart.filter(function (c) { return c.id !== id; });
    saveCart();
    updateCartCount();
    renderCart();
}

function saveCart() { localStorage.setItem('bf_cart', JSON.stringify(cart)); }

function updateCartCount() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = cart.length || '0';
}

function renderCart() {
    const el = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!el) return;

    if (!cart.length) {
        el.innerHTML = '<div class="empty-cart"><div class="icon">🛒</div><p>কার্ট খালি</p></div>';
        if (totalEl) totalEl.textContent = '৳০';
        return;
    }

    let total = 0;
    el.innerHTML = cart.map(function (item) {
        total += item.price;
        return '<div class="cart-item">' +
            '<div class="cart-item-img">' + item.emoji + '</div>' +
            '<div class="cart-item-info">' +
            '<div class="cart-item-name">' + item.name + '</div>' +
            '<div class="cart-item-price">' + fmtBn(item.price) + '</div>' +
            '</div>' +
            '<button class="cart-item-remove" onclick="removeFromCart(\'' + item.id + '\')">✕</button>' +
            '</div>';
    }).join('');
    if (totalEl) totalEl.textContent = fmtBn(total);
}

function checkoutCart() {
    if (!cart.length) { toast('কার্ট খালি!', '#e53e3e'); return; }
    const products = ShopDB.getProducts();
    const first = products.find(function (p) { return p.id === cart[0].id; });
    if (first) {
        const sidebar = document.getElementById('cartSidebar');
        if (sidebar) sidebar.classList.remove('open');
        openOrder(first.id);
    }
}

// ═══ TOAST ═══
function toast(msg, color) {
    color = color || '#065F46';
    const ex = document.querySelector('.toast-msg');
    if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'toast-msg';
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:' + color + ';color:#fff;padding:12px 20px;border-radius:10px;font-size:13px;z-index:99999;font-family:\'Noto Serif Bengali\',serif;box-shadow:0 4px 20px rgba(0,0,0,0.2);animation:slideUp 0.3s ease;max-width:320px;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.4s';
        setTimeout(function () { t.remove(); }, 400);
    }, 3500);
}

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', function () {
    renderCategories();
    renderProducts();
    updateCartCount();
    loadMyOrders();
});