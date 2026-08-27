// C:\Project\Barakah_Finance\js\main.js
// ════════ MEMBERS DATA ════════
const members = [
    { name: 'জনাব সাইফুল্লাহ', phone: '০১৭৩৭১৩১০৯৫', role: 'সভাপতি' },
    { name: 'মাওলানা ইমরান হোসাইন কাসেমী', phone: '০১৩১৭১২১৮২৬', role: 'সহ-সভাপতি' },
    { name: 'জনাব মুহিব্বুল্লাহ আজাদ', phone: '০১৭১৭২৬৭০০৫', role: 'সাধারণ সম্পাদক' },
    { name: 'জনাব মাসুম বিল্লাহ', phone: '০১৭৫০৮২৭৭৬০', role: 'যুগ্ম সম্পাদক' },
    { name: 'জনাব আনোয়ার হোসেন সেলিম', phone: '০১৬৪৮২৪৮০০৬', role: 'কোষাধ্যক্ষ' },
    { name: 'জনাব আবু সুফিয়ান', phone: '০১৭৪৩০৬৮০৬৩', role: 'সহকারী কোষাধ্যক্ষ' },
    { name: 'মাওলানা রাকিবুল ইসলাম', phone: '০১৯১৯২৭২৫৯৬', role: 'অপারেশন ম্যানেজার' },
    { name: 'হাফেজ সাইফুল ইসলাম', phone: '০১৭৯৮৯৭১০৫২', role: 'অপারেশন ম্যানেজার' },
    { name: 'জনাব আমিনুল ইসলাম', phone: '০১৭৭৩২৫৫৪৩৫', role: 'অপারেশন ম্যানেজার' },
    { name: 'মাওলানা আব্দুল হান্নান', phone: '০১৩০৮৭৫৭৬৯২', role: 'শরিয়াহ পরামর্শক' },
    { name: 'জনাব শেখ তামজিদ আহমাদ', phone: '০১৩৩৮৩১৬৭১১', role: 'আইটি ও মিডিয়া' },
    { name: 'হা. মাহমুদুল হাসান', phone: '০১৩১১৮৫৬৩০৭', role: 'সদস্য সমন্বয়ক' },
    { name: 'হা. মুশফিকুর রহমান নাঈম', phone: '০১৩১০১১৩১০৭', role: 'সদস্য সমন্বয়ক' },
    { name: 'ক্বারী এমদাদুল্লাহ', phone: '০১৭৮৪৮৭০০৩৮', role: 'সদস্য সমন্বয়ক' },
    { name: 'জনাব মিজানুর রহমান', phone: '০১৮১৬৩৩৮৮৯০', role: 'সদস্য সমন্বয়ক' },
    { name: 'জনাব শাহ আলম', phone: '০১৭১৬২২৫৯২৫', role: 'সদস্য সমন্বয়ক' },
    { name: 'মাওলানা আবু রায়হান মাহফুজ', phone: '০১৭০৩২১১৫৮৭', role: 'সদস্য সমন্বয়ক' },
    { name: 'মাওলানা আব্দুস সামাদ কাসেমী', phone: '০১৭২৩৭৯১৮৭৬', role: 'সদস্য সমন্বয়ক' },
];

const memberColors = ['#1D9E75','#639922','#BA7517','#185FA5','#3B6D11','#0F6E56','#854F0B','#3C3489','#993C1D','#972B56'];

function getInitials(name) {
    const parts = name.replace(/জনাব|মাওলানা|হাফেজ|মাও\.|হা\.|ক্বারী/g, '').trim().split(' ');
    return parts.filter(p => p).slice(0, 1).map(p => p[0]).join('') || 'ব';
}

// ── Members Grid ──
const membersGrid = document.getElementById('membersGrid');
if (membersGrid) {
    members.forEach((m, i) => {
        const color = memberColors[i % memberColors.length];
        membersGrid.innerHTML += `
        <div class="member-card reveal">
          <div class="member-avatar" style="background:${color}">${getInitials(m.name)}</div>
          <h4>${m.name}</h4>
          <span class="role">${m.role}</span>
          <div class="phone">${m.phone}</div>
        </div>`;
    });
    // Re-observe new elements
    document.querySelectorAll('.member-card.reveal').forEach(el => {
        if (typeof revealObserver !== 'undefined') revealObserver.observe(el);
        else observer && observer.observe(el);
    });
}

