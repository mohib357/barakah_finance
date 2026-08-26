// ═══════════════════════════════════════════════════════════
//  BARAKAH FINANCE — SHOP JS
// ═══════════════════════════════════════════════════════════
let _allProducts = [];
let _currentProduct = null;
let _page = 0;
const PAGE_SIZE = 12;

document.addEventListener('DOMContentLoaded', loadProducts);

async function loadProducts() {
  let products = [];
  try {
    const res = await fetch('http://localhost:3001/api/products', { signal: AbortSignal.timeout(3000) });
    if (res.ok) { const d = await res.json(); products = d.products || d; }
  } catch(_) {}
  if (!products.length && typeof DB !== 'undefined') {
    products = DB.getProducts();
  }
  if (!products.length) {
    products = [
      {id:'p1',name:'Samsung Galaxy A15',category:'মোবাইল',price:18000,emoji:'📱',description:'৬.৫ ইঞ্চি AMOLED ডিসপ্লে, ৫০০০mAh ব্যাটারি, ১২৮GB স্টোরেজ।',inStock:true,featured:true},
      {id:'p2',name:'Walton রেফ্রিজারেটর ২৫০L',category:'ইলেকট্রনিক্স',price:35000,emoji:'🧊',description:'ডাবল ডোর, A++ রেটিং, বিদ্যুৎ সাশ্রয়ী।',inStock:true,featured:true},
      {id:'p3',name:'Hero Splendor Plus',category:'মোটরযান',price:125000,emoji:'🏍️',description:'১০০cc ইঞ্জিন, ৮০+ কিমি মাইলেজ।',inStock:false,featured:false},
      {id:'p4',name:'Singer সেলাই মেশিন',category:'গৃহস্থালি',price:12000,emoji:'🧵',description:'ইলেকট্রিক, ১৫ প্যাটার্ন।',inStock:true,featured:true},
      {id:'p5',name:'Vision 43" Smart TV',category:'ইলেকট্রনিক্স',price:42000,emoji:'📺',description:'4K UHD, Android 11, WiFi সমর্থিত।',inStock:true,featured:false},
      {id:'p6',name:'Butterfly সেলাই মেশিন',category:'গৃহস্থালি',price:8500,emoji:'🦋',description:'মেকানিক্যাল, টেকসই ও সহজে চালানো যায়।',inStock:true,featured:false},
    ];
  }
  _allProducts = products;
  _page = 0;
  buildCategories();
  renderProducts();
}

function buildCategories() {
  const cats = [...new Set(_allProducts.map(p=>p.category).filter(Boolean))];
  const wrap = document.getElementById('shopCatBtns');
  if (!wrap) return;
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'shop-cat-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.onclick = () => setCategory(cat, btn);
    wrap.appendChild(btn);
  });
}

let _activeCat = '';
function setCategory(cat, btn) {
  _activeCat = cat;
  _page = 0;
  document.querySelectorAll('.shop-cat-btn').forEach(b=>b.classList.toggle('active', b.dataset.cat===cat));
  renderProducts();
}

function filterProducts() {
  _page = 0;
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;
  const q = (document.getElementById('shopSearch')?.value||'').toLowerCase();
  const sort = document.getElementById('shopSort')?.value||'';
  let filtered = _allProducts.filter(p =>
    (!_activeCat || p.category===_activeCat) &&
    (!q || (p.name||'').toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q))
  );
  if (sort==='price-asc') filtered.sort((a,b)=>a.price-b.price);
  if (sort==='price-desc') filtered.sort((a,b)=>b.price-a.price);
  // Featured first
  filtered.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0));

  const page = filtered.slice(0, (_page+1)*PAGE_SIZE);
  if (!page.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🛒</div><div class="empty-state-title">কোনো পণ্য পাওয়া যায়নি।</div></div>`;
    document.getElementById('loadMoreWrap')?.classList.add('hidden');
    return;
  }
  grid.innerHTML = page.map(p => `
    <div class="product-card" onclick="openProduct('${p.id}')">
      <div class="product-img">
        ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy"/>` : `<span>${p.emoji||'📦'}</span>`}
        ${!p.inStock ? '<div class="product-badge-out">স্টক নেই</div>' : ''}
        ${p.featured ? '<div class="product-badge-feat">⭐ ফিচার্ড</div>' : ''}
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category||''}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">৳ ${p.price.toLocaleString('en-IN')}</div>
        <div class="product-installment">৬ কিস্তিতে ≈ ৳ ${Math.round((p.price*1.1)/6).toLocaleString('en-IN')}/মাস</div>
      </div>
    </div>`).join('');

  const lm = document.getElementById('loadMoreWrap');
  if (lm) lm.classList.toggle('hidden', (_page+1)*PAGE_SIZE >= filtered.length);
}

function loadMoreProducts() { _page++; renderProducts(); }

function openProduct(id) {
  const p = _allProducts.find(x=>x.id===id);
  if (!p) return;
  _currentProduct = p;
  document.getElementById('pmName').textContent = p.name;
  document.getElementById('pmCat').textContent = p.category||'';
  document.getElementById('pmPrice').textContent = '৳ ' + p.price.toLocaleString('en-IN');
  document.getElementById('pmDesc').textContent = p.description||'';
  const mainImg = document.getElementById('pmImgMain');
  if (p.images?.[0]) { mainImg.innerHTML = `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/>`; }
  else { mainImg.innerHTML = `<span>${p.emoji||'📦'}</span>`; }
  const stock = document.getElementById('pmStock');
  stock.innerHTML = p.inStock
    ? '<span class="badge badge-success">✅ স্টক আছে</span>'
    : '<span class="badge badge-danger">❌ স্টক নেই</span>';
  const orderBtn = document.getElementById('pmOrderBtn');
  if (orderBtn) orderBtn.disabled = !p.inStock;
  updateInstallment();
  document.getElementById('productModal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('productModal').classList.add('hidden');
  _currentProduct = null;
}

function updateInstallment() {
  if (!_currentProduct) return;
  const n = parseInt(document.getElementById('pmInstallNum')?.value||6);
  const price = _currentProduct.price;
  const profit = Math.round(price * 0.1);
  const total = price + profit;
  const monthly = Math.round(total / n);
  document.getElementById('pmCalcResult').innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>বিক্রয়মূল্য (১০% লাভ):</span><strong>৳ ${total.toLocaleString('en-IN')}</strong></div>
    <div style="display:flex;justify-content:space-between;color:var(--clr-primary-500);font-weight:700"><span>মাসিক কিস্তি (${n} মাস):</span><strong>৳ ${monthly.toLocaleString('en-IN')}</strong></div>`;
  document.getElementById('pmInstall').textContent = `${n} মাসে ৳ ${monthly.toLocaleString('en-IN')}/মাস`;
}

function orderProduct() {
  const session = typeof DB !== 'undefined' ? DB.getSession() : null;
  if (!session) { showToast('অর্ডার করতে লগইন করুন।','warning'); return; }
  if (!_currentProduct) return;
  const n = parseInt(document.getElementById('pmInstallNum')?.value||6);
  const total = Math.round(_currentProduct.price * 1.1);
  const monthly = Math.round(total/n);
  document.getElementById('orderSummary').innerHTML = `
    <div><b>পণ্য:</b> ${_currentProduct.name}</div>
    <div><b>মূল্য:</b> ৳ ${_currentProduct.price.toLocaleString('en-IN')}</div>
    <div><b>বিক্রয়মূল্য:</b> ৳ ${total.toLocaleString('en-IN')}</div>
    <div><b>কিস্তি:</b> ${n} মাসে ৳ ${monthly.toLocaleString('en-IN')}/মাস</div>`;
  document.getElementById('orderModal').classList.remove('hidden');
}

async function confirmOrder() {
  const session = typeof DB !== 'undefined' ? DB.getSession() : null;
  if (!session || !_currentProduct) return;
  const address = document.getElementById('orderAddress')?.value.trim();
  const note = document.getElementById('orderNote')?.value.trim();
  if (!address) { showToast('ডেলিভারি ঠিকানা দিন।','error'); return; }

  const n = parseInt(document.getElementById('pmInstallNum')?.value||6);
  const total = Math.round(_currentProduct.price * 1.1);
  const order = {
    productId: _currentProduct.id,
    productName: _currentProduct.name,
    price: _currentProduct.price,
    salePrice: total,
    installments: n,
    monthlyAmount: Math.round(total/n),
    customerPhone: session.phone,
    customerId: session.id,
    deliveryAddress: address,
    note: note||'',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  try {
    const res = await fetch('http://localhost:3001/api/orders', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+(localStorage.getItem('bf_token')||'')},
      body: JSON.stringify(order),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      document.getElementById('orderModal').classList.add('hidden');
      closeProductModal();
      showToast('অর্ডার সফলভাবে জমা হয়েছে! কমিটি পর্যালোচনা করবে।','success');
      if (typeof DB !== 'undefined') DB.addOrder(order);
      return;
    }
  } catch(_) {}

  // Offline fallback
  if (typeof DB !== 'undefined') DB.addOrder(order);
  document.getElementById('orderModal').classList.add('hidden');
  closeProductModal();
  showToast('অর্ডার সফলভাবে জমা হয়েছে!','success');
}