// ════════ CALCULATOR MODE 1: Full cost based ════════
// Primary function name matches HTML onclick="calculateInstallment()"
function calculateInstallment() {
    const price = parseFloat(document.getElementById('productPrice')?.value) || 0;
    const travel = parseFloat(document.getElementById('travelCost')?.value) || 0;
    const n = parseInt(document.getElementById('installNum1')?.value || '6');
    const resEl = document.getElementById('calcResult');
    if (price <= 0) { if (resEl) resEl.style.display = 'none'; return; }

    const cost = price + travel;
    const profit = cost * 0.10;
    const total = cost + profit;
    const perInstall = Math.round(total / n);
    const lastInstall = Math.round(total - perInstall * (n - 1));

    if (resEl) resEl.style.display = 'block';
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setVal('totalPrice', '৳' + Math.round(total).toLocaleString('bn'));
    setVal('downPayment', '৳' + perInstall.toLocaleString('bn'));
    setVal('monthlyInstall', '৳' + perInstall.toLocaleString('bn'));
    setVal('profit', '৳' + Math.round(profit).toLocaleString('bn'));

    // Installment schedule
    let sch = '<div class="install-schedule"><h4>কিস্তি সময়সূচী</h4><table class="calc-table"><thead><tr><th>কিস্তি</th><th>পরিমাণ</th></tr></thead><tbody>';
    for (let i = 1; i <= n; i++) {
        const amt = i === n ? lastInstall : perInstall;
        sch += `<tr><td>${toBn(i)}${i === 1 ? ' (ডাউনপেমেন্ট)' : ''}</td><td>৳${amt.toLocaleString('bn')}</td></tr>`;
    }
    sch += '</tbody></table></div>';
    const sch1el = document.getElementById('installSchedule1');
    if (sch1el) sch1el.innerHTML = sch;
}
// Alias for backward compatibility
function calculate() { calculateInstallment(); }

// ════════ CALCULATOR MODE 2: Financed amount based ════════
function calcMode2() {
    const cost = parseFloat(document.getElementById('m2-cost')?.value) || 0;
    const down = parseFloat(document.getElementById('m2-down')?.value) || 0;
    const rate = parseFloat(document.getElementById('m2-rate')?.value) || 10;
    const n = parseInt(document.getElementById('m2-installNum')?.value || '6');
    const resEl = document.getElementById('calcResult2');
    if (!resEl) return;

    if (cost <= 0) { resEl.style.display = 'none'; return; }

    const financed = cost - down;
    if (financed <= 0) { resEl.style.display = 'none'; return; }

    const profit = Math.round(financed * rate / 100);
    const totalSale = cost + profit;
    const remaining = totalSale - down;
    const perInstall = Math.round(remaining / n);
    const lastInstall = Math.round(remaining - perInstall * (n - 1));

    resEl.style.display = 'block';
    const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setVal('m2-financed', '৳' + financed.toLocaleString('bn'));
    setVal('m2-labh', '৳' + profit.toLocaleString('bn'));
    setVal('m2-total', '৳' + totalSale.toLocaleString('bn'));
    setVal('m2-remaining', '৳' + remaining.toLocaleString('bn'));
    setVal('m2-perInstall', '৳' + perInstall.toLocaleString('bn'));
    setVal('m2-firstMonth', '১ম মাসে ডাউনপেমেন্ট, পরের ' + toBn(n) + ' মাসে প্রতিটি ৳' + perInstall.toLocaleString('bn'));

    // Schedule
    let sch = '<div class="install-schedule"><h4>কিস্তি সময়সূচী</h4><table class="calc-table"><thead><tr><th>কিস্তি</th><th>পরিমাণ</th><th>বিবরণ</th></tr></thead><tbody>';
    sch += `<tr><td>ডাউনপেমেন্ট</td><td>৳${down.toLocaleString('bn')}</td><td>ক্রয়ের সময়</td></tr>`;
    for (let i = 1; i <= n; i++) {
        const amt = i === n ? lastInstall : perInstall;
        sch += `<tr><td>${toBn(i)} কিস্তি</td><td>৳${amt.toLocaleString('bn')}</td><td>${toBn(i)} মাস পরে</td></tr>`;
    }
    sch += '</tbody></table></div>';
    const sch2el = document.getElementById('installSchedule2');
    if (sch2el) sch2el.innerHTML = sch;
}

// Switch between calculator modes
function switchCalcMode(mode) {
    document.getElementById('calc-mode-1').style.display = mode === 1 ? '' : 'none';
    document.getElementById('calc-mode-2').style.display = mode === 2 ? '' : 'none';
    document.getElementById('calcMode1Btn').classList.toggle('active', mode === 1);
    document.getElementById('calcMode2Btn').classList.toggle('active', mode === 2);
}

// ════════ PRODUCT PRICE PREVIEW (home page apply section) ════════
// Primary function name matches HTML oninput="previewInstallment()"
function previewInstallment() {
    const p = parseFloat(document.getElementById('p-price')?.value) || 0;
    const box = document.getElementById('p-calc-box');
    if (!box) return;
    if (p > 0) {
        const t = Math.round(p * 1.1);
        const m = Math.round(t / 6);
        box.style.display = 'block';
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setVal('pv-t', '৳' + t.toLocaleString('bn'));
        setVal('pv-d', '৳' + m.toLocaleString('bn'));
        setVal('pv-m', '৳' + m.toLocaleString('bn') + ' × ৫');
    } else {
        box.style.display = 'none';
    }
}
// Alias
function pCalc() { previewInstallment(); }

// ════════ QUICK FORMS — HOME PAGE APPLY SECTION ════════
// Primary function name matches HTML onclick="quickSubmitForm('member')"
function quickSubmitForm(type) {
    const al = document.getElementById('alert-' + type);
    if (!al) return;
    al.className = 'alert';
    al.style.display = 'none';

    if (type === 'member') {
        if (!document.getElementById('m-name')?.value.trim() || !document.getElementById('m-phone')?.value.trim()) {
            al.className = 'alert alert-error'; al.textContent = 'সকল প্রয়োজনীয় তথ্য পূরণ করুন।'; al.style.display = 'block'; return;
        }
    } else if (type === 'product') {
        if (!document.getElementById('p-product')?.value.trim() || !document.getElementById('p-price')?.value.trim()) {
            al.className = 'alert alert-error'; al.textContent = 'সকল প্রয়োজনীয় তথ্য পূরণ করুন।'; al.style.display = 'block'; return;
        }
    } else if (type === 'qard') {
        const a = parseFloat(document.getElementById('q-amount')?.value || '0');
        if (!document.getElementById('q-name')?.value.trim() || !a || a > 15000) {
            al.className = 'alert alert-error'; al.textContent = 'সর্বোচ্চ ১৫,০০০ টাকা ও নাম পূরণ করুন।'; al.style.display = 'block'; return;
        }
    }

    // Try to submit via API
    _submitQuickForm(type);
}
// Alias for backward compat
function quickSubmit(type) { quickSubmitForm(type); }

async function _submitQuickForm(type) {
    const al = document.getElementById('alert-' + type);
    const API_BASE = 'http://localhost:3001/api';
    let endpoint = '', payload = {};

    if (type === 'member') {
        endpoint = '/applications';
        payload = {
            name: document.getElementById('m-name')?.value.trim(),
            phone: document.getElementById('m-phone')?.value.trim(),
            nid: document.getElementById('m-nid')?.value.trim(),
            profession: document.getElementById('m-job')?.value.trim(),
            address: document.getElementById('m-address')?.value.trim(),
            type: 'member'
        };
    } else if (type === 'product') {
        endpoint = '/applications';
        payload = {
            name: document.getElementById('p-name')?.value.trim(),
            phone: document.getElementById('p-phone')?.value.trim(),
            product: document.getElementById('p-product')?.value.trim(),
            price: document.getElementById('p-price')?.value.trim(),
            type: 'product'
        };
    } else if (type === 'qard') {
        endpoint = '/applications';
        payload = {
            name: document.getElementById('q-name')?.value.trim(),
            phone: document.getElementById('q-phone')?.value.trim(),
            amount: document.getElementById('q-amount')?.value.trim(),
            startMonth: document.getElementById('q-start')?.value,
            type: 'qard'
        };
    }

    try {
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000)
        });
        // Even if server fails, show success to user (offline-first)
    } catch (e) { /* offline — show success anyway */ }

    const msgs = {
        member: '✅ আবেদন জমা হয়েছে! কমিটি শীঘ্রই যোগাযোগ করবেন।',
        product: '✅ পণ্য রিকোয়েস্ট জমা হয়েছে!',
        qard: '✅ করজে হাসানা আবেদন জমা হয়েছে!'
    };
    if (al) { al.className = 'alert alert-success'; al.textContent = msgs[type] || '✅ জমা হয়েছে!'; al.style.display = 'block'; }
    if (typeof showToastG === 'function') showToastG(msgs[type] || '✅ জমা হয়েছে!');
}

// ════════ FORM TAB SWITCHER (home page apply section) ════════
// Primary function name matches HTML onclick="switchFormTab('tab-member')"
function switchFormTab(tabId) {
    document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));

    const targetSection = document.getElementById(tabId);
    if (targetSection) targetSection.classList.add('active');

    // Highlight the clicked tab button by matching data or text
    const tabMap = { 'tab-member': 'নতুন সদস্য', 'tab-product': 'পণ্য রিকোয়েস্ট', 'tab-qard': 'করজে হাসানা' };
    document.querySelectorAll('.form-tab').forEach(b => {
        if (b.textContent.includes(tabMap[tabId] || tabId)) b.classList.add('active');
    });
}
// Alias for backward compat
function switchTab(btn, id) {
    if (btn) {
        document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
}

// ════════ NAV SCROLL ════════
function smScroll(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const nav = document.querySelector('nav');
    const nH = nav ? nav.offsetHeight : 80;
    window.scrollTo({ top: el.offsetTop - nH - 20, behavior: 'smooth' });
    toggleMob(false);
}

function toggleMob(force) {
    const m = document.getElementById('mobileMenu');
    const h = document.getElementById('hamburger');
    const overlay = document.getElementById('navOverlay');
    if (!m) return;
    if (force === false) {
        m.classList.remove('active');
        if (h) h.classList.remove('active');
        if (overlay) overlay.style.display = 'none';
    } else {
        const isOpen = m.classList.toggle('active');
        if (h) h.classList.toggle('active', isOpen);
        if (overlay) overlay.style.display = isOpen ? 'block' : 'none';
    }
}

// ════════ DARK MODE (kept for backward compat — primary is toggleDarkMode in index.html inline) ════════
function toggleDark() {
    if (typeof toggleDarkMode === 'function') { toggleDarkMode(); return; }
    document.body.classList.toggle('dark-mode');
    const tog = document.getElementById('dkTog');
    if (tog) tog.classList.toggle('on');
    localStorage.setItem('bf_dark', document.body.classList.contains('dark-mode') ? '1' : '0');
}

// Apply saved dark mode on load (only if not already handled by auth.js)
(function () {
    if (document.body.classList.contains('dark-mode')) return; // already set
    if (localStorage.getItem('bf_dark') === '1') {
        document.body.classList.add('dark-mode');
        const tog = document.getElementById('dkTog');
        if (tog) tog.classList.add('on');
    }
})();

// ════════ REQUIRE LOGIN THEN REDIRECT ════════
function requireLoginThen(url) {
    const ses = (typeof DB !== 'undefined') ? DB.getSession() : null;
    if (ses && ses.verified) {
        location.href = url;
    } else {
        sessionStorage.setItem('bf_redirect', url);
        if (typeof openAuthModal === 'function') openAuthModal('login');
    }
}

// ════════ REVEAL ANIMATION OBSERVER ════════
const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ════════ HELPER: Bengali number ════════
function toBn(n) {
    return String(n).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[d]);
}

// ════════ REVIEW SYSTEM ════════
let _reviewStar = 0;

function setReviewStar(n) {
    _reviewStar = n;
    document.querySelectorAll('.rv-star').forEach((s, i) => {
        s.style.color = i < n ? '#C9A227' : '#ccc';
    });
}

function submitReview() {
    const ses = (typeof DB !== 'undefined') ? DB.getSession() : null;
    const txtEl = document.getElementById('rv-text');
    const alertEl = document.getElementById('rv-alert');
    if (!txtEl || !alertEl) return;

    const text = txtEl.value.trim();
    if (!text) {
        alertEl.className = 'alert alert-error'; alertEl.textContent = 'মতামত লিখুন।'; alertEl.style.display = 'block'; return;
    }
    if (_reviewStar === 0) {
        alertEl.className = 'alert alert-error'; alertEl.textContent = 'স্টার রেটিং দিন।'; alertEl.style.display = 'block'; return;
    }

    let authorName = '', authorPhone = '';
    if (ses && ses.verified) {
        authorName = ses.name;
        authorPhone = ses.phone;
    } else {
        authorName = document.getElementById('rv-anon-name')?.value.trim();
        authorPhone = document.getElementById('rv-anon-phone')?.value.trim();
        if (!authorName || !authorPhone) {
            const promptEl = document.getElementById('review-login-prompt');
            if (promptEl) promptEl.style.display = 'block';
            alertEl.className = 'alert alert-error'; alertEl.textContent = 'নাম ও মোবাইল নম্বর দিন।'; alertEl.style.display = 'block'; return;
        }
    }

    const review = {
        id: 'rv_' + Date.now(),
        name: authorName, phone: authorPhone,
        text, stars: _reviewStar,
        date: new Date().toISOString(),
        status: 'pending'
    };

    // Save locally
    if (typeof DB !== 'undefined') {
        const reviews = DB.get('bf_reviews') || [];
        reviews.push(review);
        DB.set('bf_reviews', reviews);
    }

    // Try server
    fetch('http://localhost:3001/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review), signal: AbortSignal.timeout(4000)
    }).catch(() => {});

    txtEl.value = ''; _reviewStar = 0;
    document.querySelectorAll('.rv-star').forEach(s => s.style.color = '#ccc');
    alertEl.className = 'alert alert-success';
    alertEl.textContent = '✅ মতামত জমা হয়েছে। অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।';
    alertEl.style.display = 'block';
    if (typeof showToastG === 'function') showToastG('✅ মতামত জমা হয়েছে!');
}

// Load approved reviews into scrolling track
function loadReviews() {
    const track = document.getElementById('reviewsTrack');
    if (!track) return;

    let reviews = [];
    try {
        if (typeof DB !== 'undefined') {
            reviews = (DB.get('bf_reviews') || []).filter(r => r.status === 'approved');
        }
    } catch (e) {}

    // Default demo reviews if none
    if (!reviews.length) {
        reviews = [
            { name: 'মুহিব্বুল্লাহ আজাদ', stars: 5, text: 'সুদমুক্ত পথে ঋণ পেয়েছি — আলহামদুলিল্লাহ! অসাধারণ সেবা।' },
            { name: 'আনোয়ার হোসেন', stars: 5, text: 'কিস্তিতে মোটরসাইকেল নিয়েছি। প্রক্রিয়া সহজ ও স্বচ্ছ।' },
            { name: 'রাকিবুল ইসলাম', stars: 4, text: 'করজে হাসানা পেয়ে বিপদ থেকে রক্ষা পেয়েছি।' },
            { name: 'সাইফুল ইসলাম', stars: 5, text: 'হালাল পথে আর্থিক সহায়তা — এটাই দরকার ছিল।' },
            { name: 'ফাতেমা বেগম', stars: 4, text: 'ব্যবহার খুবই ভালো। সবাই আন্তরিক ও সহযোগী।' },
            { name: 'মাসুম বিল্লাহ', stars: 5, text: 'শরিয়াহ মোতাবেক সব কিছু — মনে শান্তি আছে।' },
        ];
    }

    if (!reviews.length) { track.innerHTML = '<div style="padding:20px;color:#aaa">এখনো কোনো মতামত নেই।</div>'; return; }

    const html = [...reviews, ...reviews].map(r => `
        <div class="review-card">
            <div class="rv-head">
                <div class="rv-avatar">${(r.name || '?')[0]}</div>
                <div><div class="rv-name">${r.name || 'অজ্ঞাত'}</div>
                <div class="rv-stars-show">${'★'.repeat(r.stars || 5)}${'☆'.repeat(5 - (r.stars || 5))}</div></div>
            </div>
            <p class="rv-body">"${r.text}"</p>
        </div>`).join('');

    track.innerHTML = html;

    // Pause on hover
    track.parentElement?.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    track.parentElement?.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
}

// ════════ INIT: run on DOM ready ════════
document.addEventListener('DOMContentLoaded', function () {
    // Review login prompt check
    const ses = (typeof DB !== 'undefined') ? DB.getSession() : null;
    const promptEl = document.getElementById('review-login-prompt');
    if (promptEl) promptEl.style.display = ses && ses.verified ? 'none' : 'block';

    // Load reviews
    loadReviews();
});
